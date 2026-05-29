## Goal

Ship the "Habit Rewards Pro" customisation UI now, gated to your own account so you can dogfood it. Everyone else sees a "Register interest" CTA, and those signups are stored for re-engagement once payments are live.

## Access model (interim)

- A new SQL helper `public.is_pro(uid uuid)` returns `true` if the user's email matches an allowlist. For now the allowlist is a single hard-coded email: `samuel.robinson@mail.mcgill.ca` (looked up via `auth.users.email`).
- When you wire up Paddle later, `is_pro` swaps to read from a `subscribers` table — call sites don't change.

## Database changes (one migration)

1. **`is_pro(uid uuid)` SECURITY DEFINER function** — returns true if `auth.users.email = 'samuel.robinson@mail.mcgill.ca'`.
2. **RPCs** (all SECURITY DEFINER, all check `is_pro(auth.uid())`, else raise):
   - `create_activity(name text, value bigint) → bigint`
   - `update_activity(activity_id bigint, name text, value bigint, active boolean)` — if value differs from latest `activity_values`, insert a new row (preserves history).
   - `delete_activity(activity_id bigint)` — soft delete via `active = false`.
3. **`pro_interest` table** — capture leads:
   ```text
   pro_interest
     id bigint PK
     user_id uuid (auth.uid, unique)
     email text
     created_at timestamptz
     notified_at timestamptz null   -- for later outreach
   ```
   RLS: user can INSERT and SELECT their own row; service_role full access. Grants for `authenticated` + `service_role` only.
4. Keep existing `activities` / `activity_values` RLS as-is (owner CRUD). The Pro check lives in the RPCs the UI calls — non-Pro users simply won't see the UI, and writes go via RPC. (If you want a hard server-side block on direct table writes later, we can tighten then.)

## Frontend changes

- **`src/hooks/useIsPro.ts`** — calls `is_pro(auth.uid())` via `supabase.rpc`. Cached with react-query.
- **`src/hooks/useInterest.ts`** — read + register interest in `pro_interest`.
- **`src/pages/Settings.tsx`** — new "Habit Rewards Pro" section:
  - If `isPro` → render `<ManageActivities />`.
  - Else → render `<ProInterestCard />` with value prop ("Add your own habits, set custom rewards, rename or remove any activity"), a single "Register interest" button. After click → success state ("We'll email you when Pro launches"). Idempotent.
- **`src/components/ManageActivities.tsx`** — list of all owned activities (active + inactive) with:
  - Inline edit (name + value).
  - Active toggle.
  - "Add activity" button → dialog with name + value inputs (defaults to `currency_unit_amount`).
  - "Delete" → soft delete (sets active=false). Show inactive in a collapsed section so they can be re-enabled.
  - Mobile-friendly (drawer for add/edit on small screens, dialog on desktop).
- **`src/components/ProInterestCard.tsx`** — value prop + CTA.

## Build order

1. Migration: `is_pro`, the 3 RPCs, `pro_interest` table + RLS + grants.
2. `useIsPro` + `useInterest` hooks.
3. `ProInterestCard` + `ManageActivities` components.
4. Wire both into `Settings.tsx` under a new section.
5. Smoke test on your account (should see ManageActivities) and on a second account (should see interest CTA, row appears in `pro_interest`).

## Open questions

None — proceeding with the email above as the sole allowlist entry. When Paddle is enabled later, the only change is swapping `is_pro`'s implementation.
