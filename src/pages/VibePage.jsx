import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
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
  {
    id: "journal",
    emoji: "📓",
    label: "Journal",
    desc: "Speak your thoughts. I'll write them down for you.",
    gradientFrom: "#1a3a2a",
    gradientTo: "#0d2418",
    borderColor: "rgba(74,222,128,0.35)",
    activeBorder: "rgba(74,222,128,0.85)",
    labelColor: "#4ade80",
    glow: "rgba(74,222,128,0.25)",
  },
];

export default function VibePage() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);

  // Block access if user hasn't accepted consent
  React.useEffect(() => {
    if (!localStorage.getItem("unfiltr_consent_accepted")) {
      navigate("/onboarding", { replace: true });
    }
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("unfiltr_vibe", selected);
    navigate("/chat");
  };

  return (
    <AppShell
      tabs={false}
      bg="linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 100%)"
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── FIXED HEADER ── */}
      <div style={{
        flexShrink: 0, padding: "12px 20px 12px",
        position: "relative", zIndex: 1,
      }}>
        {/* Friend activity indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
          padding: "5px 10px", borderRadius: 999, width: "fit-content",
          background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
          <span style={{ color: "rgba(74,222,128,0.7)", fontSize: 11, fontWeight: 500 }}>
            {Math.floor(Math.random() * 8) + 2} friends are chatting right now
          </span>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "white", fontWeight: 900, fontSize: 26, margin: 0, textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>Set the vibe</h1>
            <p style={{ color: "rgba(196,180,252,0.5)", fontSize: 12, margin: "2px 0 0" }}>How do you want to roll today?</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => navigate("/PersonalityQuiz")}
              style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 12, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12 }}>🧪</span>
              <span style={{ color: "#c084fc", fontSize: 11, fontWeight: 700 }}>Quiz</span>
            </button>
            <button onClick={() => navigate("/journal")}
              style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 12, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <BookOpen size={14} color="#4ade80" />
              <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>Journal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE VIBE CARDS ── */}
      <div className="scroll-area" style={{
        flex: 1, minHeight: 0,
        overflowY: "auto", overflowX: "hidden",
        display: "flex", flexDirection: "column", gap: 10,
        padding: "4px 20px 20px",
        position: "relative", zIndex: 1,
        justifyContent: "center",
      }}>
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
            <div style={{
              position: "absolute", inset: 0,
              background: selected === v.id ? "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)" : "transparent",
              pointerEvents: "none",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1, minHeight: 64 }}>
              <span style={{ fontSize: 44, flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))", lineHeight: 1 }}>{v.emoji}</span>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p style={{ color: v.labelColor, fontWeight: 800, fontSize: 18, margin: 0 }}>{v.label}</p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "4px 0 0", lineHeight: 1.5 }}>{v.desc}</p>
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: selected === v.id ? 1 : 0, opacity: selected === v.id ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ flexShrink: 0 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #db2777)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 16px ${v.glow}`,
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </motion.div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── FIXED CTA AT BOTTOM ── */}
      <div style={{
        flexShrink: 0, padding: "12px 20px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        position: "relative", zIndex: 2,
        background: "linear-gradient(to top, rgba(18,6,38,1) 60%, rgba(18,6,38,0.95) 80%, transparent 100%)",
      }}>
        <button
          onClick={handleContinue}
          disabled={!selected}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
            color: "white", fontWeight: 900, fontSize: 18, letterSpacing: "0.5px",
            cursor: selected ? "pointer" : "default",
            opacity: selected ? 1 : 0.5,
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
            boxShadow: "0 8px 32px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          Let's go →
        </button>
      </div>
    </AppShell>
  );
}