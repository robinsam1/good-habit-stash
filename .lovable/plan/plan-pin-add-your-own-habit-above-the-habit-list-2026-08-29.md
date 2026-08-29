# Plan: Pin "Add your own habit" above the habit list

## Goal
On the `/get-started` "Which habits will help?" step, keep the "Add your own habit" input visible at all times by moving it above the scrollable habit list on both desktop and mobile.

## Current state
- The habit list and the custom-habit input are rendered inside a single `overflow-y-auto` container.
- The blank custom row scrolls with the preset habits, so on small screens or long lists it can end up hidden below the fold.

## Proposed change
1. Restructure the step 1 panel so it has two vertical sections:
   - A **fixed top section** containing the step heading, subheader, and the "Add your own habit" input.
   - A **scrollable bottom section** containing only the preset/suggested habits.
2. Keep the existing behaviour where typing in the last blank row spawns another blank row below it.
3. Preserve the current styling, spacing, and responsive behaviour (`short:` modifiers, mobile/desktop layout).
4. Ensure the "Next" CTA bar at the bottom of the card remains pinned as it is today.

## Files to change
- `src/pages/GetStarted.tsx` — step 1 habit list layout only.

## Out of scope
- No changes to goals, currency step, seeding logic, animations, or the mobile intro gate.
