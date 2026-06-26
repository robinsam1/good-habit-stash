## Problem

`OnboardingTour` is statically imported (no lazy boundary), so the JS is already in the bundle. The perceived delay comes from runtime gating, not async loading:

1. `useEffect` waits for `enabled` (which depends on `isAnonymous` resolving from the auth/profile fetch).
2. After that, a **hard 400ms `setTimeout`** before `setActive(true)`.
3. Then `useLayoutEffect` measures the first target — which only exists after the dashboard's own data (balance, picker) has rendered.

So the page paints, then ~400ms+ later the tour pops in. That's the latency the user is seeing.

## Plan

Tighten the gating so the tour overlay shows up on the same frame as the dashboard, with no fixed delay.

1. **Drop the 400ms `setTimeout`** in `OnboardingTour.tsx`. Set `active = true` synchronously the moment `enabled` is true and the `ONBOARDING_PENDING_KEY` flag is set.

2. **Paint the dim overlay immediately**, even before the first target rect is measured. Today, when `rect` is null we already render a centered tooltip — good — but we can also render the dark backdrop right away so there's never a "bare page" frame. Use `useLayoutEffect` (already in place) so the first measurement happens before paint.

3. **Pre-resolve `enabled` earlier.** In `Index.tsx`, `isAnonymous` comes from a hook that waits on Supabase. Read `ONBOARDING_PENDING_KEY` from `localStorage` directly as the initial gate — it's synchronous and set during `/get-started` before navigation. The auth check then only needs to *cancel* the tour if the user turns out to be fully registered, not *enable* it. This removes the auth-roundtrip wait.

4. **Retry-on-mount for the first target.** Since target nodes (`data-tour="total"`, etc.) may mount one frame after the tour, the existing `raf1 → raf2 → 120ms settle` loop stays, but we also add a `MutationObserver` on `document.body` that fires `update()` once the first target appears, then disconnects. This eliminates the worst-case wait when the dashboard data is slow.

5. **Keep behaviour identical** when the flag isn't set: tour stays off, no overlay, no observer.

## Files touched

- `src/components/OnboardingTour.tsx` — remove timeout, synchronous initial state from localStorage, add MutationObserver fallback, render backdrop before first measurement.
- `src/pages/Index.tsx` — no logic change needed; `enabled={isAnonymous}` still works as the cancel signal. (Optional: pass a second prop so the tour can show immediately and self-cancel if the user is signed in.)

## Not doing

- No `React.lazy` / preloading — the component is already in the main bundle, so lazy-loading would make this *worse*, not better.
- No changes to the steps, copy, or styling.