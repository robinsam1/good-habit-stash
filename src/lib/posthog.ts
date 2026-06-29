import posthog from "posthog-js";

// PostHog project API key is a public client-side key, safe to ship in the bundle.
// Configured via VITE_POSTHOG_KEY / VITE_POSTHOG_HOST in .env.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://eu.i.posthog.com";

let initialized = false;

const PROD_HOSTS = new Set(["habitvisor.com", "www.habitvisor.com"]);

export function initPostHog() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;
  // Only record analytics & session replays on the live custom domain.
  // Skips Lovable editor preview, *.lovable.app, and localhost.
  if (!PROD_HOSTS.has(window.location.hostname)) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
    },
  });
  initialized = true;
}

export { posthog };
