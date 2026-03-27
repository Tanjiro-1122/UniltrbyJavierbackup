import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore, resetOnboardingStore } from "@/components/onboarding/useOnboardingStore";

const VIBES = [
  {
    id: "journal",
    emoji: "📓",
    label: "Journal",
    desc: "Write freely. Speak your thoughts. Save them.",
    bg: "bg-emerald-900/30",
    border: "border-emerald-400/40",
    color: "from-emerald-400 to-teal-300",
    dot: "bg-emerald-600",
  },
  {
    id: "chill",
    emoji: "😌",
    label: "Chill",
    desc: "Just hanging out. No agenda, no pressure.",
    bg: "bg-teal-900/30",
    border: "border-teal-400/40",
    color: "from-teal-500 to-cyan-400",
    dot: "bg-purple-600",
  },
  {
    id: "vent",
    emoji: "💨",
    label: "Vent",
    desc: "Need to let it all out? I'm here, no judgement.",
    bg: "bg-blue-900/30",
    border: "border-blue-400/40",
    color: "from-blue-500 to-indigo-500",
    dot: "bg-purple-600",
  },
  {
    id: "hype",
    emoji: "🔥",
    label: "Hype",
    desc: "Big moment coming up? Let's get you READY.",
    bg: "bg-orange-900/30",
    border: "border-orange-400/40",
    color: "from-orange-500 to-yellow-400",
    dot: "bg-purple-600",
  },
  {
    id: "deep",
    emoji: "🌙",
    label: "Deep Talk",
    desc: "2am thoughts, existential questions, real talk.",
    bg: "bg-purple-900/30",
    border: "border-purple-400/40",
    color: "from-purple-600 to-pink-500",
    dot: "bg-purple-600",
  },
];

export default function OnboardingVibe() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [selected, setSelected] = useState(store.selectedVibe || null);
  const [loading, setLoading] = useState(false);

  if (!store.selectedCompanion) {
    navigate("/onboarding/companion", { replace: true });
    return null;
  }

  const finishOnboardingForJournal = async () => {
    setLoading(true);
    try {
      const companionData = COMPANIONS.find(c => c.id === store.selectedCompanion);
      const companion = await base44.entities.Companion.create({
        name: companionData.name,
        avatar_url: companionData.avatar,
        mood_mode: "neutral",
        personality: companionData.tagline,
      });

      const defaultBg = BACKGROUNDS[0];
      const profileData = {
        display_name: store.displayName,
        companion_id: companion.id,
        background_id: defaultBg.id,
        premium: store.isTesterAccount,
        is_premium: store.isTesterAccount,
        session_memory: store.isTesterAccount ? [{
          date: new Date().toLocaleDateString(),
          summary: "This is a demo account for app review.",
        }] : [],
      };

      let userProfile;
      if (store.pendingProfileId) {
        userProfile = await base44.entities.UserProfile.update(store.pendingProfileId, profileData);
      } else {
        userProfile = await base44.entities.UserProfile.create(profileData);
      }

      localStorage.setItem("userProfileId", userProfile.id);
      localStorage.setItem("companionId", companion.id);

      const finalName = store.companionNickname.trim() || companionData.name;
      localStorage.setItem("unfiltr_companion_nickname", store.companionNickname.trim());
      localStorage.setItem("unfiltr_companion", JSON.stringify({
        id: companionData.id,
        name: companionData.name,
        displayName: finalName,
        systemPrompt: `You are ${finalName}, a supportive AI companion. ${companionData.tagline}`,
      }));

      localStorage.setItem("unfiltr_env", JSON.stringify({
        id: defaultBg.id, label: defaultBg.label, bg: defaultBg.url,
      }));

      resetOnboardingStore();
      navigate("/vibe");
    } catch (err) {
      console.error("Journal onboarding DB error (non-blocking):", err);
      // Always navigate even if DB fails
      resetOnboardingStore();
      navigate("/vibe");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selected) return;
    updateOnboardingStore({ selectedVibe: selected });

    if (selected === "journal") {
      finishOnboardingForJournal();
    } else {
      navigate("/onboarding/background");
    }
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={6}
      onBack={() => navigate("/onboarding/nickname")}
      onNext={handleNext}
      canAdvance={!!selected && !loading}
      loading={loading}
      nextLabel={selected === "journal" ? (loading ? "Setting up…" : "Start journaling →") : "Pick your world →"}
    >
      <div style={{ padding: "0 20px 20px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
          What's your vibe?
        </h2>
        <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: "0 0 16px" }}>
          Journal your thoughts or chat with your companion
        </p>

        <div className="space-y-3">
          {VIBES.map((v, i) => (
            <React.Fragment key={v.id}>
              {i === 1 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <p className="text-white/30 text-xs uppercase tracking-widest">or chat</p>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}
              <motion.div
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
                      <div className={`w-3 h-3 rounded-full ${v.dot}`} />
                    </div>
                  )}
                </div>
              </motion.div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
}