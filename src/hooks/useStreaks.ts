import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  computeStreakStats,
  toLocalDateKey,
  type Polarity,
  type StreakStats,
} from "@/lib/streaks";

export interface StreakStat extends StreakStats {
  activityId: number;
  name: string;
  polarity: Polarity;
  value: number;
}

export function useStreaks() {
  return useQuery({
    queryKey: ["streaks"],
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<StreakStat[]> => {
      // Active activities scoped to current user via RLS.
      const { data: activities, error: actErr } = await supabase
        .from("activities")
        .select("id, name, active")
        .eq("active", true);
      if (actErr) throw actErr;
      if (!activities || activities.length === 0) return [];

      const ids = activities.map((a) => a.id);

      const [{ data: values, error: valErr }, { data: logs, error: logErr }] =
        await Promise.all([
          supabase
            .from("activity_values")
            .select("activity_id, value, effective_from")
            .in("activity_id", ids)
            .order("effective_from", { ascending: true }),
          supabase
            .from("log")
            .select("activity_id, date")
            .in("activity_id", ids)
            .is("deleted_at", null),
        ]);
      if (valErr) throw valErr;
      if (logErr) throw logErr;

      // Per activity: latest value (polarity), earliest effective_from (creation proxy).
      const latestValue = new Map<number, number>();
      const earliestCreated = new Map<number, string>();
      for (const v of values ?? []) {
        const prev = latestValue.get(v.activity_id);
        // values are ordered asc; last write wins for "latest"
        latestValue.set(v.activity_id, v.value);
        if (!earliestCreated.has(v.activity_id)) {
          earliestCreated.set(v.activity_id, v.effective_from);
        }
      }

      // Logged-day buckets per activity (local tz).
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todayKey = toLocalDateKey(new Date(), tz);
      const dayBuckets = new Map<number, Set<string>>();
      const earliestLog = new Map<number, string>();
      for (const l of logs ?? []) {
        const key = toLocalDateKey(l.date, tz);
        let set = dayBuckets.get(l.activity_id);
        if (!set) {
          set = new Set();
          dayBuckets.set(l.activity_id, set);
        }
        set.add(key);
        const prev = earliestLog.get(l.activity_id);
        if (!prev || key < prev) earliestLog.set(l.activity_id, key);
      }

      const stats: StreakStat[] = activities.map((a) => {
        const value = latestValue.get(a.id) ?? 0;
        const polarity: Polarity = value >= 0 ? "positive" : "negative";
        const loggedDays = dayBuckets.get(a.id) ?? new Set<string>();

        let windowStartDay: string | null = null;
        if (polarity === "positive") {
          windowStartDay = earliestLog.get(a.id) ?? null;
        } else {
          const created = earliestCreated.get(a.id);
          windowStartDay = created ? toLocalDateKey(created, tz) : null;
        }

        const s = computeStreakStats({
          loggedDays,
          polarity,
          windowStartDay,
          todayKey,
        });
        return {
          activityId: a.id,
          name: a.name,
          polarity,
          value,
          ...s,
        };
      });

      stats.sort((a, b) => {
        if (b.current !== a.current) return b.current - a.current;
        return a.name.localeCompare(b.name);
      });
      return stats;
    },
  });
}
