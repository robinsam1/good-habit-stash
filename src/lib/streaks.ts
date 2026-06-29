// Pure helpers for computing daily streak stats.

export type Polarity = "positive" | "negative";

export interface StreakStats {
  current: number;
  breaks: number;
  avgStreak: number;
}

// Convert a Date (or ISO string) to a YYYY-MM-DD key in the given IANA tz.
// 'en-CA' yields YYYY-MM-DD reliably.
export function toLocalDateKey(
  date: Date | string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-CA", { timeZone });
}

// Add `days` to a YYYY-MM-DD key (UTC math; safe for day arithmetic).
export function addDays(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const nd = new Date(t);
  const yy = nd.getUTCFullYear();
  const mm = String(nd.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(nd.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function daysBetween(startKey: string, endKey: string): number {
  const [y1, m1, d1] = startKey.split("-").map(Number);
  const [y2, m2, d2] = endKey.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Compute streak stats for a single task.
 *
 * Positive (good habit): a "good" day = day IS in loggedDays.
 * Negative (bad habit):  a "good" day = day is NOT in loggedDays.
 *
 * windowStartDay bounds the earliest day we consider.
 * - positive: first logged day; if never logged, returns all zeros.
 * - negative: task creation day.
 *
 * Current streak = consecutive good days ending today (inclusive).
 * Past streaks = maximal runs of good days that ended before today.
 * breaks = number of completed past streaks.
 * avgStreak = mean length of completed past streaks (0 if none).
 */
export function computeStreakStats(opts: {
  loggedDays: Set<string>;
  polarity: Polarity;
  windowStartDay: string | null;
  todayKey: string;
}): StreakStats {
  const { loggedDays, polarity, windowStartDay, todayKey } = opts;

  if (!windowStartDay) {
    return { current: 0, breaks: 0, avgStreak: 0 };
  }
  if (daysBetween(windowStartDay, todayKey) < 0) {
    return { current: 0, breaks: 0, avgStreak: 0 };
  }

  const isGood = (day: string) =>
    polarity === "positive" ? loggedDays.has(day) : !loggedDays.has(day);

  // Current streak: walk back from today until not-good or before window.
  let current = 0;
  let cursor = todayKey;
  while (daysBetween(windowStartDay, cursor) >= 0 && isGood(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Past completed streaks: scan window..yesterday.
  const completed: number[] = [];
  const yesterday = addDays(todayKey, -1);
  if (daysBetween(windowStartDay, yesterday) >= 0) {
    let day = windowStartDay;
    let run = 0;
    while (daysBetween(day, yesterday) >= 0) {
      if (isGood(day)) {
        run += 1;
      } else if (run > 0) {
        completed.push(run);
        run = 0;
      }
      day = addDays(day, 1);
    }
    // If today is good, the trailing run is the current streak (not completed).
    // If today is NOT good, the trailing run was already broken before today,
    // so it's a completed past streak.
    if (run > 0 && !isGood(todayKey)) {
      completed.push(run);
    }
  }

  const breaks = completed.length;
  const avgStreak =
    completed.length === 0
      ? 0
      : completed.reduce((a, b) => a + b, 0) / completed.length;

  return { current, breaks, avgStreak };
}
