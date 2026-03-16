import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

export default function OnboardingCompanion() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [selected, setSelected] = useState(store.selectedCompanion);

  // Redirect if no name set
  if (!store.displayName.trim()) {
    navigate("/onboarding", { replace: true });
    return null;
  }

  const handleSelect = (id) => {
    setSelected(id);
    updateOnboardingStore({ selectedCompanion: id });
    // Auto-advance to nickname step
    navigate("/onboarding/nickname");
  };

  return (
    <OnboardingLayout
      step={2}
      onBack={() => navigate("/onboarding")}
      canAdvance={false}
    >
      <div style={{ flexShrink: 0, padding: "0 16px 10px" }}>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
          Pick your companion
        </h2>
        <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: 0 }}>
          Choose who you want to hang with.
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 0, margin: "4px 16px 12px", borderRadius: 22, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(42,31,74,0.6)", overflow: "hidden" }}>
        <div className="scroll-area" style={{ height: "100%", padding: "10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, paddingBottom: 12 }}>
          {COMPANIONS.filter(c => !c.testerOnly || store.isTesterAccount).map(c => (
            <motion.button key={c.id} whileTap={{ scale: 0.94 }}
              onClick={() => handleSelect(c.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                borderRadius: 18, overflow: "hidden", cursor: "pointer", padding: "10px 6px 8px",
                background: selected === c.id ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${selected === c.id ? "rgba(168,85,247,0.85)" : "rgba(42,31,74,0.7)"}`,
                boxShadow: selected === c.id ? "0 0 18px rgba(168,85,247,0.35)" : "none",
                transition: "all 0.15s",
              }}
            >
              <div style={{ width: "100%", height: 90, overflow: "hidden", borderRadius: 10 }}>
                <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={e => e.target.style.opacity = "0.3"} />
              </div>
              <p style={{ color: "white", fontSize: 11, fontWeight: 700, margin: "6px 0 2px", textAlign: "center", lineHeight: 1.2 }}>{c.emoji} {c.name}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textAlign: "center", lineHeight: 1.2, margin: 0 }}>{c.tagline}</p>
              {selected === c.id && (
                <div style={{ marginTop: 5, width: 16, height: 16, borderRadius: "50%", background: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}