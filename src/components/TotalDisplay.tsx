import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TotalDisplayProps {
  total: number;
  className?: string;
  animate?: boolean;
  isLoading?: boolean;
}

export function TotalDisplay({ total, className, animate, isLoading }: TotalDisplayProps) {
  const isPositive = total >= 0;
  const formattedTotal = formatPounds(total);
  
  return (
    <div className={cn("text-center", className)}>
      <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
        Your Balance
      </p>
      {isLoading ? (
        <Skeleton className="h-16 md:h-20 w-48 mx-auto" />
      ) : (
        <div
          className={cn(
            "font-display text-6xl md:text-7xl font-bold tracking-tight transition-all duration-300",
            isPositive ? "text-positive" : "text-negative",
            animate && "animate-pulse-success"
          )}
        >
          {formattedTotal}
        </div>
      )}
      <p className="text-sm text-muted-foreground mt-2">
        {isLoading ? "\u00A0" : isPositive ? "Ready to reward yourself" : "Time to build good habits"}
      </p>
    </div>
  );
}

export function formatPounds(pence: number): string {
  const pounds = pence / 100;
  const sign = pounds >= 0 ? "" : "-";
  return `${sign}£${Math.abs(pounds).toFixed(2)}`;
}

export function formatPoundsShort(pence: number): string {
  const pounds = pence / 100;
  const sign = pounds >= 0 ? "+" : "";
  return `${sign}£${pounds.toFixed(2)}`;
}
