# 2026 Design System Refresh

A full visual retheme of Habit Visor. Layout, UX, element positions, copy and images stay exactly as they are — only colour, type, shape, depth and motion change, driven from one shared token set.

## Direction

**Refined Indigo + Ember.** The blue-orange idea survives, but modernised: a clean near-white canvas instead of the dull blue-grey wash, an electric indigo primary, and ember orange reserved as a true accent (CTAs, streaks, highlights) rather than a decorative gradient everywhere.

**Typography: high-contrast display serif + clean sans.** MADE Voyager and YWFT Garadone are commercial licences we can't ship, so we use the closest free equivalents:
- Headings / balance figure / wordmark: **Instrument Serif** (tight, high-contrast modern serif — the Voyager/Garadone family of feel)
- Body / UI / numbers: **Geist** (or Inter Tight as fallback) — neutral, tabular numerals for money

Optional variant if Instrument Serif reads too editorial once in place: **Fraunces** with a low `soft`/`wonk` axis. We'll build with Instrument Serif first.

**Shape & motion: soft and springy.** Cards and sheets at 20px, buttons pill-shaped, inputs 14px. Press states scale to 0.97 with a spring curve; entrances use short spring rises rather than the current linear fades. Reduced-motion respected throughout.

**Both themes.** Light and dark are fully retokenised, not just inverted.

## Token set

Defined once in `src/index.css` and exposed through `tailwind.config.ts`.

- Canvas: layered near-white (`#F7F8FC` base, `#FFFFFF` cards) in light; deep indigo-ink (`#0E1020` base, `#171A2B` cards) in dark. The flat blue-grey body gradient is replaced by a very soft radial indigo bloom that reads as light, not grey.
- Primary: electric indigo `#3B3FD8` (light) / `#7C82FF` (dark)
- Accent: ember `#FF6B35`, used sparingly
- Positive / negative: refreshed emerald and rose that hold contrast in both themes
- Borders: hairline low-opacity ink instead of grey fills
- Elevation: two soft, tinted shadow tokens (indigo-tinted, not black) plus a "glow" token for the primary CTA
- Radii: `--radius` 1.25rem with `sm`/`md`/`lg`/`pill` steps
- Motion: shared spring easing + duration tokens

The blue→orange gradient is kept, but restricted to two intentional places (the wordmark and the balance figure) so it feels like a signature instead of a default.

## Screens updated

Every surface consumes the tokens, so all of these get the new look with no structural change:

- `/welcome` carousel, `/get-started`, `/signup`, `/auth`
- `/` home: balance display, activity picker, log entries, mark-as-paid dialog, floating decor
- `/tasks`, `/history`, `/report` (adherence bars re-tinted to the new indigo/ember/gold scale)
- `/settings`, onboarding tour, confetti, toasts, empty states, skeletons
- shadcn primitives: button, input, select, dialog, drawer, popover, card, badge, switch, tabs

Icons stay Lucide but move to a consistent `1.75` stroke weight and a single sizing scale.

## Technical notes

- All colours defined as HSL custom properties in `src/index.css` (`:root` and `.dark`); no new hardcoded colour utilities in components — existing hardcoded ones get swapped to tokens.
- `tailwind.config.ts` gains the new font families, radii, shadow, and spring keyframes/animations.
- Fonts loaded via Google Fonts with `display=swap`, replacing the current DM Sans / Space Grotesk import.
- `HabitTimeline.tsx` draws on canvas, so its colour constants are read from the CSS variables at render time to stay in sync with theme switches.
- No changes to hooks, RPCs, schema, routes, or copy.

## Out of scope

Layout, component placement, copy, images, and any behaviour change.
