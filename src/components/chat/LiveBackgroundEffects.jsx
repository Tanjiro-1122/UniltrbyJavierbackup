import React, { useEffect, useRef, useMemo } from "react";

// ── Snowfall Effect ──
function Snowfall() {
  const flakes = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 6,
      drift: -20 + Math.random() * 40,
      opacity: 0.3 + Math.random() * 0.7,
    })), []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(-10px) translateX(0px); opacity: 0; }
          10% { opacity: var(--snow-opacity); }
          90% { opacity: var(--snow-opacity); }
          100% { transform: translateY(calc(100dvh + 10px)) translateX(var(--snow-drift)); opacity: 0; }
        }
      `}</style>
      {flakes.map(f => (
        <div key={f.id} style={{
          position: "absolute",
          left: `${f.left}%`,
          top: -10,
          width: f.size,
          height: f.size,
          borderRadius: "50%",
          background: "white",
          opacity: 0,
          "--snow-opacity": f.opacity,
          "--snow-drift": `${f.drift}px`,
          animation: `snowfall ${f.duration}s ${f.delay}s linear infinite`,
          filter: f.size > 4 ? "blur(1px)" : "none",
        }} />
      ))}
    </div>
  );
}

// ── Fish Swimming Effect ──
function SwimmingFish() {
  const fish = useMemo(() => {
    const fishEmojis = ["🐠", "🐟", "🐡", "🦈", "🐙", "🦑", "🪼"];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: fishEmojis[Math.floor(Math.random() * fishEmojis.length)],
      top: 15 + Math.random() * 70,
      size: 14 + Math.random() * 16,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 15,
      direction: Math.random() > 0.5 ? 1 : -1,
      wobble: 5 + Math.random() * 15,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      <style>{`
        @keyframes swimRight {
          0% { transform: translateX(-60px) translateY(0px) scaleX(1); opacity: 0; }
          5% { opacity: var(--fish-opacity); }
          50% { transform: translateX(50vw) translateY(var(--fish-wobble)) scaleX(1); }
          95% { opacity: var(--fish-opacity); }
          100% { transform: translateX(calc(100vw + 60px)) translateY(0px) scaleX(1); opacity: 0; }
        }
        @keyframes swimLeft {
          0% { transform: translateX(calc(100vw + 60px)) translateY(0px) scaleX(-1); opacity: 0; }
          5% { opacity: var(--fish-opacity); }
          50% { transform: translateX(50vw) translateY(var(--fish-wobble)) scaleX(-1); }
          95% { opacity: var(--fish-opacity); }
          100% { transform: translateX(-60px) translateY(0px) scaleX(-1); opacity: 0; }
        }
      `}</style>
      {fish.map(f => (
        <div key={f.id} style={{
          position: "absolute",
          top: `${f.top}%`,
          left: 0,
          fontSize: f.size,
          opacity: 0,
          "--fish-wobble": `${f.wobble}px`,
          "--fish-opacity": f.opacity,
          animation: `${f.direction > 0 ? "swimRight" : "swimLeft"} ${f.duration}s ${f.delay}s ease-in-out infinite`,
        }}>
          {f.emoji}
        </div>
      ))}
      {/* Bubble particles */}
      {Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        size: 3 + Math.random() * 6,
        duration: 5 + Math.random() * 8,
        delay: Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.25,
      })).map(b => (
        <div key={`b${b.id}`} style={{
          position: "absolute",
          left: `${b.left}%`,
          bottom: -10,
          width: b.size,
          height: b.size,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.05)",
          opacity: 0,
          animation: `bubbleRise ${b.duration}s ${b.delay}s ease-out infinite`,
        }} />
      ))}
      <style>{`
        @keyframes bubbleRise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: var(--fish-opacity, 0.2); }
          80% { opacity: 0.15; }
          100% { transform: translateY(calc(-100dvh - 20px)) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Fireplace / Fire Crackling Effect ──
function FireEffect() {
  const embers = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: 20 + Math.random() * 60,
      size: 2 + Math.random() * 4,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      drift: -30 + Math.random() * 60,
      color: Math.random() > 0.5 ? "#ff6b35" : Math.random() > 0.5 ? "#ffd700" : "#ff4500",
      opacity: 0.4 + Math.random() * 0.6,
    })), []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {/* Warm ambient glow at the bottom */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "10%",
        right: "10%",
        height: "40%",
        background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,53,0.15) 0%, rgba(255,69,0,0.06) 40%, transparent 70%)",
        animation: "fireGlow 2s ease-in-out infinite alternate",
      }} />
      <style>{`
        @keyframes fireGlow {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes emberRise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          15% { opacity: var(--ember-opacity); }
          70% { opacity: var(--ember-opacity); }
          100% { transform: translateY(calc(-45dvh)) translateX(var(--ember-drift)) scale(0); opacity: 0; }
        }
        @keyframes flickerPulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.2; }
        }
      `}</style>
      {/* Flickering warm overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, transparent 40%, rgba(255,107,53,0.08) 100%)",
        animation: "flickerPulse 1.5s ease-in-out infinite",
      }} />
      {/* Rising embers */}
      {embers.map(e => (
        <div key={e.id} style={{
          position: "absolute",
          left: `${e.left}%`,
          bottom: "5%",
          width: e.size,
          height: e.size,
          borderRadius: "50%",
          background: e.color,
          boxShadow: `0 0 ${e.size * 2}px ${e.color}`,
          opacity: 0,
          "--ember-opacity": e.opacity,
          "--ember-drift": `${e.drift}px`,
          animation: `emberRise ${e.duration}s ${e.delay}s ease-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Ocean Waves Effect ──
function OceanWaves() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      <style>{`
        @keyframes waveMove1 {
          0% { transform: translateX(-25%) translateY(0); }
          50% { transform: translateX(0%) translateY(-3px); }
          100% { transform: translateX(-25%) translateY(0); }
        }
        @keyframes waveMove2 {
          0% { transform: translateX(0%) translateY(0); }
          50% { transform: translateX(-25%) translateY(3px); }
          100% { transform: translateX(0%) translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.15; }
        }
      `}</style>
      {/* Wave layers */}
      <div style={{
        position: "absolute",
        bottom: "8%",
        left: "-25%",
        width: "200%",
        height: 60,
        background: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.08) 25%, rgba(56,189,248,0.12) 50%, rgba(56,189,248,0.08) 75%, transparent 100%)",
        borderRadius: "50%",
        animation: "waveMove1 6s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        bottom: "12%",
        left: 0,
        width: "200%",
        height: 40,
        background: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.06) 25%, rgba(56,189,248,0.10) 50%, rgba(56,189,248,0.06) 75%, transparent 100%)",
        borderRadius: "50%",
        animation: "waveMove2 8s ease-in-out infinite",
      }} />
      {/* Light shimmer */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: `${20 + Math.random() * 50}%`,
          left: `${Math.random() * 100}%`,
          width: 2 + Math.random() * 3,
          height: 2 + Math.random() * 3,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.4)",
          animation: `shimmer ${2 + Math.random() * 3}s ${Math.random() * 4}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Background ID to Effect mapping ──
const EFFECT_MAP = {
  // Snow
  "cabin": Snowfall,
  "winter-cabin-real": Snowfall,
  // Fish / Ocean
  "ocean": SwimmingFish,
  "deep-ocean-real": SwimmingFish,
  // Fire
  "living_room": FireEffect,
  "cozy-living-room-real": FireEffect,
  // Ocean waves
  "beach": OceanWaves,
  "sunset-beach-real": OceanWaves,
};

export default function LiveBackgroundEffects({ backgroundId }) {
  const EffectComponent = EFFECT_MAP[backgroundId];
  if (!EffectComponent) return null;
  return <EffectComponent />;
}