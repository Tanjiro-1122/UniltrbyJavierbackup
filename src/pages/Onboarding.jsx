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

  const canAdvance = [
    displayName.trim().length > 0,
    !!selectedCompanion,
    !!selectedBackground,
  ];

  const handleNext = async () => {
    if (!canAdvance[step]) return;

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

        // Store companion data for ChatPage
        localStorage.setItem("userProfileId", userProfile.id);
        localStorage.setItem("companionId", companion.id);
        localStorage.setItem("unfiltr_companion", JSON.stringify({
          id: companionData.id,
          name: companionData.name,
          systemPrompt: `You are ${companionData.name}, a supportive AI companion. ${companionData.tagline}`,
        }));
        const bg = BACKGROUNDS.find((b) => b.id === selectedBackground);
        localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));

        navigate("/vibe");
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const STEP_TITLES = ["What's your name?", "Pick your companion", "Pick your space"];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a0a2e] flex flex-col max-w-[430px] mx-auto pb-20" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 shrink-0" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <p className="text-white/50 text-sm">Step {step + 1} of 3</p>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-4 shrink-0">
        <div className="h-1 bg-white/10 rounded-full">
          <div
            className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="flex-1 flex flex-col justify-start pt-8 px-4"
          >
            <h2 className="text-3xl font-bold text-white mb-2">{STEP_TITLES[0]}</h2>
            <p className="text-white/40 text-sm mb-6">This is what your companion will call you.</p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              placeholder="Enter display name"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              autoFocus
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="flex-1 flex flex-col min-h-0 px-4"
          >
            <h2 className="text-3xl font-bold text-white mb-2 shrink-0">{STEP_TITLES[1]}</h2>
            <p className="text-white/40 text-sm mb-4 shrink-0">Choose who you want to hang with.</p>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 pb-4">
                {COMPANIONS.map((c) => (
                  <motion.button
                    key={c.id}
                    onClick={() => setSelectedCompanion(c.id)}
                    className={`rounded-2xl border-2 transition-all overflow-hidden flex flex-col items-center p-3 ${
                      selectedCompanion === c.id
                        ? "border-purple-500 shadow-lg shadow-purple-500/30 bg-white/10"
                        : "border-white/20 bg-white/5"
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <img src={c.avatar} alt={c.name} className="w-24 h-24 object-contain" />
                    <p className="text-white text-sm font-bold mt-2">{c.emoji} {c.name}</p>
                    <p className="text-white/50 text-[11px] text-center mt-0.5 leading-tight">{c.tagline}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            className="flex-1 flex flex-col min-h-0 px-4"
          >
            <h2 className="text-3xl font-bold text-white mb-2 shrink-0">{STEP_TITLES[2]}</h2>
            <p className="text-white/40 text-sm mb-4 shrink-0">Where do you want to hang out?</p>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 pb-2">
                {BACKGROUNDS.map((bg) => (
                  <motion.button
                    key={bg.id}
                    onClick={() => setSelectedBackground(bg.id)}
                    className={`relative h-32 rounded-2xl border-2 overflow-hidden transition-all ${
                      selectedBackground === bg.id
                        ? "border-purple-500 shadow-lg shadow-purple-500/30"
                        : "border-white/20"
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 p-2 text-center pointer-events-none">
                      <p className="text-white text-xs font-semibold">{bg.emoji} {bg.label}</p>
                    </div>
                    {selectedBackground === bg.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer — always pinned */}
      <div className="px-4 pt-3 shrink-0" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}>
        <button
          onClick={handleNext}
          disabled={!canAdvance[step] || loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl disabled:opacity-40 active:scale-95 transition-all shadow-xl shadow-purple-500/20"
        >
          {step === 2
            ? loading ? "Setting up..." : "Enter this world →"
            : <>Next <ChevronRight className="inline w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}