import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GOALS, GoalCode } from "@/lib/goals";
import { presetsForGoal } from "@/lib/habitPresets";
import { REGION_GROUPS, getRegion } from "@/lib/regions";

import { useAuth } from "@/hooks/useAuth";
import { FloatingDecor } from "@/components/FloatingDecor";
import {
  ANON_STARTED_KEY,
  ANON_NUDGED_KEY,
  ONBOARDING_PENDING_KEY,
} from "@/hooks/useAnonymousLifecycle";
import { cn } from "@/lib/utils";
import { CONFETTI_FLAGS } from "@/components/EmojiConfetti";
import demoVideoMp4 from "@/assets/demo-desk-ai2.mp4";
import demoVideoWebm from "@/assets/demo-desk-ai2.webm";

interface HabitDraft {
  id: string;
  name: string;
  checked: boolean;
  custom: boolean;
  value: string;
}

let habitSeq = 0;
const nextId = () => `h${++habitSeq}`;

const blankHabit = (): HabitDraft => ({
  id: nextId(),
  name: "",
  checked: false,
  custom: true,
  value: "1",
});

const GetStarted = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signInAnonymously } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<GoalCode | null>(null);
  const [habits, setHabits] = useState<HabitDraft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regionCode, setRegionCode] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState<{ step: number; key: number } | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const startingRef = useRef(false);

  useEffect(() => {
    // Don't auto-redirect while the user is actively clicking Get started —
    // handleSubmit needs to finish setting guest lifecycle markers first.
    if (startingRef.current) return;
    if (!isLoading && isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const region = getRegion(regionCode);

  const chooseGoal = (code: GoalCode) => {
    setGoal(code);
    if (code !== goal) {
      setHabits([
        ...presetsForGoal(code).map((p) => ({
          id: nextId(),
          name: p.name,
          checked: !!p.suggested,
          custom: false,
          value: "1",
        })),
        blankHabit(),
      ]);
    }
  };

  const updateHabit = (id: string, patch: Partial<HabitDraft>) => {
    setHabits((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, ...patch } : h));
      // Typing into the last blank custom row spawns another blank row below.
      const last = next[next.length - 1];
      if (last && last.custom && last.name.trim() !== "") next.push(blankHabit());
      return next;
    });
  };

  const selected = useMemo(
    () => habits.filter((h) => h.checked && h.name.trim() !== ""),
    [habits]
  );

  const canNext = step === 0 ? !!goal : step === 1 ? selected.length > 0 : !!region && !submitting;

  const handleNext = () => {
    if (!canNext) {
      // Nudge the user towards what needs selecting — only for the current step.
      if ((step === 0 && !goal) || (step === 2 && !region)) {
        setShake({ step, key: Date.now() });
      }
      return;
    }
    if (step < 2) {
      setEditingId(null);
      setStep(step + 1);
      return;
    }
    void handleSubmit();
  };

  const handleSubmit = async () => {
    if (!goal || !region) return;
    const factor = Math.pow(10, region.minorUnitDigits);
    const payload = selected.slice(0, 40).map((h) => {
      const parsed = parseFloat(h.value.replace(",", "."));
      const amount = Number.isFinite(parsed) ? parsed : 1;
      return { name: h.name.trim().slice(0, 120), value: Math.round(amount * factor) };
    });

    startingRef.current = true;
    setSubmitting(true);
    // Fresh guest FRE — let confetti fire again for this session.
    localStorage.removeItem(CONFETTI_FLAGS.task);
    localStorage.removeItem(CONFETTI_FLAGS.paid);
    const { error } = await signInAnonymously(goal, region, payload);

    if (error) {
      startingRef.current = false;
      setSubmitting(false);
      toast.error("Couldn't get started", { description: "Please try again." });
      return;
    }

    localStorage.setItem(ANON_STARTED_KEY, String(Date.now()));
    localStorage.removeItem(ANON_NUDGED_KEY);
    localStorage.setItem(ONBOARDING_PENDING_KEY, "1");

    startingRef.current = false;
    setSubmitting(false);
    navigate("/", { replace: true });
  };

  const ctaLabel = step === 2 ? "Get started" : "Next";

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col items-center justify-center px-4 py-3 sm:py-6 short:py-2 relative">
      <FloatingDecor />

      {/* Mobile: demo video sits behind the panel */}
      <div className="sm:hidden absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className={cn(
            "w-full h-full object-cover",
            introDone ? "scale-[1.35] blur-[2px] opacity-60" : "scale-[1.15] opacity-90"
          )}
        >
          <source src={demoVideoWebm} type="video/webm" />
              <source src={demoVideoMp4} type="video/mp4" />
        </video>
        <div className={cn("absolute inset-0", introDone ? "bg-background/80" : "bg-background/40")} />
      </div>

      <div className="w-full max-w-lg sm:max-w-3xl relative z-10 flex-1 min-h-0 max-h-[820px] flex flex-col">
        <header className="text-center mb-4 short:mb-2 shrink-0">
          <div className="inline-flex items-center justify-center w-14 h-14 short:w-11 short:h-11 rounded-2xl bg-brand-gradient mb-2 short:mb-1 animate-pop-in shadow-soft">
            <Sparkles className="h-7 w-7 short:h-5 short:w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl short:text-2xl font-bold tracking-tight">
            <span className="text-brand-gradient animate-shimmer">Habit Visor</span>
          </h1>
          <p className="text-lg italic text-foreground/80 mt-1.5 max-w-md mx-auto">
            A better you, one habit at a time
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 items-stretch flex-1 min-h-0">
          <Card className="shadow-elevated overflow-hidden flex flex-col min-h-0">
            <CardContent className="pt-4 pb-4 short:pt-3 flex-1 flex flex-col min-h-0 overflow-y-auto">
              {step === 0 && (
                <div className="space-y-3 short:space-y-2 pb-1">
                  <div>
                    <h2 className="font-display text-lg font-bold tracking-tight">
                      What matters most?
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose a goal to work towards
                    </p>
                  </div>
                  <div
                    key={shake?.step === 0 ? shake.key : "goals"}
                    className={cn(
                      "flex flex-col gap-2.5 short:gap-2",
                      shake?.step === 0 && !goal && "animate-shake"
                    )}
                  >
                    {GOALS.map((g) => {
                      const isSel = goal === g.code;
                      return (
                        <button
                          key={g.code}
                          type="button"
                          onClick={() => chooseGoal(g.code)}
                          className={cn(
                            "pressable group relative rounded-lg border p-3 short:p-2 text-left shadow-soft",
                            "hover:border-primary/50 flex items-center gap-3",
                            isSel ? "border-primary bg-primary/5" : "border-border bg-card"
                          )}
                        >
                          <div className="text-3xl short:text-2xl shrink-0">{g.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm leading-tight">{g.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-snug shorter:hidden">
                              {g.blurb}
                            </div>
                          </div>
                          {isSel && (
                            <div className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col min-h-0 flex-1 space-y-3 short:space-y-2">
                  <div>
                    <h2 className="font-display text-lg font-bold tracking-tight">
                      Which habits will help?
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pick small things that you're struggling to achieve
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto -mx-1 px-1 pb-1 space-y-1">
                    {habits.map((h) => {
                      const isBlank = h.custom && h.name.trim() === "";
                      const editing = editingId === h.id;
                      return (
                        <div
                          key={h.id}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={h.checked}
                            disabled={isBlank}
                            onCheckedChange={(v) => updateHabit(h.id, { checked: !!v })}
                            aria-label={h.name || "New habit"}
                          />
                          {editing || h.custom ? (
                            <Input
                              value={h.name}
                              autoFocus={editing}
                              placeholder={isBlank ? "Add your own habit…" : undefined}
                              onChange={(e) =>
                                updateHabit(h.id, {
                                  name: e.target.value,
                                  checked: h.custom ? e.target.value.trim() !== "" : h.checked,
                                })
                              }
                              onBlur={() => setEditingId(null)}
                              className="h-8 text-base sm:text-sm border-none shadow-none bg-transparent px-1 focus-visible:ring-1"
                            />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => updateHabit(h.id, { checked: !h.checked })}
                                className="flex-1 min-w-0 text-left text-sm truncate"
                              >
                                {h.name}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(h.id)}
                                aria-label={`Edit ${h.name}`}
                                className="shrink-0 text-muted-foreground hover:text-foreground p-1"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col min-h-0 flex-1 space-y-3 short:space-y-2">
                  <div>
                    <h2 className="font-display text-lg font-bold tracking-tight">
                      Value your work
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Science says it's easier to keep habits with rewards
                    </p>
                  </div>

                  <div
                    key={shake?.step === 2 ? shake.key : "currency"}
                    className={cn(shake?.step === 2 && !region && "animate-shake")}
                  >
                  <Select value={regionCode} onValueChange={setRegionCode} disabled={submitting}>
                    <SelectTrigger
                      id="region"
                      className={cn(
                        !regionCode &&
                          "border-primary/60 bg-primary/5 text-muted-foreground ring-1 ring-primary/20"
                      )}
                    >
                      <SelectValue placeholder="Choose your currency" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {REGION_GROUPS.flatMap((group) => group.regions).map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {r.name} · {r.currencySymbol} {r.currencyCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto -mx-1 px-1 pb-1 space-y-1">
                    {selected.map((h) => (
                      <div key={h.id} className="flex items-center gap-2 py-1">
                        <div className="flex-1 min-w-0 text-sm truncate">{h.name}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-sm text-muted-foreground w-6 text-right">
                            {region?.currencySymbol ?? ""}
                          </span>
                          <Input
                            inputMode="decimal"
                            value={h.value}
                            onChange={(e) => updateHabit(h.id, { value: e.target.value })}
                            className="h-9 w-12 text-base sm:text-sm text-right px-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border px-4 py-3 bg-card">
              <div className="flex items-center gap-1.5">
                {step > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 text-muted-foreground"
                    onClick={() => setStep(step - 1)}
                    disabled={submitting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === step ? "w-4 bg-primary" : "w-1.5 bg-border"
                      )}
                    />
                  ))}
                </div>
                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  size="sm"
                  className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {ctaLabel}
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Desktop: demo video occupies the right half */}
          <div className="hidden sm:block relative min-h-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={demoVideoWebm} type="video/webm" />
              <source src={demoVideoMp4} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-foreground/5" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 30%, hsl(var(--background)) 78%)",
              }}
            />
          </div>
        </div>

        <p className="shrink-0 text-sm text-center text-muted-foreground mt-3 short:mt-2">
          Already have an account?{" "}
          <Link to="/auth" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default GetStarted;
