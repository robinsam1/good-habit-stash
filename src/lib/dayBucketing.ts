/**
 * Shared calendar-day bucketing.
 *
 * Days are cut in a single timezone for the whole account (the profile's
 * timezone), never the browser's — some browsers (Firefox with anti-fingerprinting
 * enabled) report UTC regardless of where the device actually is, which made the
 * same account show different daily totals in different browsers.
 */

/** The browser's best guess at the local zone, falling back to UTC. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatterCache.get(timeZone);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
      });
    } catch {
      fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
      });
    }
    formatterCache.set(timeZone, fmt);
  }
  return fmt;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
}

/** Calendar parts of an instant as seen in `timeZone`. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = getFormatter(timeZone).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  // Some engines render midnight as hour "24".
  const hour = get("hour") % 24;
  return { year: get("year"), month: get("month"), day: get("day"), hour };
}

/**
 * Days elapsed since the Unix epoch for the calendar day this instant falls on
 * in `timeZone`. Stable across devices, and safe to subtract for day deltas.
 */
export function zonedDayNumber(date: Date, timeZone: string): number {
  const { year, month, day } = zonedParts(date, timeZone);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

/** Start of the calendar day (as a UTC-midnight Date) for labelling purposes. */
export function dayNumberToDate(dayNumber: number): Date {
  return new Date(dayNumber * 86400000);
}

/**
 * Late-night grace pass, applied per habit.
 *
 * If a habit has 2+ entries on a day, the previous day has none, and the
 * earliest entry landed between 00:00 and 01:00 in the account's timezone,
 * that entry is reassigned to the previous day so a streak isn't broken by
 * logging just after midnight.
 *
 * Mutates and returns the given map (day number -> entry timestamps).
 */
export function applyLateNightGrace(
  dayMap: Map<number, Date[]>,
  timeZone: string,
): Map<number, Date[]> {
  const dayNumbers = Array.from(dayMap.keys()).sort((a, b) => a - b);
  for (const d of dayNumbers) {
    if (dayMap.has(d - 1)) continue;
    const entries = dayMap.get(d);
    if (!entries || entries.length < 2) continue;
    entries.sort((a, b) => a.getTime() - b.getTime());
    const earliest = entries[0];
    if (zonedParts(earliest, timeZone).hour !== 0) continue;
    entries.shift();
    dayMap.set(d - 1, [earliest]);
  }
  return dayMap;
}

/**
 * Buckets log entries per activity into day numbers, with the grace rule applied.
 */
export function bucketByActivity(
  entries: { activity_id: number; date: string }[],
  timeZone: string,
): Map<number, Map<number, Date[]>> {
  const byActivity = new Map<number, Map<number, Date[]>>();
  for (const entry of entries) {
    const when = new Date(entry.date);
    if (Number.isNaN(when.getTime())) continue;
    const dayNumber = zonedDayNumber(when, timeZone);
    let dayMap = byActivity.get(entry.activity_id);
    if (!dayMap) {
      dayMap = new Map<number, Date[]>();
      byActivity.set(entry.activity_id, dayMap);
    }
    const list = dayMap.get(dayNumber);
    if (list) list.push(when);
    else dayMap.set(dayNumber, [when]);
  }
  for (const dayMap of byActivity.values()) {
    applyLateNightGrace(dayMap, timeZone);
  }
  return byActivity;
}
