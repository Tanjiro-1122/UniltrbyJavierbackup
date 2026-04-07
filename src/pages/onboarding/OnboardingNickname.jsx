import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

// Fun placeholder prompts that cycle so the input feels alive
const PLACEHOLDERS = [
  c => `Keep it as ${c}`,
  c => `e.g. "Star"`,
  c => `e.g. "My ${c}"`,
  c => `Whatever feels right ✨`,
];

export default function OnboardingNickname() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [nickname, setNickname] = useState(store.companionNickname || "");
  const [phIdx, setPhIdx] = useState(0);
  const [focused, setFocused] = useState(false);

  if (!store.selectedCompanion) {
    navigate("/onboarding/companion", { replace: true }); // no companion selected — let them pick
    return null;
  }

  const companion = COMPANIONS.find(c => c.id === store.selectedCompanion);
  const displayName = nickname.trim() || companion?.name || "your companion";

  // Cycle placeholder every 2.5s when not focused
  useEffect(() => {
    if (focused) return;
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 2500);
    return () => clearInterval(t);
  }, [focused]);

  const handleNext = () => {
    updateOnboardingStore({ companionNickname: nickname.trim() || companion?.name || "" });
    navigate("/onboarding/vibe");
  };

  return (
    <OnboardingLayout totalSteps={7} step={4} onBack={() => navigate("/onboarding/quiz")} onNext={handleNext} canAdvance={true}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 20px 32px" }}>

        {/* Companion hero — big and front and center */}
        {companion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, marginTop: 4 }}>

            {/* Glow + avatar */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <div style={{
                position: "absolute", inset: -20,
                background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
                filter: "blur(10px)", borderRadius: "50%",
              }} />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                style={{
                  width: 130, height: 130, borderRadius: 26, overflow: "hidden",
                  border: "2.5px solid rgba(168,85,247,0.5)",
                  boxShadow: "0 12px 40px rgba(168,85,247,0.3)",
                  position: "relative",
                }}>
                <img src={companion.avatar} alt={companion.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
              </motion.div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{companion.emoji}</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 }}>{companion.tagline}</span>
            </div>
          </motion.div>
        )}

        {/* Text */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ color: "white", fontWeight: 900, fontSize: 24, margin: "0 0 6px", lineHeight: 1.3 }}>
            What do you want<br />to call them?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>
            This is how they'll introduce themselves.<br />
            Make it yours. 💜
          </p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{
            position: "relative",
            border: `2px solid ${focused ? "rgba(168,85,247,0.7)" : "rgba(139,92,246,0.2)"}`,
            borderRadius: 18, overflow: "hidden", transition: "border-color 0.2s",
            background: focused ? "rgba(168,85,247,0.08)" : "rgba(139,92,246,0.06)",
            boxShadow: focused ? "0 0 24px rgba(168,85,247,0.15)" : "none",
          }}>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNext()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={PLACEHOLDERS[phIdx](companion?.name || "them")}
              maxLength={20}
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "16px 20px", background: "transparent",
                color: "white", fontSize: 18, fontWeight: 700,
                border: "none", outline: "none", caretColor: "#a855f7",
                textAlign: "center", letterSpacing: "0.02em",
              }}
            />
          </div>

          {/* Live preview */}
          <motion.p
            key={displayName}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            style={{ color: "rgba(168,85,247,0.7)", fontSize: 13, textAlign: "center", margin: "10px 0 0", fontWeight: 600 }}>
            {nickname.trim()
              ? `✨ They'll go by "${nickname.trim()}"`
              : `✨ They'll go by "${companion?.name}" by default`}
          </motion.p>
        </motion.div>

      </div>
    </OnboardingLayout>
  );
}
