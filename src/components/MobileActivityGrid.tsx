import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivityValues } from "@/hooks/useHabits";
import { getActivityIcon } from "@/lib/activityIcons";

interface MobileActivityGridProps {
  onSelect: (activityId: number) => void;
  isLogging?: boolean;
}

/**
 * Mobile alternative to the dropdown <ActivityPicker />. Renders every active
 * activity as a tappable cell in a 2-column icon grid. Tapping a cell fires the
 * same onSelect(activityId) callback used by the desktop picker, so it plugs
 * straight into the existing logActivity mutation with no logic changes.
 *
 * Carries data-tour="picker" so the onboarding tour attaches to the grid.
 */
export function MobileActivityGrid({ onSelect, isLogging }: MobileActivityGridProps) {
  const { data: activities, isLoading } = useActivityValues();

  if (isLoading) {
    return (
      <div data-tour="picker" className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border-2 border-border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        data-tour="picker"
        className={cn(
          "grid grid-cols-2 gap-3 transition-opacity",
          isLogging && "opacity-60 pointer-events-none"
        )}
      >
        {activities?.map((activity, index) => {
          const Icon = getActivityIcon(activity.name, index);
          return (
            <button
              key={activity.id}
              type="button"
              disabled={isLogging}
              onClick={() => onSelect(activity.id)}
              aria-label={`Log ${activity.name}`}
              className={cn(
                "group flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card p-3 text-center",
                "transition-all active:scale-[0.97] hover:border-primary/40 hover:bg-secondary/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary transition-transform group-active:scale-95">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium leading-tight text-foreground line-clamp-2">
                {activity.name}
              </span>
            </button>
          );
        })}
      </div>

      {isLogging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging...
          </span>
        </div>
      )}
    </div>
  );
}
