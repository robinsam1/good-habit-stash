# Adherence: timezone-aware day bucketing with a late-night grace rule

## What's actually happening

Days are bucketed by the device's timezone. Your dehumidifier log has an entry on 25 Aug at **23:44 UTC**, which is 25 Aug on a UTC device (desktop, unbroken streak) but 26 Aug on a UTC+1 device (phone, 25 Aug looks empty and 26 Aug has two entries). That matches the mobile pattern you described exactly.

## What to change

Keep device-local bucketing, and add a leniency rule so post-midnight logging doesn't break a streak.

1. **Display in the device's current timezone** — unchanged behaviour, made explicit: every log timestamp is bucketed into a calendar day using the browser's local timezone at render time. Travelling shifts the picture slightly, which is expected and accepted.

2. **Late-night grace rule** — reassign an early-hours entry back to the previous day when, per habit:
   - the day has two or more entries logged for that habit, and
   - the previous day has no entries for that habit, and
   - the earliest entry of that day falls between 00:00 and 01:00 local time.

   Then that earliest entry moves to the previous day, so the streak stays continuous. Applied per habit, not globally, and only ever shifts one entry back by one day.

   For your dehumidifier row on a UK phone: 26 Aug has entries at 00:44 and 10:45, 25 Aug is empty, so the 00:44 entry moves to 25 Aug and the streak reads as unbroken — matching the desktop view.

3. The rule only affects how the adherence report groups days. Nothing is written back to the database and no other screen's data changes.

## Technical notes

- All logic lands in the `useMemo` in `src/pages/Report.tsx`; `HabitTimeline.tsx` is untouched.
- Bucketing today stores only a day index per habit in a `Set`. To evaluate the rule it needs entry times too: build `Map<activityId, Map<dayIndex, Date[]>>` from the log, apply the grace pass over each habit's days in ascending order, then flatten to the sorted day-index array `HabitTimeline` already consumes.
- Grace pass per habit: for each day index `d` with `entries.length >= 2` and no entries at `d - 1` and `d - 1 >= 0`, take the earliest entry; if its local hour is `0`, move it to `d - 1`.
- Continue using `date-fns` `startOfDay` / `differenceInCalendarDays` (local timezone) for indices, and `getHours()` for the 00:00–01:00 check — both already resolve in device-local time.
- Order matters: run the grace pass in ascending day order so a shifted entry can itself satisfy "previous day has no entries" for a later day only via the updated state.

## Verification

Render the report with the browser timezone forced to `Europe/London` and to `UTC`, and confirm the dehumidifier row shows the same unbroken run ending yesterday in both.
