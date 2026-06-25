## Soft registration + guided onboarding

### 1. Backend: anonymous auth + goal-based seeding

**Enable** anonymous sign-ins (`external_anonymous_users_enabled: true`, keep HIBP on).

**New config table-less approach** — goals live in code (`src/lib/goals.ts`) AND mirrored as a Postgres function so the `handle_new_user` trigger can seed correctly:

```ts
// src/lib/goals.ts
export const GOALS = {
  fit:     { label: "Getting Fit",            emoji: "💪", tasks: [...] },
  job:     { label: "Finding a New Job",      emoji: "💼", tasks: [...] },
  zen:     { label: "Zen Living",             emoji: "🧘", tasks: [...] },
  connect: { label: "Making New Connections", emoji: "🤝", tasks: [...] },
};
```

I'll draft ~10 tasks per goal in the existing `Category – Task` style (e.g. Fit → "Exercise – 30 minutes cardio", "Eating – Drink 2L water", "Sleep – 8 hours"; Job → "Job – Apply to 1 role", "Job – Update CV section"; Zen → "Mind – 10 min meditation"; Connect → "Social – Call a friend"). All seeded at 1 currency unit.

**Rewrite `handle_new_user` trigger** to:
- Read `goal_code` from `raw_user_meta_data`. If absent, fall back to today's full default list (keeps `/signup` flow intact for direct signups via "I already have an account" path edge cases).
- For anonymous users, skip seeding `profiles.region_code`/`currency_code` defaults if they're missing — default to US/USD until conversion or save page collects region. (Anonymous users will provide region during the Get Started step, so we pass it via metadata anyway.)
- Seed only that goal's task list + 1 unit value each.

**New RPC `cleanup_anonymous_users()`**: deletes `auth.users` where `is_anonymous = true AND created_at < now() - interval '24 hours'`. Cascades to activities/log/profiles via existing FKs. Scheduled via `pg_cron` every hour.

**Mark conversion**: when an anonymous user calls `updateUser({email,password})`, Supabase flips `is_anonymous` to false in-place — no data migration needed. We'll also stamp `profiles.region_code/currency_code/locale` on the save page if not already set.

### 2. New "Get Started" goal/region page (`/get-started`)

Replaces the implicit "click Get started in carousel → /signup" jump.

- 2×2 grid of large emoji tiles for the 4 goals. Selection state ring/scale.
- Region `<Select>` below ("Choose your country").
- CTA "Get started" disabled until both chosen.
- On submit:
  1. `supabase.auth.signInAnonymously({ options: { data: { goal_code, region_code, currency_code, currency_symbol, locale, minor_unit_digits } } })`
  2. Trigger seeds activities for that goal.
  3. Write `localStorage.setItem('hv_anon_started_at', Date.now())` and `localStorage.setItem('hv_onboarding_pending','1')`.
  4. Navigate to `/`.

Welcome carousel's "Get started" CTA now points here. "I already have an account" still goes to `/auth`.

### 3. `/` changes for anonymous users

`useAuth` exposes `isAnonymous` (from `user.is_anonymous`).

- **Save button** (top-left of header, mirroring sign-out position): `Save` floppy-disk icon with small red dot badge top-right. Links to `/signup`. Only rendered when `isAnonymous`.
- **Sign out button hidden** for anonymous users (sign-out would orphan data).
- **Settings/Tasks icons** stay visible.

### 4. `/signup` changes

Behaviour now depends on `isAnonymous`:

- **Anonymous user present** → "save progress" mode:
  - Title: "Save your progress"
  - CTA: "Create account to save your progress"
  - Hide region picker (already set on anonymous user's profile)
  - Hide "Already have an account? Sign in" link
  - On submit: `supabase.auth.updateUser({ email, password })`. Same user_id, all data preserved. Clear `localStorage` timers.
- **No session** → existing flow unchanged (email + password + region, "Create account").

### 5. Auto-redirect timers (anonymous session lifecycle)

A new tiny hook `useAnonymousLifecycle()` mounted in `Index.tsx`:

- Reads `hv_anon_started_at` from localStorage.
- If `isAnonymous && now - started >= 1h && route === '/'` → `navigate('/signup')` (one-shot, flag in localStorage to avoid loop if user navigates back).
- If `isAnonymous && now - started >= 24h` → call `supabase.auth.signOut()`, clear localStorage, `navigate('/welcome')`. Backend cron will purge the row.
- Uses a `setInterval` (e.g. 60s) plus a check on mount/focus.

### 6. Guided onboarding tour on `/`

Custom in-app overlay (no library). Triggered when `localStorage.hv_onboarding_pending === '1'` after first landing on `/`.

**Steps** (5):
1. Highlight `TotalDisplay` card — "Track habits in a digital piggy bank"
2. Highlight `ActivityPicker` trigger — "Select habits from the dropdown when you complete them"
3. Highlight `MarkAsPaidButton` — "At the end of the day, pay yourself for what you've done"
4. Highlight Tasks icon in header — "Add and adjust habits here"
5. Highlight Save icon in header — "Don't forget to save your progress!"

**Implementation**:
- `<OnboardingTour />` component rendered at top of `Index`.
- `data-tour="total" | "picker" | "mark-paid" | "tasks" | "save"` attributes added to the targets.
- Fixed full-screen overlay with `pointer-events-auto` + an SVG mask cutout at the target's bounding rect (recomputed on resize/scroll). Target remains visible & interactive-blocked.
- Tooltip card positioned near the cutout with `Next` / `Skip` CTAs and step indicator dots.
- Smooth animations: overlay `fade-in`, tooltip `slide-up + scale-in` between steps, cutout rect animates via CSS transition on `x/y/width/height`. Small pulsing ring on the highlighted element.
- Completing or skipping clears `hv_onboarding_pending`.

### Files

**New**
- `src/lib/goals.ts` — goal config + task lists
- `src/pages/GetStarted.tsx` — goal grid + region
- `src/components/OnboardingTour.tsx` + `src/components/SaveProgressButton.tsx`
- `src/hooks/useAnonymousLifecycle.ts`

**Modified**
- `src/App.tsx` — add `/get-started`
- `src/pages/Welcome.tsx` — CTA → `/get-started`
- `src/pages/Index.tsx` — Save button, hide sign-out for anon, tour, `data-tour` attrs, lifecycle hook
- `src/pages/Signup.tsx` — branch on `isAnonymous`
- `src/hooks/useAuth.ts` — expose `isAnonymous`, add `signInAnonymously`, `upgradeAccount`

**Migrations**
- Rewrite `handle_new_user` to accept `goal_code` and seed accordingly
- `cleanup_anonymous_users()` RPC + `pg_cron` hourly schedule
- Enable anonymous auth via `configure_auth`

### Open items I'll decide while building (flag if you want different)
- Exact task lists per goal (10 each, 1-unit value, existing naming convention)
- Pulse + cutout colors reuse primary/accent gradient
- The 1h auto-redirect fires only when the tab is foregrounded, to avoid yanking focus mid-session
