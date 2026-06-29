Your key `phc_IvpFfQ5yMDWsGCR3gqWxJG8c3c2VeGrQyXgFSyyUEMq` is valid against `https://eu.i.posthog.com` (decide endpoint returned 200, session recording enabled).

Plan:
1. Replace the `__REPLACE_WITH_PHC_KEY__` placeholder in `src/lib/posthog.ts` with the real key.
2. No other changes — init, autocapture, pageviews, and session recording (with `maskAllInputs: true`) are already wired.

After approval, events should start appearing in your PostHog EU project within a minute of loading the app.