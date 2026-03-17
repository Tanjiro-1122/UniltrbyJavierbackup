import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore, resetOnboardingStore } from "@/components/onboarding/useOnboardingStore";

export default function OnboardingBackground() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [selected, setSelected] = useState(store.selectedBackground);
  const [loading, setLoading] = useState(false);

  if (!store.selectedCompanion) {
    navigate("/onboarding/companion", { replace: true });
    return null;
  }

  const handleFinish = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const companionData = COMPANIONS.find(c => c.id === store.selectedCompanion);
      const companion = await base44.entities.Companion.create({
        name: companionData.name,
        avatar_url: companionData.avatar,
        mood_mode: "neutral",
        personality: companionData.tagline,
      });

      const profileData = {
        display_name: store.displayName,
        companion_id: companion.id,
        background_id: selected,
        premium: store.isTesterAccount,
        is_premium: store.isTesterAccount,
        session_memory: store.isTesterAccount ? [{
          date: "Mar 14, 2026",
          summary: "This is a demo account for app review. The user wanted to explore all premium features including companion memory, unlimited messages, and voice responses.",
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

      const bg = BACKGROUNDS.find(b => b.id === selected);
      localStorage.setItem("unfiltr_env", JSON.stringify({
        id: bg.id, label: bg.label, bg: bg.url,
      }));

      resetOnboardingStore();
      navigate("/vibe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={4}
      onBack={() => navigate("/onboarding/nickname")}
      onNext={handleFinish}
      canAdvance={!!selected}
      loading={loading}
      nextLabel={loading ? "Setting up…" : "Enter this world →"}
    >
      <div style={{ padding: "0 20px 20px", width: "100%", maxWidth: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", flex: 1 }}>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)", flexShrink: 0 }}>
          Pick your space
        </h2>
        <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: "0 0 16px", flexShrink: 0 }}>
          Where do you want to hang out?
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, flex: 1 }}>
          {BACKGROUNDS.map(bg => (
            <motion.button key={bg.id} whileTap={{ scale: 0.96 }}
              onClick={() => { setSelected(bg.id); updateOnboardingStore({ selectedBackground: bg.id }); }}
              style={{
                position: "relative", height: 120, borderRadius: 18, overflow: "hidden", cursor: "pointer",
                border: `3px solid ${selected === bg.id ? "#a855f7" : "rgba(255,255,255,0.1)"}`,
                boxShadow: selected === bg.id ? "0 0 28px rgba(168,85,247,0.6), inset 0 0 12px rgba(168,85,247,0.1)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                background: "transparent", padding: 0,
              }}
            >
              <img src={bg.url} alt={bg.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px", textAlign: "center", pointerEvents: "none" }}>
                <p style={{ color: "white", fontSize: 12, fontWeight: 600, margin: 0 }}>{bg.emoji} {bg.label}</p>
              </div>
              {selected === bg.id && (
                <div style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px rgba(168,85,247,0.8)" }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>    </OnboardingLayout>
  );
}