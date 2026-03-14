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
    labelColor: "#2dd4bf",
  },
  {
    id: "vent",
    emoji: "💨",
    label: "Vent",
    desc: "Need to let it all out? I'm here, no judgement.",
    gradientFrom: "#1a2a5e",
    gradientTo: "#111a40",
    borderColor: "rgba(99,102,241,0.35)",
    labelColor: "#818cf8",
  },
  {
    id: "hype",
    emoji: "🔥",
    label: "Hype",
    desc: "Big moment coming up? Let's get you READY.",
    gradientFrom: "#5c2a00",
    gradientTo: "#3d1a00",
    borderColor: "rgba(251,146,60,0.35)",
    labelColor: "#fb923c",
  },
  {
    id: "deep",
    emoji: "🌙",
    label: "Deep Talk",
    desc: "2am thoughts, existential questions, real talk.",
    gradientFrom: "#2d1254",
    gradientTo: "#1a0a35",
    borderColor: "rgba(168,85,247,0.4)",
    labelColor: "#c084fc",
  },
];

export default function VibePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("unfiltr_vibe", selected);
    navigate("/chat");
  };

  return (
    <div
      className="fixed inset-0 flex flex-col max-w-[430px] mx-auto"
      style={{
        height: "100dvh",
        background: "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 100%)",
      }}
    >
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.1,
              animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + "s",
            }}
          />
        ))}
      </div>
      <style>{`@keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.9} }`}</style>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pb-4 shrink-0"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-black text-2xl" style={{ textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
            Set the vibe
          </h1>
          <p className="text-purple-300/60 text-xs">How do you want to roll today?</p>
        </div>
      </div>

      {/* Vibe cards — all 4 fit, no scrollbar */}
      <div className="relative z-10 flex-1 px-4 flex flex-col gap-3 overflow-hidden justify-center pb-2">
        {VIBES.map((v) => (
          <motion.button
            key={v.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(v.id)}
            className="w-full rounded-2xl p-4 text-left transition-all"
            style={{
              background: `linear-gradient(135deg, ${v.gradientFrom}, ${v.gradientTo})`,
              border: `1.5px solid ${selected === v.id ? v.borderColor.replace("0.35", "0.8").replace("0.4", "0.9") : v.borderColor}`,
              boxShadow: selected === v.id ? `0 0 20px ${v.borderColor}` : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl shrink-0">{v.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base" style={{ color: v.labelColor }}>{v.label}</p>
                <p className="text-white/60 text-sm leading-snug">{v.desc}</p>
              </div>
              {selected === v.id && (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* CTA — always visible, never cut off */}
      <div className="relative z-10 px-4 pt-3 shrink-0"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 rounded-2xl font-black text-lg text-white active:scale-95 transition-all disabled:opacity-30"
          style={{
            background: selected ? "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)" : "rgba(255,255,255,0.08)",
            boxShadow: selected ? "0 0 24px rgba(168,85,247,0.45)" : "none",
          }}
        >
          Let's go →
        </button>
      </div>
    </div>
  );
}