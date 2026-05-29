import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMoney } from "@/hooks/useProfile";
import { format } from "date-fns";
import { MessageSquare, X, Check, Loader2, Trash2, Pencil, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateLogNotes, useDeleteLogEntry, useUpdateLogActivity, useActivityValues } from "@/hooks/useHabits";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface LogEntryProps {
  id: number;
  activityId: number;
  activityName: string;
  value: number;
  date: string;
  notes?: string | null;
  isNew?: boolean;
  showNoteButton?: boolean;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
}

export function LogEntry({ id, activityId, activityName, value, date, notes, isNew, showNoteButton = true, showDeleteButton = false, showEditButton = false }: LogEntryProps) {
  const isPositive = value >= 0;
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [noteText, setNoteText] = useState(notes || "");
  const { mutate: updateNotes, isPending } = useUpdateLogNotes();
  const { mutate: deleteEntry, isPending: isDeleting } = useDeleteLogEntry();
  const { mutate: updateActivity, isPending: isUpdatingActivity } = useUpdateLogActivity();
  const { data: activities } = useActivityValues();
  const isMobile = useIsMobile();
  const { formatMoneySigned } = useMoney();
  
  // Sync local state when notes prop changes (after successful save)
  useEffect(() => {
    setNoteText(notes || "");
  }, [notes]);
  
  const handleSaveNote = () => {
    updateNotes(
      { logId: id, notes: noteText },
      {
        onSuccess: () => {
          setIsEditingNote(false);
          toast.success("Note saved");
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Please try again";
          toast.error("Failed to save note", { description: msg });
        },
      }
    );
  };
  
  const handleDelete = () => {
    deleteEntry(id);
  };
  
  const handleCancelNote = () => {
    setNoteText(notes || "");
    setIsEditingNote(false);
  };
  
  const handleSelectActivity = (newActivityId: number) => {
    if (newActivityId === activityId) {
      setIsEditingActivity(false);
      return;
    }
    updateActivity(
      { logId: id, activityId: newActivityId },
      {
        onSuccess: () => {
          setIsEditingActivity(false);
          toast.success("Activity updated");
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Please try again";
          toast.error("Failed to update activity", { description: msg });
        },
      }
    );
  };

  const activityPicker = (
    <Command>
      <CommandInput placeholder="Search activities..." className="h-12" />
      <CommandList className={cn(isMobile && "max-h-[60vh]")}>
        <CommandEmpty>No activity found.</CommandEmpty>
        <CommandGroup>
          {activities?.map((activity) => (
            <CommandItem
              key={activity.id}
              value={activity.name}
              onSelect={() => handleSelectActivity(activity.id)}
              className={cn(
                "py-3 cursor-pointer",
                isMobile && "py-4 text-base",
                activity.id === activityId && "bg-primary/10"
              )}
            >
              <span className="font-medium">{activity.name}</span>
              {activity.id === activityId && <Check className="ml-auto h-4 w-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
  
  return (
    <div
      className={cn(
        "py-3 px-4 rounded-lg bg-card border border-border/50",
        "transition-all duration-300",
        isNew && "animate-slide-up border-primary/30 shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {showEditButton && !isEditingNote ? (
            isMobile ? (
              <Drawer open={isEditingActivity} onOpenChange={setIsEditingActivity}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-1 text-left font-medium text-foreground break-words hyphens-auto hover:text-primary transition-colors">
                    {isUpdatingActivity ? (
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    ) : (
                      <Pencil className="h-3 w-3 shrink-0 opacity-50" />
                    )}
                    {activityName}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="px-4 pb-6">
                  <div className="mt-4">
                    {activityPicker}
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Popover open={isEditingActivity} onOpenChange={setIsEditingActivity}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-left font-medium text-foreground break-words hyphens-auto hover:text-primary transition-colors">
                    {isUpdatingActivity ? (
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    ) : (
                      <Pencil className="h-3 w-3 shrink-0 opacity-50" />
                    )}
                    {activityName}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start" side="bottom" sideOffset={4}>
                  {activityPicker}
                </PopoverContent>
              </Popover>
            )
          ) : (
            <span className="font-medium text-foreground break-words hyphens-auto">{activityName}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(date), "h:mm a")}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "font-semibold text-lg tabular-nums whitespace-nowrap",
              isPositive ? "text-positive" : "text-negative"
            )}
          >
            {formatMoneySigned(value)}
          </span>
          {showNoteButton && !isEditingNote && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                notes ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setIsEditingNote(true)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          {showDeleteButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-negative"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Note display (when not editing) */}
      {notes && !isEditingNote && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground italic">{notes}</p>
        </div>
      )}
      
      {/* Note editing */}
      {isEditingNote && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            className="min-h-[60px] resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelNote}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}