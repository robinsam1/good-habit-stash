# Welcome screen: staged vertical scaling

`/welcome` currently shrinks by height media queries only, which gives uneven results between the image, the copy and the CTA. Replace that with an explicit, measured ladder of compression stages so the page degrades in the exact order you described.

## The ladder

The page always fills exactly the visible viewport. A stage is applied only if the previous stage still overflows:

1. **Roomy** — full-height image, natural spacing between header, image and body, all leftover space collected between the body and the CTA (CTA + "I already have an account" sit bottom-justified).
2. **Compact slack** — the flexible gap between body and CTA shrinks toward zero; everything else unchanged.
3. **Half spacing** — gaps between header, image, body and CTA shrink by up to 50%.
4. **Cropped image** — image height reduced by up to 50%, cropping vertically (full width preserved, `object-cover`).
5. **No image** — image is removed entirely; header, title, body, dots and CTA remain.
6. **Overflow** — accept it: the content area scrolls internally while the CTA stays pinned at the bottom, so nothing is unreachable.

The tallest slide of the three drives the stage, so the layout does not jump as you swipe between slides.

## Technical detail

- `src/pages/Welcome.tsx` gets a small layout hook that measures the natural content height of the tallest slide against the container height and resolves a stage (`roomy | tight | half | crop | noimage | overflow`) plus a continuous factor within stages 2-4.
  - Measurement happens in a `useLayoutEffect` with a `ResizeObserver` on the page container; recomputed on resize and on font load. Stage resolution is a pure function of (available height, measured natural heights), so it is deterministic and hysteresis-guarded (small dead-zone) to prevent flicker at boundaries.
  - Spacing is driven by CSS custom properties (`--w-gap`, `--w-img-scale`) set inline from the resolved stage, rather than by height media queries — so gaps interpolate smoothly (100% → 50%) instead of snapping.
  - The image container is `flex-1 min-h-0` with `height: calc(var(--w-img-h) * var(--w-img-scale))`; at stage 5 the image element is unmounted (not just hidden) so it costs no layout.
  - Footer (dots, primary CTA, "I already have an account") stays `shrink-0` and bottom-pinned in all stages; at stage 6 only the middle region gets `overflow-y-auto`.
- Remove the now-redundant `short:` / `shorter:` utilities from `Welcome.tsx`. The `short`/`shorter` screens stay in `tailwind.config.ts` because `/get-started` and `/auth` still use them.
- Verify with Playwright screenshots at 1280x1800, 1280x900, 1280x700, 393x852, 393x688, 393x600 and 740x380 (landscape phone), confirming the expected stage is hit at each and the CTA is in-frame down to stage 5.
