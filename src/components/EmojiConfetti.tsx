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
    // Launch angle biased upward: -150° to -30° (upper hemisphere)
    const angle = (-150 + Math.random() * 120) * (Math.PI / 180);
    const speed = 180 + Math.random() * 220;
    const tx = Math.cos(angle) * speed; // horizontal drift
    const apex = Math.sin(angle) * speed - 60; // peak height (negative = up)
    const fall = window.innerHeight - cy + 240; // off-screen bottom
    const rot = (Math.random() - 0.5) * 720;
    const size = 24 + Math.random() * 20;
    const delay = Math.random() * 120;
    const duration = 1800 + Math.random() * 600;
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
      --apex:${apex}px;
      --fall:${fall}px;
      --r:${rot}deg;
      animation:emoji-burst ${duration}ms linear ${delay}ms forwards;
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
