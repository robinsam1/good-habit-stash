# Habit adherence report

A new page showing, for every habit, a compact one-line-tall timeline of the days it was logged — from the day the account was created through today.

## Entry point

- Add a reporting icon (bar-chart) to the top-left of the main page, mirroring the sign-out icon on the top-right.
- For guest accounts the "save progress" button already sits top-left; the report icon goes beside it in the same left-aligned group.
- New route `/report`, with the same "redirect to /welcome when signed out" guard used by History, Tasks and Settings.

## The view

- Table layout: leftmost column lists every activity (active ones) in ascending alphabetical order.
- To the right of each name, a single-line-height horizontal timeline.
- Header above the timeline column shows only two labels: the account creation date on the left and today's date on the right.
- A day where the habit was logged is drawn as a filled cell; days with no log stay transparent. Consecutive logged days join into an unbroken bar because adjacent cells touch with no gap.
- Logging date = the day the log entry was created (`log.date`), not when it was moved to savings. Paid and unpaid entries both count; soft-deleted entries are excluded.
- Activities created after signup still start their track at the account creation date — the earlier days simply render empty.
- Rows scroll vertically; the whole grid keeps a fixed pixel width so all days fit on screen without horizontal scrolling.

## Handling up to 5000 days

Rendering one DOM node per day per habit does not scale. Each row is drawn as a single `<canvas>` sized to the row's pixel width, with days mapped to fractional pixel positions and runs of consecutive logged days painted as one rectangle. This stays fast at 5000 days across dozens of habits, and re-paints only when data or width changes.

When the day count exceeds the available pixels, multiple days share a pixel column; a column is painted if any day in it was logged.

## Technical notes

- New hook `useAllLog()` in `src/hooks/useHabits.ts`: selects `id, date, activity_id` from `log` where `deleted_at is null` (no `paid_out` filter), used only by the report.
- Account start date: earliest of the user's `profiles.created_at` and their earliest log date, so old accounts never clip data.
- Day bucketing uses local-time `yyyy-MM-dd` keys via `date-fns`, matching how the rest of the app groups dates.
- New files: `src/pages/Report.tsx`, `src/components/HabitTimeline.tsx` (canvas row). Route registered in `src/App.tsx`.
- Colors come from existing design tokens (primary for logged days, muted for the empty track) — no hardcoded color utilities.
