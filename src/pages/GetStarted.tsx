import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GOALS, GoalCode } from "@/lib/goals";
import { REGIONS, getRegion } from "@/lib/regions";
import { useAuth } from "@/hooks/useAuth";
import { FloatingDecor } from "@/components/FloatingDecor";
import {
  ANON_STARTED_KEY,
  ANON_NUDGED_KEY,
  ONBOARDING_PENDING_KEY,
} from "@/hooks/useAnonymousLifecycle";
import { cn } from "@/lib/utils";

const GetStarted = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signInAnonymously } = useAuth();
  const [goal, setGoal] = useState<GoalCode | null>(null);
  const [regionCode, setRegionCode] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const canSubmit = !!goal && !!regionCode && !submitting;

  const handleSubmit = async () => {
    if (!goal || !regionCode) return;
    const region = getRegion(regionCode);
    if (!region) return;

    setSubmitting(true);
    const { error } = await signInAnonymously(goal, region);
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't get started", { description: "Please try again." });
      return;
    }

    // Reset lifecycle markers, mark onboarding tour pending.
    localStorage.setItem(ANON_STARTED_KEY, String(Date.now()));
    localStorage.removeItem(ANON_NUDGED_KEY);
    localStorage.setItem(ONBOARDING_PENDING_KEY, "1");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <FloatingDecor />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/5 rounded-full animate-blob blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-56 h-56 bg-accent/5 rounded-full animate-blob blur-3xl pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-lg relative z-10">
        <Link to="/welcome">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <header className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 mb-4 animate-pop-in">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer">
              What matters most?
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">Pick a focus — we'll build your starter habits.</p>
        </header>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary w-full" />
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g, i) => {
                const selected = goal === g.code;
                return (
                  <button
                    key={g.code}
                    type="button"
                    onClick={() => setGoal(g.code)}
                    className={cn(
                      "group relative rounded-2xl border-2 p-4 text-left transition-all animate-slide-up",
                      "hover:border-primary/60 hover:shadow-md",
                      selected
                        ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg scale-[1.02]"
                        : "border-border bg-card"
                    )}
                    style={{ animationDelay: `${0.05 * i}s`, animationFillMode: "both" }}
                  >
                    <div className={cn(
                      "text-4xl mb-2 transition-transform",
                      selected ? "scale-110" : "group-hover:scale-105"
                    )}>
                      {g.emoji}
                    </div>
                    <div className="font-display font-semibold text-sm leading-tight">{g.label}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-snug">{g.blurb}</div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
              <label htmlFor="region" className="text-sm font-medium">Choose your country</label>
              <Select value={regionCode} onValueChange={setRegionCode} disabled={submitting}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Choose your country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {REGIONS.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name} · {r.currencySymbol} {r.currencyCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sets the currency your rewards are tracked in.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
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

        <p className="text-sm text-center text-muted-foreground mt-4">
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
