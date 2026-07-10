## Problem

After the revert, `src/lib/posthog.ts` still imports `posthog-js`, but the package is no longer in `node_modules`. Vite fails with:

```
Failed to resolve import "posthog-js" from "src/lib/posthog.ts"
```

This crashes the dev server response inside the preview iframe (blank/error), while a separate browser tab may still show a stale cached render.

## Fix

Install the missing dependency:

- `bun add posthog-js`

That's the only change needed — `src/lib/posthog.ts` and its usage in `src/App.tsx` (the `PostHogPageviews` component) are already written to no-op safely until initialized, so once the import resolves the preview will render again.

## Verification

- Confirm Vite recompiles without the "Failed to resolve import" error.
- Confirm `/welcome` renders inside the preview frame.
