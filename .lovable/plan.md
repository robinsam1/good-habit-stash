# Aesthetic Reset: Playful, Consistent System

Rebuild the visual language from one reference point so every screen evokes the same feeling. Layout, element positions, copy, images and UX stay exactly as they are.

## The reference

**Duolingo, with a dash of Headspace** — the most consistently themed playful consumer products around. What makes them work isn't randomness; it's rigid rules applied cheerfully: one chunky rounded typeface, flat saturated colour, "3D" buttons with a solid bottom lip you can press, fat radii everywhere, and bouncy but short motion.

Tasteful variation so it isn't a copy: a warm cream canvas instead of Duolingo's white, a saffron/teal-led palette rather than their green-and-blue, and geometric confetti-free chrome (our emoji confetti stays as a moment, not a texture).

Rules applied with no exceptions:

- One type family for everything, rounded and friendly.
- Flat colour only — no gradients, no glow, no blur blobs.
- Every raised control has the same solid bottom-lip shadow and the same press behaviour.
- One radius language: fat and consistent.
- Short, springy motion on interaction; nothing ambient or looping.

## Colour

Flat, saturated, high-contrast — cheerful without being neon.

- Canvas cream `#FFF9F0`, surfaces `#FFFFFF`, sunken rows `#FFF3E4`
- Ink `#2B2A33` primary, `#6B6875` secondary, `#A19DAC` tertiary
- Borders are visible, not hairline: `#E6DFD3` at 2px
- Primary **teal** `#14B8A6` (buttons, selection, focus)
- Accent **saffron** `#FFB627` (streaks, highlights, badges)
- Positive `#34C759`, negative `#FF5A5F`, info violet `#7C5CFF` for tour/onboarding chrome
- Dark theme: canvas `#1B1A22`, surfaces `#25232E`, borders `#37343F`, teal `#2DD4BF`, saffron `#FFC44D`

The blue→orange gradient is removed everywhere, including the wordmark and balance figure. The wordmark becomes solid ink with a saffron dot/accent mark.

## Type

**Nunito** for absolutely everything — wordmark, headings, body, numerals — at weights 600/700/800 only, with tabular numerals for money. Rounded terminals carry the playfulness so no second family is needed. Instrument Serif and Geist are dropped.

Scale: 34/26/20/16/15/13/11. Headings 800 with `-0.01em` tracking; body 600 (Nunito reads light at 400). Balance figure is 60px/800 tabular.

## Shape, depth, motion

- Radii: 20px cards and sheets, 16px buttons and inputs, 12px chips, 999px only on true avatars/toggles. `--radius` = 1.25rem with consistent steps.
- **The signature move:** every raised control (primary/secondary buttons, option tiles, activity picker trigger, Move-to-savings CTA) sits on a 4px solid bottom lip in a darker shade of its own colour. Press translates it down 4px and collapses the lip — the same physical rule everywhere.
- Cards use a 2px border and no shadow; only dialogs, drawers and popovers float, with one soft neutral shadow.
- Motion: 140ms press, 220ms entrances, `cubic-bezier(0.34, 1.4, 0.5, 1)` — one springy curve, used everywhere. Shimmer, blob, and glow-pulse animations are removed.
- Icons: Lucide at 2px stroke (matching the type weight), sizes 18/22 only.

## Screens touched

Token-driven, so everything updates without structural change: `/welcome`, `/get-started`, `/signup`, `/auth`, `/` home (balance, activity picker, log entries, move-to-savings dialog), `/tasks`, `/history`, `/report`, `/settings`, onboarding tour, toasts, skeletons, empty states.

Specific inconsistencies resolved:

- The four "what matters most" tiles adopt the exact button language: 2px border, 20px radius, solid bottom lip, press-down on tap. Selected state is a teal border plus teal-tinted surface and a saffron check — the same selection treatment used by every other selectable control.
- Card top-edge gradient strips and blurred background blobs are removed.
- The adherence timeline ramp becomes muted teal → saffron for streaks, with negative red markers for broken streaks.
- Emoji confetti stays as-is.

## Technical notes

- All values become HSL custom properties in `src/index.css` (`:root` and `.dark`); `tailwind.config.ts` gains the Nunito stack, the new radius steps, the lip/shadow tokens, and the single spring easing, and drops pill/glow/gradient tokens.
- A `.lip` / raised-control utility is defined once in `index.css` and reused by button variants and option tiles so the press physics can't drift.
- Every shadcn primitive (`button`, `input`, `textarea`, `select`, `card`, `dialog`, `drawer`, `sheet`, `popover`, `badge`, `switch`, `tabs`, `skeleton`, `toast`) is updated to the new radii, borders and motion.
- Components with hardcoded gradient/glow/pill classes are swept onto tokens.
- `HabitTimeline.tsx` reads colours from CSS variables at render time so it tracks theme changes.
- Google Fonts import switches to Nunito only.
- No changes to hooks, RPCs, schema, routes, copy or images.

## Out of scope

Layout, element positions, component order, copy, images, behaviour.
