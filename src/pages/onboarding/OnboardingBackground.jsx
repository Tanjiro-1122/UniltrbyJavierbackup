import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BACKGROUNDS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

export default function OnboardingBackground() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [selected, setSelected] = useState(store.selectedBackground);


  if (!store.selectedCompanion) {
    navigate("/onboarding/companion", { replace: true });
    return null;
  }

  const handleNext = () => {
    if (!selected) return;
    updateOnboardingStore({ selectedBackground: selected });
    navigate("/onboarding/consent");
  };

  return (
    <OnboardingLayout
      step={4}
      onBack={() => navigate("/onboarding/nickname")}
      onNext={handleNext}
      canAdvance={!!selected}
    >
      <div style={{ padding: "0 20px 20px", width: "100%", maxWidth: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", flex: 1 }}>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)", flexShrink: 0 }}>
          Pick your space
        </h2>
        <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: "0 0 16px", flexShrink: 0 }}>
          Where do you want to hang out?
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, paddingBottom: 16 }}>
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