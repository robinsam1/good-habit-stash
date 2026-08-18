import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GOALS, GoalCode } from "@/lib/goals";
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
import {
  useClaimOnboardingReward,
  ONBOARDING_STEP_LABELS,
} from "@/hooks/useHabits";
import { useMoney } from "@/hooks/useProfile";


const GetStarted = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signInAnonymously } = useAuth();
  const { mutateAsync: claimReward } = useClaimOnboardingReward();
  const { formatMoney } = useMoney();
  const [goal, setGoal] = useState<GoalCode | null>(null);
  const [regionCode, setRegionCode] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const canSubmit = !!goal && !!regionCode && !submitting;

  const showRewardToast = (reward: { value: number } | null, stepKey: string) => {
    if (!reward || reward.value === 0) return;
    const label = ONBOARDING_STEP_LABELS[stepKey] ?? "taking a step";
    toast.success("Reward earned!", {
      description: `You earned ${formatMoney(reward.value)} for ${label}.`,
    });
  };

  const handleSubmit = async () => {
    if (!goal || !regionCode) return;
    const region = getRegion(regionCode);
    if (!region) return;

    setSubmitting(true);
    // Fresh guest FRE — let confetti fire again for this session.
    localStorage.removeItem(CONFETTI_FLAGS.task);
    localStorage.removeItem(CONFETTI_FLAGS.paid);
    const { error } = await signInAnonymously(goal, region);

    if (error) {
      setSubmitting(false);
      toast.error("Couldn't get started", { description: "Please try again." });
      return;
    }

    // Claim onboarding rewards now that a session exists.
    try {
      const welcomeReward = await claimReward("welcome_complete");
      showRewardToast(welcomeReward, "welcome_complete");
      const startedReward = await claimReward("get_started_complete");
      showRewardToast(startedReward, "get_started_complete");
    } catch {
      // Non-blocking: the user still proceeds to the app.
    }

    setSubmitting(false);

    // Reset lifecycle markers, mark onboarding tour pending.
    localStorage.setItem(ANON_STARTED_KEY, String(Date.now()));
    localStorage.removeItem(ANON_NUDGED_KEY);
    localStorage.setItem(ONBOARDING_PENDING_KEY, "1");
    console.log("[GetStarted debug] set pending", localStorage.getItem(ONBOARDING_PENDING_KEY));
    navigate("/", { replace: true });

  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-3 sm:py-6 relative overflow-hidden">
      <FloatingDecor />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/5 rounded-full animate-blob blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-56 h-56 bg-accent/5 rounded-full animate-blob blur-3xl pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-lg relative z-10">
        <Link to="/welcome">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground h-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <header className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 mb-2 animate-pop-in">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-display text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-1">
            Habit Visor
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer">
              What matters most?
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pick a focus — we'll build your starter habits.</p>
        </header>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary w-full" />
          <CardContent className="pt-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {GOALS.map((g, i) => {
                const selected = goal === g.code;
                return (
                  <button
                    key={g.code}
                    type="button"
                    onClick={() => setGoal(g.code)}
                    className={cn(
                      "group relative rounded-2xl border-2 p-3 text-left transition-all animate-slide-up",
                      "hover:border-primary/60 hover:shadow-md",
                      selected
                        ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg scale-[1.02]"
                        : "border-border bg-card"
                    )}
                    style={{ animationDelay: `${0.05 * i}s`, animationFillMode: "both" }}
                  >
                    <div className={cn(
                      "text-3xl mb-1 transition-transform",
                      selected ? "scale-110" : "group-hover:scale-105"
                    )}>
                      {g.emoji}
                    </div>
                    <div className="font-display font-semibold text-sm leading-tight">{g.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
              <label htmlFor="region" className="text-sm font-medium">Choose your country</label>
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
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Get started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-sm text-center text-muted-foreground mt-3">
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
