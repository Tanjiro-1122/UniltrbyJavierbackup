import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

const MODES = [
  {
    id: "friend",
    emoji: "👋",
    label: "Friend",
    desc: "Casual, real talk — like texting someone who actually gets you.",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.1)",
    border: "rgba(129,140,248,0.25)",
  },
  {
    id: "coach",
    emoji: "🎯",
    label: "Coach",
    desc: "Focused, direct, goal-oriented — here to push you forward.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.25)",
  },
  {
    id: "companion",
    emoji: "💜",
    label: "Companion",
    desc: "Deep connection, emotional support — always in your corner.",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.1)",
    border: "rgba(192,132,252,0.25)",
  },
];

export default function OnboardingMode() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [selected, setSelected] = useState(
    localStorage.getItem("unfiltr_relationship_mode") || "friend"
  );

  const handleNext = () => {
    localStorage.setItem("unfiltr_relationship_mode", selected);
    updateOnboardingStore({ relationshipMode: selected });
    navigate("/onboarding/vibe");
  };

  return (
    <OnboardingLayout
      totalSteps={7} step={5}
      onBack={() => navigate("/onboarding/quiz")}
      canAdvance={true}
      onNext={handleNext}>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 20px 32px" }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Your dynamic
          </p>
          <h2 style={{ color: "white", fontWeight: 900, fontSize: 24, margin: "0 0 6px", lineHeight: 1.3 }}>
            How should they be with you?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
            This shapes how your companion talks to you. You can always change it later.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MODES.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(mode.id)}
              style={{
                width: "100%", padding: "18px 20px", borderRadius: 18,
                background: selected === mode.id ? mode.bg : "rgba(255,255,255,0.04)",
                border: `2px solid ${selected === mode.id ? mode.color : "rgba(255,255,255,0.08)"}`,
                cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 16,
                boxShadow: selected === mode.id ? `0 0 24px ${mode.bg}` : "none",
              }}>

              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: selected === mode.id ? mode.bg : "rgba(255,255,255,0.06)",
                border: `1.5px solid ${selected === mode.id ? mode.border : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, transition: "all 0.2s",
              }}>
                {mode.emoji}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  color: selected === mode.id ? "white" : "rgba(255,255,255,0.75)",
                  fontWeight: 800, fontSize: 16, marginBottom: 3, transition: "color 0.2s",
                }}>
                  {mode.label}
                </div>
                <div style={{
                  color: selected === mode.id ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)",
                  fontSize: 13, lineHeight: 1.4, transition: "color 0.2s",
                }}>
                  {mode.desc}
                </div>
              </div>

              {selected === mode.id && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: mode.color, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12,
                  }}>
                  ✓
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
}
