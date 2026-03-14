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
  const [companionNickname, setCompanionNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const canAdvance = [
    displayName.trim().length > 0,
    !!selectedCompanion,
    true,
    !!selectedBackground,
  ];

  const handleBack = () => {
    if (step === 0) {
      navigate("/");
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleNext = async () => {
    if (!canAdvance[step]) return;

    if (step === 3) {
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
        localStorage.setItem("unfiltr_companion", JSON.stringify({
          id: companionData.id,
          name: companionData.name,
          systemPrompt: `You are ${companionData.name}, a supportive AI companion. ${companionData.tagline}`,
        }));
        const bg = BACKGROUNDS.find((b) => b.id === selectedBackground);
        localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
        if (companionNickname.trim()) {
          localStorage.setItem("unfiltr_companion_nickname", companionNickname.trim());
        }

        navigate("/vibe");
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const STEP_TITLES = [
    "What's your name?",
    "Pick your companion",
    "Name your companion",
    "Pick your space",
  ];
  const STEP_SUBTITLES = [
    "This is what your companion will call you.",
    "Choose who you want to hang with.",
    "Give them a nickname — or keep their real name.",
    "Where do you want to hang out?",
  ];

  return (
    <div
      className="screen"
      style={{
        background: "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)",
      }}
    >
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.6 + 0.1,
              animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + "s",
            }}
          />
        ))}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", top: "-40px" }} />
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.9} }
      `}</style>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pb-2 shrink-0"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <p className="text-white/40 text-sm">Step {step + 1} of 4</p>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-4 pb-5 shrink-0">
        <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: `${((step + 1) / 4) * 100}%`,
              background: "linear-gradient(90deg, #7c3aed, #db2777)",
              boxShadow: "0 0 8px rgba(168,85,247,0.6)",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            className="relative z-10 flex-1 flex flex-col justify-start pt-6 px-4"
          >
            <h2 className="text-3xl font-black text-white mb-2"
              style={{ textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
              {STEP_TITLES[0]}
            </h2>
            <p className="text-purple-300/70 text-sm mb-6">{STEP_SUBTITLES[0]}</p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              placeholder="Enter display name"
              className="w-full px-4 py-4 rounded-2xl text-white placeholder-white/30 focus:outline-none text-base"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.3)",
                boxShadow: "0 0 0 0 rgba(139,92,246,0)",
                transition: "box-shadow 0.2s",
              }}
              onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.5)"}
              onBlur={(e) => e.target.style.boxShadow = "0 0 0 0 rgba(139,92,246,0)"}
              autoFocus
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            className="relative z-10 flex flex-col px-4 overflow-hidden"
            style={{ flex: 1, minHeight: 0 }}
          >
            <h2 className="text-3xl font-black text-white mb-1 shrink-0"
              style={{ textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
              Pick your companion
            </h2>
            <p className="text-purple-300/70 text-sm mb-3 shrink-0">Choose who you want to hang with.</p>

            <div className="scroll-area">
              <div className="grid grid-cols-3 gap-2 pb-4">
                {COMPANIONS.map((c) => (
                  <motion.button
                    key={c.id}
                    onClick={() => { setSelectedCompanion(c.id); setStep(2); }}
                    whileTap={{ scale: 0.94 }}
                    className="flex flex-col items-center rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: selectedCompanion === c.id
                        ? "rgba(139,92,246,0.25)"
                        : "rgba(255,255,255,0.04)",
                      border: selectedCompanion === c.id
                        ? "2px solid rgba(168,85,247,0.85)"
                        : "2px solid rgba(255,255,255,0.08)",
                      boxShadow: selectedCompanion === c.id
                        ? "0 0 18px rgba(168,85,247,0.35)"
                        : "none",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                    }}
                  >
                    <div className="w-full overflow-hidden rounded-xl" style={{ height: "80px" }}>
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-full h-full object-contain object-top"
                        onError={(e) => { e.target.style.opacity = "0.3"; }}
                      />
                    </div>
                    <p className="text-white text-xs font-bold mt-1.5 text-center leading-tight">
                      {c.emoji} {c.name}
                    </p>
                    <p className="text-white/40 text-[10px] text-center leading-tight mt-0.5 px-1">
                      {c.tagline}
                    </p>
                    {selectedCompanion === c.id && (
                      <div className="mt-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            className="relative z-10 flex-1 flex flex-col justify-start pt-6 px-4"
          >
            <h2 className="text-3xl font-black text-white mb-2"
              style={{ textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
              {STEP_TITLES[2]}
            </h2>
            <p className="text-purple-300/70 text-sm mb-6">{STEP_SUBTITLES[2]}</p>

            {selectedCompanion && (() => {
              const c = COMPANIONS.find(cd => cd.id === selectedCompanion);
              return (
                <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <img src={c.avatar} alt={c.name} className="w-16 h-16 object-contain" />
                  <div>
                    <p className="text-white font-bold">{c.name}</p>
                    <p className="text-white/40 text-xs">{c.tagline}</p>
                  </div>
                </div>
              );
            })()}

            <input
              type="text"
              value={companionNickname}
              onChange={(e) => setCompanionNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              placeholder={`Default: ${COMPANIONS.find(c => c.id === selectedCompanion)?.name || "companion"}`}
              maxLength={20}
              className="w-full px-4 py-4 rounded-2xl text-white placeholder-white/30 focus:outline-none text-base"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
              onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.5)"}
              onBlur={(e) => e.target.style.boxShadow = "none"}
              autoFocus
            />
            <p className="text-white/30 text-xs mt-3 text-center">Leave blank to use their default name</p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            className="relative z-10 flex flex-col px-4 overflow-hidden"
            style={{ flex: 1, minHeight: 0 }}
          >
            <h2 className="text-3xl font-black text-white mb-2 shrink-0"
              style={{ textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
              {STEP_TITLES[3]}
            </h2>
            <p className="text-purple-300/70 text-sm mb-4 shrink-0">{STEP_SUBTITLES[3]}</p>
            <div className="scroll-area">
              <div className="grid grid-cols-2 gap-3 pb-2">
                {BACKGROUNDS.map((bg) => (
                  <motion.button key={bg.id} onClick={() => setSelectedBackground(bg.id)}
                    whileTap={{ scale: 0.96 }}
                    className="relative h-32 rounded-2xl overflow-hidden transition-all"
                    style={{
                      border: selectedBackground === bg.id
                        ? "2px solid rgba(168,85,247,0.9)"
                        : "2px solid rgba(255,255,255,0.1)",
                      boxShadow: selectedBackground === bg.id
                        ? "0 0 20px rgba(168,85,247,0.35)"
                        : "none",
                    }}
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

      {/* Footer button */}
      <div className="sticky-bottom relative z-10">
        <button
          onClick={handleNext}
          disabled={!canAdvance[step] || loading}
          className="w-full py-4 text-white font-black text-lg rounded-2xl disabled:opacity-30 active:scale-95 transition-all"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
            boxShadow: canAdvance[step] ? "0 0 24px rgba(168,85,247,0.45), 0 4px 16px rgba(0,0,0,0.4)" : "none",
          }}
        >
          {step === 3
            ? loading ? "Setting up..." : "Enter this world →"
            : <>Next <ChevronRight className="inline w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}