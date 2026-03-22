import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { BACKGROUNDS } from "@/components/companionData";

export default function BackgroundSelect() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    const bg = BACKGROUNDS.find(b => b.id === selected);
    if (bg) {
      localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
    }
    navigate("/chat");
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0d0520] to-[#1a0a35] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 shrink-0" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button onClick={() => navigate("/vibe")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-xl">Pick your space</h1>
          <p className="text-white/40 text-xs">Where do you want to hang out?</p>
        </div>
      </div>

      {/* Background Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 scroll-area" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
        <div className="grid grid-cols-2 gap-3">
          {BACKGROUNDS.map(bg => (
            <motion.button
              key={bg.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelected(bg.id)}
              className="relative overflow-hidden rounded-2xl"
              style={{
                height: 120,
                border: `3px solid ${selected === bg.id ? "#a855f7" : "rgba(255,255,255,0.1)"}`,
                boxShadow: selected === bg.id ? "0 0 28px rgba(168,85,247,0.6)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                background: "transparent", padding: 0,
              }}
            >
              <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 p-2 text-center pointer-events-none">
                <p className="text-white text-xs font-semibold">{bg.emoji} {bg.label}</p>
              </div>
              {selected === bg.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pt-2 shrink-0" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            selected
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30 active:scale-95"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          Enter this world →
        </button>
      </div>
    </div>
  );
}