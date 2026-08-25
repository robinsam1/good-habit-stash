# Faster carousel images on /welcome

The three welcome photos are ~1.8 MB JPEGs each, served at full camera resolution, so the first slide can sit blank for seconds. Fix it in two layers: make the real images far smaller, and show an instant low-res version while the full one loads.

## What changes

1. **Downscaled full-res images** — each photo is re-encoded to a sensible display size (max ~1400px wide, progressive JPEG, quality ~72). Expect roughly 1.8 MB down to 120-200 KB each with no visible quality loss at the sizes the carousel actually renders.
2. **Instant low-res placeholder** — a tiny (~24px wide) blurred version of each photo is inlined directly in the code as a data URI (~1 KB, no network request). It paints immediately, scaled up and blurred, filling the exact image frame.
3. **Crossfade** — when the full image finishes decoding it fades in over the blurred placeholder, so there is no pop or layout shift.
4. **Preload + eager decode for slide 1** — slide 1's image is preloaded so it starts downloading with the page; slides 2 and 3 stay lazy but are prefetched once slide 1 has painted, so tapping Next feels instant.

## Technical detail

- Resize/re-encode the three source photos with `sharp` (or ffmpeg) in the sandbox, upload the optimised files as new assets via `lovable-assets create`, and repoint `src/assets/welcome-{1,2,3}.jpg.asset.json`. Old assets are deleted only after the new pointers are verified, to avoid breaking earlier deploys.
- Generate the LQIP by encoding each photo at 24px wide, quality 40, as a base64 data URI stored in a new `src/assets/welcome-lqip.ts` constant map (one string per slide).
- In `src/pages/Welcome.tsx`, each slide's image frame gets the LQIP as a CSS `background-image` with `blur` + `scale` on a wrapper, and the real `<img>` sits on top at `opacity-0`, transitioning to `opacity-100` on its `onLoad`. Slides already loaded stay loaded (tracked in a `Set` in state), so swiping back doesn't refade.
- Slide 1 keeps `loading="eager"` / `fetchPriority="high"`; slides 2-3 switch from `loading="lazy"` to a `new Image()` prefetch fired after slide 1's `onLoad`.
- No layout or copy changes — the staged vertical scaling behaviour added earlier is untouched.
- Verify by loading `/welcome` in Playwright with network throttled and screenshotting at ~150 ms to confirm the blurred placeholder is visible rather than an empty frame, plus checking transferred bytes before/after.
