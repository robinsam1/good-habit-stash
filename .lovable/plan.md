# Interactive Onboarding Tour

Turn passive tour steps 2 ("Log a habit") and 3 ("Pay yourself out") into hands-on actions the user must complete to advance. Steps 1, 4, 5 remain click-to-advance.

## Behaviour

**Step 2 — "What have you done for yourself today?"**
- Tooltip copy changes to prompt the user to pick any habit from the dropdown.
- "Next" button is removed; tour advances automatically when a new log entry is created.
- "Skip tour" remains.

**Step 3 — "Reward yourself"**
- Tooltip copy: prompt the user to open their banking app, set up a savings pot, and transfer the value shown — then tap the pay-out CTA to confirm.
- "Next" button removed; tour advances automatically when the user taps Mark as Paid (i.e. pending balance drops to 0 / log marked paid).
- "Skip tour" remains.
- Mark-as-paid CTA stays force-visible during this step (already wired via `onTargetChange`).

Steps 1, 4, 5 keep the existing "Next" button behaviour.

## Implementation (technical)

**`src/components/OnboardingTour.tsx`**
- Extend `Step` with `interactive?: "log" | "paid"`.
- Update STEPS[1] and STEPS[2] copy + set `interactive`.
- Hide the Next button when `currentStep.interactive` is set; show a small italic hint ("Pick a habit to continue" / "Tap pay-out to continue") instead. Keep "Skip tour".
- Advancement signal: parent (`Index.tsx`) passes counters/flags via new props `logCount` and `paidCount` (or `lastLogAt` / `lastPaidAt` timestamps). When on step 2 and `logCount` increments, auto-advance. Same for step 3 / `paidCount`.

**`src/pages/Index.tsx`**
- Read pending log count and paid-out count from existing hooks (`useHabits` / running total / log list already in scope).
- Pass change-detection values to `<OnboardingTour>`.
- No business-logic changes — purely observation.

No DB or RPC changes. No copy changes elsewhere.

## Out of scope
- Confetti behaviour (already wired for first log / first paid).
- Tour persistence rules — unchanged.
