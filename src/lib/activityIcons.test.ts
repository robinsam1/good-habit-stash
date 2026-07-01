import { describe, it, expect } from "vitest";
import { Footprints, BookOpen, GlassWater, Moon, Sparkles } from "lucide-react";
import { getActivityIcon } from "./activityIcons";

describe("getActivityIcon", () => {
  it("maps common keywords to specific icons", () => {
    expect(getActivityIcon("Morning run", 0).Icon).toBe(Footprints);
    expect(getActivityIcon("Read a book", 1).Icon).toBe(BookOpen);
    expect(getActivityIcon("Drink water", 2).Icon).toBe(GlassWater);
    expect(getActivityIcon("Sleep 8 hours", 3).Icon).toBe(Moon);
  });

  it("is case-insensitive for keyword matching", () => {
    expect(getActivityIcon("MORNING RUN", 0).Icon).toBe(Footprints);
  });

  it("falls back deterministically to the palette by index when no keyword matches", () => {
    // Two keyword-less names at the same index resolve to the same fallback icon.
    expect(getActivityIcon("Zxqw", 0).Icon).toBe(Sparkles);
    expect(getActivityIcon("Qplm", 0).Icon).toBe(getActivityIcon("Zxqw", 0).Icon);
  });

  it("returns a stable icon and colour for the same input", () => {
    const a = getActivityIcon("Side project", 5);
    const b = getActivityIcon("Side project", 5);
    expect(a.Icon).toBe(b.Icon);
    expect(a.fg).toBe(b.fg);
    expect(a.bg).toBe(b.bg);
  });

  it("always provides Tailwind colour classes", () => {
    const { fg, bg } = getActivityIcon("Anything", 2);
    expect(fg).toMatch(/^text-/);
    expect(bg).toMatch(/^bg-/);
  });
});
