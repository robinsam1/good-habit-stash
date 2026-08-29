import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitTimeline } from "@/components/HabitTimeline";
import { useReportActivities, useAllLog } from "@/hooks/useHabits";
import { useHabitStats } from "@/hooks/useHabitStats";
import { useProfile, useTimezone } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { bucketByActivity, dayNumberToDate, zonedDayNumber } from "@/lib/dayBucketing";

/** Formats a day number (UTC-midnight anchored) without re-applying a timezone. */
const dayLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "2-digit",
});
const formatDayLabel = (dayNumber: number) =>
  dayLabelFormatter.format(dayNumberToDate(dayNumber));

const Report = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: activities, isLoading: activitiesLoading } = useReportActivities();
  const { data: logs, isLoading: logsLoading } = useAllLog();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const timeZone = useTimezone();
  const habitStats = useHabitStats();
  const [hideEmpty, setHideEmpty] = useState(true);
  const [singleLine, setSingleLine] = useState(true);
  const [maxLines, setMaxLines] = useState(1);
  const habitHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isLoading = activitiesLoading || logsLoading || profileLoading;

  const { startDayNumber, todayDayNumber, totalDays, rows, emptyCount } = useMemo(() => {
    const todayDayNumber = zonedDayNumber(new Date(), timeZone);

    const candidates: number[] = [];
    if (profile?.created_at) candidates.push(zonedDayNumber(new Date(profile.created_at), timeZone));
    if (user?.created_at) candidates.push(zonedDayNumber(new Date(user.created_at), timeZone));
    if (logs?.length) candidates.push(zonedDayNumber(new Date(logs[0].date), timeZone));
    const startDayNumber = candidates.length ? Math.min(...candidates) : todayDayNumber;

    const totalDays = Math.max(1, todayDayNumber - startDayNumber + 1);

    // Account-timezone bucketing with the late-night grace rule applied.
    const byActivity = bucketByActivity(logs ?? [], timeZone);

    const rows = (activities ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        days: Array.from(byActivity.get(activity.id)?.keys() ?? [])
          .map((dayNumber) => dayNumber - startDayNumber)
          .filter((idx) => idx >= 0 && idx < totalDays)
          .sort((a, b) => a - b),
      }));

    const emptyCount = rows.filter((row) => row.days.length === 0).length;
    const visibleRows = hideEmpty ? rows.filter((row) => row.days.length > 0) : rows;

    return { startDayNumber, todayDayNumber, totalDays, rows: visibleRows, emptyCount };
  }, [activities, logs, profile?.created_at, user?.created_at, hideEmpty, timeZone]);


  useEffect(() => {
    const header = habitHeaderRef.current;
    if (!header || !rows.length) return;

    const compute = () => {
      if (singleLine) {
        setMaxLines(1);
        return;
      }

      const width = header.clientWidth;
      if (!width) return;
      const measure = document.createElement("div");
      measure.className =
        "text-sm leading-snug py-1 absolute left-0 top-0 -z-10 opacity-0 pointer-events-none whitespace-normal break-words";
      measure.style.width = `${width}px`;
      document.body.appendChild(measure);

      let max = 1;
      for (const row of rows) {
        measure.textContent = row.name;
        const lineHeight =
          parseFloat(getComputedStyle(measure).lineHeight) || 19;
        max = Math.max(max, Math.round(measure.scrollHeight / lineHeight));
      }
      document.body.removeChild(measure);
      setMaxLines(Math.min(6, max));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(header);
    return () => ro.disconnect();
  }, [rows, singleLine]);

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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
            {emptyCount > 0 && (
              <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                <Checkbox
                  id="hide-empty-habits"
                  checked={hideEmpty}
                  onCheckedChange={(checked) => setHideEmpty(checked === true)}
                />
                <span>Hide habits with no entries ({emptyCount})</span>
              </label>
            )}
            <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
              <Checkbox
                id="single-line-names"
                checked={singleLine}
                onCheckedChange={(checked) => setSingleLine(checked === true)}
              />
              <span>Show names on one line</span>
            </label>
          </div>
        </header>

        {/* Top-line habits-completed metric */}
        <div className="flex items-baseline gap-x-6 gap-y-1 flex-wrap mb-4">
          <p className="text-sm text-muted-foreground">
            Habits completed{" "}
            <span className="font-display text-2xl font-bold text-foreground tabular-nums align-baseline">
              {habitStats.isLoading ? "–" : habitStats.total}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Today{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {habitStats.isLoading ? "–" : habitStats.today}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            7-day avg{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {habitStats.isLoading ? "–" : habitStats.avg7}
            </span>
          </p>
        </div>

        <Card className="p-4 sm:p-5 border-border shadow-lg overflow-hidden">
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
            <div className="grid grid-cols-[minmax(5rem,30%)_2.5rem_minmax(0,1fr)] sm:grid-cols-[minmax(6rem,30%)_3.5rem_minmax(0,1fr)] gap-x-3 sm:gap-x-4 items-center min-w-0">
              {/* Header */}
              <div
                ref={habitHeaderRef}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2"
              >
                Habit
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 text-right">
                Done
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs text-muted-foreground pb-2 min-w-0">
                <span className="truncate">{formatDayLabel(startDayNumber)}</span>
                <span className="truncate">{formatDayLabel(todayDayNumber)}</span>

              </div>

              {rows.map((row, index) => {
                const highlighted = index % 2 === 1;
                return (
                  <div
                    key={row.id}
                    className={`col-span-3 grid grid-cols-[minmax(5rem,30%)_2.5rem_minmax(0,1fr)] sm:grid-cols-[minmax(6rem,30%)_3.5rem_minmax(0,1fr)] gap-x-3 sm:gap-x-4 items-center px-2 -mx-2 rounded-[3px] ${
                      highlighted ? "bg-secondary/70" : "bg-transparent"
                    }`}
                  >
                    <div
                      className="flex items-center text-sm text-foreground py-1 leading-snug"
                      style={{ minHeight: `${maxLines * 1.375}em` }}
                      title={row.name}
                    >
                      <span
                        className="break-words"
                        style={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: maxLines,
                          overflow: "hidden",
                        }}
                      >
                        {row.name}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground tabular-nums text-right py-1">
                      {habitStats.perActivity.get(row.id) ?? 0}
                    </div>
                    <div className="py-1 min-w-0">
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
