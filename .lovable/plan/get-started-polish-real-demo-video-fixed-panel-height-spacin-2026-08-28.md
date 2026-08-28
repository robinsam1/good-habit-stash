# /get-started polish: real demo video, fixed panel height, spacing

## 1. Real product video in an iPhone frame

Replace the AI-generated animation with a screen recording of the actual app.

- Record the real flow with Playwright against the running app at a phone viewport (390x844): guest session on `/`, open the activity picker, select a habit, the balance ticks up, then "Mark as paid". Slow, deliberate cursor/tap movements, a few seconds of dwell on each beat.
- Post-process with ffmpeg: trim to a clean ~10-12s loop, then composite the recording inside an iPhone-style device frame (rounded corners, bezel, subtle shadow) rendered on a transparent/scene background, exported as a looping MP4.
- Swap the asset in `GetStarted.tsx`. Because the video is now a portrait phone, the desktop right-hand column shows the device centred and full-height with `object-contain` rather than the current zoomed `object-cover`; the soft radial feather to the page background stays. Mobile background layer keeps the blurred/scaled treatment.

## 2. Fixed panel height across the three steps

The card currently sizes to its content, so step 1 (four goal tiles) is much taller than steps 2 and 3, and on short screens the footer CTA can be pushed off.

- Measure available vertical space once (same approach as `/welcome`: a `ResizeObserver` on the page container, subtracting header, back link, footer link) and set one explicit pixel height on the card that all three steps share.
- Prefer more space when it is available: the card takes the full space left over, clamped between a sensible minimum and a maximum so it never looks stretched on a tall desktop screen.
- Inside the card the content area scrolls and the footer (dots + Back + Next/Get started) is pinned below it, so the CTA is always visible at any viewport size.
- Desktop: the video column stretches to the same fixed height.

## 3. Breathing room above the footer

Add bottom padding to each step's content area (and a little top padding on the footer row) so the last goal tile no longer sits flush against the footer's top border. The scroll area gets a fade/padding at the bottom so content reads as scrollable rather than clipped.

## Technical notes

- Files: `src/pages/GetStarted.tsx`, one new video asset under `src/assets/` (old `demo-log-habit.mp4` asset removed).
- Recording is done in the sandbox with Playwright video capture plus ffmpeg for trimming and the device-frame composite; no runtime dependency is added to the app.
- No changes to the step logic, habit seeding, `/welcome`, `/`, or the FRE.
