import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";

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
    if (step === 2 && !selectedBackground) return;
    
    if (step === 2) {
      setLoading(true);
      try {
        const companionData = COMPANIONS.find((c) => c.id === selectedCompanion);
        const companion = await base44.entities.Companion.create({
          name: companionData.name,
          avatar_url: companionData.avatar,
          mood_mode: "neutral",
          personality: companionData.tagline,
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
                  className={`flex-shrink-0 w-28 h-36 rounded-2xl border-2 transition-all overflow-hidden flex flex-col ${
                    selectedCompanion === c.id
                      ? "border-purple-500 bg-purple-500/20 scale-105 shadow-lg shadow-purple-500/30"
                      : "border-white/20 bg-white/5"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <img src={c.avatar} alt={c.name} className="w-full h-24 object-cover" />
                  <div className="flex-1 flex flex-col items-center justify-center px-2">
                    <p className="text-white text-xs font-bold text-center">{c.emoji} {c.name}</p>
                    <p className="text-white/60 text-[10px] text-center leading-tight">{c.tagline}</p>
                  </div>
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
                  className={`relative h-32 rounded-2xl border-2 overflow-hidden transition-all ${
                    selectedBackground === bg.id
                      ? "border-purple-500 scale-105 shadow-lg shadow-purple-500/30"
                      : "border-white/20"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2 pointer-events-none">
                    <div className="text-center w-full">
                      <p className="text-white text-xs font-semibold">{bg.emoji} {bg.label}</p>
                    </div>
                  </div>
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