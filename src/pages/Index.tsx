import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, LogOut, Loader2, Sparkles } from "lucide-react";
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
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-10 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Habit Rewards
            </span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium tracking-wide">
            Track habits, earn rewards ✨
          </p>
        </header>
        
        {/* Total Display */}
        <div className="mb-10">
          <TotalDisplay total={total} animate={animateTotal} isLoading={isLoadingLog} />
        </div>
        
        {/* Activity Picker */}
        <div className="mb-8">
          <ActivityPicker 
            onSelect={handleSelectActivity} 
            isLogging={isPending}
          />
        </div>
        
        {/* Mark as Paid Button */}
        <div className="mb-8">
          <MarkAsPaidButton />
        </div>
        
        {/* Activity Log */}
        <div>
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
