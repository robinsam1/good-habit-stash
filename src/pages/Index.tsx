import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, LogOut, Loader2, Sparkles, Settings as SettingsIcon, ListChecks, Flame } from "lucide-react";
import { TotalDisplay } from "@/components/TotalDisplay";
import { ActivityPicker } from "@/components/ActivityPicker";
import { ActivityLog } from "@/components/ActivityLog";
import { MarkAsPaidButton } from "@/components/MarkAsPaidButton";
import { FloatingDecor } from "@/components/FloatingDecor";
import { SaveProgressButton } from "@/components/SaveProgressButton";
import { OnboardingTour } from "@/components/OnboardingTour";
import { fireConfetti, CONFETTI_FLAGS } from "@/components/EmojiConfetti";
import { useLogActivity, useRunningTotal, useUnpaidLog } from "@/hooks/useHabits";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useAuth } from "@/hooks/useAuth";
import { useAnonymousLifecycle } from "@/hooks/useAnonymousLifecycle";
import { toast } from "sonner";
import { useMoney } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  const { isLoading: isLoadingLog } = useUnpaidLog();
  const total = useRunningTotal();
  const { mutate: logActivity, isPending } = useLogActivity();

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
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/5 rounded-full animate-blob blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-56 h-56 bg-accent/5 rounded-full animate-blob blur-3xl pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-10 relative">
          {/* Save (guests only) — top-left, mirroring the sign-out CTA */}
          {isAnonymous && (
            <div className="absolute left-0 top-0 flex items-center gap-1">
              <SaveProgressButton data-tour="save" />
              <Link to="/streaks">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Streaks"
                >
                  <Flame className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
          <div className="absolute right-0 top-0 flex items-center gap-1">
            {!isAnonymous && (
              <Link to="/streaks">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Streaks"
                >
                  <Flame className="h-4 w-4" />
                </Button>
              </Link>
            )}
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 mb-4 animate-pop-in">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer">
              Habit Visor
            </span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium tracking-wide">
            Track habits, earn rewards ✨
          </p>
        </header>

        {/* Total Display */}
        <Card data-tour="total" className="mb-10 border-border/50 shadow-xl overflow-hidden animate-slide-up" style={{ animationFillMode: "both" }}>
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary w-full" />
          <div className="py-8 px-4">
            <TotalDisplay total={total} animate={animateTotal} isLoading={isLoadingLog} />
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
          <MarkAsPaidButton forceVisible={tourTarget === "mark-paid"} />
        </div>

        {/* Activity Log */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
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
      <OnboardingTour enabled={isAnonymous} onTargetChange={setTourTarget} />

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
