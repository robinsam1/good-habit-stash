import { useEffect, useState } from "react";
import { FlaskConical, Smartphone, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "habit-visor-prototype-modal-dismissed";

/** Read the dismissed flag, never throwing on storage errors. */
function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist the dismissed flag, silently ignoring storage errors. */
function markDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore — a storage failure must never break the app */
  }
}

/**
 * Global "this is a prototype" notice. Mounted once at the app root so it shows
 * on first load regardless of the landing route. It appears only once — on
 * dismiss a flag is stored (best-effort) and checked on load. After dismissal a
 * small always-visible "Prototype" badge remains.
 */
export function PrototypeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!wasDismissed()) setOpen(true);
  }, []);

  const dismiss = () => {
    markDismissed();
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <FlaskConical className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-center font-display text-2xl">You're viewing a prototype</DialogTitle>
            <DialogDescription className="text-center">
              This is an interactive preview of <span className="font-medium text-foreground">Habit Visor</span>. The
              backend is mocked — activity data, auth and logging are simulated in your browser, so nothing is saved to
              a real account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
            <p className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="font-semibold text-foreground">What's new:</span> on mobile, the dashboard activity
                picker is now a 2-column icon grid (each activity gets an auto-matched icon). The desktop dropdown is
                unchanged.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="font-semibold text-foreground">Try it:</span> open this preview on a mobile-width screen
                (or narrow your browser under 768px). You'll be taken straight to <span className="font-medium">Sign up</span> —
                create an account with any email &amp; password, then tap tiles on the <span className="font-medium">home (/)</span> screen to log a habit.
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button onClick={dismiss} className="w-full h-12 text-base font-semibold">
              Got it — let me explore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Always-visible indicator that this is a prototype. */}
      <div className="pointer-events-none fixed bottom-3 left-3 z-50">
        <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          <FlaskConical className="h-3.5 w-3.5 text-primary" />
          Prototype
        </span>
      </div>
    </>
  );
}
