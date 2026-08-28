# /get-started as a landing page

Turn `/get-started` into a standalone landing experience for visitors arriving from outbound marketing: a short value-prop line, a looping product demo, and a three-step onboarding panel that captures goal, habits and reward values before the guest account is created.

## Layout

Desktop (`sm` and up): two columns inside the existing `max-w-3xl` container. Left half = the onboarding panel. Right half = the demo video. Mobile: panel unchanged and full width, with the demo video behind it as a background layer.

The video is zoomed in (`object-cover`, scaled ~1.15) with a 10% ink overlay so it clearly reads as a demo, autoplaying, looping, muted, `playsInline`. A soft radial/edge gradient in the page background colour feathers all four edges so it never competes with the panel. On mobile the same treatment is stronger (heavier overlay + blur) so panel text stays legible. Honours `prefers-reduced-motion` by pausing on a still frame.

## Copy

Under the "Habit Visor" wordmark, one supporting line: "Track the small habits that get you to your goals — and pay yourself for sticking with them." Existing headline moves into the panel as step 1's prompt.

## The panel: three steps

```text
Step 1  What matters most?          -> [Next]
Step 2  Which habits will help?     -> [Next]
Step 3  Reward yourself             -> [Get started]
```

The CTA is small and bottom-right inside the panel, disabled until the step's requirement is met. A back arrow sits bottom-left on steps 2 and 3. Step progress is shown as three small dots.

**Step 1 — Goal.** The four existing goal cards, unchanged. Country selector is removed from this step. Selecting a goal enables "Next".

**Step 2 — Habits.** Prompt: "Which habits will help you reach your goal?" A scrollable list of goal-specific preset habits, each with a checkbox and a pencil to rename inline. Below the presets, a blank "Add your own habit" row — typing in it immediately appends another blank row beneath. The list scrolls inside a fixed-height area; the footer with the CTA sits below it with a top border so it stays visible. Sensible defaults are pre-checked. "Next" enables once at least one habit is checked.

**Step 3 — Rewards.** Prompt: "You should reward yourself! Set a value for each habit." The country/currency selector sits directly below (same region list and currency logic as today). Under it, each selected habit with an editable amount input, defaulting to 1 unit of the chosen currency and re-defaulting if the country changes before any manual edit. "Get started" enables once a country is chosen, then creates the guest account and lands on `/` with the FRE exactly as today.

## Seeded habits

The guest's starting habits are the ones chosen here, at the values entered — not the fixed 10-habit default list. The onboarding reward habit is still seeded as today.

## Technical notes

- **Presets**: new `src/lib/habitPresets.ts` with ~8-10 habits per goal (`fit`, `job`, `zen`, `connect`), using the existing `Category – Habit` naming convention.
- **Seeding**: `signInAnonymously` gains a `habits` argument and passes `[{ name, value }]` (values in minor units) into `raw_user_meta_data`. Migration updates `public.handle_new_user()` to seed from that JSON array when present, falling back to the current hardcoded list when absent (so `/signup` and any other path keep working). Names are trimmed and length-capped server-side; the array is capped at 40 entries.
- **Video**: generated with the video tool as a stylised app-like animation of a habit being logged, saved under `src/assets/` and imported directly. Poster frame shown while it buffers.
- **State**: local step state in `GetStarted.tsx`; no routing changes. Guest lifecycle markers, confetti resets, and the `/` redirect behave exactly as now.
- **Design system**: existing tokens only — card, radii, `pressable` squish, `animate-slide-up`, brand gradient wordmark. The vertical `short:` compression rules on this page are kept and extended to the new steps.
- Files: `src/pages/GetStarted.tsx`, `src/lib/habitPresets.ts`, `src/hooks/useAuth.ts`, one migration, one generated video asset.

## Out of scope

`/welcome`, `/` and the in-app FRE tour (beyond which habits exist), `/signup`, `/auth`.
