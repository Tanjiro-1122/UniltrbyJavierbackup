import React from "react";

const PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  key: i,
  size: Math.random() * 3 + 0.5,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.5 + 0.1,
  duration: Math.random() * 6 + 3,
  delay: Math.random() * 5,
  drift: Math.random() * 20 - 10,
  isOrb: i < 5,
}));

export default function FloatingParticles() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: var(--p-opacity); }
          90% { opacity: var(--p-opacity); }
          100% { transform: translateY(-100px) translateX(var(--p-drift)); opacity: 0; }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.3); opacity: 0.25; }
        }
      `}</style>

      {PARTICLES.map(p => (
        p.isOrb ? (
          <div key={p.key} style={{
            position: "absolute",
            width: 60 + p.size * 30,
            height: 60 + p.size * 30,
            borderRadius: "50%",
            top: p.top + "%",
            left: p.left + "%",
            background: `radial-gradient(circle, ${p.key % 2 === 0 ? "rgba(139,92,246,0.3)" : "rgba(219,39,119,0.2)"} 0%, transparent 70%)`,
            animation: `orb-pulse ${p.duration}s ease-in-out infinite`,
            animationDelay: p.delay + "s",
          }} />
        ) : (
          <div key={p.key} style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.key % 3 === 0 ? "#c084fc" : "white",
            top: p.top + "%",
            left: p.left + "%",
            "--p-opacity": p.opacity,
            "--p-drift": p.drift + "px",
            animation: `float-up ${p.duration}s ease-in-out infinite`,
            animationDelay: p.delay + "s",
          }} />
        )
      ))}

      {/* Top glow */}
      <div style={{
        position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.05) 40%, transparent 70%)",
      }} />

      {/* Bottom accent glow */}
      <div style={{
        position: "absolute", bottom: -100, left: "50%", transform: "translateX(-50%)",
        width: 400, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(219,39,119,0.1) 0%, transparent 70%)",
      }} />
    </div>
  );
}