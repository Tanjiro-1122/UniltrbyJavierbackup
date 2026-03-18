import React, { useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// Canvas-based live background effects — realistic & smooth
// ═══════════════════════════════════════════════════════════

function CanvasEffect({ draw, init }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    stateRef.current = init(canvas.offsetWidth, canvas.offsetHeight);

    let lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      draw(ctx, stateRef.current, dt, canvas.offsetWidth, canvas.offsetHeight);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [draw, init]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 1,
      }}
    />
  );
}

// ── SNOWFALL ─────────────────────────────────────────────
function Snowfall() {
  const init = useCallback((w, h) => {
    return Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 2.5,
      speedY: 8 + Math.random() * 25,
      speedX: -8 + Math.random() * 16,
      wobbleAmp: 0.3 + Math.random() * 0.8,
      wobbleFreq: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.25 + Math.random() * 0.65,
    }));
  }, []);

  const draw = useCallback((ctx, flakes, dt, w, h) => {
    for (const f of flakes) {
      f.phase += dt * f.wobbleFreq;
      f.y += f.speedY * dt;
      f.x += (f.speedX + Math.sin(f.phase) * f.wobbleAmp * 15) * dt;

      if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
      if (f.x < -10) f.x = w + 10;
      if (f.x > w + 10) f.x = -10;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
      ctx.fill();

      // Soft glow for larger flakes
      if (f.r > 1.8) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.opacity * 0.1})`;
        ctx.fill();
      }
    }
  }, []);

  return <CanvasEffect init={init} draw={draw} />;
}

// ── SWIMMING FISH ────────────────────────────────────────
function SwimmingFish() {
  const init = useCallback((w, h) => {
    const fish = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * w,
      y: h * 0.15 + Math.random() * h * 0.6,
      speed: 15 + Math.random() * 30,
      dir: Math.random() > 0.5 ? 1 : -1,
      size: 6 + Math.random() * 10,
      wobbleAmp: 3 + Math.random() * 8,
      wobbleFreq: 1.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      tailPhase: Math.random() * Math.PI * 2,
      hue: [190, 200, 40, 30, 170, 310, 55, 210][i],
      opacity: 0.35 + Math.random() * 0.4,
    }));
    const bubbles = Array.from({ length: 20 }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * h,
      r: 1 + Math.random() * 3,
      speed: 12 + Math.random() * 22,
      wobble: Math.random() * Math.PI * 2,
      opacity: 0.08 + Math.random() * 0.18,
    }));
    return { fish, bubbles };
  }, []);

  const draw = useCallback((ctx, state, dt, w, h) => {
    // Bubbles
    for (const b of state.bubbles) {
      b.y -= b.speed * dt;
      b.wobble += dt * 1.5;
      const bx = b.x + Math.sin(b.wobble) * 4;
      if (b.y < -10) { b.y = h + 10; b.x = Math.random() * w; }

      ctx.beginPath();
      ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,230,255,${b.opacity})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Highlight
      ctx.beginPath();
      ctx.arc(bx - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.6})`;
      ctx.fill();
    }

    // Fish
    for (const f of state.fish) {
      f.phase += dt * f.wobbleFreq;
      f.tailPhase += dt * 8;
      f.x += f.speed * f.dir * dt;
      const fy = f.y + Math.sin(f.phase) * f.wobbleAmp;

      // Wrap around
      if (f.dir > 0 && f.x > w + 40) { f.x = -40; f.y = h * 0.15 + Math.random() * h * 0.6; }
      if (f.dir < 0 && f.x < -40) { f.x = w + 40; f.y = h * 0.15 + Math.random() * h * 0.6; }

      ctx.save();
      ctx.translate(f.x, fy);
      ctx.scale(f.dir, 1);

      const s = f.size;
      const tailSwing = Math.sin(f.tailPhase) * s * 0.3;

      // Body
      ctx.beginPath();
      ctx.moveTo(s * 1.2, 0);
      ctx.quadraticCurveTo(s * 0.6, -s * 0.55, -s * 0.3, -s * 0.15);
      ctx.quadraticCurveTo(-s * 0.6, 0, -s * 0.3, s * 0.15);
      ctx.quadraticCurveTo(s * 0.6, s * 0.55, s * 1.2, 0);
      ctx.closePath();
      ctx.fillStyle = `hsla(${f.hue}, 70%, 60%, ${f.opacity})`;
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, 0);
      ctx.lineTo(-s * 0.9, -s * 0.35 + tailSwing);
      ctx.lineTo(-s * 0.9, s * 0.35 + tailSwing);
      ctx.closePath();
      ctx.fillStyle = `hsla(${f.hue}, 60%, 50%, ${f.opacity * 0.8})`;
      ctx.fill();

      // Eye
      ctx.beginPath();
      ctx.arc(s * 0.7, -s * 0.08, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${f.opacity * 0.8})`;
      ctx.fill();

      ctx.restore();
    }

    // Subtle light rays from top
    const time = performance.now() / 2000;
    for (let i = 0; i < 3; i++) {
      const rx = w * (0.2 + i * 0.3) + Math.sin(time + i) * 30;
      const grad = ctx.createLinearGradient(rx, 0, rx + 40, h * 0.7);
      grad.addColorStop(0, "rgba(120,200,255,0.04)");
      grad.addColorStop(1, "rgba(120,200,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx - 15, 0);
      ctx.lineTo(rx + 55, 0);
      ctx.lineTo(rx + 80, h * 0.7);
      ctx.lineTo(rx - 40, h * 0.7);
      ctx.closePath();
      ctx.fill();
    }
  }, []);

  return <CanvasEffect init={init} draw={draw} />;
}

// ── FIRE CRACKLING ───────────────────────────────────────
function FireEffect() {
  const init = useCallback((w, h) => {
    const embers = Array.from({ length: 35 }, () => ({
      x: w * 0.25 + Math.random() * w * 0.5,
      y: h,
      life: 0,
      maxLife: 2 + Math.random() * 4,
      speedY: 20 + Math.random() * 50,
      speedX: -10 + Math.random() * 20,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 3,
      active: false,
    }));
    return { embers, time: 0, flickerPhase: 0 };
  }, []);

  const draw = useCallback((ctx, state, dt, w, h) => {
    state.time += dt;
    state.flickerPhase += dt * 6;

    // Warm ambient glow — flickers naturally
    const flicker1 = 0.08 + Math.sin(state.flickerPhase) * 0.02 + Math.sin(state.flickerPhase * 2.3) * 0.015;
    const flicker2 = 0.06 + Math.sin(state.flickerPhase * 1.7) * 0.02;
    
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.9, 0, w * 0.5, h * 0.9, h * 0.6);
    glow.addColorStop(0, `rgba(255,120,30,${flicker1})`);
    glow.addColorStop(0.4, `rgba(255,80,10,${flicker2})`);
    glow.addColorStop(1, "rgba(255,50,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Secondary warm tone
    const glow2 = ctx.createRadialGradient(w * 0.45, h * 0.95, 0, w * 0.45, h * 0.95, h * 0.35);
    glow2.addColorStop(0, `rgba(255,200,50,${flicker1 * 0.5})`);
    glow2.addColorStop(1, "rgba(255,150,30,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, w, h);

    // Embers rising
    for (const e of state.embers) {
      if (!e.active) {
        e.delay -= dt;
        if (e.delay <= 0) {
          e.active = true;
          e.life = 0;
          e.x = w * 0.2 + Math.random() * w * 0.6;
          e.y = h * 0.85 + Math.random() * h * 0.15;
        }
        continue;
      }

      e.life += dt;
      if (e.life > e.maxLife) {
        e.active = false;
        e.delay = Math.random() * 2;
        e.maxLife = 2 + Math.random() * 4;
        continue;
      }

      const progress = e.life / e.maxLife;
      e.y -= e.speedY * dt;
      e.x += (e.speedX + Math.sin(e.life * 3) * 8) * dt;

      const alpha = progress < 0.15
        ? progress / 0.15
        : progress > 0.7
          ? 1 - (progress - 0.7) / 0.3
          : 1;

      // Color shifts from bright yellow → orange → red as it rises
      const r = 255;
      const g = Math.floor(200 - progress * 150);
      const b = Math.floor(50 - progress * 50);

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.7})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.08})`;
      ctx.fill();
    }
  }, []);

  return <CanvasEffect init={init} draw={draw} />;
}

