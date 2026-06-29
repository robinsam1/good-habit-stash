import { Link } from "react-router-dom";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONFETTI_FLAGS } from "@/components/EmojiConfetti";

/**
 * Floppy-disk save CTA shown to guest (anonymous) users on the homepage.
 * Red badge draws attention to the call-to-action to save progress.
 */
export function SaveProgressButton({ "data-tour": dataTour }: { "data-tour"?: string }) {
  const stampFlags = () => {
    // Once the user commits to converting, suppress any future FRE confetti
    // even if they haven't hit the milestones yet.
    try {
      localStorage.setItem(CONFETTI_FLAGS.task, "1");
      localStorage.setItem(CONFETTI_FLAGS.paid, "1");
    } catch {
      // ignore storage failures
    }
  };
  return (
    <Link to="/signup" data-tour={dataTour} onClick={stampFlags}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        title="Save your progress"
        aria-label="Save your progress"
      >
        <Save className="h-4 w-4" />
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
        </span>
      </Button>
    </Link>
  );
}
