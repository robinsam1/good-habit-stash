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
import demoVideo from "@/assets/demo-phone.mp4";

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
    if (!canNext) return;
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
          src={demoVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-[1.35] blur-[2px] opacity-60"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="w-full max-w-lg sm:max-w-3xl relative z-10 flex-1 min-h-0 max-h-[820px] flex flex-col">
        <Link to="/welcome" className="shrink-0">
          <Button variant="ghost" size="sm" className="mb-2 short:mb-1 -ml-2 text-muted-foreground h-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <header className="text-center mb-3 short:mb-2 shrink-0">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-gradient mb-2 animate-pop-in short:hidden">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-muted-foreground mb-1">
            Habit Visor
          </div>
          <h1 className="font-display text-2xl short:text-xl font-bold tracking-tight">
            <span className="text-brand-gradient animate-shimmer">
              Small habits, real rewards
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto short:hidden">
            Habit Visor helps you track the small habits that get you to your goals — and pay
            yourself for sticking with them.
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
                    <p className="text-xs text-muted-foreground mt-0.5 short:hidden">
                      Pick a focus — we'll suggest habits to match.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 short:gap-2">
                    {GOALS.map((g, i) => {
                      const isSel = goal === g.code;
                      return (
                        <button
                          key={g.code}
                          type="button"
                          onClick={() => chooseGoal(g.code)}
                          className={cn(
                            "pressable group relative rounded-lg border p-3 short:p-2 text-left animate-slide-up shadow-soft",
                            "hover:border-primary/50 flex items-center gap-3",
                            isSel ? "border-primary bg-primary/5" : "border-border bg-card"
                          )}
                          style={{ animationDelay: `${0.05 * i}s`, animationFillMode: "both" }}
                        >
                          <div className="text-3xl short:text-2xl shrink-0">{g.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm leading-tight">{g.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-snug short:hidden">
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
                    <p className="text-xs text-muted-foreground mt-0.5 short:hidden">
                      Tick the ones you want to start with, or add your own.
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
                      You should reward yourself!
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Set a value for completing each habit.
                    </p>
                  </div>

                  <Select value={regionCode} onValueChange={setRegionCode} disabled={submitting}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Choose your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {REGION_GROUPS.flatMap((group) => group.regions).map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {r.name} · {r.currencySymbol} {r.currencyCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                            className="h-9 w-20 text-base sm:text-sm text-right"
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
                  disabled={!canNext}
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
              src={demoVideo}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-foreground/5" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 62%, hsl(var(--background)) 100%)",
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
