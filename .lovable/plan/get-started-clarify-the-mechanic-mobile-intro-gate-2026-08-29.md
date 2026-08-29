# /get-started: clarify the mechanic, mobile intro gate

## Goal

Reduce confusion for paid-social traffic by (a) restating the product mechanic above the demo video on all viewports, and (b) on mobile only, leading with a video + copy intro and a "Choose your goal" CTA that reveals the existing onboarding panel.

## Changes (all in `src/pages/GetStarted.tsx`)

### 1. Mechanic copy (all viewports)
- Add a short line below the header, above the panel/video grid: "Use this tool to log habits towards the goal that matters to you." Styled as a supporting line (small, muted, centered) so it doesn't compete with the panel.
- On mobile this copy appears on the intro screen; on desktop it sits above the two-column grid.

### 2. Mobile intro gate (new local state: `introDone`, default `false` on mobile)
- When `introDone === false` on mobile (`sm:hidden`):
  - The onboarding `Card` and the step panel are **not rendered**.
  - The mobile background video becomes the hero: stronger/blur-free presentation of the demo loop (reduce the `bg-background/80` overlay so the demo is watchable, keep some scrim for text legibility).
  - Centered content: the existing Habit Visor header, the tagline, the new mechanic line.
  - Bottom-anchored: a full-width primary CTA **"Choose your goal"** and beneath it the existing "Already have an account? Sign in" link (moved up from its current footer position for this state).
- When the user taps "Choose your goal": set `introDone = true` and the page renders exactly as today — the panel appears above the background video (existing heavier overlay treatment), all steps, CTAs, shake validation, and sign-in footer work unchanged.
- Header/tagline: keep shown in both intro and panel states on mobile so the brand stays present (uses existing `short:` compression).

### 3. Desktop unchanged
- Desktop keeps the current two-column layout and interactions; the only change is the new mechanic copy line above the grid.

## Technical notes
- Single-file change in `src/pages/GetStarted.tsx`; no routing, state, or seeding changes.
- Use a CSS-only gate where possible (`sm:hidden` / `hidden sm:block`) so SSR/first paint doesn't flash the panel on mobile; `introDone` only needs to flip on mobile since the desktop column is always visible.
- Keep existing design tokens, `pressable` squish, and `short:` height-compression rules.

## Out of scope
- `/welcome`, `/auth`, `/`, tour, and seeding logic.
