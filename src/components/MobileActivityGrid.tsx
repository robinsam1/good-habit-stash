import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityValues } from "@/hooks/useHabits";
import { getActivityIcon } from "@/lib/activityIcons";

interface MobileActivityGridProps {
  onSelect: (activityId: number) => void;
  isLogging?: boolean;
}

/**
 * Mobile-only replacement for the dropdown ActivityPicker.
 *
 * Renders the activities as a fixed 2-column grid of tappable icon cells. Each
 * cell shows a Lucide icon (derived from the activity name — see
 * `getActivityIcon`) with the activity name below it. Tapping a cell calls the
 * same `onSelect(activityId)` callback the dropdown uses, so it triggers the
 * existing `logActivity` mutation with no business-logic changes.
 */
export function MobileActivityGrid({ onSelect, isLogging }: MobileActivityGridProps) {
  const { data: activities, isLoading } = useActivityValues();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-border">
        <p className="text-muted-foreground font-medium">No activities yet</p>
        <p className="text-sm text-muted-foreground mt-1">Add one from the tasks screen to start logging.</p>
      </div>
    );
  }

  return (
    <div
      className={cn("grid grid-cols-2 gap-3 transition-opacity", isLogging && "opacity-60 pointer-events-none")}
      aria-busy={isLogging}
    >
      {activities.map((activity, index) => {
        const { Icon, fg, bg } = getActivityIcon(activity.name, index);
        return (
          <button
            key={activity.id}
            type="button"
            onClick={() => onSelect(activity.id)}
            disabled={isLogging}
            aria-label={`Log ${activity.name}`}
            className={cn(
              "group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card p-4 min-h-[7rem]",
              "text-center transition-all active:scale-95 hover:border-primary/40 hover:bg-secondary/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-6 w-6", fg)} aria-hidden="true" />
            </span>
            <span className="text-sm font-medium leading-tight text-foreground line-clamp-2">
              {activity.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
