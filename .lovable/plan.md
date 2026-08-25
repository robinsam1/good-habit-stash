# Aesthetic Reset: Playful, Modern, Consistent

Rebuild the visual language from one 2025–26 reference so every screen evokes the same feeling. Layout, element positions, copy, images and UX stay exactly as they are.

## The reference

**Airbnb's 2025 app refresh, crossed with the Arc/Dia interface language.** That pairing is where playful currently lives: soft "squish" surfaces that feel physical, warm off-white canvases, oversized rounded-but-not-bubbly shapes, one candy accent used decisively, and expressive display type sitting on a very neutral body face. It reads current rather than gamified — playful because of shape, colour and motion, not because of cartoon styling.

Tasteful variation so it isn't a copy: a warm oat canvas instead of Airbnb's pink-white, a coral-to-plum pairing rather than their Rausch red, and a wider display face than either uses.

Rules, applied everywhere with no exceptions:

- Two type families, strictly divided: expressive display for headings and money, neutral geometric for everything else.
- Flat colour surfaces. No multi-stop gradients, no glow, no blurred blobs.
- Squish physics: every interactive surface scales down slightly and softens its shadow on press — the same rule everywhere.
- One radius language: generous, uniform, and never a pill except on true toggles/avatars.
- Motion is short and rubbery, only on interaction — nothing ambient or looping.

## Colour

Warm, soft, confident — one saturated accent doing all the work.

- Canvas oat `#FBF7F2`, surfaces `#FFFFFF`, sunken rows `#F4EEE7`
- Ink `#1F1B19` primary, `#6E6560` secondary, `#A39A93` tertiary
- Borders `#EBE3DA`, 1.5px and always visible
- Primary **coral** `#F2543D` — buttons, selection, focus rings
- Secondary **plum** `#5B3FA6` — onboarding tour, badges, informational chrome
- Accent **butter** `#FFC24B` — streaks and highlights only
- Positive `#1F9D6B`, negative `#DC3B3B`
- Dark theme: canvas `#17130F`, surfaces `#221C18`, borders `#332A24`, coral `#FF6F58`, plum `#9C7BEC`, butter `#FFD37A`

The blue→orange gradient is removed everywhere, including the wordmark and balance figure. The wordmark becomes solid ink in the display face with a coral full stop.

## Type

- **Display: Bricolage Grotesque** (700, tight tracking) — wordmark, page headings, the balance figure. Wide, slightly quirky, unmistakably 2025.
- **Body/UI: Plus Jakarta Sans** (400/500/600) — labels, buttons, inputs, lists, numbers in tables, with tabular numerals for money.

Instrument Serif and Geist are dropped. Scale: display 60/34/26, UI 17/15/13/11. Nothing uses the display face below 22px.

## Shape, depth, motion

- Radii: 24px cards and sheets, 18px buttons and inputs, 14px chips, 999px only on toggles/avatars. `--radius` = 1.5rem with consistent steps down.
- **The signature move — squish:** every interactive surface (buttons, option tiles, activity picker trigger, log rows, Move-to-savings CTA) presses to `scale(0.97)` while its shadow tightens, on a rubbery curve. One rule, one utility, applied to every pressable element.
- Depth: cards use a 1.5px border plus a very soft warm shadow; dialogs, drawers and popovers get a larger version of the same warm shadow. No indigo tint, no glow.
- Motion: 130ms press, 240ms entrances, `cubic-bezier(0.32, 1.3, 0.5, 1)` — one curve used everywhere. Shimmer, blob and glow-pulse animations are removed.
- Icons: Lucide at 1.75 stroke, sizes 18/22 only.

## Screens touched

Token-driven, so all surfaces update with no structural change: `/welcome`, `/get-started`, `/signup`, `/auth`, `/` home (balance, activity picker, log entries, move-to-savings dialog), `/tasks`, `/history`, `/report`, `/settings`, onboarding tour, toasts, skeletons, empty states.

Specific inconsistencies resolved:

- The four "what matters most" tiles adopt the shared pressable language: 24px radius, 1.5px border, soft warm shadow, squish on press. Selected is a coral border plus a coral-tinted surface — identical to every other selectable control in the app.
- Card top-edge gradient strips and blurred background blobs are removed.
- The adherence timeline ramp becomes warm neutral → butter → coral for streaks, with the negative red for broken-streak markers.
- Emoji confetti stays as-is.

## Technical notes

- All values become HSL custom properties in `src/index.css` (`:root` and `.dark`); `tailwind.config.ts` gains the Bricolage/Jakarta stacks, the new radius steps, warm shadow tokens and the single rubbery easing, and drops pill/glow/gradient tokens.
- A single `.pressable` utility in `index.css` owns the squish physics, reused by button variants, option tiles and picker triggers so behaviour can't drift.
- Every shadcn primitive (`button`, `input`, `textarea`, `select`, `card`, `dialog`, `drawer`, `sheet`, `popover`, `badge`, `switch`, `tabs`, `skeleton`, `toast`) is updated to the new radii, borders and motion.
- Components carrying hardcoded gradient/glow/pill classes are swept onto tokens.
- `HabitTimeline.tsx` reads colours from CSS variables at render time so it tracks theme changes.
- Google Fonts import switches to Bricolage Grotesque + Plus Jakarta Sans.
- No changes to hooks, RPCs, schema, routes, copy or images.

## Out of scope

Layout, element positions, component order, copy, images, behaviour.
