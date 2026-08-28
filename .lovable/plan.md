# Adherence: same habit, different streak on mobile vs desktop

## What's actually happening

The two devices disagree because the day each log entry belongs to is decided by the *device's* timezone, not a fixed one.

Your dehumidifier log has one entry on 25 Aug at **23:44 UTC**. That is:

- 25 Aug on a device set to UTC (your desktop) — the streak is unbroken.
- 26 Aug on a device set to UTC+1 / BST (your phone) — so 25 Aug has no entry and 26 Aug has two.

The mobile pattern you described, from the right: empty (today), filled, filled, empty, then a long filled run — matches that shift exactly. Desktop is showing the truthful picture; the phone is off by one day for any habit logged close to midnight.

The canvas drawing itself is fine: I re-ran the exact algorithm at a mobile track width and a desktop one against your real data and both produce the same shape, so width is not the cause.

## The fix

Bucket log entries into days using one fixed timezone for every device, so a given entry always lands on the same calendar day regardless of where the report is opened.

- Use the timezone implied by the account (profile region) as the canonical one, falling back to UTC when none is set.
- Apply the same rule to the account start date and to "today", so the track length and the right-hand edge line up with the buckets.
- Apply it consistently to the other date-grouped views (activity log grouping, history) so the app never disagrees with itself about which day something happened.

## Technical notes

- `src/pages/Report.tsx` currently calls `startOfDay(parseISO(entry.date))` and `differenceInCalendarDays(...)`, both of which resolve in the browser's local timezone. Replace with a helper that converts the UTC timestamp into a `yyyy-MM-dd` key in the canonical zone, then maps keys to day indices.
- Add a small `src/lib/day.ts` with `dayKey(iso, tz)` and `dayIndex(iso, startKey, tz)` built on `Intl.DateTimeFormat` with `timeZone` (no new dependency needed), plus `todayKey(tz)`.
- Canonical zone resolution: derive from the profile's region via a region → IANA timezone map added to `src/lib/regions.ts`; fall back to `UTC` if the region is missing or unmapped.
- Reuse the same helper in `src/components/ActivityLog.tsx` and `src/pages/History.tsx` date grouping so "Today / Yesterday" headings agree with the report.
- No database or schema changes; timestamps stay stored in UTC.

## Verification

Load the report at desktop and mobile widths with the browser timezone forced to UTC and to Europe/London, and confirm the dehumidifier row renders the identical streak in both.
