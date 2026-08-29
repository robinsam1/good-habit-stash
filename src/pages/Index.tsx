import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, LogOut, Loader2, Sparkles, Settings as SettingsIcon, ListChecks, BarChart3, Mail } from "lucide-react";
import { TotalDisplay } from "@/components/TotalDisplay";
import { ActivityPicker } from "@/components/ActivityPicker";
import { ActivityLog } from "@/components/ActivityLog";
import { MarkAsPaidButton } from "@/components/MarkAsPaidButton";
import { FloatingDecor } from "@/components/FloatingDecor";
import { SaveProgressButton } from "@/components/SaveProgressButton";
import { OnboardingTour } from "@/components/OnboardingTour";
import { fireConfetti, CONFETTI_FLAGS } from "@/components/EmojiConfetti";
import { useLogActivity, usePaidLog, useRunningTotal, useUnpaidLog } from "@/hooks/useHabits";
import { useHabitStats } from "@/hooks/useHabitStats";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useAuth } from "@/hooks/useAuth";
import { useAnonymousLifecycle } from "@/hooks/useAnonymousLifecycle";
import { toast } from "sonner";
import { useMoney } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAnonymous, isLoading: authLoading, signOut } = useAuth();
  const [newEntryId, setNewEntryId] = useState<number | undefined>();
  const [animateTotal, setAnimateTotal] = useState(false);
  const [tourTarget, setTourTarget] = useState<string | null>(null);
  const [tourPayoutVersion, setTourPayoutVersion] = useState(0);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const { formatMoneySigned } = useMoney();

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Enable cross-device realtime sync
  useRealtimeSync();
  // Guest-account lifecycle (1h nudge → /signup, 24h purge → /welcome)
  useAnonymousLifecycle();

  const { data: unpaidLog, isLoading: isLoadingLog } = useUnpaidLog();
  const { data: paidLog } = usePaidLog();
  const total = useRunningTotal();
  const { mutate: logActivity, isPending } = useLogActivity();
  const habitStats = useHabitStats();

  const handleSelectActivity = useCallback((activityId: number) => {
    logActivity(activityId, {
      onSuccess: (entry) => {
        setNewEntryId(entry.id);
        setAnimateTotal(true);

        const isPositive = entry.value >= 0;
        toast.success(
          isPositive ? "Great job! 🎉" : "Logged",
          {
            description: `${entry.activity?.name}: ${formatMoneySigned(entry.value)}`,
          }
        );

        // First-task confetti for guest users only, once per browser.
        if (isAnonymous) {
          try {
            if (!localStorage.getItem(CONFETTI_FLAGS.task)) {
              fireConfetti(["🌟", "🏅", "🏆"]);
              localStorage.setItem(CONFETTI_FLAGS.task, "1");
            }
          } catch {
            /* ignore */
          }
        }

        // Reset animation states after a delay
        setTimeout(() => {
          setNewEntryId(undefined);
          setAnimateTotal(false);
        }, 500);
      },
      onError: () => {
        toast.error("Failed to log activity", {
          description: "Please try again",
        });
      },
    });
  }, [logActivity, formatMoneySigned]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    // Clear guest-session markers so the lifecycle hook doesn't fire again.
    localStorage.removeItem('hv_anon_started_at');
    localStorage.removeItem('hv_anon_nudged_save');
    localStorage.removeItem('hv_onboarding_pending');
    toast.success(isAnonymous ? 'Signed out — guest data cleared' : 'Signed out');
  }, [signOut, isAnonymous]);

  const handleSignOutClick = useCallback(() => {
    if (isAnonymous) {
      setConfirmSignOut(true);
    } else {
      void handleSignOut();
    }
  }, [isAnonymous, handleSignOut]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingDecor />

      {/* Soft gradient blobs */}

      <div className="max-w-lg sm:max-w-3xl mx-auto px-4 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-10 relative">
          {/* Reporting + Save (guests only) — top-left, mirroring the right-hand controls */}
          <div className="absolute left-0 top-0 flex items-center gap-1">
            <Link to="/report">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5 px-2 tabular-nums"
                title="Adherence report"
                aria-label={`Adherence report — ${habitStats.total} habits completed`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {habitStats.isLoading ? "–" : habitStats.total}
                </span>
              </Button>
            </Link>
            {isAnonymous && <SaveProgressButton data-tour="save" />}
          </div>
          <div className="absolute right-0 top-0 flex items-center gap-1">
            <Link to="/tasks" data-tour="tasks">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title="Edit tasks"
              >
                <ListChecks className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title="Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOutClick}
              className="text-muted-foreground hover:text-foreground"
              title={isAnonymous ? "Sign out and clear guest data" : "Sign out"}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gradient mb-4 animate-pop-in">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            <span className="text-brand-gradient animate-shimmer">
              Habit Visor
            </span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium tracking-wide">
            Track habits, earn rewards ✨
          </p>
        </header>

        {/* Guest save-progress banner */}
        {isAnonymous && (
          <Link to="/signup" className="block mb-6 animate-slide-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
            <Card className="border border-primary/20 bg-primary/5 shadow-soft hover:shadow-md transition-shadow">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Register your email to save your progress
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Your habits and balance are only stored on this device until you sign up.
                  </p>
                </div>
                <Button size="sm" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
                  Save progress
                </Button>
              </div>
            </Card>
          </Link>
        )}

        {/* Total Display */}
        <Card data-tour="total" className="mb-10 border-border shadow-elevated overflow-hidden animate-slide-up relative" style={{ animationFillMode: "both" }}>
          <div className="py-8 px-4">
            <TotalDisplay total={total} animate={animateTotal} isLoading={isLoadingLog} />
          </div>
          {/* Habits-completed stats — deliberately smaller so they never compete with the balance */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-0.5 text-right">
            {habitStats.isLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Completed today{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {habitStats.today}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  7-day avg{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {habitStats.avg7}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Target{" "}
                  <span
                    className={
                      habitStats.today >= habitStats.target
                        ? "font-semibold text-positive tabular-nums"
                        : "font-semibold text-foreground tabular-nums"
                    }
                  >
                    {habitStats.target}
                  </span>
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Activity Picker */}
        <div data-tour="picker" className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <ActivityPicker
            onSelect={handleSelectActivity}
            isLogging={isPending}
          />
        </div>

        {/* Mark as Paid Button */}
        <div data-tour="mark-paid" className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
          <MarkAsPaidButton
            forceVisible={tourTarget === "mark-paid"}
            onPaid={() => setTourPayoutVersion((version) => version + 1)}
          />
        </div>

        {/* Activity Log */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Logged Today
            </h2>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </Link>
          </div>
          <ActivityLog newEntryId={newEntryId} />
        </div>
      </div>

      {/* Guided tour for new guest users */}
      <OnboardingTour
        enabled={isAnonymous}
        isLoading={authLoading}
        onTargetChange={setTourTarget}
        unpaidCount={unpaidLog?.length ?? 0}
        paidCount={paidLog?.length ?? 0}
        payoutVersion={tourPayoutVersion}
      />


      {/* Confirm sign-out for guest accounts (destructive) */}
      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              Sign out and clear guest data?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You're using a guest account. Signing out will permanently delete your
              habits, log entries and balance. Save your progress first to keep them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmSignOut(false);
                void handleSignOut();
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              Sign out & delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