// ── OCEAN WAVES ──────────────────────────────────────────
function OceanWaves() {
  const init = useCallback((w, h) => {
    const sparkles = Array.from({ length: 20 }, () => ({
      x: Math.random() * w,
      y: h * 0.2 + Math.random() * h * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 2,
      size: 0.5 + Math.random() * 1.5,
    }));
    return { time: 0, sparkles };
  }, []);

  const draw = useCallback((ctx, state, dt, w, h) => {
    state.time += dt;
    const t = state.time;

    // Light rays from sun
    const sunX = w * 0.7;
    const rayAlpha = 0.03 + Math.sin(t * 0.5) * 0.01;
    for (let i = 0; i < 5; i++) {
      const angle = -0.3 + i * 0.15 + Math.sin(t * 0.3 + i) * 0.05;
      ctx.save();
      ctx.translate(sunX, 0);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.8);
      grad.addColorStop(0, `rgba(255,220,150,${rayAlpha})`);
      grad.addColorStop(1, "rgba(255,220,150,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(-20, 0, 40, h * 0.8);
      ctx.restore();
    }

    // Gentle wave reflections
    for (let i = 0; i < 4; i++) {
      const waveY = h * (0.55 + i * 0.1);
      const amplitude = 3 + i * 1.5;
      const freq = 0.008 - i * 0.001;
      const alpha = 0.04 - i * 0.008;

      ctx.beginPath();
      ctx.moveTo(0, waveY);
      for (let x = 0; x <= w; x += 3) {
        const y = waveY + Math.sin(x * freq + t * (0.8 + i * 0.2)) * amplitude
                        + Math.sin(x * freq * 2.3 + t * 1.1) * amplitude * 0.3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = `rgba(56,189,248,${alpha})`;
      ctx.fill();
    }

    // Water sparkles
    for (const s of state.sparkles) {
      s.phase += dt * s.speed;
      const alpha = Math.max(0, Math.sin(s.phase)) * 0.5;
      if (alpha > 0.05) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
    }
  }, []);

  return <CanvasEffect init={init} draw={draw} />;
}

// ── Background ID → Effect ──
const EFFECT_MAP = {
  "cabin": Snowfall,
  "winter-cabin-real": Snowfall,
  "ocean": SwimmingFish,
  "deep-ocean-real": SwimmingFish,
  "living_room": FireEffect,
  "cozy-living-room-real": FireEffect,
  "beach": OceanWaves,
  "sunset-beach-real": OceanWaves,
};

export default function LiveBackgroundEffects({ backgroundId }) {
  const EffectComponent = EFFECT_MAP[backgroundId];
  if (!EffectComponent) return null;
  return <EffectComponent />;
}