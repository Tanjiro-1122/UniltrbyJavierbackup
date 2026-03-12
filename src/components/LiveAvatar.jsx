import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useAnimationControls } from "framer-motion";

const PORTRAITS = {
  luna:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/1bdb796b8_generated_image.png",
  kai:    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/65d497e31_generated_image.png",
  nova:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/c144c6bc7_generated_image.png",
  ash:    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/6754cc067_generated_image.png",
  sakura: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/c4299d871_generated_image.png",
  ryuu:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/d2dc8464e_generated_image.png",
  zara:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/819a7a550_generated_image.png",
  sage:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/5ad741241_generated_image.png",
};

const FULL_BODY = {
  luna:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/231bb2202_generated_image.png",
  kai:    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/17a0d2e29_generated_image.png",
  nova:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/e70157dd1_generated_image.png",
  ash:    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9723bfa90_generated_image.png",
  sakura: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/2c171ca02_generated_image.png",
  ryuu:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/940208747_generated_image.png",
  zara:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/e15438d64_generated_image.png",
  sage:   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/58a7f7877_generated_image.png",
};

// Per-companion mouth position — face is in top ~22% of full-body image (viewBox 0 0 100 100)
const MOUTH_CONFIG = {
  luna:   { cx: 50, cy: 19, rx: 3.5, ry: 1.5 },
  kai:    { cx: 50, cy: 19, rx: 3,   ry: 1.5 },
  nova:   { cx: 50, cy: 19, rx: 3.5, ry: 1.5 },
  ash:    { cx: 50, cy: 19, rx: 3,   ry: 1.5 },
  sakura: { cx: 50, cy: 19, rx: 3.5, ry: 1.5 },
  ryuu:   { cx: 50, cy: 18, rx: 3,   ry: 1.5 },
  zara:   { cx: 50, cy: 19, rx: 3.5, ry: 1.5 },
  sage:   { cx: 50, cy: 19, rx: 3,   ry: 1.5 },
};

// Per-companion eye positions for blink overlay — full body
const EYE_CONFIG = {
  luna:   [{ cx: 44, cy: 14 }, { cx: 56, cy: 14 }],
  kai:    [{ cx: 44, cy: 14 }, { cx: 56, cy: 14 }],
  nova:   [{ cx: 43, cy: 14 }, { cx: 57, cy: 14 }],
  ash:    [{ cx: 44, cy: 14 }, { cx: 56, cy: 14 }],
  sakura: [{ cx: 44, cy: 14 }, { cx: 56, cy: 14 }],
  ryuu:   [{ cx: 43, cy: 13 }, { cx: 57, cy: 13 }],
  zara:   [{ cx: 44, cy: 14 }, { cx: 56, cy: 14 }],
  sage:   [{ cx: 44, cy: 14 }, { cx: 56, cy: 14 }],
};

export default function LiveAvatar({ companionId, state, audioRef, isSpeaking, onClick }) {
  const controls = useAnimationControls();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [mouthOpen, setMouthOpen] = useState(0); // 0-1 amplitude
  const [blinking, setBlinking] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const portrait = FULL_BODY[companionId] || FULL_BODY.luna;
  const mouth = MOUTH_CONFIG[companionId] || MOUTH_CONFIG.luna;
  const eyes = EYE_CONFIG[companionId] || EYE_CONFIG.luna;

  // Random blinking
  useEffect(() => {
    let timeout;
    const scheduleBlink = () => {
      timeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 160);
      }, 2000 + Math.random() * 2000);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Web Audio analyser for real lip-sync
  useEffect(() => {
    if (!isSpeaking || !audioRef?.current) {
      setMouthOpen(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let ctx, source;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    } catch {
      // Fallback: simulate mouth movement
      let t = 0;
      const simulate = () => {
        t += 0.15;
        setMouthOpen(Math.abs(Math.sin(t)) * 0.8);
        animFrameRef.current = requestAnimationFrame(simulate);
      };
      simulate();
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    const tick = () => {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avg = dataArrayRef.current.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      setMouthOpen(Math.min(1, avg / 120));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      try { ctx.close(); } catch {}
    };
  }, [isSpeaking, audioRef]);

  // Body animation states
  useEffect(() => {
    if (state === "idle") {
      controls.start({
        rotate: [0, 0.8, 0, -0.8, 0],
        scale: [1, 1.005, 1, 1.005, 1],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      });
    } else if (state === "wave") {
      controls.start({
        rotate: [0, -6, 6, -4, 2, 0],
        transition: { duration: 1.2, ease: "easeInOut" },
      });
    } else if (state === "jump") {
      controls.start({
        scale: [1, 1.08, 1.04, 1.01, 1],
        rotate: [0, -2, 2, -1, 0],
        transition: { duration: 0.65, ease: "easeOut" },
      });
    } else if (state === "talk") {
      controls.start({
        rotate: [0, 1, 0, -1, 0],
        transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
      });
    }
  }, [state]);

  const avatarW = 200;
  const avatarH = 340;

  return (
    <motion.div
      animate={controls}
      onClick={onClick}
      style={{ cursor: "pointer", transformOrigin: "bottom center", position: "relative", width: avatarW, height: avatarH }}
    >
      {/* Glow when speaking */}
      {isSpeaking && (
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            position: "absolute", inset: -16, borderRadius: 32,
            background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Full-body image */}
      <img
        src={portrait}
        alt={companionId}
        onLoad={() => setImgLoaded(true)}
        style={{
          width: avatarW, height: avatarH,
          borderRadius: 24,
          objectFit: "cover",
          objectPosition: "top center",
          display: "block",
          userSelect: "none",
          filter: `drop-shadow(0 12px 32px rgba(0,0,0,0.6)) ${isSpeaking ? "brightness(1.08)" : "brightness(1)"}`,
          transition: "filter 0.2s",
        }}
        draggable={false}
      />

      {/* SVG overlay for mouth + blink */}
      {imgLoaded && (
        <svg
          viewBox="0 0 100 100"
          style={{ position: "absolute", top: 0, left: 0, width: avatarW, height: avatarH, pointerEvents: "none" }}
        >
          {/* Mouth overlay */}
          <ellipse
            cx={mouth.cx}
            cy={mouth.cy}
            rx={mouth.rx}
            ry={mouth.ry + mouthOpen * 5}
            fill={mouthOpen > 0.1 ? "rgba(40,10,60,0.7)" : "none"}
            style={{ transition: "all 0.05s" }}
          />
          {/* Teeth hint when mouth open */}
          {mouthOpen > 0.2 && (
            <ellipse
              cx={mouth.cx}
              cy={mouth.cy - mouth.ry * 0.3}
              rx={mouth.rx * 0.75}
              ry={mouth.ry * 0.5}
              fill="rgba(255,255,255,0.85)"
            />
          )}
          {/* Blink overlays — closed eyelid shape */}
          {blinking && eyes.map((eye, i) => (
            <g key={i}>
              {/* Skin-colored lid that covers the eye */}
              <ellipse cx={eye.cx} cy={eye.cy} rx={9} ry={5.5} fill="rgba(210,170,130,0.98)" />
              {/* Dark lash line on top */}
              <ellipse cx={eye.cx} cy={eye.cy - 1.5} rx={8.5} ry={2} fill="rgba(40,20,10,0.6)" />
            </g>
          ))}
        </svg>
      )}
    </motion.div>
  );
}