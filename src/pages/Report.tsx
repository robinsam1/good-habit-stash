import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitTimeline } from "@/components/HabitTimeline";
import { useActivities, useAllLog } from "@/hooks/useHabits";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const Report = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: logs, isLoading: logsLoading } = useAllLog();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [hideEmpty, setHideEmpty] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isLoading = activitiesLoading || logsLoading || profileLoading;

  const { startDate, today, totalDays, rows, emptyCount } = useMemo(() => {
    const today = startOfDay(new Date());

    const candidates: Date[] = [];
    if (profile?.created_at) candidates.push(startOfDay(parseISO(profile.created_at)));
    if (user?.created_at) candidates.push(startOfDay(parseISO(user.created_at)));
    if (logs?.length) candidates.push(startOfDay(parseISO(logs[0].date)));
    const startDate = candidates.length
      ? new Date(Math.min(...candidates.map((d) => d.getTime())))
      : today;

    const totalDays = Math.max(1, differenceInCalendarDays(today, startDate) + 1);

    // activity_id -> set of day indices
    const byActivity = new Map<number, Set<number>>();
    for (const entry of logs ?? []) {
      const idx = differenceInCalendarDays(startOfDay(parseISO(entry.date)), startDate);
      if (idx < 0 || idx >= totalDays) continue;
      let set = byActivity.get(entry.activity_id);
      if (!set) {
        set = new Set<number>();
        byActivity.set(entry.activity_id, set);
      }
      set.add(idx);
    }

    const rows = (activities ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        days: Array.from(byActivity.get(activity.id) ?? []).sort((a, b) => a - b),
      }));

    const emptyCount = rows.filter((row) => row.days.length === 0).length;
    const visibleRows = hideEmpty ? rows.filter((row) => row.days.length > 0) : rows;

    return { startDate, today, totalDays, rows: visibleRows, emptyCount };
  }, [activities, logs, profile?.created_at, user?.created_at, hideEmpty]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Adherence
          </h1>
          <p className="text-muted-foreground mt-1">
            Every day you logged each habit, since you started
          </p>
          {emptyCount > 0 && (
            <label className="inline-flex items-center gap-2 mt-4 text-sm text-foreground cursor-pointer select-none">
              <Checkbox
                id="hide-empty-habits"
                checked={hideEmpty}
                onCheckedChange={(checked) => setHideEmpty(checked === true)}
              />
              <span>Hide habits with no entries ({emptyCount})</span>
            </label>
          )}
        </header>

        <Card className="p-4 sm:p-5 border-border/50 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-full rounded" />
              ))}
            </div>
          ) : !rows.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {hideEmpty
                ? "All your habits are currently empty. Log something to see them here."
                : "No habits to report on yet."}
            </p>
          ) : (
            <div className="grid grid-cols-[minmax(7rem,40%)_1fr] gap-x-3 sm:gap-x-4 items-center">
              {/* Header */}
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2">
                Habit
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                <span>{format(startDate, "d MMM yyyy")}</span>
                <span>{format(today, "d MMM yyyy")}</span>
              </div>

              {rows.map((row, index) => {
                const highlighted = index % 2 === 1;
                return (
                  <div
                    key={row.id}
                    className={`col-span-2 grid grid-cols-[minmax(7rem,40%)_1fr] gap-x-3 sm:gap-x-4 items-center px-2 -mx-2 rounded-[3px] ${
                      highlighted ? "bg-secondary/70" : "bg-transparent"
                    }`}
                  >
                    <div
                      className="text-sm text-foreground truncate py-1"
                      title={row.name}
                    >
                      {row.name}
                    </div>
                    <div className="py-1">
                      <HabitTimeline
                        days={row.days}
                        totalDays={totalDays}
                        trackColor={highlighted ? "card" : "secondary-70"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Report;
