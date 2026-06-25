import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const ANON_STARTED_KEY = "hv_anon_started_at";
export const ANON_NUDGED_KEY = "hv_anon_nudged_save";
export const ONBOARDING_PENDING_KEY = "hv_onboarding_pending";

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL = 60 * 1000; // 60s

/**
 * Lifecycle timers for anonymous (guest) sessions:
 *  - after 1h on `/`, nudge user to /signup (once)
 *  - after 24h, sign out and return to /welcome (cron purges the row)
 */
export function useAnonymousLifecycle() {
  const navigate = useNavigate();
  const { isAnonymous } = useAuth();

  useEffect(() => {
    if (!isAnonymous) return;

    let started = Number(localStorage.getItem(ANON_STARTED_KEY) || 0);
    if (!started) {
      started = Date.now();
      localStorage.setItem(ANON_STARTED_KEY, String(started));
    }

    const tick = async () => {
      const age = Date.now() - started;

      if (age >= ONE_DAY) {
        localStorage.removeItem(ANON_STARTED_KEY);
        localStorage.removeItem(ANON_NUDGED_KEY);
        localStorage.removeItem(ONBOARDING_PENDING_KEY);
        await supabase.auth.signOut();
        navigate("/welcome", { replace: true });
        return;
      }

      if (
        age >= ONE_HOUR &&
        !localStorage.getItem(ANON_NUDGED_KEY) &&
        window.location.pathname === "/" &&
        document.visibilityState === "visible"
      ) {
        localStorage.setItem(ANON_NUDGED_KEY, "1");
        navigate("/signup");
      }
    };

    void tick();
    const id = window.setInterval(tick, CHECK_INTERVAL);
    const onFocus = () => void tick();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAnonymous, navigate]);
}
