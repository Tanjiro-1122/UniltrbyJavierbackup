import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

const ENVIRONMENTS = [
  {
    id: "living_room",
    label: "Cozy Living Room",
    emoji: "🛋️",
    desc: "Warm, chill, like coming home.",
    bg: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/e94aaa131_generated_image.png",
  },
  {
    id: "park",
    label: "Sunny Park",
    emoji: "🌳",
    desc: "Fresh air, blue skies, good energy.",
    bg: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/e704bd982_generated_image.png",
  },
  {
    id: "beach",
    label: "Sunset Beach",
    emoji: "🌅",
    desc: "Waves, warmth, total zen.",
    bg: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/ae1b4b563_generated_image.png",
  },
  {
    id: "space",
    label: "Outer Space",
    emoji: "🚀",
    desc: "Just you, the stars, and big thoughts.",
    bg: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/ba89824d4_generated_image.png",
  },
];

export default function EnvironmentPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    const env = ENVIRONMENTS.find((e) => e.id === selected);
    localStorage.setItem("unfiltr_env", JSON.stringify(env));
    navigate("/chat");
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0d0520] to-[#1a0a35] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button onClick={() => navigate("/vibe")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-xl">Pick your spot</h1>
          <p className="text-white/40 text-xs">Where do you want to hang out?</p>
        </div>
      </div>

      <div className="flex-1 px-4 grid grid-cols-2 gap-3 overflow-y-auto pb-4 content-start">
        {ENVIRONMENTS.map((env) => (
          <motion.div
            key={env.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(env.id)}
            className={`relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] transition-all ${
              selected === env.id ? "ring-3 ring-white scale-[1.02]" : ""
            }`}
            style={{ boxShadow: selected === env.id ? "0 0 0 3px white" : "none" }}
          >
            <img src={env.bg} alt={env.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-bold text-sm">{env.emoji} {env.label}</p>
              <p className="text-white/60 text-xs">{env.desc}</p>
            </div>
            {selected === env.id && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="px-4 pb-8 pt-2">
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