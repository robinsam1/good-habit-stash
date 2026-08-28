# /get-started: header, and a 3D phone demo

Four changes to the landing experience, all confined to `/get-started` and the demo asset.

## 1. Remove the back link

The "Back" button linking to `/welcome` is removed. Nothing else in the page moves; the vertical space it frees is absorbed by the new header.

## 2. Full logo and full-size title

The header becomes the page's anchor: the Habit Visor mark at a larger size (56px tile, up from 40px) sitting above the "HABIT VISOR" wordmark and the "Small habits, real rewards" gradient title at a full display size (`text-3xl`, up from `text-2xl`), with the supporting product line underneath.

The header also stops collapsing at the first height breakpoint — the mark and title stay visible, and only the supporting line and the extra margins compress on genuinely short viewports. Net effect: the header takes slightly more vertical space than today, and the panel below shrinks to match while keeping its fixed height across all three steps.

## 3. Fix the misaligned screen in the demo video

The current composite pastes the recorded screen at the canvas origin instead of inside the bezel, so the app content sits up and to the left of the device body — it reads as a floating screenshot rather than a phone. The frame builder is corrected so the screen lands exactly at the bezel's inner rectangle, and the result is checked frame-by-frame against the device body before re-encoding.

## 4. The phone as a 3D object on a table

Instead of a flat, front-on mock, the demo becomes a photoreal iPhone lying on a desk, angled roughly 45 degrees, with the real recorded app footage playing on its screen.

Approach — a generated still scene plus the real video, perspective-mapped into the screen:

```text
AI-generated desk scene (phone with blank/dark screen, ~45 deg)
        +
real recorded demo footage, perspective-warped onto the screen quad
        =
one MP4/WebM pair, same as today
```

- The desk scene is generated once as a still image: a warm, oat-toned desk surface matching the app palette, soft daylight, an iPhone lying flat and rotated, screen blank so nothing competes with the real footage.
- The four screen corners are measured from that still, and each frame of the real recording is warped into that quad (a true perspective transform, not a skew), with a subtle screen glow and a soft highlight so it sits in the scene rather than on top of it.
- Accuracy check: frames from the composite are compared against the source recording — the balance figure, the activity list, and the "Move to savings" moment must all remain readable and correctly ordered. If the generated scene's phone geometry doesn't hold up under the warp, the scene is regenerated rather than the footage distorted to fit.
- Because the content is the real recording, nothing about the demo is invented — the AI contributes only the desk and the phone hardware.

The video keeps its current behaviour: autoplay, loop, muted, `playsInline`, WebM with MP4 fallback, right column on desktop and a blurred background layer on mobile. The radial feather is retuned for the new landscape-ish framing so the desk edges fade into the page background.

## Technical notes

- Files: `src/pages/GetStarted.tsx`, replacement `src/assets/demo-phone.mp4` / `.webm` (regenerated, same import names).
- Scene generation via the image tool; per-frame perspective warp and re-encode via PIL + ffmpeg in the sandbox, using the existing recorded footage as the source — no re-recording needed unless the fix in step 3 reveals a capture problem.
- Design system unchanged: existing tokens, radii, and the brand gradient wordmark.
- Verified with screenshots at desktop, short desktop, mobile and short mobile that the CTA stays visible and the panel height is identical across all three steps.

## Out of scope

`/welcome`, `/`, the in-app tour, `/signup`, `/auth`, and the onboarding step logic itself.
