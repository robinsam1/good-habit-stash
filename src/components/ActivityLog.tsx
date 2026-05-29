import { useUnpaidLog, LogEntry as LogEntryType, Activity } from "@/hooks/useHabits";
import { LogEntry } from "./LogEntry";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityLogProps {
  newEntryId?: number;
}

export function ActivityLog({ newEntryId }: ActivityLogProps) {
  const { data: logEntries, isLoading } = useUnpaidLog();
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (!logEntries?.length) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-4xl mb-3">🌱</div>
        <p className="text-muted-foreground font-medium">No habits logged yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Select an activity above to start tracking
        </p>
      </div>
    );
  }
  
  // Group entries by date
  const groupedEntries = logEntries.reduce((groups, entry) => {
    const dateKey = format(parseISO(entry.date), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(entry);
    return groups;
  }, {} as Record<string, typeof logEntries>);
  
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const date = parseISO(dateKey);
        let dateLabel = format(date, "EEEE, MMMM d");
        if (isToday(date)) dateLabel = "Today";
        else if (isYesterday(date)) dateLabel = "Yesterday";
        
        return (
          <div key={dateKey}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              {dateLabel}
            </h3>
            <div className="space-y-2">
              {groupedEntries[dateKey].map((entry) => (
                <LogEntry
                  key={entry.id}
                  id={entry.id}
                  activityId={entry.activity_id}
                  activityName={entry.activity?.name ?? "Unknown"}
                  value={entry.value}
                  date={entry.date}
                  notes={entry.notes ?? ""}
                  isNew={entry.id === newEntryId}
                  showDeleteButton
                  showEditButton
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
