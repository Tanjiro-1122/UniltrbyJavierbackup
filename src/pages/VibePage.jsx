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
    color: "from-teal-500 to-cyan-400",
    bg: "bg-teal-900/30",
    border: "border-teal-400/40",
  },
  {
    id: "vent",
    emoji: "💨",
    label: "Vent",
    desc: "Need to let it all out? I'm here, no judgement.",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-900/30",
    border: "border-blue-400/40",
  },
  {
    id: "hype",
    emoji: "🔥",
    label: "Hype",
    desc: "Big moment coming up? Let's get you READY.",
    color: "from-orange-500 to-yellow-400",
    bg: "bg-orange-900/30",
    border: "border-orange-400/40",
  },
  {
    id: "deep",
    emoji: "🌙",
    label: "Deep Talk",
    desc: "2am thoughts, existential questions, real talk.",
    color: "from-purple-600 to-pink-500",
    bg: "bg-purple-900/30",
    border: "border-purple-400/40",
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
    <div className="fixed inset-0 bg-gradient-to-b from-[#0d0520] to-[#1a0a35] flex flex-col overflow-hidden pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-xl">Set the vibe</h1>
          <p className="text-white/40 text-xs">How do you want to roll today?</p>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-3 overflow-y-auto pb-4">
        {VIBES.map((v) => (
          <motion.div
            key={v.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(v.id)}
            className={`rounded-2xl border p-4 cursor-pointer transition-all ${v.bg} ${v.border} ${
              selected === v.id ? "ring-2 ring-white/50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{v.emoji}</span>
              <div>
                <p className={`font-bold text-base bg-gradient-to-r ${v.color} bg-clip-text text-transparent`}>
                  {v.label}
                </p>
                <p className="text-white/60 text-sm">{v.desc}</p>
              </div>
              {selected === v.id && (
                <div className="ml-auto w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-4 pt-2" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            selected
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30 active:scale-95"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          Let's go →
        </button>
      </div>
    </div>
  );
}