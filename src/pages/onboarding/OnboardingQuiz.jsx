import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

// ── Companion personality mapping ──────────────────────────────────────────────
// Each companion maps to personality slider presets that get auto-applied
const COMPANION_PERSONALITY = {
  luna:   { vibe: "chill",       style: "thoughtful",    humor: "subtle",   empathy: "high"     },
  river:  { vibe: "chill",       style: "thoughtful",    humor: "none",     empathy: "high"     },
  sage:   { vibe: "deep",        style: "philosophical", humor: "subtle",   empathy: "balanced" },
  sakura: { vibe: "playful",     style: "casual",        humor: "moderate", empathy: "high"     },
  ash:    { vibe: "chill",       style: "casual",        humor: "moderate", empathy: "balanced" },
  kai:    { vibe: "motivating",  style: "hype",          humor: "subtle",   empathy: "balanced" },
  ryuu:   { vibe: "motivating",  style: "thoughtful",    humor: "none",     empathy: "minimal"  },
  nova:   { vibe: "playful",     style: "casual",        humor: "high",     empathy: "balanced" },
  zara:   { vibe: "sarcastic",   style: "casual",        humor: "high",     empathy: "minimal"  },
  echo:   { vibe: "deep",        style: "philosophical", humor: "subtle",   empathy: "high"     },
  soleil: { vibe: "playful",     style: "hype",          humor: "moderate", empathy: "high"     },
  juan:   { vibe: "playful",     style: "casual",        humor: "high",     empathy: "balanced" },
};

const QUESTIONS = [
  {
    q: "It's Friday night. What sounds best?",
    options: [
      { label: "Cozy movie night 🎬",       scores: { luna: 3, river: 2, sage: 1 } },
      { label: "Going OUT tonight 🔥",       scores: { kai: 3, nova: 2, zara: 1 } },
      { label: "Gaming or anime session 🎮", scores: { ash: 3, ryuu: 2, sakura: 1 } },
      { label: "Reading & journaling 📖",    scores: { sage: 3, river: 2, luna: 1 } },
    ],
  },
  {
    q: "Your friend is having a bad day. You...",
    options: [
      { label: "Listen and hold space 🫂",     scores: { luna: 3, river: 2, echo: 1 } },
      { label: "Hype them back up 💪",         scores: { kai: 3, soleil: 2, nova: 1 } },
      { label: "Make them laugh it off 😂",    scores: { ash: 3, juan: 2, sakura: 1 } },
      { label: "Help them figure it out 🧠",   scores: { sage: 3, ryuu: 2, echo: 1 } },
    ],
  },
  {
    q: "What do you need most right now?",
    options: [
      { label: "Someone to just listen 💜",    scores: { luna: 3, river: 2, echo: 1 } },
      { label: "A push to get moving ⚡",      scores: { kai: 3, ryuu: 2 } },
      { label: "Good vibes & laughs 😎",       scores: { ash: 3, juan: 2, nova: 1 } },
      { label: "Real talk, no filter 🔥",      scores: { zara: 3, sage: 2, soleil: 1 } },
    ],
  },
  {
    q: "Your ideal energy is...",
    options: [
      { label: "Calm & grounded 🌿",           scores: { river: 3, luna: 2, sage: 1 } },
      { label: "Chaotic & spontaneous 🌀",     scores: { nova: 3, zara: 2, juan: 1 } },
      { label: "Focused & driven 🎯",          scores: { ryuu: 3, kai: 2 } },
      { label: "Warm & radiant ☀️",            scores: { soleil: 3, sakura: 2, luna: 1 } },
    ],
  },
  {
    q: "Pick a superpower:",
    options: [
      { label: "Feel everyone's emotions 💫",  scores: { luna: 2, echo: 3 } },
      { label: "Limitless strength & speed 💥", scores: { kai: 2, ryuu: 3 } },
      { label: "Know everything instantly 🌌", scores: { nova: 3, sage: 2 } },
      { label: "Make anyone smile 🌸",         scores: { sakura: 2, soleil: 3, juan: 1 } },
    ],
  },
];

