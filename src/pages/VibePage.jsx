import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppShell from "@/components/shell/AppShell";

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
    navigate("/chat");
  };

  return (
    <AppShell
      tabs={true}
      bg="linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 100%)"
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0, padding: "0 16px 12px",
        paddingTop: "12px",
        position: "relative", zIndex: 1,
      }}>
        <h1 style={{ color: "white", fontWeight: 900, fontSize: 26, margin: 0, textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>Set the vibe</h1>
        <p style={{ color: "rgba(196,180,252,0.5)", fontSize: 12, margin: "2px 0 0" }}>How do you want to roll today?</p>
      </div>

      {/* ── VIBE CARDS ── */}
      <div className="scroll-area" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px", position: "relative", zIndex: 1 }}>
        {VIBES.map(v => (
          <motion.button
            key={v.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelected(v.id)}
            style={{
              width: "100%", borderRadius: 18, padding: "18px",
              border: `2px solid ${selected === v.id ? v.activeBorder : v.borderColor}`,
              background: `linear-gradient(135deg, ${v.gradientFrom} 0%, ${v.gradientTo} 100%)`,
              backdropFilter: "blur(12px)",
              boxShadow: selected === v.id ? `0 8px 32px ${v.glow}, inset 0 1px 0 rgba(255,255,255,0.1)` : `inset 0 1px 0 rgba(255,255,255,0.05)`,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Shimmer effect */}
            <div style={{
              position: "absolute", inset: 0,
              background: selected === v.id ? "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)" : "transparent",
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: 40, flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>{v.emoji}</span>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p style={{ color: v.labelColor, fontWeight: 800, fontSize: 17, margin: 0 }}>{v.label}</p>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: "4px 0 0", lineHeight: 1.4 }}>{v.desc}</p>
              </div>
              {selected === v.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", background: "white",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: v.labelColor }} />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
        <div style={{ height: 12 }} />
      </div>

      {/* ── CTA ── */}
      <div style={{
        flexShrink: 0, padding: "12px 16px",
        position: "relative", zIndex: 1,
      }}>
        <button
          onClick={handleContinue}
          disabled={!selected}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
            color: "white", fontWeight: 900, fontSize: 18, letterSpacing: "0.5px",
            cursor: selected ? "pointer" : "default",
            opacity: selected ? 1 : 0.3,
            background: selected ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)" : "rgba(255,255,255,0.08)",
            boxShadow: selected ? "0 8px 32px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          Let's go →
        </button>
      </div>
    </AppShell>
  );
}