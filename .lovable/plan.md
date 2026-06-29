
# Streaks view

A new dedicated page that shows, per active task, how long the user has currently kept it going, how many times they've previously broken the streak, and their average past streak length. Negative-value (bad-habit) tasks invert: the streak counts consecutive days the task was NOT logged.

## What the user sees

A flame icon in the header on `/`, next to Save (guests, left cluster) and next to Tasks/Settings (everyone, right cluster). Clicking routes to `/streaks`.

`/streaks` layout matches `/history` and `/tasks`:

- Same gradient header, "Streaks" title, back-to-home button.
- Sorted list of active tasks (deleted/inactive hidden), ordered by **longest current active streak desc**, then by task name.
- Each row shows:
  - Task name (with the same category prefix used elsewhere).
  - Current streak: `N day(s)` with a 🔥 badge; muted "—" if 0.
  - Past streaks broken: "Broken X times".
  - Average past streak length: "Avg N.N days".
  - Small label "good habit" / "bad habit" so the inversion rule is legible.
- Empty state when the user has no active tasks: friendly nudge to add one.
- Loading skeletons during fetch.

No edits to the logging flow, no schema changes.

## How streaks are computed

Daily cadence in the user's local timezone. A "day" = a calendar date in the browser's TZ derived from `log.date`.

For each active task owned by the current user:

1. Pull all non-deleted `log` rows for that task (`activity_id`, `date`).
2. Bucket into a `Set<YYYY-MM-DD>` of logged days (TZ-local).
3. Determine polarity from the latest `activity_values.value`:
   - `value >= 0` → **positive (good habit)**: streak day = day IS in the set. Window starts at the first-ever log day for that task. Never logged → all stats = 0.
   - `value < 0` → **negative (bad habit / avoidance)**: streak day = day IS NOT in the set. Window starts at the **task's `created_at`** day. Never logged since creation → current streak = days-since-created (inclusive of today). Each logging event breaks and closes a past streak; the next clean day starts a new one.
4. Walk from today backward, bounded by window start, to compute **current streak length**.
5. Walk window start → yesterday to enumerate **completed past streaks**: each maximal run that ended before today (today's ongoing streak is excluded).
   - `breaks` = number of completed past streaks.
   - `avgStreak` = mean length of completed past streaks (0 if none).
6. Sort tasks by `currentStreak desc`, then name.

All computation client-side in a `useStreaks()` hook — no new RPC, no migration. Reuses existing RLS-scoped reads from `activities`, `activity_values`, and `log`.

## Files

New
- `src/pages/Streaks.tsx` — page shell, list rendering, empty/loading states.
- `src/components/StreakRow.tsx` — single-task row.
- `src/hooks/useStreaks.ts` — fetches activities (incl. `created_at`) + latest values + logs, returns sorted `StreakStat[]`.
- `src/lib/streaks.ts` — pure functions: `toLocalDateKey(date)`, `computeStreakStats({ loggedDays, polarity, windowStartDay, todayKey })` → `{ current, breaks, avgStreak }`.
- `src/test/streaks.test.ts` — covers: never-logged positive, only-today, broken yesterday, long active streak, multiple past streaks averaged, negative never-logged (current = days since created), negative broken once then resumed, midnight TZ boundary.

Edited
- `src/App.tsx` — register `/streaks` route above the catch-all.
- `src/pages/Index.tsx` — add a `Flame` icon `Link` to `/streaks` in both the guest left cluster (next to `SaveProgressButton`) and the right cluster (before `ListChecks`/Tasks).

## Technical notes

- `useStreaks` runs three parallel queries: active activities (with `created_at`), latest `activity_values` per activity (reuse the pattern from `useActivityValues`), and a single `log` select scoped to the user with `deleted_at is null`, ordered by `date asc`. All RLS-protected by existing policies.
- Date keys use `toLocaleDateString('en-CA', { timeZone: <browser tz> })` to yield `YYYY-MM-DD` safely.
- "Today" is recomputed at render. Query key `['streaks']`, `refetchOnWindowFocus: true`.
- No new tables, no new RPCs, no migration. Pure read + client compute.
