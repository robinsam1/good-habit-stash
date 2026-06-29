import { describe, it, expect } from "vitest";
import { computeStreakStats, addDays, daysBetween, toLocalDateKey } from "@/lib/streaks";

const TODAY = "2026-06-29";

describe("date helpers", () => {
  it("addDays handles month boundaries", () => {
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("daysBetween", () => {
    expect(daysBetween("2026-06-01", "2026-06-10")).toBe(9);
    expect(daysBetween("2026-06-10", "2026-06-01")).toBe(-9);
  });
  it("toLocalDateKey produces YYYY-MM-DD", () => {
    expect(toLocalDateKey("2026-06-29T12:00:00Z", "UTC")).toBe("2026-06-29");
  });
});

describe("positive streaks", () => {
  it("never logged → all zero", () => {
    expect(
      computeStreakStats({
        loggedDays: new Set(),
        polarity: "positive",
        windowStartDay: null,
        todayKey: TODAY,
      }),
    ).toEqual({ current: 0, breaks: 0, avgStreak: 0 });
  });

  it("only today logged", () => {
    expect(
      computeStreakStats({
        loggedDays: new Set([TODAY]),
        polarity: "positive",
        windowStartDay: TODAY,
        todayKey: TODAY,
      }),
    ).toEqual({ current: 1, breaks: 0, avgStreak: 0 });
  });

  it("broken yesterday: current=0, one past streak", () => {
    // logged 5 days, then skipped yesterday and today
    const days = new Set<string>();
    for (let i = 7; i >= 3; i--) days.add(addDays(TODAY, -i));
    const stats = computeStreakStats({
      loggedDays: days,
      polarity: "positive",
      windowStartDay: addDays(TODAY, -7),
      todayKey: TODAY,
    });
    expect(stats.current).toBe(0);
    expect(stats.breaks).toBe(1);
    expect(stats.avgStreak).toBe(5);
  });

  it("multiple past streaks averaged", () => {
    // streaks of length 3 and 2, plus current of 1
    const days = new Set<string>([
      addDays(TODAY, -10),
      addDays(TODAY, -9),
      addDays(TODAY, -8), // 3
      addDays(TODAY, -5),
      addDays(TODAY, -4), // 2
      TODAY, // current 1
    ]);
    const stats = computeStreakStats({
      loggedDays: days,
      polarity: "positive",
      windowStartDay: addDays(TODAY, -10),
      todayKey: TODAY,
    });
    expect(stats.current).toBe(1);
    expect(stats.breaks).toBe(2);
    expect(stats.avgStreak).toBeCloseTo(2.5);
  });
});

describe("negative streaks", () => {
  it("never logged since creation → current = days since creation (inclusive)", () => {
    const start = addDays(TODAY, -4); // 5-day window inclusive
    const stats = computeStreakStats({
      loggedDays: new Set(),
      polarity: "negative",
      windowStartDay: start,
      todayKey: TODAY,
    });
    expect(stats.current).toBe(5);
    expect(stats.breaks).toBe(0);
    expect(stats.avgStreak).toBe(0);
  });

  it("broken once then resumed: current resets from most recent log", () => {
    const start = addDays(TODAY, -10);
    // logged on day -6 → breaks the streak; -5..today are clean = 6 days current
    const stats = computeStreakStats({
      loggedDays: new Set([addDays(TODAY, -6)]),
      polarity: "negative",
      windowStartDay: start,
      todayKey: TODAY,
    });
    expect(stats.current).toBe(6);
    expect(stats.breaks).toBe(1);
    expect(stats.avgStreak).toBe(4); // days -10..-7 = 4 clean days before the break
  });
});
