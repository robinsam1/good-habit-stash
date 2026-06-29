# Emoji confetti on FRE milestones

Add a celebratory emoji burst the first time a guest user logs a task and the first time they tap "Move to savings". Suppress both forever once the user converts to a registered account.

## Behaviour

- **First task logged**: shower of 🌟 🏅 🏆 emojis (mixed) bursting from center, ~30–40 emojis, fast iMessage-style animation (~1.5s total: scale-in + outward arc + fade).
- **First mark-as-paid**: same animation, using 💸 emoji.
- Each trigger fires **at most once per browser** via two `localStorage` flags:
  - `hv_fre_confetti_task_done`
  - `hv_fre_confetti_paid_done`
- **Gated to guests only**: only fires when `useAuth().isAnonymous === true`. Registered users never see it — so once a guest saves their account, the flag is irrelevant and the burst stops.
- Also stamp both flags as "done" inside `SaveProgressButton` success path so converted users don't get a delayed burst if they hadn't hit the milestones yet.

## Files

### New: `src/components/EmojiConfetti.tsx`
- Lightweight, no extra deps.
- Imperative API: `fireConfetti(emojis: string[])` mounted once globally.
- Implementation: a `<div>` portal appended to `document.body`, fixed inset, `pointer-events-none`, `z-[100]`. Each call spawns ~35 absolutely-positioned `<span>` emoji elements at center with randomized end transforms (translate, rotate, scale) via inline style + a single keyframe animation (`emoji-burst`) defined in `src/index.css`. Cleans up nodes on `animationend`.
- Export `fireConfetti` as a module-level function that lazily mounts the host container.

### `src/index.css`
- Add `@keyframes emoji-burst` (0%: scale 0.4, opacity 0, translate 0,0; 15%: opacity 1, scale 1.1; 100%: translate var(--tx) var(--ty), rotate var(--r), scale 0.8, opacity 0). Single animation, ~1500ms ease-out.

### `src/pages/Index.tsx`
- In `handleSelectActivity` `onSuccess`, after the existing toast: if `isAnonymous && !localStorage.getItem('hv_fre_confetti_task_done')`, call `fireConfetti(['🌟','🏅','🏆'])` and set the flag.

### `src/components/MarkAsPaidButton.tsx`
- Accept `isAnonymous` via `useAuth()` (already used elsewhere) — or read directly from hook here.
- In `markAsPaid` `onSuccess`, after toast: if `isAnonymous && !localStorage.getItem('hv_fre_confetti_paid_done')`, call `fireConfetti(['💸'])` and set the flag.

### `src/components/SaveProgressButton.tsx`
- On successful account save, set both `hv_fre_confetti_task_done` and `hv_fre_confetti_paid_done` to `'1'` so the bursts can never fire for the now-registered user.

## Out of scope
- No new deps (no canvas-confetti). Pure DOM + CSS keeps bundle small and works fine for ~35 nodes.
- No DB changes — purely client-side, per-browser. Acceptable because the gate is the guest→registered transition, not cross-device state.
