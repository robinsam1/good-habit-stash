# Plan: Onboarding rewards for every funnel step

Add small, country-appropriate cash rewards for completing each step of the first-run experience. Rewards appear in history and the adherence report, but not in the habit picker. They are one-time per account and carry over when a guest upgrades to a permanent account.

## User-facing behaviour

- Seven hardcoded onboarding milestones each pay a small reward:
  1. Finish the welcome carousel.
  2. Submit the "Get started" screen (choose focus + country).
  3. See the piggy-bank total during the tour.
  4. Log your first habit during the tour.
  5. Tap the pay-out button during the tour.
  6. Open the habit tuning screen during the tour.
  7. Open the save-progress flow during the tour.
- Each reward is shown as a log entry like "Onboarding – Logged your first habit" with a positive value.
- A brief toast appears when a reward is earned: "You earned £0.25 for logging your first habit!"
- Onboarding rewards never appear in the activity picker, so they cannot be logged twice.

## Reward amounts

A new database lookup maps currency to a culturally small-but-meaningful amount:

- 2-decimal currencies (USD, GBP, EUR, CAD, AUD, PLN, SEK, DKK, CZK, HUF, RON, BGN, INR, CNY, BRL): 25 minor units, e.g. £0.25 / €0.25 / R$0.25.
- JPY: ¥25.
- IDR: Rp500.

The mapping lives in a new immutable SQL function so the value is resolved server-side.

## Database changes

1. Add `is_onboarding boolean NOT NULL DEFAULT false` to `public.activities`.
2. Create `public.onboarding_rewards` tracking table:
   - `user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE`
   - `step_key text NOT NULL`
   - `claimed_at timestamptz NOT NULL DEFAULT now()`
   - `UNIQUE(user_id, step_key)`
   - GRANT/RLS as an authenticated-only table.
3. Add `public.onboarding_reward_amount(currency_code text) RETURNS bigint` immutable lookup function.
4. Update `public.handle_new_user()` to seed seven onboarding activities per new user, each with `is_onboarding = true` and the region-appropriate reward value.
5. Add `public.claim_onboarding_reward(p_step_key text) RETURNS public.log` SECURITY DEFINER RPC:
   - Idempotent: skip if `onboarding_rewards` already has the step for `auth.uid()`.
   - Look up the matching onboarding activity for the user.
   - Insert a `log` row with that activity's current value.
   - Record the claim and return the new log row.

## Frontend changes

1. Add `claimOnboardingReward(stepKey)` mutation in `useHabits.ts` that calls the new RPC and invalidates `unpaidLog` / `allLog`.
2. In `Welcome.tsx`: call the mutation when the user clicks the final-slide "Get started" button.
3. In `GetStarted.tsx`: call the mutation after successful anonymous sign-in.
4. In `OnboardingTour.tsx`:
   - Auto-claim non-interactive steps when the step becomes active (total, tasks, save).
   - Claim interactive steps when the tour auto-advances (log habit, pay out).
5. Show a reward toast on successful claim using the existing `sonner` toast and `useMoney()` formatting.
6. Update `useActivities()` to exclude `is_onboarding = true` activities so they never appear in the picker or `ManageActivities.tsx`.
7. History and adherence report queries already read from `log`, so onboarding entries appear automatically once logged.

## Backfill

Existing users do not auto-claim rewards (they have already completed onboarding). The migration will still seed the seven onboarding activities for existing users so the feature is available if they ever re-enter a funnel path.

## Files expected to change

- `supabase/migrations/<new>.sql`
- `src/hooks/useHabits.ts`
- `src/pages/Welcome.tsx`
- `src/pages/GetStarted.tsx`
- `src/components/OnboardingTour.tsx`
- `src/integrations/supabase/types.ts` (auto-generated, refreshed by migration)