import { useMemo } from "react";
import { useAllLog, useActivities } from "./useHabits";
import { useProfile, useTimezone } from "./useProfile";
import { bucketByActivity, zonedDayNumber } from "@/lib/dayBucketing";

export interface HabitStats {
  /** Completions logged on the account's current calendar day. */
  today: number;
  /** Completions per day over the last 7 days (including today). */
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
 *
 * Days are cut in the account's timezone (not the device's) and the late-night
 * grace rule from the adherence report is applied, so every device/browser and
 * both views agree.
 */
export function useHabitStats(): HabitStats {
  const { data: logs, isLoading: logsLoading } = useAllLog();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const timeZone = useTimezone();

  const stats = useMemo(() => {
    const completions = (logs ?? []).filter((entry) => entry.value >= 0);

    const todayNumber = zonedDayNumber(new Date(), timeZone);
    const byActivity = bucketByActivity(completions, timeZone);

    let today = 0;
    let last7 = 0;
    let total = 0;
    const perActivity = new Map<number, number>();

    for (const [activityId, dayMap] of byActivity) {
      let activityTotal = 0;
      for (const [dayNumber, entries] of dayMap) {
        const count = entries.length;
        activityTotal += count;
        const offset = dayNumber - todayNumber;
        if (offset === 0) today += count;
        if (offset > -7 && offset <= 0) last7 += count;
      }
      perActivity.set(activityId, activityTotal);
      total += activityTotal;
    }

    const activeCount = (activities ?? []).filter((a) => a.active && !a.is_onboarding).length;
    const suggestedTarget = Math.max(3, Math.round(activeCount / 2));
    const override = profile?.daily_target;
    const isTargetOverride = typeof override === "number" && override > 0;

    return {
      today,
      avg7: Math.round((last7 / 7) * 10) / 10,
      total,
      perActivity,
      target: isTargetOverride ? override : suggestedTarget,
      suggestedTarget,
      isTargetOverride,
    };
  }, [logs, activities, profile?.daily_target, timeZone]);

  return {
    ...stats,
    isLoading: logsLoading || activitiesLoading || profileLoading,
  };
}
