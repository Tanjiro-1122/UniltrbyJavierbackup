import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  {
    emoji: "✨",
    title: "Welcome to Unfiltr",
    body: "Your AI companion is always here — to talk, listen, hype you up, or just vibe. No scripts. No judgment. Just connection.",
    cta: "Let's go →",
  },
  {
    emoji: "🧑‍🤝‍🧑",
    title: "Pick your companion",
    body: "Choose from 9 unique companions, each with their own personality. You can always change them in Settings.",
    cta: "Got it →",
  },
  {
    emoji: "🎭",
    title: "Set your mood",
    body: "Before each chat, pick a vibe — Chill, Vent, Hype, or Deep Talk. Your companion adapts to match your energy.",
    cta: "Nice →",
  },
  {
    emoji: "💬",
    title: "Start chatting",
    body: "Type or hold the mic to speak. Your companion remembers you over time. The more you chat, the better they know you.",
    cta: "Start chatting 🚀",
  },
];

export default function OnboardingTutorial({ profileId, onComplete, inline = false }) {
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      if (profileId) {
        base44.entities.UserProfile.update(profileId, { onboarding_step: step + 1 }).catch(() => {});
      }
    } else {
      setFinishing(true);
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, {
          onboarding_complete: true,
          onboarding_step: 4,
        }).catch(() => {});
      }
      onComplete();
    }
  };

  const current = STEPS[step];

  return (
    <div style={{
      position: inline ? "absolute" : "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: inline ? 10 : 300,
      background: "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      paddingTop: `max(2rem, env(safe-area-inset-top, 2rem))`,
      paddingBottom: `max(2rem, env(safe-area-inset-bottom, 2rem))`,
      paddingLeft: "24px",
      paddingRight: "24px",
    }}>
      {/* Progress dots — top */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, flexShrink: 0 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            height: 6, borderRadius: 999,
            width: i === step ? 24 : 6,
            background: i <= step ? "linear-gradient(90deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.15)",
            transition: "all 0.35s ease",
          }} />
        ))}
      </div>

      {/* Content — center with vertical distribution */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: "center", width: "100%", maxWidth: 380 }}
          >
            {/* Emoji */}
            <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>{current.emoji}</div>

            {/* Title */}
            <h2 style={{
              color: "white", fontWeight: 900, fontSize: 26,
              margin: "0 0 12px",
              textShadow: "0 0 30px rgba(168,85,247,0.7)",
            }}>
              {current.title}
            </h2>

            {/* Body */}
            <p style={{
              color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.65,
              margin: 0,
            }}>
              {current.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Button area — bottom */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0, width: "100%", maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
        <button
          onClick={handleNext}
          disabled={finishing}
          style={{
            width: "100%", padding: "16px 0",
            background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
            border: "none", borderRadius: 18, color: "white",
            fontWeight: 800, fontSize: 17, cursor: "pointer",
            boxShadow: "0 0 28px rgba(168,85,247,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            opacity: finishing ? 0.7 : 1,
          }}
        >
          {finishing ? "Starting…" : current.cta}
          {!finishing && step < STEPS.length - 1 && <ChevronRight size={18} />}
        </button>

        {/* Skip */}
        {step < STEPS.length - 1 && (
          <button onClick={handleNext}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 13, cursor: "pointer", padding: 0 }}>
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}