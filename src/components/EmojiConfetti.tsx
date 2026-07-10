// Lightweight emoji confetti burst with real gravity physics.
// Per-frame integration (vy += g * dt) gives smooth, continuous acceleration
// downward — no keyframe seams.
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

type Particle = {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  scale: number;
  born: number;
  life: number; // ms before forced removal
  delay: number;
  started: boolean;
};

const GRAVITY = 1400; // px/s^2
let rafId: number | null = null;
const particles: Particle[] = [];

function tick(now: number) {
  let prev = (tick as any)._prev as number | undefined;
  if (prev === undefined) prev = now;
  const dt = Math.min(0.05, (now - prev) / 1000); // clamp big gaps
  (tick as any)._prev = now;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const age = now - p.born;
    if (age < p.delay) continue;

    if (!p.started) {
      p.started = true;
      p.el.style.opacity = "1";
    }

    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;

    // Pop-in scale during first 140ms after start
    const sinceStart = age - p.delay;
    const popT = Math.min(1, sinceStart / 140);
    const popScale = 0.4 + (p.scale - 0.4) * (popT < 1 ? 1 - Math.pow(1 - popT, 3) : 1);

    // Fade out in the last 250ms of life
    const remaining = p.life - sinceStart;
    const opacity = remaining < 250 ? Math.max(0, remaining / 250) : 1;

    p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rot}deg) scale(${popScale})`;
    p.el.style.opacity = String(opacity);

    if (sinceStart >= p.life || p.y > window.innerHeight + 200) {
      p.el.remove();
      particles.splice(i, 1);
    }
  }

  if (particles.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = null;
    (tick as any)._prev = undefined;
  }
}

export function fireConfetti(emojis: string[], count = 36) {
  if (typeof document === "undefined" || !emojis.length) return;
  const root = ensureHost();
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const now = performance.now();

  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.textContent = emojis[i % emojis.length];
    // Upper hemisphere launch: -150° to -30°
    const angle = (-150 + Math.random() * 120) * (Math.PI / 180);
    const speed = 420 + Math.random() * 360; // px/s
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed; // negative = up
    const size = 24 + Math.random() * 20;
    const scale = 0.9 + Math.random() * 0.3;
    const vr = (Math.random() - 0.5) * 720; // deg/s
    const delay = Math.random() * 140;

    span.style.cssText = `
      position:absolute;
      left:0;
      top:0;
      font-size:${size}px;
      line-height:1;
      transform:translate3d(${cx}px,${cy}px,0) scale(0.4);
      opacity:0;
      will-change:transform,opacity;
      user-select:none;
    `;
    root.appendChild(span);

    particles.push({
      el: span,
      x: cx,
      y: cy,
      vx,
      vy,
      rot: 0,
      vr,
      scale,
      born: now,
      life: 2200 + Math.random() * 600,
      delay,
      started: false,
    });
  }

  if (rafId === null) {
    (tick as any)._prev = undefined;
    rafId = requestAnimationFrame(tick);
  }
}

export const CONFETTI_FLAGS = {
  task: "hv_fre_confetti_task_done",
  paid: "hv_fre_confetti_paid_done",
} as const;
