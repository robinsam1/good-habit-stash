import { useState } from "react";
import { FlaskConical, Smartphone, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "hv_prototype_notice_dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* storage may be unavailable (private mode / quota) — ignore */
  }
}

/**
 * Global "this is a prototype" notice, mounted once at the app root so it shows
 * regardless of which route the user lands on. It appears once (persisted via
 * localStorage) and leaves behind a small always-visible "Prototype" badge.
 */
export function PrototypeNotice() {
  // Initialise synchronously so the modal shows on first paint (and never flashes
  // the badge first) when the notice hasn't been dismissed yet.
  const [open, setOpen] = useState(() => !readDismissed());

  const dismiss = () => {
    writeDismissed();
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
        <DialogContent className="sm:max-w-md z-[200]">
          <DialogHeader>
            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <FlaskConical className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="font-display text-2xl">You're viewing a prototype</DialogTitle>
            <DialogDescription className="text-base">
              This is an interactive preview built on the real Habit Visor app — feel free to
              click around. Backend data is live-seeded for guest sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">What's new:</span> on mobile, the
                dashboard's dropdown activity picker is now a 2-column icon grid, and the guest
                onboarding tour uses mobile coach marks instead of the desktop spotlight.
              </p>
            </div>
            <div className="flex gap-2.5">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Where to try it:</span> view on a
                phone (or narrow your browser below 768px), then tap{" "}
                <span className="font-medium text-foreground">Get started</span> on the welcome
                screen to enter as a guest. The icon grid and coach marks appear on the main{" "}
                <span className="font-medium text-foreground">/</span> dashboard.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={dismiss}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 sm:w-auto"
            >
              Got it — let me explore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Always-visible prototype indicator once the notice is dismissed */}
      {!open && (
        <div className="pointer-events-none fixed bottom-3 left-3 z-40">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
            <FlaskConical className="h-3 w-3 text-primary" />
            Prototype
          </span>
        </div>
      )}
    </>
  );
}
