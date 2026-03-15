import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

const VIBES = [
  {
    id: "chill",
    emoji: "😌",
    label: "Chill",
    desc: "Just hanging out. No agenda, no pressure.",
    gradientFrom: "#0d4f4f",
    gradientTo: "#0a3a3a",
    borderColor: "rgba(45,212,191,0.35)",
    activeBorder: "rgba(45,212,191,0.85)",
    labelColor: "#2dd4bf",
    glow: "rgba(45,212,191,0.25)",
  },
  {
    id: "vent",
    emoji: "💨",
    label: "Vent",
    desc: "Need to let it all out? I'm here, no judgement.",
    gradientFrom: "#1a2a5e",
    gradientTo: "#111a40",
    borderColor: "rgba(99,102,241,0.35)",
    activeBorder: "rgba(99,102,241,0.85)",
    labelColor: "#818cf8",
    glow: "rgba(99,102,241,0.25)",
  },
  {
    id: "hype",
    emoji: "🔥",
    label: "Hype",
    desc: "Big moment coming up? Let's get you READY.",
    gradientFrom: "#5c2a00",
    gradientTo: "#3d1a00",
    borderColor: "rgba(251,146,60,0.35)",
    activeBorder: "rgba(251,146,60,0.85)",
    labelColor: "#fb923c",
    glow: "rgba(251,146,60,0.25)",
  },
  {
    id: "deep",
    emoji: "🌙",
    label: "Deep Talk",
    desc: "2am thoughts, existential questions, real talk.",
    gradientFrom: "#2d1254",
    gradientTo: "#1a0a35",
    borderColor: "rgba(168,85,247,0.35)",
    activeBorder: "rgba(168,85,247,0.9)",
    labelColor: "#c084fc",
    glow: "rgba(168,85,247,0.25)",
  },
];

export default function VibePage() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("unfiltr_vibe", selected);
    navigate("/ChatPage");
  };

  return (
    <div
      className="screen no-tabs"
      style={{ background: "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 100%)" }}
    >
      {/* Stars */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width:  Math.random() * 2 + 0.5,
            height: Math.random() * 2 + 0.5,
            borderRadius: "50%", background: "white",
            top:  Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            opacity: Math.random() * 0.5 + 0.1,
            animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + "s",
          }} />
        ))}
      </div>
      <style>{`@keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.9} }`}</style>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px 16px",
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
        position: "relative", zIndex: 1,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 24, margin: 0, textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>Set the vibe</h1>
          <p style={{ color: "rgba(196,180,252,0.6)", fontSize: 12, margin: "2px 0 0" }}>How do you want to roll today?</p>
        </div>
      </div>

      {/* ── VIBE CARDS ── */}
      <div className="scroll-area" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 16px 8px", position: "relative", zIndex: 1 }}>
        {VIBES.map(v => (
          <motion.button
            key={v.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(v.id)}
            style={{
              width: "100%", borderRadius: 20, padding: "16px", textAlign: "left",
              border: `1.5px solid ${selected === v.id ? v.activeBorder : v.borderColor}`,
              background: `linear-gradient(135deg, ${v.gradientFrom}, ${v.gradientTo})`,
              boxShadow: selected === v.id ? `0 0 24px ${v.glow}` : "none",
              cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 30, flexShrink: 0 }}>{v.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: v.labelColor, fontWeight: 700, fontSize: 16, margin: 0 }}>{v.label}</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "3px 0 0", lineHeight: 1.35 }}>{v.desc}</p>
              </div>
              {selected === v.id && (
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#7c3aed" }} />
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── CTA ── */}
      <div className="sticky-bottom" style={{ position: "relative", zIndex: 1 }}>
        <button
          onClick={handleContinue}
          disabled={!selected}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
            color: "white", fontWeight: 900, fontSize: 17,
            cursor: selected ? "pointer" : "default",
            opacity: selected ? 1 : 0.3,
            background: selected ? "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)" : "rgba(255,255,255,0.08)",
            boxShadow: selected ? "0 0 24px rgba(168,85,247,0.45)" : "none",
            transition: "opacity 0.2s, box-shadow 0.2s",
          }}
        >
          Let's go →
        </button>
      </div>
    </div>
  );
}