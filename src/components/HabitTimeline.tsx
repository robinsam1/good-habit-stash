import { useEffect, useRef } from "react";

interface HabitTimelineProps {
  /** Sorted, de-duplicated day indices (0 = first day) that were logged. */
  days: number[];
  /** Total number of days on the track (inclusive of first and today). */
  totalDays: number;
  height?: number;
  /** Optional color for the empty track. Defaults to the theme's muted color. */
  trackColor?: string;
}

/**
 * A single one-line-tall adherence track drawn on canvas so it scales to
 * thousands of days without creating a DOM node per day.
 */
export function HabitTimeline({ days, totalDays, height = 20, trackColor }: HabitTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const width = wrap.clientWidth;
      if (!width) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const styles = getComputedStyle(document.documentElement);
      // Streak days use a gold→gray ramp; broken days use the destructive token.
      const destructive = `hsl(${styles.getPropertyValue("--destructive").trim()})`;
      const muted = `hsl(${styles.getPropertyValue("--muted").trim()})`;

      const trackH = Math.max(6, Math.round(height * 0.55));
      const trackY = Math.round((height - trackH) / 2);

      const step = width / Math.max(1, totalDays);
      // Minimum width of a single day so isolated points stay visible on long ranges.
      const dayMin = Math.max(2, Math.min(step, 3));
      // Natural width of one logged day, never smaller than the visibility floor.
      const dayW = Math.max(dayMin, step);

      // Base radius for a single point: half the day width, capped by track height.
      // Multi-day runs and the empty track use the same radius so their ends match.
      const pointRadius = Math.min(trackH / 2, dayW / 2);

      // Empty track — always draw, even when there are no logged days.
      ctx.fillStyle = resolveTrackColor(trackColor, muted);
      roundRect(ctx, 0, trackY, width, trackH, [pointRadius, pointRadius, pointRadius, pointRadius]);
      ctx.fill();

      if (!days.length || totalDays <= 0) return;

      // Identify the first day after each streak (the day the streak was broken).
      const daySet = new Set(days);
      const brokenSet = new Set<number>();
      let streakEnd = days[0];
      for (let i = 1; i < days.length; i++) {
        const d = days[i];
        if (d - streakEnd > 1) {
          const broken = streakEnd + 1;
          if (broken < totalDays && !daySet.has(broken)) brokenSet.add(broken);
        }
        streakEnd = d;
      }
      const lastBroken = streakEnd + 1;
      if (lastBroken < totalDays && !daySet.has(lastBroken)) brokenSet.add(lastBroken);
      const brokenDays = Array.from(brokenSet);

      ctx.fillStyle = destructive;
      for (const d of brokenDays) {
        const x = d * step;
        const brokenW = Math.min(dayW / 2, width - x);
        // Square off the side that touches a preceding streak; keep the side
        // that leads into a new streak rounded.
        const prevIsStreak = daySet.has(d - 1);
        roundRect(ctx, x, trackY, brokenW, trackH, cornerRadii(pointRadius, prevIsStreak, false));
        ctx.fill();
      }

      let runStart = days[0];
      let prev = days[0];
      const flush = (start: number, end: number, nextIsBroken: boolean) => {
        const runLength = end - start + 1;
        for (let j = 0; j < runLength; j++) {
          const x = start * step + j * dayW;
          if (x >= width) break;
          const isLast = j === runLength - 1;
          // Slight overlap between neighbours avoids hairline seams.
          const w = Math.min(isLast ? dayW : dayW + 0.5, width - x);
          ctx.fillStyle = streakColor(j);
          // Square the right edge of the final day when it leads into a
          // broken-streak marker; keep it rounded when a new streak follows.
          const rightSquare = !isLast || nextIsBroken;
          roundRect(ctx, x, trackY, w, trackH, cornerRadii(pointRadius, j !== 0, rightSquare));
          ctx.fill();
        }
      };
      for (let i = 1; i < days.length; i++) {
        const d = days[i];
        // Merge runs that are consecutive, or that collapse into the same pixel.
        if (d - prev <= 1 || (d - prev) * step < dayW) {
          prev = d;
          continue;
        }
        flush(runStart, prev, brokenSet.has(prev + 1));
        runStart = d;
        prev = d;
      }
      flush(runStart, prev, brokenSet.has(prev + 1));

    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [days, totalDays, height]);

  return (
    <div ref={wrapRef} className="w-full" style={{ height }}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

function resolveTrackColor(trackColor: string | undefined, fallback: string): string {
  if (!trackColor) return fallback;
  if (trackColor === "transparent") return "transparent";

  const styles = getComputedStyle(document.documentElement);
  const hslParts = (varName: string) =>
    styles.getPropertyValue(varName).trim().split(/\s+/).join(", ");

  if (trackColor === "secondary-70") {
    return `hsla(${hslParts("--secondary")}, 0.7)`;
  }
  if (trackColor === "card") {
    return `hsl(${hslParts("--card")})`;
  }
  return trackColor;
}

/**
 * Colour for a day within a streak: neutral gray on day 1, saturating toward
 * gold by day 10 and beyond, while keeping the same brightness.
 */
function streakColor(indexInStreak: number): string {
  const t = Math.min(1, indexInStreak / 9);
  const saturation = 6 + t * 79; // 6% → 85%
  return `hsl(45, ${saturation.toFixed(1)}%, 52%)`;
}

function cornerRadii(r: number, leftSquare: boolean, rightSquare: boolean): [number, number, number, number] {

  const left = leftSquare ? 0 : r;
  const right = rightSquare ? 0 : r;
  // Order: top-left, top-right, bottom-right, bottom-left.
  return [left, right, right, left];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: [number, number, number, number],
) {
  const maxR = Math.min(w / 2, h / 2);
  const [tl, tr, br, bl] = radii.map((r) => Math.min(r, maxR));
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + h, tr);
  ctx.arcTo(x + w, y + h, x, y + h, br);
  ctx.arcTo(x, y + h, x, y, bl);
  ctx.arcTo(x, y, x + w, y, tl);
  ctx.closePath();
}
