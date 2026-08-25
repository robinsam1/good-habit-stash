# Faster "move to savings" hand-off

Keep the transfer manual (Habit Visor never touches your money) but cut the friction down to roughly two taps: copy the amount, jump straight into your banking app, come back and confirm.

## Why not automate it

Monzo pots have no sort code / account number, so open banking payment initiation and sweeping VRP can't target them. Monzo's own pots API is limited to developer-mode access on your own account and can't ship to other users. So the win here is friction, not automation.

## What changes

In the "Move to savings" confirmation dialog:

1. **Amount is one tap to copy** — the total is shown large with a copy button; tapping it copies the plain number (e.g. `12.40`, no currency symbol) so it can be pasted straight into a transfer field. Brief "Copied" feedback.
2. **"Open my banking app" button** — attempts a deep link into the user's chosen bank app, falling back to the bank's web URL if the app isn't installed. Amount can't be pre-filled by any UK bank's public deep link, which is why the copy step exists.
3. **Confirm step stays** — "I've moved it" still resets the balance, unchanged. The button copy shifts slightly so the order of operations reads clearly: copy → transfer → confirm.

## Choosing a bank

- A new **Savings** section in Settings with a "Banking app" picker: Monzo, Starling, Revolut, Chase, Barclays, HSBC, Lloyds, NatWest, Santander, Nationwide, Halifax, Monzo-style "Other".
- Stored per user; "Other" hides the deep-link button and just shows copy + confirm.
- If nothing is chosen yet, the dialog shows a small inline "Set your bank" link into Settings rather than a broken button.

## Honest caveats surfaced in the UI

- One line under the button: "We can't pre-fill the amount — paste it in your banking app."
- No claim that the transfer happened; confirming only resets the Habit Visor balance.

## Technical notes

- Bank registry in a new `src/lib/banks.ts`: id, label, iOS/Android app scheme or universal link, web fallback URL. Deep links are best-effort — we open the universal/https link where the bank publishes one (most reliable), and the custom scheme only where it's known good.
- Preference stored on `profiles` via a new nullable `bank_id text` column (migration + GRANTs unchanged from existing table policy set), read/written through the existing `useProfile` hook.
- Amount formatting for copy uses the existing `useMoney` minor-unit digits, but strips the currency symbol.
- Changes are contained to `src/components/MarkAsPaidButton.tsx`, `src/pages/Settings.tsx`, `src/hooks/useProfile.ts`, plus the new `src/lib/banks.ts` and one migration.
- Clipboard uses `navigator.clipboard` with a `document.execCommand` fallback for older mobile Safari.
