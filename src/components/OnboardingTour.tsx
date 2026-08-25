import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ONBOARDING_PENDING_KEY } from "@/hooks/useAnonymousLifecycle";
import {
  useClaimOnboardingReward,
  ONBOARDING_COMPLETE_STEP,
  ONBOARDING_COMPLETE_LABEL,
} from "@/hooks/useHabits";
import { useMoney } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";


interface Step {
  target: string; // data-tour attribute value
  title: string;
  body: string;
  interactive?: "log" | "paid";
  hint?: string;
  padding?: number; // override default highlight padding
  square?: boolean; // force highlight to be a square centered on the target
}



const STEPS: Step[] = [
  {
    target: "total",
    title: "Your digital piggy bank",
    body: "Every habit you tick adds real money to this pot. Watch it grow as your streak grows.",
  },
  {
    target: "picker",
    title: "What have you done for yourself today?",
    body: "Pick any habit from the dropdown that you've already completed today — go on, give yourself credit.",
    interactive: "log",
    hint: "Pick a habit to continue",
  },
  {
    target: "mark-paid",
    title: "Reward yourself",
    body: "Open your banking app, set up a savings pot, and transfer the amount above into it. Then tap the pay-out button to mark it done — a job well done deserves a real reward.",
    interactive: "paid",
    hint: "Tap pay-out to continue",
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
    padding: 10,
    square: true,
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

function readRect(target: string, padding: number = PADDING, square = false): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  let width = r.width;
  let height = r.height;
  let left = r.left;
  let top = r.top;
  if (square) {
    const size = Math.max(width, height);
    left = left + width / 2 - size / 2;
    top = top + height / 2 - size / 2;
    width = size;
    height = size;
  }
  // Viewport-relative — the overlay is position: fixed, so do NOT add scroll offsets.
  return {
    top: top - padding,
    left: left - padding,
    width: width + padding * 2,
    height: height + padding * 2,
  };
}




export function OnboardingTour({
  enabled,
  isLoading,
  onTargetChange,
  unpaidCount = 0,
  paidCount = 0,
}: {
  enabled: boolean;
  isLoading?: boolean;
  onTargetChange?: (target: string | null) => void;
  unpaidCount?: number;
  paidCount?: number;
}) {

  // Initialise synchronously from localStorage so the overlay can paint on
  // the same frame as the dashboard — no auth roundtrip, no setTimeout.
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ONBOARDING_PENDING_KEY) === "1";
  });
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const { mutate: claimReward } = useClaimOnboardingReward();
  const { formatMoney } = useMoney();

  const claimedRef = useRef(false);

  const claimCompletion = () => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    claimReward(ONBOARDING_COMPLETE_STEP, {
      onSuccess: (reward) => {
        if (!reward || reward.value === 0) return;
        toast.success("Reward earned!", {
          description: `You earned ${formatMoney(reward.value)} for ${ONBOARDING_COMPLETE_LABEL}.`,
        });
      },
    });
  };

  // `enabled` is only used as a CANCEL signal — once auth resolves, if the user
  // turns out to be fully registered, tear the tour down. While auth is still
  // loading we must not cancel, otherwise the initial `enabled=false` state
  // for an anonymous user kills the tour before the session resolves.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(ONBOARDING_PENDING_KEY) !== "1") {
      if (active) setActive(false);
      return;
    }
    // Flag is set: only show for anonymous sessions.
    if (!isLoading && !enabled && active) setActive(false);
  }, [enabled, active, isLoading]);




  const currentStep = STEPS[step];

  // Recompute rect whenever step changes or the layout shifts.

  useLayoutEffect(() => {
    if (!active || !currentStep) return;
    let raf1 = 0;
    let raf2 = 0;
    let settle = 0;
    // Bring the target into view INSTANTLY so we can measure its final position
    // immediately — smooth scroll on mobile was the main source of perceived lag.
    const el = document.querySelector<HTMLElement>(`[data-tour="${currentStep.target}"]`);
    try {
      el?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "center", inline: "nearest" });
    } catch {
      el?.scrollIntoView({ block: "center", inline: "nearest" });
    }
    const update = () => {
      setRect(readRect(currentStep.target, currentStep.padding, currentStep.square));
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    // Measure now, next frame, and once more after a short settle to catch
    // any post-mount animation without running a 480ms polling loop.
    update();
    raf1 = requestAnimationFrame(() => {
      update();
      raf2 = requestAnimationFrame(update);
    });
    settle = window.setTimeout(update, 120);

    // If the target isn't in the DOM yet (dashboard still mounting),
    // watch for it and measure the instant it appears.
    let observer: MutationObserver | null = null;
    if (!el) {
      observer = new MutationObserver(() => {
        const found = document.querySelector<HTMLElement>(`[data-tour="${currentStep.target}"]`);
        if (found) {
          try {
            found.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "center", inline: "nearest" });
          } catch {
            found.scrollIntoView({ block: "center", inline: "nearest" });
          }
          update();
          observer?.disconnect();
          observer = null;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    const onResize = () => {
      cancelAnimationFrame(raf1);
      raf1 = requestAnimationFrame(update);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf1);
      raf1 = requestAnimationFrame(update);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer?.disconnect();
    };
  }, [active, step, currentStep]);

  // Notify parent of current target (so e.g. mark-paid CTA can be forced visible).
  useEffect(() => {
    if (!onTargetChange) return;
    onTargetChange(active && currentStep ? currentStep.target : null);
  }, [active, currentStep, onTargetChange]);

  const finish = (completed = false) => {
    if (completed) claimCompletion();
    localStorage.removeItem(ONBOARDING_PENDING_KEY);
    setActive(false);
    onTargetChange?.(null);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish(true);
      return;
    }
    setStep((s) => s + 1);
  };

  // Baselines captured the moment an interactive step becomes active.
  // Auto-advance when the relevant counter moves past its baseline.
  const unpaidBaselineRef = useRef<number | null>(null);
  const paidBaselineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !currentStep) return;
    if (currentStep.interactive === "log") {
      unpaidBaselineRef.current = unpaidCount;
    } else {
      unpaidBaselineRef.current = null;
    }
    if (currentStep.interactive === "paid") {
      paidBaselineRef.current = paidCount;
    } else {
      paidBaselineRef.current = null;
    }
    // We intentionally only re-run when step changes, not when counts move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  useEffect(() => {
    if (!active || !currentStep) return;
    if (
      currentStep.interactive === "log" &&
      unpaidBaselineRef.current !== null &&
      unpaidCount > unpaidBaselineRef.current
    ) {
      next();
    }
    if (
      currentStep.interactive === "paid" &&
      paidBaselineRef.current !== null &&
      paidCount > paidBaselineRef.current
    ) {
      next();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unpaidCount, paidCount, active, currentStep]);


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
    // Prefer below; if no room, go above. Clamp to viewport in either case
    // so the tooltip's CTAs are always reachable.
    const TOOLTIP_H = 260;
    const spaceBelow = viewport.h - (rect.top + rect.height);
    const placeBelow = spaceBelow > TOOLTIP_H + 16;
    let top = placeBelow
      ? rect.top + rect.height + 16
      : rect.top - TOOLTIP_H - 16;
    const maxTop = viewport.h - TOOLTIP_H - 16;
    top = Math.max(16, Math.min(top, maxTop));
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
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* SVG mask overlay with a cutout for the highlighted element */}
      <svg
        className={cn(
          "absolute inset-0 w-full h-full",
          currentStep.interactive ? "pointer-events-none" : "pointer-events-auto"
        )}
        onClick={currentStep.interactive ? undefined : next}
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
          "absolute rounded-2xl border bg-card text-card-foreground shadow-2xl",
          "p-5",
          currentStep.interactive ? "pointer-events-none" : "pointer-events-auto"
        )}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipPos.width,
          
        }}
      >

        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
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
                  i === step ? "w-6 bg-brand-gradient" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => finish()}
              className={cn(
                "text-muted-foreground",
                currentStep.interactive && "pointer-events-auto"
              )}
            >
              Skip tour
            </Button>

            {currentStep.interactive ? (
              <span className="text-xs italic text-muted-foreground pr-1">
                {currentStep.hint ?? "Try it to continue"}
              </span>
            ) : (
              <Button
                size="sm"
                onClick={next}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {step === STEPS.length - 1 ? "Got it" : "Next"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
