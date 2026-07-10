import { describe, it, expect } from "vitest";
import {
  Apple,
  BookOpen,
  Brain,
  Droplets,
  Inbox,
  Moon,
  PersonStanding,
  PiggyBank,
  Smartphone,
  Star,
  Target,
  Utensils,
} from "lucide-react";
import { getActivityIcon } from "./activityIcons";

describe("getActivityIcon", () => {
  it("maps keywords from the real seeded activity names", () => {
    expect(getActivityIcon("Eating – Drink 2L water", 0)).toBe(Droplets);
    expect(getActivityIcon("Exercise – 1 hour walking", 0)).toBe(PersonStanding);
    expect(getActivityIcon("Sleep – Go to bed on time", 0)).toBe(Moon);
    expect(getActivityIcon("Mind – Read 20 pages", 0)).toBe(BookOpen);
    expect(getActivityIcon("Mind – 10 minutes meditation", 0)).toBe(Brain);
    expect(getActivityIcon("Eating – Cook your meal", 0)).toBe(Utensils);
    expect(getActivityIcon("Finances – Save $10", 0)).toBe(PiggyBank);
    expect(getActivityIcon("Mind – 2 hours free of social media", 0)).toBe(Smartphone);
    expect(getActivityIcon("Work – Get to inbox zero", 0)).toBe(Inbox);
    expect(getActivityIcon("Work – Set 3 goals for the day", 0)).toBe(Target);
    expect(getActivityIcon("Eating – 5 fruits/vegetables today", 0)).toBe(Apple);
  });

  it("falls back to a deterministic palette for unmatched names", () => {
    const first = getActivityIcon("Some obscure custom habit", 0);
    const again = getActivityIcon("A totally different label", 0);
    // Same index => same fallback icon, regardless of the (unmatched) name.
    expect(first).toBe(again);
    expect(first).toBe(Star);
  });

  it("keeps the fallback stable and in-range for any index", () => {
    const a = getActivityIcon("xxxxx", 3);
    const b = getActivityIcon("yyyyy", 15); // 15 % 12 === 3
    expect(a).toBe(b);
    // Negative / out-of-range indices never throw and always resolve.
    expect(getActivityIcon("zzzzz", -1)).toBeTruthy();
  });
});
