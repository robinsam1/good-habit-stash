import { useState } from "react";
import { Banknote, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMarkAsPaid, useRunningTotal } from "@/hooks/useHabits";
import { useMoney } from "@/hooks/useProfile";
import { toast } from "sonner";

export function MarkAsPaidButton({ forceVisible = false }: { forceVisible?: boolean }) {
  const [open, setOpen] = useState(false);
  const total = useRunningTotal();
  const { mutate: markAsPaid, isPending } = useMarkAsPaid();
  const { formatMoney } = useMoney();

  const handleMarkAsPaid = () => {
    markAsPaid(undefined, {
      onSuccess: () => {
        toast.success("Nice — balance reset", {
          description: `${formatMoney(total)} moved to your savings`,
          icon: <CheckCircle className="h-5 w-5" />,
        });
        setOpen(false);
      },
      onError: () => {
        toast.error("Something went wrong", {
          description: "Please try again",
        });
      },
    });
  };

  // Normally hidden when there's nothing to pay out, but the onboarding tour
  // forces it visible (disabled) so the user can see the CTA being explained.
  if (total === 0 && !forceVisible) {
    return null;
  }

  const disabled = total === 0;
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          disabled={disabled}
          className="w-full h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 disabled:opacity-70"
        >
          <Banknote className="h-5 w-5 mr-2" />
          Move to savings
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl">
            Move {formatMoney(total)} to your savings?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            You've earned {formatMoney(total)}. Move this into your savings pot in your own
            banking app, then confirm here to reset your balance. Habit Visor never touches
            your money — you're in control.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleMarkAsPaid}
            disabled={isPending}
            className="bg-accent hover:bg-accent/90 font-semibold"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            I've moved it ✓
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
