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
      const primary = `hsl(${styles.getPropertyValue("--primary").trim()})`;
      const muted = `hsl(${styles.getPropertyValue("--muted").trim()})`;

      const trackH = Math.max(6, Math.round(height * 0.55));
      const trackY = Math.round((height - trackH) / 2);

      // Empty track — always draw, even when there are no logged days.
      ctx.fillStyle = resolveTrackColor(trackColor, muted);
      roundRect(ctx, 0, trackY, width, trackH, trackH / 2);
      ctx.fill();

      if (!days.length || totalDays <= 0) return;

      const step = width / totalDays;
      // Minimum width of a single day so isolated points stay visible on long ranges.
      const dayMin = Math.max(2, Math.min(step, 3));
      // Natural width of one logged day, never smaller than the visibility floor.
      const dayW = Math.max(dayMin, step);

      // Base radius for a single point: half the day width, capped by track height.
      // Multi-day runs use the same radius so their ends match an isolated point.
      const pointRadius = Math.min(trackH / 2, dayW / 2);

      ctx.fillStyle = primary;
      let runStart = days[0];
      let prev = days[0];
      const flush = (start: number, end: number) => {
        const x = start * step;
        const runLength = end - start + 1;
        const w = runLength * dayW;
        roundRect(ctx, x, trackY, Math.min(w, width - x), trackH, pointRadius);
        ctx.fill();
      };
      for (let i = 1; i < days.length; i++) {
        const d = days[i];
        // Merge runs that are consecutive, or that collapse into the same pixel.
        if (d - prev <= 1 || (d - prev) * step < dayW) {
          prev = d;
          continue;
        }
        flush(runStart, prev);
        runStart = d;
        prev = d;
      }
      flush(runStart, prev);
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

  if (trackColor === "muted-40") {
    return `hsla(${hslParts("--muted")}, 0.4)`;
  }
  if (trackColor === "card") {
    return `hsl(${hslParts("--card")})`;
  }
  return trackColor;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
