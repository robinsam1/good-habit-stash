import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePaidLog } from "@/hooks/useHabits";
import { useAuth } from "@/hooks/useAuth";
import { useMoney } from "@/hooks/useProfile";
import { LogEntry } from "@/components/LogEntry";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const History = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: logEntries, isLoading } = usePaidLog();
  const { formatMoney } = useMoney();
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Group entries by paid_out date
  const groupedEntries = logEntries?.reduce((groups, entry) => {
    const dateKey = entry.paid_out ? format(parseISO(entry.paid_out), "yyyy-MM-dd") : "unknown";
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(entry);
    return groups;
  }, {} as Record<string, typeof logEntries>);
  
  const sortedDates = groupedEntries 
    ? Object.keys(groupedEntries).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      )
    : [];
  
  return (
    <div className="min-h-screen">
      <div className="max-w-lg sm:max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            History
          </h1>
          <p className="text-muted-foreground mt-1">
            View your past habit completions
          </p>
        </header>
        
        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !logEntries?.length ? (
          <div className="text-center py-12 px-4">
            <div className="text-4xl mb-3">📜</div>
            <p className="text-muted-foreground font-medium">No history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete habits and mark them as paid to see history
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((dateKey) => {
              const entries = groupedEntries![dateKey];
              const paidOutDate = entries[0]?.paid_out;
              const totalValue = entries.reduce((sum, e) => sum + e.value, 0);
              
              return (
                <div key={dateKey} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50 border-b border-border flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Paid {paidOutDate ? format(parseISO(paidOutDate), "MMMM d, yyyy") : "Unknown"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {paidOutDate && format(parseISO(paidOutDate), "h:mm a")}
                      </p>
                    </div>
                    <span className="font-semibold text-lg tabular-nums text-primary">
                      {formatMoney(totalValue)}
                    </span>
                  </div>
                  <div className="p-2 space-y-2">
                    {entries.map((entry) => (
                      <LogEntry
                        key={entry.id}
                        id={entry.id}
                        activityId={entry.activity_id}
                        activityName={entry.activity?.name ?? "Unknown"}
                        value={entry.value}
                        date={entry.date}
                        notes={entry.notes ?? ""}
                        showNoteButton={false}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;