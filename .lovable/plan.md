# One timezone per account, used everywhere

## What's actually happening

Your data confirms it, and it isn't your location. For today (29 Aug), your log holds:

- 16 entries when days are cut in **Europe/London**
- 13 entries when days are cut in **UTC**

The three-entry gap is exactly the run logged at 23:22 UTC on 28 Aug, which is 00:22 BST on 29 Aug. So Safari is bucketing in real local time and Firefox is bucketing in UTC. Firefox does that on purpose when anti-fingerprinting is enabled (Resist Fingerprinting / strict privacy mode): it reports the timezone as UTC to every site. Same address, same clock, different reported timezone — which is why it looks browser-dependent.

Both the adherence page and Habits completed read the browser's timezone, so both inherit the problem. The adherence page's grace rule masked it for you in that view.

## The fix

Stop trusting the browser. Give the account one timezone and use it everywhere.

1. **Timezone on your profile** — a new `timezone` field, set from the browser's detected zone the first time it is missing, and editable in Settings ("Time zone — used to decide which day a habit belongs to"). If the detected value is `UTC` it is still stored, but Settings makes it easy to correct.
2. **All day bucketing uses it** — the Habits completed stats (today, 7-day average, target) and the adherence report both convert timestamps into the profile timezone instead of the device's. Every browser and device then shows identical numbers.
3. **Grace rule applies to counts too** — the existing "first entry between 00:00 and 01:00 counts as the previous day when that day has 2+ entries and the previous day has none, per habit" rule moves into shared logic and is applied to the completion counts as well, so /report and the home page always agree.

Nothing is rewritten in the database; this only changes how existing timestamps are grouped for display.

## Technical notes

- Migration: `ALTER TABLE public.profiles ADD COLUMN timezone text;` (nullable, existing RLS and grants already cover it). No backfill — null falls back to the browser zone until first written.
- New `src/lib/dayBucketing.ts` holding: `zonedDayIndex(date, tz)` and the grace pass, both currently inlined in `src/pages/Report.tsx`. `Report.tsx` and `src/hooks/useHabitStats.ts` both consume it so there is a single definition of "which day is this".
- Zone conversion via `Intl.DateTimeFormat` with `timeZone` (no new dependency): format the timestamp into y/m/d/hour parts in the target zone, derive the day index from the y-m-d, and use the zoned hour for the 00:00–01:00 check.
- `useProfile.ts`: expose `timezone`, add a `useUpdateTimezone` mutation, and a one-time write of `Intl.DateTimeFormat().resolvedOptions().timeZone` when the profile loads with a null timezone.
- `useHabitStats` gains the grace pass over per-activity day buckets before counting; `total` and `perActivity` are unaffected by bucketing and stay as-is.
- Settings gets a timezone select (IANA zones from `Intl.supportedValuesOf('timeZone')`, with a fallback list for older browsers).

## Verification

With the browser timezone forced to `UTC` and to `Europe/London`, the home page must report the same "completed today" figure, and it must match the adherence report in both runs.
