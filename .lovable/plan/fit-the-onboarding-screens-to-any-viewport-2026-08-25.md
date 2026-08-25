# Fit the onboarding screens to any viewport

Right now `/welcome`, `/get-started` and `/auth` are laid out at their natural height, so on short windows (and most phones) the primary CTA falls below the fold. Each screen becomes a height-constrained layout: it fills exactly the visible viewport and shrinks its flexible parts so the button is always visible without scrolling.

## Approach

All three pages switch from `min-h-screen` to a dynamic-viewport height (`h-[100dvh]`, so mobile browser chrome is accounted for) with the content in a column: fixed header, flexible middle, pinned footer/CTA.

### /welcome
- The carousel photo becomes the flexible element: it uses a height that shrinks with available space rather than a fixed `16/10` aspect ratio, cropping vertically via `object-cover` while keeping full width.
- Title and body text keep their size on tall screens and step down one size on short screens.
- Dots + Next / Get started + "I already have an account" sit in a fixed-height footer that never scrolls away.

### /get-started
- Header, goal list, country select and CTA all fit the viewport.
- When vertical space is tight, each goal option hides its blurb description (emoji + label only, more compact padding) so all four options plus the country picker and CTA fit.
- The blurbs return automatically when the window is tall enough.

### /auth
- Card is vertically centred as today but the outer wrapper is height-capped; on short screens padding and header spacing compress so the Sign In button and "Create an account" link stay visible.

If a viewport is genuinely too short even after compression (e.g. landscape phone), the content area scrolls internally while the CTA stays pinned — nothing is ever unreachable.

## Technical detail

- Replace `min-h-screen` with `h-[100dvh] overflow-hidden` plus `min-h-0` on flex children so shrinking works.
- Welcome image: swap `aspect-[16/10]` for a flex-basis driven container (`flex-1 min-h-0` with `max-h-[45vh]`), image keeps `w-full h-full object-cover`.
- Short-screen adjustments use Tailwind height media variants (`max-h-[720px]:` custom screens added to `tailwind.config.ts` if not already present, or arbitrary `@media (max-height: ...)` utilities) rather than JS measurement.
- Files: `src/pages/Welcome.tsx`, `src/pages/GetStarted.tsx`, `src/pages/Auth.tsx`, `tailwind.config.ts`.
- Verify with Playwright screenshots at 393x688, 393x600 (short phone), 1280x1800 and 1280x700 (short desktop) confirming the CTA is in-frame on each page.
