Give the confetti a ballistic arc: emojis launch upward/outward, then accelerate downward off-screen.

## Changes

**`src/components/EmojiConfetti.tsx`**
- Replace the current single-target (`--tx`, `--ty`) trajectory with a two-phase arc:
  - Phase 1 (apex): horizontal drift `--tx` plus strong upward `--apex` (e.g. `-180 to -340px`).
  - Phase 2 (fall): same horizontal continues, vertical falls to `--fall` well below the viewport (e.g. `window.innerHeight` + 200px) so pieces clear the screen.
- Increase duration to ~1800–2200ms and randomize per-piece so they don't all land together.
- Keep rotation, scale-in pop, and final fade.

**`src/index.css` — `@keyframes emoji-burst`**
- Rewrite with apex keyframe to simulate gravity:
  - `0%`: scale 0.4, opacity 0, at origin.
  - `12%`: scale 1.15, opacity 1 (pop-in).
  - `40%`: at apex — `translate(calc(-50% + var(--tx) * 0.45), calc(-50% + var(--apex)))`, slow ease-out feel.
  - `100%`: at fall position — `translate(calc(-50% + var(--tx)), calc(-50% + var(--fall)))`, opacity fades near end.
- Switch timing function to `cubic-bezier(0.33, 0, 0.67, 1)` (ease-in on descent via keyframe spacing handles the acceleration shape) — confetti rises quickly, hangs briefly, then accelerates down.

No other files affected; both confetti triggers (task log + mark as paid) inherit the new motion automatically.