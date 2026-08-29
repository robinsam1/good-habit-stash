import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitTimeline } from "@/components/HabitTimeline";
import { useActivities, useAllLog } from "@/hooks/useHabits";
import { useHabitStats } from "@/hooks/useHabitStats";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const Report = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: logs, isLoading: logsLoading } = useAllLog();
  const { data: profile, isLoading: profileLoading } = useProfile();
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

    // activity_id -> day index -> entry timestamps (device-local bucketing)
    const byActivity = new Map<number, Map<number, Date[]>>();
    for (const entry of logs ?? []) {
      const when = parseISO(entry.date);
      const idx = differenceInCalendarDays(startOfDay(when), startDate);
      if (idx < 0 || idx >= totalDays) continue;
      let dayMap = byActivity.get(entry.activity_id);
      if (!dayMap) {
        dayMap = new Map<number, Date[]>();
        byActivity.set(entry.activity_id, dayMap);
      }
      const list = dayMap.get(idx);
      if (list) list.push(when);
      else dayMap.set(idx, [when]);
    }

    // Late-night grace: if a habit has 2+ entries on a day, the previous day is
    // empty, and the earliest entry landed between 00:00 and 01:00 local time,
    // treat that entry as belonging to the previous day so the streak holds.
    for (const dayMap of byActivity.values()) {
      const dayIndices = Array.from(dayMap.keys()).sort((a, b) => a - b);
      for (const d of dayIndices) {
        if (d - 1 < 0 || dayMap.has(d - 1)) continue;
        const entries = dayMap.get(d);
        if (!entries || entries.length < 2) continue;
        entries.sort((a, b) => a.getTime() - b.getTime());
        const earliest = entries[0];
        if (earliest.getHours() !== 0) continue;
        entries.shift();
        dayMap.set(d - 1, [earliest]);
      }
    }

    const rows = (activities ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        days: Array.from(byActivity.get(activity.id)?.keys() ?? []).sort((a, b) => a - b),
      }));


    const emptyCount = rows.filter((row) => row.days.length === 0).length;
    const visibleRows = hideEmpty ? rows.filter((row) => row.days.length > 0) : rows;

    return { startDate, today, totalDays, rows: visibleRows, emptyCount };
  }, [activities, logs, profile?.created_at, user?.created_at, hideEmpty]);

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
                <span className="truncate">{format(startDate, "d MMM yy")}</span>
                <span className="truncate">{format(today, "d MMM yy")}</span>
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
