import { Sparkles, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProInterest, useRegisterProInterest } from "@/hooks/usePro";
import { toast } from "sonner";

export function ProInterestCard() {
  const { data: interest, isLoading } = useProInterest();
  const register = useRegisterProInterest();

  const registered = !!interest;

  const handleClick = async () => {
    try {
      await register.mutateAsync();
      toast.success("Thanks — we'll be in touch when Pro launches.");
    } catch (e: any) {
      toast.error("Couldn't register interest", { description: e?.message });
    }
  };

  return (
    <Card className="p-6 border-border/50 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-secondary" />
        <h2 className="font-display text-lg font-semibold">Habit Rewards Pro</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Customise your activities — add your own habits, set custom rewards, and rename or
        remove any activity to make Habit Rewards truly yours.
      </p>
      <ul className="space-y-2 mb-6 text-sm">
        <li className="flex items-start gap-2">
          <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
          <span>Add your own custom habits</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
          <span>Set your own reward amounts</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
          <span>Rename or remove any activity</span>
        </li>
      </ul>
      {registered ? (
        <div className="rounded-md bg-secondary/10 border border-secondary/30 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-secondary" />
            You're on the list
          </div>
          <p className="text-muted-foreground mt-1">
            We'll email you as soon as Pro is available.
          </p>
        </div>
      ) : (
        <Button
          onClick={handleClick}
          disabled={isLoading || register.isPending}
          className="w-full h-14"
        >
          {register.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Register interest"
          )}
        </Button>
      )}
    </Card>
  );
}
