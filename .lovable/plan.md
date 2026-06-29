# Add PostHog analytics

Wire up PostHog (EU Cloud) with autocapture pageviews/clicks and session replay. No custom event instrumentation, no user identification — guests and signed-in users alike are tracked anonymously by PostHog's distinct_id.

## Steps

1. **Secret** — request `VITE_POSTHOG_KEY` (PostHog Project API key, public/client-side, safe in frontend bundle) via `add_secret`. Host is hardcoded to `https://eu.i.posthog.com`.
2. **Install** — `bun add posthog-js`.
3. **Init** — new `src/lib/posthog.ts` that calls `posthog.init(key, { api_host: 'https://eu.i.posthog.com', person_profiles: 'identified_only', autocapture: true, capture_pageview: true, capture_pageleave: true, session_recording: { maskAllInputs: true } })`. Skip init when the key is missing or in dev (optional — default: init in all envs).
4. **Bootstrap** — import the module in `src/main.tsx` so it initializes once at app start.
5. **SPA pageviews** — add a tiny `<PostHogPageviews/>` component inside `<BrowserRouter>` in `src/App.tsx` that watches `useLocation()` and calls `posthog.capture('$pageview')` on route change (autocapture's initial pageview covers first load; this covers client-side nav).
6. **Privacy** — session replay config masks all input fields by default so passwords/emails on `/auth`, `/signup`, `/settings` aren't recorded. No DOM changes needed.

## Files

- new `src/lib/posthog.ts`
- edit `src/main.tsx` (one import)
- edit `src/App.tsx` (mount pageview tracker inside Router)
- `package.json` / lockfile via `bun add`

## Not doing

- No identify() tying events to Supabase user_id (can add later).
- No custom events (log_activity, mark_as_paid, etc.).
- No backend/edge-function capture.
- No cookie banner — PostHog EU + input masking is generally fine, but flag if you need explicit consent.
