import { useEffect, useRef } from "react";

export default function BackgroundEffect({ environmentId }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    cancelAnimationFrame(animRef.current);

    if (environmentId === "ocean" || environmentId === "deep-ocean-real") {
      const jellyfish = Array.from({ length: 8 }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 18 + Math.random() * 22,
        speed: 0.25 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        hue: 180 + Math.random() * 80,
        tentacles: Array.from({ length: 8 }, () => ({
          angle: Math.random() * Math.PI * 2,
          len: 20 + Math.random() * 30,
          wave: Math.random() * Math.PI * 2,
        })),
      }));

      const bubbles = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        r: 1 + Math.random() * 3,
        speed: 0.4 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 0.3,
        alpha: 0.2 + Math.random() * 0.4,
      }));

      let t = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.012;

        bubbles.forEach(b => {
          b.y -= b.speed;
          b.x += b.drift;
          if (b.y < -10) { b.y = canvas.height + 10; b.x = Math.random() * canvas.width; }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(150,220,255,${b.alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        });

        jellyfish.forEach(j => {
          j.y -= j.speed;
          j.x += j.drift + Math.sin(t + j.phase) * 0.5;
          if (j.y < -j.r * 4) { j.y = canvas.height + j.r * 2; j.x = Math.random() * canvas.width; }

          const pulse = Math.sin(t * 1.5 + j.phase) * 0.15 + 0.85;
          const cr = j.r * pulse;

          const glow = ctx.createRadialGradient(j.x, j.y, 0, j.x, j.y, cr * 3);
          glow.addColorStop(0, `hsla(${j.hue},100%,70%,0.25)`);
          glow.addColorStop(1, `hsla(${j.hue},100%,70%,0)`);
          ctx.beginPath();
          ctx.arc(j.x, j.y, cr * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          const bell = ctx.createRadialGradient(j.x, j.y - cr * 0.3, cr * 0.1, j.x, j.y, cr);
          bell.addColorStop(0, `hsla(${j.hue},100%,90%,0.9)`);
          bell.addColorStop(0.5, `hsla(${j.hue},100%,65%,0.6)`);
          bell.addColorStop(1, `hsla(${j.hue},100%,50%,0.1)`);
          ctx.beginPath();
          ctx.ellipse(j.x, j.y, cr, cr * 0.65, 0, Math.PI, 0);
          ctx.fillStyle = bell;
          ctx.fill();

          j.tentacles.forEach((ten, ti) => {
            const tx = j.x + Math.sin(ten.angle) * cr * 0.7;
            const ty = j.y + Math.cos(ten.angle) * cr * 0.3;
            const wave = Math.sin(t * 2 + ten.wave + ti) * 8;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.bezierCurveTo(
              tx + wave, ty + ten.len * 0.4,
              tx - wave, ty + ten.len * 0.7,
              tx + wave * 0.5, ty + ten.len
            );
            ctx.strokeStyle = `hsla(${j.hue},100%,75%,0.35)`;
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "cabin" || environmentId === "winter-cabin-real") {
      const flakes = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.8 + Math.random() * 2.5,
        speed: 0.5 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.4 + Math.random() * 0.6,
        wobble: Math.random() * 0.02 + 0.005,
      }));

      let t = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.01;

        flakes.forEach(f => {
          f.y += f.speed;
          f.x += f.drift + Math.sin(t + f.phase) * f.wobble * 20;
          if (f.y > canvas.height + 5) { f.y = -5; f.x = Math.random() * canvas.width; }

          if (f.r > 1.8) {
            const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3);
            glow.addColorStop(0, `rgba(220,240,255,${f.alpha * 0.4})`);
            glow.addColorStop(1, `rgba(220,240,255,0)`);
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,240,255,${f.alpha})`;
          ctx.fill();
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "space" || environmentId === "outer-space-real") {
      const stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.03,
        color: ["255,255,255", "200,180,255", "180,220,255", "255,240,200"][Math.floor(Math.random() * 4)],
      }));

      const shooters = Array.from({ length: 3 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        len: 80 + Math.random() * 120,
        speed: 6 + Math.random() * 6,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        alpha: 0,
        active: false,
        timer: Math.random() * 200,
      }));

      let t = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.02;

        stars.forEach(s => {
          const alpha = 0.4 + Math.sin(t * s.speed * 10 + s.phase) * 0.5;
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          glow.addColorStop(0, `rgba(${s.color},${alpha})`);
          glow.addColorStop(1, `rgba(${s.color},0)`);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.color},${Math.min(1, alpha + 0.3)})`;
          ctx.fill();
        });

        shooters.forEach(s => {
          s.timer--;
          if (s.timer <= 0 && !s.active) {
            s.active = true;
            s.x = Math.random() * canvas.width;
            s.y = Math.random() * canvas.height * 0.4;
            s.alpha = 1;
            s.timer = 300 + Math.random() * 400;
          }
          if (s.active) {
            s.x += Math.cos(s.angle) * s.speed;
            s.y += Math.sin(s.angle) * s.speed;
            s.alpha -= 0.025;
            if (s.alpha <= 0) { s.active = false; }
            const grad = ctx.createLinearGradient(
              s.x, s.y,
              s.x - Math.cos(s.angle) * s.len,
              s.y - Math.sin(s.angle) * s.len
            );
            grad.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
            grad.addColorStop(1, `rgba(255,255,255,0)`);
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "cafe" || environmentId === "rainy-cafe-real") {
      const drops = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: 15 + Math.random() * 25,
        speed: 6 + Math.random() * 8,
        alpha: 0.15 + Math.random() * 0.25,
        width: 0.5 + Math.random() * 1,
      }));

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drops.forEach(d => {
          d.y += d.speed;
          if (d.y > canvas.height + d.len) { d.y = -d.len; d.x = Math.random() * canvas.width; }

          const grad = ctx.createLinearGradient(d.x, d.y, d.x - 2, d.y + d.len);
          grad.addColorStop(0, `rgba(180,220,255,0)`);
          grad.addColorStop(0.4, `rgba(180,220,255,${d.alpha})`);
          grad.addColorStop(1, `rgba(180,220,255,0)`);
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 2, d.y + d.len);
          ctx.strokeStyle = grad;
          ctx.lineWidth = d.width;
          ctx.stroke();
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "forest" || environmentId === "enchanted-forest-real") {
      const fireflies = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.4,
        hue: 80 + Math.random() * 60,
        blinkSpeed: 0.02 + Math.random() * 0.04,
      }));

      const spores = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        r: 1.5 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.4,
        alpha: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));

      let t = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.015;

        spores.forEach(s => {
          s.y -= s.speed;
          s.x += s.drift + Math.sin(t + s.phase) * 0.3;
          if (s.y < -10) { s.y = canvas.height + 10; s.x = Math.random() * canvas.width; }
          const alpha = s.alpha * (0.5 + Math.sin(t * 2 + s.phase) * 0.5);
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
          glow.addColorStop(0, `rgba(180,255,120,${alpha})`);
          glow.addColorStop(1, `rgba(180,255,120,0)`);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,255,150,${alpha})`;
          ctx.fill();
        });

        fireflies.forEach(f => {
          f.x += f.speedX;
          f.y += f.speedY;
          if (f.x < 0 || f.x > canvas.width) f.speedX *= -1;
          if (f.y < 0 || f.y > canvas.height) f.speedY *= -1;
          const blink = Math.sin(t * 30 * f.blinkSpeed + f.phase);
          const alpha = blink > 0 ? blink * 0.9 : 0;
          if (alpha > 0.05) {
            const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 5);
            glow.addColorStop(0, `hsla(${f.hue},100%,80%,${alpha * 0.6})`);
            glow.addColorStop(1, `hsla(${f.hue},100%,60%,0)`);
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * 5, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${f.hue},100%,90%,${alpha})`;
            ctx.fill();
          }
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "beach" || environmentId === "sunset-beach-real") {
      const sparkles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.55 + Math.random() * canvas.height * 0.45,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
        size: 1 + Math.random() * 2,
      }));

      let t = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.01;

        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          const baseY = canvas.height * (0.6 + w * 0.12);
          for (let x = 0; x <= canvas.width; x += 4) {
            const y = baseY + Math.sin(x * 0.015 + t * 1.5 + w * 1.2) * 6
                              + Math.sin(x * 0.025 + t * 0.8 + w) * 3;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(255,200,120,${0.12 - w * 0.03})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        sparkles.forEach(s => {
          const alpha = Math.max(0, Math.sin(t * s.speed * 100 + s.phase));
          if (alpha > 0.1) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,220,150,${alpha * 0.7})`;
            ctx.fill();
          }
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "cyberpunk" || environmentId === "cyberpunk-city-real") {
      const neonDrops = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: 20 + Math.random() * 40,
        speed: 4 + Math.random() * 6,
        hue: [300, 180, 60, 120][Math.floor(Math.random() * 4)],
        alpha: 0.2 + Math.random() * 0.4,
      }));

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        neonDrops.forEach(d => {
          d.y += d.speed;
          if (d.y > canvas.height + d.len) { d.y = -d.len; d.x = Math.random() * canvas.width; }
          const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.len);
          grad.addColorStop(0, `hsla(${d.hue},100%,65%,0)`);
          grad.addColorStop(0.5, `hsla(${d.hue},100%,65%,${d.alpha})`);
          grad.addColorStop(1, `hsla(${d.hue},100%,65%,0)`);
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x, d.y + d.len);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "rooftop" || environmentId === "tokyo-rooftop-real") {
      const petals = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 3 + Math.random() * 5,
        speedY: 0.5 + Math.random() * 1,
        speedX: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.5 + Math.random() * 0.5,
        hue: 330 + Math.random() * 20,
      }));

      let t = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.01;

        petals.forEach(p => {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(t + p.phase) * 0.5;
          p.rotation += p.rotSpeed;
          if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},80%,80%,${p.alpha})`;
          ctx.fill();
          ctx.restore();
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();

    } else if (environmentId === "park" || environmentId === "sunny-park-real") {
      const butterflies = Array.from({ length: 8 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        hue: 30 + Math.random() * 200,
        size: 6 + Math.random() * 6,
        wingPhase: Math.random() * Math.PI * 2,
      }));

      let t = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.015;

        butterflies.forEach(b => {
          b.x += Math.cos(t * b.speed + b.phase) * 1.2;
          b.y += Math.sin(t * b.speed * 0.7 + b.phase) * 0.8;
          if (b.x < 0) b.x = canvas.width;
          if (b.x > canvas.width) b.x = 0;
          if (b.y < 0) b.y = canvas.height * 0.7;
          if (b.y > canvas.height * 0.7) b.y = 0;

          const wingFlap = Math.sin(t * 8 + b.wingPhase);
          const wx = b.size * Math.abs(wingFlap);

          ctx.beginPath();
          ctx.ellipse(b.x - wx * 0.5, b.y, wx, b.size * 0.7, -0.3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${b.hue},90%,65%,0.7)`;
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(b.x + wx * 0.5, b.y, wx, b.size * 0.7, 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${b.hue + 20},90%,65%,0.7)`;
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, 1.5, b.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${b.hue},60%,30%,0.9)`;
          ctx.fill();
        });

        animRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [environmentId]);

  const supported = ["ocean","deep-ocean-real","cabin","winter-cabin-real","space","outer-space-real","cafe","rainy-cafe-real","forest","enchanted-forest-real","beach","sunset-beach-real","cyberpunk","cyberpunk-city-real","rooftop","tokyo-rooftop-real","park","sunny-park-real"];
  if (!supported.includes(environmentId)) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}