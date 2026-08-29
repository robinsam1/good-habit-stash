# Habits completed: an adherence-first metric

Adds a "Habits completed" counter alongside the money balance, a daily target, and per-habit completion counts in the Adherence report.

## Definition

A completion = one log entry for an activity whose value is zero or positive, not deleted. Paid or unpaid doesn't matter. Logging the same habit five times in a day counts five times. Negative-value entries are excluded. Counts are anchored to the time each entry was logged: deactivating a habit later never decrements the counter (its past entries still count), and a habit that is currently inactive contributes nothing new.

All counts are computed in the browser from the existing log; nothing new is written to the database except the editable target.

## 1. Home page (`/`) balance panel

Inside the existing balance card, top right, in a smaller type scale so it never competes with the balance:

```text
+--------------------------------------------------+
|                                  Completed today 4 |
|            £42.00                7-day avg      3.1|
|         Your Balance             Target         5  |
+--------------------------------------------------+
```

- Completed today — count for the device-local calendar day.
- 7-day avg — completions over the last 7 local days (including today) divided by 7, one decimal.
- Target — daily target (see below), with a subtle "hit" state when today's count reaches it.
- Skeletons while the log is loading, matching the balance's existing loading behaviour.

## 2. Daily target

- Default (auto): `max(3, round(active habit count / 2))`.
- Stored per user as an optional override; when unset the auto value is used and follows the habit count.
- Editable on the Edit Tasks page (`/tasks`) in its own card at the top, available to every user (not behind the Pro gate) — a number input plus a "Use suggested (n)" reset.

## 3. Lifetime counter replaces the report icon

The bar-chart icon button in the header becomes a compact pill: the same chart icon on the left plus the total number of completions since account creation (e.g. `📊 128`). It still links to `/report`, keeps an accessible label ("Adherence report — 128 habits completed"), and shows a placeholder while loading.

## 4. Guided tour

Steps stay the same. The `data-tour="total"` highlight already wraps the whole balance card, so the new stats sit inside the highlight; step 1 copy gains a short line pointing at the completion stats. Highlight rects are re-measured after the stats render so the cut-out fits the taller card.

## 5. Copy

"Move to savings" becomes "Move balance to savings" on the pay-out button (dialog copy unchanged).

## 6-7. Adherence report (`/report`)

- Top-line summary row above the timeline card: total habits completed, completed today, 7-day average — using the same definitions as the home page.
- The grid gains a middle column between the habit name and the timeline showing that habit's lifetime completion count, right-aligned and muted. Column widths shift to `name / count / bar`; on mobile the count column stays narrow (~2.5rem) so the bar keeps its space.

## Technical notes

- `useAllLog` currently selects `id, date, activity_id`; add `value` so completions can be filtered. Type update in the same file.
- New `src/hooks/useHabitStats.ts` derives: `today`, `avg7`, `total`, and `perActivity` (Map of activity id → count) from `useAllLog`, using device-local day bucketing (`startOfDay`/`differenceInCalendarDays`), consistent with the report. The report's existing late-night grace rule affects streak display only, not counts.
- Target override: migration adding a nullable `daily_target smallint` to `public.profiles` (existing GRANTs and RLS already cover it), plus a `useUpdateDailyTarget` mutation alongside `useUpdateBank` in `useProfile.ts`. Auto value derived from `useActivities()`.
- No changes to logging, payout, or money logic.
