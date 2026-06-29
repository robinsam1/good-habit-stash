// Lightweight emoji confetti burst. No deps — single global host, CSS keyframe.
let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
  if (host && document.body.contains(host)) return host;
  host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:100;overflow:hidden;";
  document.body.appendChild(host);
  return host;
}

export function fireConfetti(emojis: string[], count = 36) {
  if (typeof document === "undefined" || !emojis.length) return;
  const root = ensureHost();
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.textContent = emojis[i % emojis.length];
    const angle = Math.random() * Math.PI * 2;
    const distance = 140 + Math.random() * 260;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 80; // slight upward bias
    const rot = (Math.random() - 0.5) * 720;
    const size = 24 + Math.random() * 20;
    const delay = Math.random() * 120;
    span.style.cssText = `
      position:absolute;
      left:${cx}px;
      top:${cy}px;
      font-size:${size}px;
      line-height:1;
      transform:translate(-50%,-50%) scale(0.4);
      opacity:0;
      will-change:transform,opacity;
      --tx:${tx}px;
      --ty:${ty}px;
      --r:${rot}deg;
      animation:emoji-burst 1500ms cubic-bezier(0.18,0.7,0.3,1) ${delay}ms forwards;
      user-select:none;
    `;
    span.addEventListener("animationend", () => span.remove(), { once: true });
    root.appendChild(span);
  }
}

export const CONFETTI_FLAGS = {
  task: "hv_fre_confetti_task_done",
  paid: "hv_fre_confetti_paid_done",
} as const;
