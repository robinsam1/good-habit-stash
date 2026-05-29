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
import { formatPounds } from "./TotalDisplay";
import { toast } from "sonner";

export function MarkAsPaidButton() {
  const [open, setOpen] = useState(false);
  const total = useRunningTotal();
  const { mutate: markAsPaid, isPending } = useMarkAsPaid();
  
  const handleMarkAsPaid = () => {
    markAsPaid(undefined, {
      onSuccess: () => {
        toast.success("Marked as paid!", {
          description: `${formatPounds(total)} transferred to your discretionary spending`,
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
  
  if (total === 0) {
    return null;
  }
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30"
        >
          <Banknote className="h-5 w-5 mr-2" />
          Mark as Paid
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl">
            Transfer {formatPounds(total)}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            This will mark all current habits as paid. Transfer this amount to your 
            discretionary spending pot in your banking app, then confirm here.
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
            Confirm Transfer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