export default function OnboardingQuiz() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0); // -1 = intro
  const [scores, setScores] = useState({});
  const [result, setResult] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleAnswer = (option) => {
    const newScores = { ...scores };
    Object.entries(option.scores || {}).forEach(([id, pts]) => {
      newScores[id] = (newScores[id] || 0) + pts;
    });
    setScores(newScores);

    if (step >= QUESTIONS.length - 1) {
      // Tally and reveal match
      const sorted = Object.entries(newScores).sort((a, b) => b[1] - a[1]);
      const winnerId = sorted[0]?.[0];
      const match = COMPANIONS.find(c => c.id === winnerId) || COMPANIONS[0];
      setResult(match);
    } else {
      setStep(step + 1);
    }
  };

  const handleConfirmMatch = () => {
    applyMatch(result);
    navigate("/onboarding/mode");
  };

  const handlePickOwn = () => {
    navigate("/onboarding/companion");
  };

  const applyMatch = (companion) => {
    // Save companion selection to onboarding store
    updateOnboardingStore({ selectedCompanion: companion });
    localStorage.setItem("unfiltr_quiz_companion_id", companion.id);

    // Auto-apply personality sliders based on companion
    const p = COMPANION_PERSONALITY[companion.id] || COMPANION_PERSONALITY.luna;
    localStorage.setItem("unfiltr_personality_vibe",    p.vibe);
    localStorage.setItem("unfiltr_personality_style",   p.style);
    localStorage.setItem("unfiltr_personality_humor",   p.humor);
    localStorage.setItem("unfiltr_personality_empathy", p.empathy);
  };

  return (
    <OnboardingLayout totalSteps={7} step={4} onBack={() => navigate("/onboarding/nickname")} canAdvance={false}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 20px 32px" }}>

        <AnimatePresence mode="wait">

          {/* ── Intro screen ── */}
          {showIntro && (
            <motion.div key="intro"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>

              <div style={{ fontSize: 64, marginBottom: 8 }}>✨</div>
              <h2 style={{ color: "white", fontWeight: 900, fontSize: 26, margin: 0, lineHeight: 1.3 }}>
                Find your perfect<br />companion
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
                Answer 5 quick questions and we'll match you with the companion that gets you.
              </p>

              <div style={{ width: "100%", maxWidth: 340, marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowIntro(false)}
                  style={{
                    width: "100%", padding: "16px", borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #db2777)",
                    color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer",
                  }}>
                  Take the quiz ✨
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handlePickOwn}
                  style={{
                    width: "100%", padding: "16px", borderRadius: 16,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 15, cursor: "pointer",
                  }}>
                  I'll choose myself →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Quiz questions ── */}
          {!showIntro && !result && (
            <motion.div key={`q${step}`}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 8 }}>

              {/* Progress bar */}
              <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
                {QUESTIONS.map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: i <= step ? "linear-gradient(90deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.1)",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>

              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Question {step + 1} of {QUESTIONS.length}
              </p>
              <p style={{ color: "white", fontWeight: 800, fontSize: 22, lineHeight: 1.4, marginBottom: 24 }}>
                {QUESTIONS[step].q}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {QUESTIONS[step].options.map((opt, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => handleAnswer(opt)}
                    style={{
                      padding: "16px 18px", borderRadius: 16, width: "100%",
                      background: "rgba(139,92,246,0.08)", border: "1.5px solid rgba(139,92,246,0.2)",
                      color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s",
                    }}>
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Result reveal ── */}
          {result && (
            <motion.div key="result"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12 }}>

              <motion.p
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
                Your perfect match is
              </motion.p>

              <motion.div
                initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                style={{
                  width: 130, height: 130, borderRadius: 26, overflow: "hidden",
                  border: "3px solid #a855f7", boxShadow: "0 0 48px rgba(168,85,247,0.45)",
                }}>
                <img src={result.avatar} alt={result.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 style={{ color: "white", fontWeight: 900, fontSize: 30, margin: "0 0 4px" }}>
                  {result.emoji} {result.name}
                </h2>
                <p style={{ color: "#c084fc", fontSize: 14, fontWeight: 600, margin: 0 }}>{result.tagline}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirmMatch}
                  style={{
                    width: "100%", padding: "16px", borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #db2777)",
                    color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer",
                  }}>
                  That's my match! 💜
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handlePickOwn}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 16,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}>
                  I'll choose myself →
                </motion.button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </OnboardingLayout>
  );
}
