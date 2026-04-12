import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    id: "mic",
    emoji: "🎤",
    title: "Talk instead of type",
    desc: "Tap the mic button at the bottom left to speak your message — your voice, no filter.",
    position: "bottom",
    arrowDir: "down",
  },
  {
    id: "breathing",
    emoji: "🫁",
    title: "Breathing exercises",
    desc: "Feeling overwhelmed or anxious? Tap the wind icon in the top bar for a guided breathing exercise.",
    position: "top",
    arrowDir: "up",
  },
  {
    id: "world",
    emoji: "🌍",
    title: "Change your world",
    desc: "Go to Settings → Background to change your environment — beach, cabin, space, and more.",
    position: "top",
    arrowDir: "up",
  },
  {
    id: "starters",
    emoji: "✨",
    title: "Conversation starters",
    desc: "Not sure what to say? The suggestion chips above the input bar get things flowing instantly.",
    position: "bottom",
    arrowDir: "down",
  },
  {
    id: "personality",
    emoji: "🎛️",
    title: "Shape your companion",
    desc: "This is the big one — go to Settings → Personality to tune exactly how your companion talks to you. Humor, empathy, vibe, curiosity, style. No other app does this.",
    position: "center",
    arrowDir: null,
  },
  {
    id: "done",
    emoji: "💜",
    title: "You're all set",
    desc: "That's everything. Your companion is here whenever you need them — no scripts, no judgment.",
    position: "center",
    arrowDir: null,
  },
];

export default function ChatWalkthrough({ userName, onDone }) {
  const [phase, setPhase] = useState("welcome"); // welcome | tour | done
  const [stepIdx, setStepIdx] = useState(0);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("unfiltr_walkthrough_done", "true");
      onDone();
    } else {
      setStepIdx(i => i + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("unfiltr_walkthrough_done", "true");
    onDone();
  };

  // ── WELCOME SCREEN ───────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(6,2,15,0.92)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 28px",
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            style={{
              background: "linear-gradient(160deg, rgba(124,58,237,0.22) 0%, rgba(219,39,119,0.12) 100%)",
              border: "1px solid rgba(168,85,247,0.35)",
              borderRadius: 28,
              padding: "36px 28px",
              width: "100%",
              maxWidth: 340,
              textAlign: "center",
              boxShadow: "0 0 80px rgba(124,58,237,0.25), 0 30px 80px rgba(0,0,0,0.7)",
            }}
          >
            {/* Animated triquetra glyph */}
            <div style={{ marginBottom: 20 }}>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
                  <path d="M50 15 C30 15 15 30 15 50 C15 65 25 77 38 82 C28 72 25 58 30 45 C35 32 46 25 50 15Z" stroke="#a855f7" strokeWidth="2.5" fill="none"/>
                  <path d="M50 15 C54 25 65 32 70 45 C75 58 72 72 62 82 C75 77 85 65 85 50 C85 30 70 15 50 15Z" stroke="#a855f7" strokeWidth="2.5" fill="none"/>
                  <path d="M38 82 C42 86 46 88 50 88 C54 88 58 86 62 82 C58 78 54 76 50 76 C46 76 42 78 38 82Z" stroke="#a855f7" strokeWidth="2.5" fill="none"/>
                  <circle cx="50" cy="50" r="6" stroke="#a855f7" strokeWidth="2" fill="rgba(168,85,247,0.2)"/>
                </svg>
              </motion.div>
            </div>

            <h2 style={{
              color: "white", fontWeight: 800, fontSize: 22,
              margin: "0 0 10px", letterSpacing: "-0.3px",
            }}>
              Hey {userName || "there"} 👋
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.55)", fontSize: 15,
              lineHeight: 1.6, margin: "0 0 28px",
            }}>
              Want a quick tour of everything here for you, or ready to just dive in?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setPhase("tour")}
                style={{
                  width: "100%", padding: "15px",
                  background: "linear-gradient(135deg, #7c3aed, #db2777)",
                  border: "none", borderRadius: 14,
                  color: "white", fontWeight: 700, fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                }}
              >
                Show me around ✨
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSkip}
                style={{
                  width: "100%", padding: "14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Just dive in
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── TOUR STEPS ───────────────────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(6,2,15,0.88)",
          backdropFilter: "blur(6px)",
          display: "flex", flexDirection: "column",
          alignItems: "center",
          justifyContent: step.position === "bottom" ? "flex-end"
                        : step.position === "top"    ? "flex-start"
                        : "center",
          padding: step.position === "bottom" ? "0 24px 140px"
                 : step.position === "top"    ? "max(80px,env(safe-area-inset-top)) 24px 0"
                 : "0 24px",
          pointerEvents: "none",
        }}
      >
        {/* Arrow pointing up toward header icons */}
        {step.arrowDir === "up" && (
          <motion.div
            animate={{ y: [-6, 0, -6] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            style={{ marginBottom: 12, pointerEvents: "none" }}
          >
            <span style={{ fontSize: 28 }}>☝️</span>
          </motion.div>
        )}

        {/* Step card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.94 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          style={{
            background: "linear-gradient(160deg, rgba(124,58,237,0.2) 0%, rgba(219,39,119,0.1) 100%)",
            border: "1px solid rgba(168,85,247,0.4)",
            borderRadius: 24,
            padding: "24px 22px",
            width: "100%",
            maxWidth: 340,
            textAlign: "center",
            boxShadow: "0 0 60px rgba(124,58,237,0.2), 0 20px 60px rgba(0,0,0,0.6)",
            pointerEvents: "all",
          }}
        >
          {/* Step counter */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === stepIdx ? 20 : 6,
                height: 6, borderRadius: 3,
                background: i === stepIdx ? "#a855f7" : "rgba(255,255,255,0.15)",
                transition: "all 0.3s",
              }} />
            ))}
          </div>

          <div style={{ fontSize: 38, marginBottom: 10 }}>{step.emoji}</div>

          <h3 style={{
            color: "white", fontWeight: 800, fontSize: 18,
            margin: "0 0 8px", letterSpacing: "-0.3px",
          }}>
            {step.title}
          </h3>
          <p style={{
            color: "rgba(255,255,255,0.6)", fontSize: 14,
            lineHeight: 1.6, margin: "0 0 20px",
          }}>
            {step.desc}
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSkip}
              style={{
                flex: 1, padding: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 13,
                cursor: "pointer",
              }}
            >
              Skip
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              style={{
                flex: 2, padding: "12px",
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                border: "none", borderRadius: 12,
                color: "white", fontWeight: 700, fontSize: 14,
                cursor: "pointer",
              }}
            >
              {isLast ? "Let's go 💜" : "Next →"}
            </motion.button>
          </div>
        </motion.div>

        {/* Arrow pointing down toward input bar */}
        {step.arrowDir === "down" && (
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            style={{ marginTop: 12, pointerEvents: "none" }}
          >
            <span style={{ fontSize: 28 }}>👇</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
