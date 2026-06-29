import { Flame } from "lucide-react";
import type { StreakStat } from "@/hooks/useStreaks";

interface Props {
  stat: StreakStat;
}

export function StreakRow({ stat }: Props) {
  const { name, current, breaks, avgStreak, polarity } = stat;
  const hasCurrent = current > 0;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground truncate">{name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {polarity === "positive" ? "good habit" : "bad habit"}
          {" · "}
          Broken {breaks} {breaks === 1 ? "time" : "times"}
          {" · "}
          Avg {avgStreak.toFixed(1)} days
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {hasCurrent ? (
          <>
            <Flame className="h-4 w-4 text-accent" />
            <span className="font-display font-bold text-lg text-foreground tabular-nums">
              {current}
            </span>
            <span className="text-xs text-muted-foreground">
              {current === 1 ? "day" : "days"}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>
    </div>
  );
}
