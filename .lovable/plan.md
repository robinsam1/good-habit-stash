## Goal
Stop PostHog from recording events and session replays from the Lovable preview/editor and the `*.lovable.app` published staging URL. Only the live custom domain should report.

## Change

**`src/lib/posthog.ts`** — add an environment guard in `initPostHog()` before `posthog.init(...)`:

- Read `window.location.hostname`.
- Allow only the production hosts: `habitvisor.com` and `www.habitvisor.com`.
- Bail early (no init, no autocapture, no session recording) on anything else — including `localhost`, `*.lovable.app` preview URLs, and the `good-habit-stash.lovable.app` published staging URL.

Resulting behavior:
- Preview iframe inside Lovable editor → no PostHog.
- Direct preview URL → no PostHog.
- `habitvisor.com` / `www.habitvisor.com` → full PostHog (autocapture + session replay), unchanged from today.

No other files change. `.env` keys stay as-is so production keeps working.

## Technical note
Hostname allowlist is preferred over `import.meta.env.PROD` because the Lovable `.lovable.app` published build is also a "prod" Vite build, and you want that excluded too. Hostname is the only reliable signal that separates the live custom domain from previews/staging.
