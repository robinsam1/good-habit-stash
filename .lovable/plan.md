# GetStarted layout re-balance

## Problem
On `/get-started`, the goal selection grid is a 2-column layout inside a `max-w-3xl` card. Each tile contains only an emoji and a short label, so the right side of each tile is mostly empty whitespace on desktop. The overall layout feels lopsided and wastes the available width.

## Goal
Make the goal-selection area feel more balanced while keeping the page width (`max-w-3xl` on desktop, unchanged on mobile) and preserving the existing UX (one selection required, CTA disabled until selection + country).

## Approach
Replace the 2-column goal grid with a single-column stack of full-width cards on desktop and keep a compact 2-column grid on small mobile screens.

Each goal tile becomes a horizontal card:
- A larger emoji on the left
- Label + blurb stacked on the right (using the existing `blurb` field from `GOALS`)
- Selected state, pressable squish animation, and existing colors remain unchanged
- Layout is responsive: horizontal on `sm` and up, stacked/compact on mobile

## Work items
1. **Read `GOALS` data**  
   Confirm `blurb` values exist and are suitable to display.

2. **Update `src/pages/GetStarted.tsx`**
   - Change the goal grid from `grid-cols-2 gap-2.5` to a single-column list on desktop (`flex flex-col gap-3`) and a 2-column grid on small screens only (`grid-cols-2` below `sm`).
   - Refactor each goal tile to a horizontal layout:
     - Emoji on the left (text-4xl on desktop, text-3xl on mobile)
     - Label and blurb stacked vertically on the right
     - Align items to the center-left
   - Keep the existing `pressable`, selection, and animation classes.
   - Add a subtle checkmark / selected indicator on the right side of the active tile for affordance.

3. **Verify spacing and selection states**
   - Ensure `gap-3` between cards and the country select is consistent.
   - Check that selected highlight still clearly shows.

## Out of scope
- No changes to the country select, CTA, "Back" button, or sign-in link.
- No changes to the page container width or mobile behavior.
- No changes to `GOALS` data beyond using the existing `blurb` field.
