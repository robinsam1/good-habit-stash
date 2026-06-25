import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ONBOARDING_PENDING_KEY } from "@/hooks/useAnonymousLifecycle";
import { cn } from "@/lib/utils";

interface Step {
  target: string; // data-tour attribute value
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: "total",
    title: "Your digital piggy bank",
    body: "Every habit you tick adds real money to this pot. Watch it grow as your streak grows.",
  },
  {
    target: "picker",
    title: "Log a habit in one tap",
    body: "Pick a habit from the dropdown the moment you complete it.",
  },
  {
    target: "mark-paid",
    title: "Pay yourself out",
    body: "At the end of the day, move what you earned into your savings.",
  },
  {
    target: "tasks",
    title: "Tune your habits",
    body: "Edit, add or remove habits whenever you want — tap the checklist icon.",
  },
  {
    target: "save",
    title: "Don't lose your progress!",
    body: "Save your account to keep everything you've built. You can do this any time.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const RADIUS = 14;

function readRect(target: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY - PADDING,
    left: r.left + window.scrollX - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

export function OnboardingTour({
  enabled,
  onTargetChange,
}: {
  enabled: boolean;
  onTargetChange?: (target: string | null) => void;
}) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(ONBOARDING_PENDING_KEY) !== "1") return;
    // Small delay to let the page mount its targets / animations land.
    const t = window.setTimeout(() => setActive(true), 400);
    return () => window.clearTimeout(t);
  }, [enabled]);

  const currentStep = STEPS[step];

  // Recompute rect whenever step changes or the layout shifts.
  useLayoutEffect(() => {
    if (!active || !currentStep) return;
    let raf = 0;
    const update = () => {
      setRect(readRect(currentStep.target));
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    // Re-poll briefly to catch any post-mount animations.
    let i = 0;
    const interval = window.setInterval(() => {
      update();
      if (++i >= 6) window.clearInterval(interval);
    }, 80);

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      cancelAnimationFrame(raf);
    };
  }, [active, step, currentStep]);

  const finish = () => {
    localStorage.removeItem(ONBOARDING_PENDING_KEY);
    setActive(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const tooltipPos = useMemo(() => {
    if (!rect) {
      return {
        top: viewport.h / 2 - 100,
        left: Math.max(16, viewport.w / 2 - 160),
        width: Math.min(320, viewport.w - 32),
      };
    }
    const width = Math.min(320, viewport.w - 32);
    const left = Math.min(
      Math.max(16, rect.left + rect.width / 2 - width / 2),
      viewport.w - width - 16
    );
    // Prefer below; if no room, go above.
    const spaceBelow = viewport.h - (rect.top - window.scrollY + rect.height);
    const placeBelow = spaceBelow > 220;
    const top = placeBelow
      ? rect.top + rect.height + 16
      : Math.max(16, rect.top - 220);
    return { top, left, width };
  }, [rect, viewport]);

  if (!active || !currentStep) return null;

  const maskRect = rect ?? {
    top: -100,
    left: -100,
    width: 0,
    height: 0,
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none animate-fade-in">
      {/* SVG mask overlay with a cutout for the highlighted element */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={next}
        aria-hidden
      >
        <defs>
          <mask id="hv-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={maskRect.left}
              y={maskRect.top}
              width={maskRect.width}
              height={maskRect.height}
              rx={RADIUS}
              ry={RADIUS}
              fill="black"
              style={{ transition: "all 350ms cubic-bezier(0.4,0,0.2,1)" }}
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--foreground) / 0.55)"
          mask="url(#hv-tour-mask)"
        />
      </svg>

      {/* Pulsing ring around the highlighted element */}
      {rect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: RADIUS,
            transition: "all 350ms cubic-bezier(0.4,0,0.2,1)",
            boxShadow:
              "0 0 0 2px hsl(var(--primary)), 0 0 0 8px hsl(var(--primary) / 0.25)",
            animation: "glow-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        key={step}
        className={cn(
          "absolute pointer-events-auto rounded-2xl border bg-card text-card-foreground shadow-2xl",
          "p-5 animate-slide-up"
        )}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipPos.width,
          transition: "top 350ms cubic-bezier(0.4,0,0.2,1), left 350ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <h3 className="font-display font-semibold text-lg mb-1">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{currentStep.body}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-gradient-to-r from-primary to-accent" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {step < STEPS.length - 1 && (
              <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
                Skip
              </Button>
            )}
            <Button
              size="sm"
              onClick={next}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {step === STEPS.length - 1 ? "Got it" : "Next"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
