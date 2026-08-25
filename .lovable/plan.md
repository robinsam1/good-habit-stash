# Aesthetic Reset: One Coherent System

The current look mixes eras — a 90s-flavoured serif wordmark, a gradient that belongs to a different decade, a neutral sans that matches neither, pill buttons next to heavy-bordered option tiles. The fix is to throw the whole visual language out and rebuild it from one reference point, applied to every screen without touching layout, copy, images or UX.

## The reference

**Swiss-precision product design in the Linear / Vercel / Stripe-dashboard lineage**, with a ledger-paper twist so it reads as a money app rather than a dev tool. Tasteful variation, not a copy: warm paper instead of cold white, a single deep-green signal colour instead of their blues/violets, and typographic emphasis carried by weight and size rather than colour.

Principles, applied everywhere with no exceptions:

- One type family. No serif anywhere.
- One accent colour. Everything else is a neutral ink ramp.
- No gradients, no shimmer, no glow, no floating blobs.
- Hairline borders and flat surfaces; shadow used only for true overlays.
- Small, uniform radii. Nothing is a pill, nothing is a 20px bubble.
- Fast, linear-ish motion. No bounce or spring.

## Colour

A single warm-neutral ink ramp plus one signal green.

- Paper canvas `#FAFAF9`, surfaces pure `#FFFFFF`, sunken rows `#F4F4F2`
- Ink `#111110` primary text, `#57564F` secondary, `#8A8880` tertiary
- Hairlines `#E6E5E1`
- Signal green `#0E7A54` — the only saturated colour; used for primary buttons, selection, focus rings, positive balance
- Negative `#B3261E`, kept muted so it reads as data, not alarm
- Dark theme: ink canvas `#141413`, surfaces `#1C1C1A`, hairlines `#2E2E2B`, signal `#2FB37F`

The blue→orange gradient is removed entirely, including from the wordmark and balance figure. The wordmark becomes plain ink with tight tracking.

## Type

**Inter Tight** for absolutely everything — wordmark, headings, body, numerals — with `font-feature-settings: "tnum", "cv05"` so money columns align. Instrument Serif and Geist are dropped.

Fixed scale: 32/24/20/16/14/13/11, weights limited to 400, 500 and 600. Headings sit at 600 with `-0.02em` tracking. The balance figure is 56px/600 tabular, not a display serif.

## Shape, depth, motion

- Radii: 8px cards and inputs, 8px buttons, 6px small chips, 4px on the smallest controls. `--radius` becomes `0.5rem`.
- Buttons are solid rectangles with 8px corners; secondary is a hairline outline, ghost is text-only.
- Depth: hairline border is the default separator. Only dialogs, drawers, popovers and toasts get a shadow, and it's a neutral `0 12px 32px -12px rgb(17 17 16 / 0.18)`.
- Motion: 120ms/180ms with `cubic-bezier(0.2, 0, 0, 1)`. Hover shifts background one step; press is a 1px translate, not a scale. Spring easing, `animate-pulse-success`, shimmer and blob animations are removed.
- Icons: Lucide at a uniform 1.5 stroke and 16/20px sizes only.

## Screens touched

Token-driven, so all surfaces update with no structural change: `/welcome`, `/get-started`, `/signup`, `/auth`, `/` home (balance, activity picker, log entries, move-to-savings dialog), `/tasks`, `/history`, `/report`, `/settings`, the onboarding tour, toasts, skeletons and empty states.

Specific inconsistencies resolved:

- The four "what matters most" tiles lose the 2px coloured border and rounded-bubble look. They become flat surface cards with a hairline border; selection is a 1.5px green border plus a faint green tint — same treatment as every other selectable control in the app.
- Card top-edge gradient strips are removed.
- Decorative blurred blobs behind auth/get-started are removed.
- The adherence timeline's indigo→ember ramp is replaced with a neutral-to-green intensity ramp; broken-streak markers use the muted negative red.
- Confetti stays, since it's content rather than chrome.

## Technical notes

- All values are HSL custom properties in `src/index.css` (`:root` and `.dark`); `tailwind.config.ts` gains the new font stack, the 4/6/8px radius steps, neutral shadows and the new easing, and drops the spring/pill/glow tokens.
- Every shadcn primitive (`button`, `input`, `textarea`, `select`, `card`, `dialog`, `drawer`, `sheet`, `popover`, `badge`, `switch`, `tabs`, `skeleton`, `toast`) is updated to the new radii, borders and motion.
- Components carrying hardcoded gradient/glow/pill classes are swept and moved onto tokens.
- `HabitTimeline.tsx` reads its colours from CSS variables at render time so it tracks theme changes.
- Google Fonts import switches to Inter Tight only.
- No changes to hooks, RPCs, schema, routes, copy or images.

## Out of scope

Layout, element positions, component order, copy, images, behaviour.
