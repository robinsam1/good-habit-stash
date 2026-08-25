import { useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, Loader2, CheckCircle, Copy, Check, ExternalLink } from "lucide-react";
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
import { useMoney, useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { getBank, openBank } from "@/lib/banks";
import { fireConfetti, CONFETTI_FLAGS } from "@/components/EmojiConfetti";
import { toast } from "sonner";

export function MarkAsPaidButton({ forceVisible = false }: { forceVisible?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const total = useRunningTotal();
  const { mutate: markAsPaid, isPending } = useMarkAsPaid();
  const { formatMoney, formatAmountPlain } = useMoney();
  const { isAnonymous } = useAuth();
  const { data: profile } = useProfile();
  const bank = getBank(profile?.bank_id);

  const plainAmount = formatAmountPlain(total);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plainAmount);
      } else {
        // Fallback for older mobile Safari / non-secure contexts.
        const el = document.createElement("textarea");
        el.value = plainAmount;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy", { description: `Amount: ${plainAmount}` });
    }
  };

  const handleMarkAsPaid = () => {
    markAsPaid(undefined, {
      onSuccess: () => {
        toast.success("Nice — balance reset", {
          description: `${formatMoney(total)} moved to your savings`,
          icon: <CheckCircle className="h-5 w-5" />,
        });
        // First mark-as-paid confetti for guest users only, once per browser.
        if (isAnonymous) {
          try {
            if (!localStorage.getItem(CONFETTI_FLAGS.paid)) {
              fireConfetti(["💸"]);
              localStorage.setItem(CONFETTI_FLAGS.paid, "1");
            }
          } catch {
            /* ignore */
          }
        }
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
      <AlertDialogContent className="sm:max-w-md z-[110]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl">
            Move {formatMoney(total)} to your savings
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Copy the amount, transfer it into your savings pot, then confirm here to reset
            your balance. Habit Visor never touches your money — you're in control.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {/* Step 1 — copy the amount */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount to transfer
              </p>
              <p className="font-display text-2xl font-bold tabular-nums">{plainAmount}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </span>
          </button>

          {/* Step 2 — jump into the banking app */}
          {bank && bank.id !== "other" ? (
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 font-medium"
                onClick={() => openBank(bank)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open {bank.label}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We can't pre-fill the amount — paste it in your banking app.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              {bank?.id === "other" ? (
                "Transfer the amount in your banking app, then confirm below."
              ) : (
                <>
                  <Link to="/settings" className="text-primary underline underline-offset-2">
                    Set your bank
                  </Link>{" "}
                  to jump straight to your banking app next time.
                </>
              )}
            </p>
          )}
        </div>

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
