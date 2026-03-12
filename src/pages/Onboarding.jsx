import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const COMPANIONS = [
  { id: "luna", name: "Luna", url: "https://via.placeholder.com/120?text=Luna" },
  { id: "kai", name: "Kai", url: "https://via.placeholder.com/120?text=Kai" },
  { id: "nova", name: "Nova", url: "https://via.placeholder.com/120?text=Nova" },
  { id: "ash", name: "Ash", url: "https://via.placeholder.com/120?text=Ash" },
  { id: "sakura", name: "Sakura", url: "https://via.placeholder.com/120?text=Sakura" },
  { id: "ryuu", name: "Ryuu", url: "https://via.placeholder.com/120?text=Ryuu" },
  { id: "zara", name: "Zara", url: "https://via.placeholder.com/120?text=Zara" },
  { id: "sage", name: "Sage", url: "https://via.placeholder.com/120?text=Sage" },
];

const BACKGROUNDS = [
  { id: "living_room", label: "Living Room", emoji: "🛋️" },
  { id: "park", label: "Sunny Park", emoji: "🌳" },
  { id: "beach", label: "Sunset Beach", emoji: "🌅" },
  { id: "space", label: "Outer Space", emoji: "🚀" },
  { id: "forest", label: "Enchanted Forest", emoji: "🍄" },
  { id: "cafe", label: "Rainy Café", emoji: "☕" },
  { id: "rooftop", label: "Anime Rooftop", emoji: "🌇" },
  { id: "ocean", label: "Deep Ocean", emoji: "🐠" },
  { id: "cabin", label: "Winter Cabin", emoji: "🏔️" },
  { id: "cyberpunk", label: "Cyberpunk City", emoji: "🌆" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (step === 0 && !displayName.trim()) return;
    if (step === 1 && !selectedCompanion) return;
    if (step === 2 && !selectedBackground) {
      setLoading(true);
      try {
        const companion = await base44.entities.Companion.create({
          name: selectedCompanion,
          avatar_url: COMPANIONS.find((c) => c.id === selectedCompanion)?.url,
          mood_mode: "neutral",
        });

        const userProfile = await base44.entities.UserProfile.create({
          display_name: displayName,
          companion_id: companion.id,
          background_id: selectedBackground,
          premium: false,
        });

        localStorage.setItem("userProfileId", userProfile.id);
        localStorage.setItem("companionId", companion.id);
        navigate("/chat");
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a0a2e] flex flex-col max-w-[430px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <p className="text-white/50 text-sm">Step {step + 1} of 3</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col justify-center px-4"
          >
            <h2 className="text-3xl font-bold text-white mb-4">What's your name?</h2>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              autoFocus
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col justify-center px-4"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Pick your companion</h2>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {COMPANIONS.map((c) => (
                <motion.button
                  key={c.id}
                  onClick={() => setSelectedCompanion(c.id)}
                  className={`flex-shrink-0 w-28 h-32 rounded-2xl border-2 transition-all ${
                    selectedCompanion === c.id
                      ? "border-purple-500 bg-purple-500/20 scale-105"
                      : "border-white/20 bg-white/5"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <img src={c.url} alt={c.name} className="w-full h-full object-cover rounded-xl" />
                  <p className="text-white text-xs font-semibold mt-1 text-center">{c.name}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col justify-center px-4"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Pick your space</h2>
            <div className="grid grid-cols-2 gap-3">
              {BACKGROUNDS.map((bg) => (
                <motion.button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg.id)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    selectedBackground === bg.id
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/20 bg-white/5"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-2xl mb-1">{bg.emoji}</p>
                  <p className="text-white text-xs font-semibold">{bg.label}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div className="px-4 pb-6 pt-4">
        <button
          onClick={handleNext}
          disabled={
            (step === 0 && !displayName.trim()) ||
            (step === 1 && !selectedCompanion) ||
            (step === 2 && !selectedBackground) ||
            loading
          }
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-all"
        >
          {step === 2 ? (loading ? "Setting up..." : "Complete") : "Next"} <ChevronRight className="inline w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}