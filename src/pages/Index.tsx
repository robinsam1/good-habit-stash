import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, LogOut, Loader2, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { TotalDisplay } from "@/components/TotalDisplay";
import { ActivityPicker } from "@/components/ActivityPicker";
import { ActivityLog } from "@/components/ActivityLog";
import { MarkAsPaidButton } from "@/components/MarkAsPaidButton";
import { FloatingDecor } from "@/components/FloatingDecor";
import { useLogActivity, useRunningTotal, useUnpaidLog } from "@/hooks/useHabits";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useMoney } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [newEntryId, setNewEntryId] = useState<number | undefined>();
  const [animateTotal, setAnimateTotal] = useState(false);
  const { formatMoneySigned } = useMoney();
  
  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Enable cross-device realtime sync
  useRealtimeSync();
  
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
    toast.success('Signed out');
  }, [signOut]);
  
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
          <div className="absolute right-0 top-0 flex items-center gap-1">
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
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
              title="Sign out"
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
        <Card className="mb-10 border-border/50 shadow-xl overflow-hidden animate-slide-up" style={{ animationFillMode: "both" }}>
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary w-full" />
          <div className="py-8 px-4">
            <TotalDisplay total={total} animate={animateTotal} isLoading={isLoadingLog} />
          </div>
        </Card>

        {/* Activity Picker */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <ActivityPicker
            onSelect={handleSelectActivity}
            isLogging={isPending}
          />
        </div>

        {/* Mark as Paid Button */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
          <MarkAsPaidButton />
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
    </div>
  );
};

export default Index;
