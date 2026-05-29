# Multi-tenant Habit Rewards

## 1. Data model changes (wipe & rebuild)

Wipe existing rows in `log`, `activity_values`, `activities`. Add ownership and currency:

- `activities`: add `user_id uuid not null`. Index on `user_id`.
- `activity_values`: unchanged structure, lifecycle scoped by parent activity's user_id.
- `log`: add `user_id uuid not null`, default `auth.uid()`.
- New `profiles` table: `user_id uuid primary key`, `region_code text not null` (e.g. `GB`, `US`, `IN`), `currency_code text not null` (e.g. `GBP`), `created_at`.
- Trigger `handle_new_user()` on `auth.users` insert → creates profile from signup metadata (region, currency), then seeds the default activities + their `activity_values` rows (value = 1 unit in user's currency, stored in smallest integer unit).

### RLS rewrite
All policies switch from "any authenticated" to `user_id = auth.uid()`:
- `activities`, `activity_values` (joined via activity), `log`, `profiles` — full CRUD scoped to owner.
- Update RPCs (`mark_unpaid_as_paid`, `soft_delete_log_entry`, `update_log_activity`, `update_log_notes`) to scope by `auth.uid()`.

### Default activity seed (per new user)
Sleep – Get up early · Sleep – Go to bed on time · Exercise – 30 minutes of exercise · Exercise – 1 hour walking · Habits – Make bed · Habits – Do laundry · Habits – Clean room · Eating – Cook your meal · Eating – Drink 2L water · Finances – Skip big purchase · Finances – Save {SYMBOL}10 · Mind – 10 minutes meditation · Mind – Read 20 pages

All seeded at value = 1 unit in user's currency.

## 2. Currency / region

New `src/lib/regions.ts`: dictionary of the 50 most populous countries → `{ code, name, currencyCode, currencySymbol, locale, minorUnitDigits }` (e.g. JPY/KRW have 0 minor digits).

New `src/hooks/useProfile.ts`: fetches current user's profile, exposes `currency` + `formatMoney(minorUnits)` using `Intl.NumberFormat(locale, { style: 'currency', currency })`. Replace all hard-coded `£`/pence formatting in `TotalDisplay`, `LogEntry`, `History`, etc.

## 3. First-run experience

New `/welcome` route — 3-slide carousel (embla, already in shadcn):
1. **Habits stick when they're easy to start.** Behavioural science: tiny, repeatable actions beat willpower.
2. **Rewards rewire the loop.** Pairing a habit with an immediate reward makes your brain crave the next rep.
3. **Here's how it works.** Log a habit → it adds to your reward pot → cash out when you're ready.

Primary CTA "Get started" → `/signup`; secondary "I already have an account" → `/auth`.

Unauthenticated visitors landing on `/` redirect to `/welcome`. Signed-in users skip the FRE.

## 4. Auth flow (email + password only)

- `/signup`: email, password, region `<Select>` (searchable, 50 countries). Validates with zod. `supabase.auth.signUp({ email, password, options: { data: { region_code, currency_code } }})`. Trigger reads metadata to create the profile + seed activities.
- `/auth` (login): email + password.
- Drop the existing `username@app.local` hack in `useAuth`; real emails now.
- Open public signup, email confirmation **off**.

## 5. Routing & gating

```
/welcome  → FRE carousel (public)
/signup   → signup form (public)
/auth     → login (public)
/         → app home (auth required; otherwise → /welcome)
/history  → auth required
```

`<AuthGate>` wrapper redirects unauthenticated users to `/welcome`.

## 6. UI/branding

Keep existing Monzo-style system. Polished gradient hero for FRE carousel + signup, reusing navy/orange tokens.

## 7. Out of scope

- No FX conversion — each account locked to signup region's currency.
- No data migration — existing samuel999 account and logs are wiped.
- No admin/role system.

## Technical notes

- Currency stored as smallest integer unit; `regions.ts` carries `minorUnitDigits` and `formatMoney` respects it.
- Trigger seeding: one `INSERT ... SELECT FROM (VALUES ...)` for activities, then `INSERT ... SELECT` for activity_values referencing the new activity ids.
- RPCs stay `SECURITY INVOKER` so RLS enforces tenancy automatically.
- Memory: drop "single-user samuel999" rule and add multi-tenant + per-user currency rules after build.
