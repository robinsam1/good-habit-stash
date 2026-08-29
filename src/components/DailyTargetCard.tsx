import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabitStats } from "@/hooks/useHabitStats";
import { useUpdateDailyTarget } from "@/hooks/useProfile";
import { toast } from "sonner";

/**
 * Lets every user set (or reset) their daily habits-completed target.
 * Shown above the Pro-gated activity manager on /tasks.
 */
export function DailyTargetCard() {
  const { target, suggestedTarget, isTargetOverride, isLoading } = useHabitStats();
  const updateTarget = useUpdateDailyTarget();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(target));
  }, [target]);

  const save = async (next: number | null) => {
    setSaving(true);
    try {
      await updateTarget.mutateAsync(next);
      toast.success(next === null ? "Target reset to suggested" : "Daily target updated");
    } catch (e: any) {
      toast.error("Couldn't save target", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
      toast.error("Enter a whole number between 1 and 99");
      return;
    }
    void save(parsed);
  };

  return (
    <Card className="p-6 border-border shadow-xl mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Daily target</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        How many habits you aim to complete each day.
      </p>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="flex items-center gap-2">
          <Label htmlFor="daily-target" className="sr-only">
            Daily target
          </Label>
          <Input
            id="daily-target"
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 text-base"
          />
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Save
          </Button>
          {isTargetOverride && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              disabled={saving}
              onClick={() => void save(null)}
            >
              Use suggested ({suggestedTarget})
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
