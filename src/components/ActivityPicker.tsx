import { useState } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useActivityValues } from "@/hooks/useHabits";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActivityPickerProps {
  onSelect: (activityId: number) => void;
  isLogging?: boolean;
}

export function ActivityPicker({ onSelect, isLogging }: ActivityPickerProps) {
  const [open, setOpen] = useState(false);
  
  const isMobile = useIsMobile();
  
  const { data: activities, isLoading } = useActivityValues();
  
  const handleSelect = (activityId: number) => {
    setOpen(false);
    onSelect(activityId);
  };

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between h-14 text-base font-medium bg-card hover:bg-secondary/80 border-2 border-border hover:border-primary/30 transition-all"
      disabled={isLoading || isLogging}
    >
      <span className="truncate">
        {isLoading ? (
          <span className="text-muted-foreground">Loading activities...</span>
        ) : isLogging ? (
          <span className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging...
          </span>
        ) : (
          <span className="text-muted-foreground">Tap to log activity...</span>
        )}
      </span>
      <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
    </Button>
  );

  const commandContent = (
    <Command>
      <CommandInput placeholder="Search activities..." className="h-12" />
      <CommandList className={cn(isMobile && "max-h-[60vh]")}>
        <CommandEmpty>No activity found.</CommandEmpty>
        <CommandGroup>
          {activities?.map((activity) => (
            <CommandItem
              key={activity.id}
              value={activity.name}
              onSelect={() => handleSelect(activity.id)}
              className={cn("py-3 cursor-pointer", isMobile && "py-4 text-base")}
            >
              <span className="font-medium">{activity.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
  
  return (
    <div>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            {triggerButton}
          </DrawerTrigger>
          <DrawerContent className="px-4 pb-6 z-[110]">
            <div className="mt-4">
              {commandContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[110]" align="start" side="bottom" sideOffset={4}>
            {commandContent}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
