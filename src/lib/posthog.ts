import posthog from "posthog-js";

// PostHog project API key is a public client-side key, safe to ship in the bundle.
// Replace with your project key from https://eu.posthog.com/project/settings.
const POSTHOG_KEY = "phc_IvpFfQ5yMDWsGCR3gqWxJG8c3c2VeGrQyXgFSyyUEMq";
const POSTHOG_HOST = "https://eu.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY || POSTHOG_KEY.startsWith("__REPLACE")) return;

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
