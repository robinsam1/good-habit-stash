import { useEffect, useRef, useState } from "react";
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


const GetStarted = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signInAnonymously } = useAuth();
  const [goal, setGoal] = useState<GoalCode | null>(null);
  const [regionCode, setRegionCode] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const startingRef = useRef(false);

  useEffect(() => {
    // Don't auto-redirect while the user is actively clicking Get started —
    // handleSubmit needs to finish setting guest lifecycle markers first.
    if (startingRef.current) return;
    if (!isLoading && isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);


  const canSubmit = !!goal && !!regionCode && !submitting;

  const handleSubmit = async () => {
    if (!goal || !regionCode) return;
    const region = getRegion(regionCode);
    if (!region) return;

    startingRef.current = true;
    setSubmitting(true);
    // Fresh guest FRE — let confetti fire again for this session.
    localStorage.removeItem(CONFETTI_FLAGS.task);
    localStorage.removeItem(CONFETTI_FLAGS.paid);
    const { error } = await signInAnonymously(goal, region);

    if (error) {
      startingRef.current = false;
      setSubmitting(false);
      toast.error("Couldn't get started", { description: "Please try again." });
      return;
    }

    // Mark onboarding tour pending and lifecycle markers BEFORE claiming
    // rewards, so the home page tour sees the flag as soon as it mounts.
    localStorage.setItem(ANON_STARTED_KEY, String(Date.now()));
    localStorage.removeItem(ANON_NUDGED_KEY);
    localStorage.setItem(ONBOARDING_PENDING_KEY, "1");

    startingRef.current = false;
    setSubmitting(false);
    navigate("/", { replace: true });
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-3 sm:py-6 relative overflow-hidden">
      <FloatingDecor />

      <div className="w-full max-w-lg relative z-10">
        <Link to="/welcome">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground h-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <header className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-gradient mb-2 animate-pop-in">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-muted-foreground mb-1">
            Habit Visor
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="text-brand-gradient animate-shimmer">
              What matters most?
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pick a focus — we'll build your starter habits.</p>
        </header>

        <Card className="border-border/50 shadow-elevated overflow-hidden">
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
                        ? "border-primary bg-primary/5 scale-[1.02]"
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
                    <div className="font-semibold text-sm leading-tight">{g.label}</div>
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
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
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
