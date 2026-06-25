## Goal
Pull task management out of Settings into a dedicated page with its own route and entry point.

## Changes

**New page `src/pages/Tasks.tsx`**
- Mirrors the Settings page layout (max-w-lg, back button to `/`, page title "Edit Tasks").
- Auth-guarded the same way (`useAuth` → redirect `/welcome` if signed out).
- Renders `<ManageActivities />` for Pro users and `<ProInterestCard />` for everyone else, using `useIsPro` with the loading skeleton already in Settings.

**Routing — `src/App.tsx`**
- Register `<Route path="/tasks" element={<Tasks />} />` above the catch-all.

**Settings — `src/pages/Settings.tsx`**
- Remove the Pro/ManageActivities/ProInterestCard block and unused imports (`useIsPro`, `ManageActivities`, `ProInterestCard`).
- Settings becomes password-only.

**Entry point — `src/pages/Index.tsx` header**
- Add a `ListChecks` (lucide) icon button linking to `/tasks`, placed next to the Settings gear in the top-right action cluster, with `title="Edit tasks"`.

## Out of scope
- No business logic / RPC / data-model changes.
- No change to Pro gating, interest tracking, or `is_pro` rules — same components are reused on the new route.
- No nav redesign beyond adding the single icon button.
