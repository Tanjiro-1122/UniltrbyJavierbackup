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
    gradient: "linear-gradient(135deg, #0d9488, #06b6d4)",
    bg: "rgba(13,148,136,0.12)",
    border: "rgba(13,148,136,0.35)",
    glow: "rgba(13,148,136,0.3)",
  },
  {
    id: "vent",
    emoji: "💨",
    label: "Vent",
    desc: "Need to let it all out? I'm here, no judgement.",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.35)",
    glow: "rgba(59,130,246,0.3)",
  },
  {
    id: "hype",
    emoji: "🔥",
    label: "Hype",
    desc: "Big moment coming up? Let's get you READY.",
    gradient: "linear-gradient(135deg, #f97316, #eab308)",
    bg: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.35)",
    glow: "rgba(249,115,22,0.3)",
  },
  {
    id: "deep",
    emoji: "🌙",
    label: "Deep Talk",
    desc: "2am thoughts, existential questions, real talk.",
    gradient: "linear-gradient(135deg, #7c3aed, #db2777)",
    bg: "rgba(124,58,237,0.12)",
    border: "rgba(124,58,237,0.35)",
    glow: "rgba(124,58,237,0.3)",
  },
];

export default function VibePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    if (selected === "journal") {
      localStorage.setItem("unfiltr_vibe", "journal"); navigate("/journal/splash");
      return;
    }
    localStorage.setItem("unfiltr_vibe", selected);
    navigate("/chat");
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(180deg, #0d0520 0%, #06020f 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "max(1.5rem, env(safe-area-inset-top)) 16px 16px",
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>Set the vibe</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>How do you want to roll today?</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px", display: "flex", flexDirection: "column", gap: 10 }}>

        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelected("journal")}
          style={{
            borderRadius: 18, padding: "16px",
            background: selected === "journal" ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.08)",
            border: `1.5px solid ${selected === "journal" ? "rgba(16,185,129,0.7)" : "rgba(16,185,129,0.25)"}`,
            cursor: "pointer",
            boxShadow: selected === "journal" ? "0 0 20px rgba(16,185,129,0.2)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 30, flexShrink: 0 }}>📓</span>
            <div style={{ flex: 1 }}>
              <p style={{
                fontWeight: 700, fontSize: 16, margin: "0 0 2px",
                background: "linear-gradient(135deg, #34d399, #06b6d4)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Journal</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>
                Write freely. Speak your thoughts. Save them.
              </p>
            </div>
            {selected === "journal" && (
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #34d399, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </motion.div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 600, letterSpacing: 2, margin: 0 }}>OR CHAT</p>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {VIBES.map((v) => (
          <motion.div
            key={v.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(v.id)}
            style={{
              borderRadius: 18, padding: "16px",
              background: selected === v.id ? v.bg : "rgba(255,255,255,0.04)",
              border: `1.5px solid ${selected === v.id ? v.border : "rgba(255,255,255,0.08)"}`,
              cursor: "pointer",
              boxShadow: selected === v.id ? `0 0 20px ${v.glow}` : "none",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{v.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: 700, fontSize: 16, margin: "0 0 2px",
                  background: v.gradient,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{v.label}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>{v.desc}</p>
              </div>
              {selected === v.id && (
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: v.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 16px max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(to top, #06020f 60%, transparent)",
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={!selected}
          style={{
            width: "100%", padding: "17px",
            background: selected
              ? "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)"
              : "rgba(255,255,255,0.07)",
            border: "none", borderRadius: 18,
            color: selected ? "white" : "rgba(255,255,255,0.3)",
            fontWeight: 800, fontSize: 17,
            cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected ? "0 0 28px rgba(168,85,247,0.4)" : "none",
            transition: "all 0.3s",
          }}
        >
          Let's go →
        </motion.button>
      </div>
    </div>
  );
}
