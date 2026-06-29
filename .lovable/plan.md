Reset the FRE confetti flags whenever a brand-new guest FRE begins, so a fresh anonymous session can re-trigger confetti, while registered accounts still never see it.

## Changes

**`src/pages/GetStarted.tsx`** (in the handler that calls `signInAnonymously(goal, region)`)
- Immediately before kicking off the anonymous sign-in, clear both flags:
  ```ts
  localStorage.removeItem(CONFETTI_FLAGS.task);
  localStorage.removeItem(CONFETTI_FLAGS.paid);
  ```
- Import `CONFETTI_FLAGS` from `@/components/EmojiConfetti`.

Rationale: a new guest FRE is the only natural "fresh start" boundary — it runs once per anonymous session, not on every `/welcome` view (so accidentally re-opening Welcome won't wipe a real guest's progress). `SaveProgressButton` still stamps both flags on account conversion, so registered users continue to see no confetti.

No other files affected.