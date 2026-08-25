# Wider desktop layout to match Adherence

The Adherence page uses a 3xl-wide centre column; every other screen is capped much narrower (lg or sm). Match that width on desktop only, leaving mobile untouched.

## What changes

Each page's centre container gets a desktop-only widening (`sm:` and up), keeping its current mobile cap:

- Welcome (FRE carousel) — lg → 3xl on desktop
- Get Started (goal + country) — lg → 3xl on desktop
- Auth / sign in — sm → 3xl on desktop
- Sign up — sm → 3xl on desktop
- Home / logging flow — lg → 3xl on desktop
- Tasks, History, Settings — lg → 3xl on desktop, so the whole app feels consistent

Mobile breakpoints, spacing, element order, copy and images stay exactly as they are.

## Technical detail

Replace the fixed container class on each page wrapper with a responsive pair, e.g. `max-w-lg mx-auto` becomes `max-w-lg sm:max-w-3xl mx-auto`, matching `src/pages/Report.tsx`'s `max-w-3xl`. Files: `Welcome.tsx`, `GetStarted.tsx`, `Auth.tsx`, `Signup.tsx`, `Index.tsx`, `Tasks.tsx`, `History.tsx`, `Settings.tsx`.

Two follow-on touches so wider columns don't look sparse:
- Welcome slide text keeps its `max-w-md` reading measure but the image/card grows to the new width.
- Auth/Signup cards centre within the wider column with an inner `max-w-md` for form fields, so inputs don't stretch to 768px.

Verified afterwards with a desktop screenshot pass over `/welcome`, `/get-started`, `/auth`, and `/`.
