import { useMemo } from "react";
import { parseISO, startOfDay, differenceInCalendarDays } from "date-fns";
import { useAllLog, useActivities } from "./useHabits";
import { useProfile } from "./useProfile";

export interface HabitStats {
  /** Completions logged on the device-local calendar day. */
  today: number;
  /** Completions per day over the last 7 local days (including today). */
  avg7: number;
  /** Total completions since account creation. */
  total: number;
  /** Lifetime completions per activity id. */
  perActivity: Map<number, number>;
  /** Effective daily target (user override or auto). */
  target: number;
  /** Auto-suggested target: max(3, round(active habits / 2)). */
  suggestedTarget: number;
  /** Whether the target comes from the user's override. */
  isTargetOverride: boolean;
  isLoading: boolean;
}

/**
 * Derives "habits completed" stats from the full log.
 * A completion = a non-deleted log entry with value >= 0 (negative-value
 * entries never count). Counts are anchored to when entries were logged:
 * deactivating a habit later does not remove its past completions.
 * Day bucketing uses the device's current timezone.
 */
export function useHabitStats(): HabitStats {
  const { data: logs, isLoading: logsLoading } = useAllLog();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const stats = useMemo(() => {
    const completions = (logs ?? []).filter((entry) => entry.value >= 0);

    const now = new Date();
    const todayStart = startOfDay(now);

    let today = 0;
    let last7 = 0;
    const perActivity = new Map<number, number>();

    for (const entry of completions) {
      const dayOffset = differenceInCalendarDays(startOfDay(parseISO(entry.date)), todayStart);
      if (dayOffset === 0) today += 1;
      if (dayOffset > -7 && dayOffset <= 0) last7 += 1;
      perActivity.set(entry.activity_id, (perActivity.get(entry.activity_id) ?? 0) + 1);
    }

    const activeCount = (activities ?? []).filter((a) => a.active && !a.is_onboarding).length;
    const suggestedTarget = Math.max(3, Math.round(activeCount / 2));
    const override = profile?.daily_target;
    const isTargetOverride = typeof override === "number" && override > 0;

    return {
      today,
      avg7: Math.round((last7 / 7) * 10) / 10,
      total: completions.length,
      perActivity,
      target: isTargetOverride ? override : suggestedTarget,
      suggestedTarget,
      isTargetOverride,
    };
  }, [logs, activities, profile?.daily_target]);

  return {
    ...stats,
    isLoading: logsLoading || activitiesLoading || profileLoading,
  };
}
