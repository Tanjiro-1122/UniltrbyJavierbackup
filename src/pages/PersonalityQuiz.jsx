import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";
import { motion } from "framer-motion";
import { ChevronLeft, Share2 } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";
import AppShell from "@/components/shell/AppShell";

const QUESTIONS = [
  {
    q: "It's Friday night. What sounds best?",
    options: [
      { label: "Cozy movie night 🎬", scores: { luna: 3, river: 2, sage: 1 } },
      { label: "Going OUT tonight 🔥", scores: { kai: 3, nova: 2, zara: 1 } },
      { label: "Gaming or anime 🎮", scores: { ash: 3, ryuu: 2, sakura: 1 } },
      { label: "Reading & journaling 📖", scores: { sage: 3, river: 2, luna: 1 } },
    ],
  },
  {
    q: "Your friend is having a bad day. You...",
    options: [
      { label: "Listen and give a hug 🫂", scores: { luna: 3, river: 2 } },
      { label: "Pump them up with energy! 💪", scores: { kai: 3, nova: 2 } },
      { label: "Make them laugh 😂", scores: { ash: 3, sakura: 2 } },
      { label: "Give thoughtful advice 🧠", scores: { sage: 3, ryuu: 2 } },
    ],
  },
  {
    q: "Pick a vibe:",
    options: [
      { label: "Sunset beach 🌅", scores: { river: 3, luna: 2 } },
      { label: "Neon city lights 🌆", scores: { zara: 3, nova: 2 } },
      { label: "Mountain peak 🏔️", scores: { kai: 3, ryuu: 2 } },
      { label: "Cherry blossom garden 🌸", scores: { sakura: 3, sage: 2 } },
    ],
  },
  {
    q: "What do people love about you?",
    options: [
      { label: "I'm warm and caring 💜", scores: { luna: 3, sakura: 1 } },
      { label: "I'm fearless and bold ⚡", scores: { kai: 3, zara: 1 } },
      { label: "I'm funny and chill 😎", scores: { ash: 3, nova: 1 } },
      { label: "I'm wise beyond my years 🌙", scores: { sage: 3, ryuu: 1 } },
    ],
  },
  {
    q: "Pick a superpower:",
    options: [
      { label: "Read emotions 💫", scores: { luna: 2, river: 3 } },
      { label: "Super strength 💥", scores: { kai: 2, ryuu: 3 } },
      { label: "Time travel ⏳", scores: { nova: 3, sage: 2 } },
      { label: "Invisibility 👻", scores: { ash: 2, zara: 3 } },
    ],
  },
];

export default function PersonalityQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({});
  const [result, setResult] = useState(null);

  const handleAnswer = (option) => {
    const newScores = { ...scores };
    Object.entries(option.scores || {}).forEach(([id, pts]) => {
      newScores[id] = (newScores[id] || 0) + pts;
    });
    setScores(newScores);

    if (step >= QUESTIONS.length - 1) {
      // Calculate result
      const winnerId = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0]?.[0];
      const match = COMPANIONS.find(c => c.id === winnerId) || COMPANIONS[0];
      // Save to onboarding store so OnboardingVibe doesn't redirect back
      updateOnboardingStore({ selectedCompanion: match.id });
      localStorage.setItem("unfiltr_quiz_companion_id", match.id);
      setResult(match);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("unfiltr_quiz_companion_id", "manual");
    navigate("/onboarding/companion");
  };

  const handleShare = async () => {
    const text = `I got ${result.name} ${result.emoji} as my perfect AI companion on Unfiltr! 💜\n\nTake the quiz: unfiltrbyjavier.base44.app`;
    if (navigator.share) {
      await navigator.share({ title: "My Unfiltr Match", text });
    } else {
      await navigator.clipboard.writeText(text);
      // Clipboard copied silently
      
    }
  };

  return (
    <AppShell tabs={false} bg="linear-gradient(180deg, #1a0533 0%, #0d0220 100%)">
      <div style={{ flexShrink: 0, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={18} color="white" />
        </button>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 18, margin: 0, flex: 1 }}>Companion Quiz</h1>
        {/* Skip quiz — only show during questions, not on result screen */}
        {!result && (
          <button
            onClick={handleSkip}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(168,85,247,0.7)", fontSize: 13, fontWeight: 600,
              padding: "4px 8px", textDecoration: "underline",
            }}>
            Skip
          </button>
        )}
      </div>

      <div className="scroll-area" style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {!result ? (
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} style={{ width: "100%", maxWidth: 400 }}>
            {/* Progress */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
              {QUESTIONS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "linear-gradient(90deg, #7c3aed, #db2777)" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <p style={{ color: "white", fontWeight: 800, fontSize: 22, marginBottom: 20, lineHeight: 1.4 }}>
              {QUESTIONS[step].q}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUESTIONS[step].options.map((opt, i) => (
                <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => handleAnswer(opt)}
                  style={{
                    padding: "16px", borderRadius: 16, width: "100%",
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                    color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer", textAlign: "left",
                  }}>
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", width: "100%", maxWidth: 360 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Your perfect match is</p>
            <div style={{
              width: 120, height: 120, borderRadius: 24, overflow: "hidden",
              margin: "0 auto 16px", border: "3px solid #a855f7",
              boxShadow: "0 0 40px rgba(168,85,247,0.4)",
            }}>
              <img src={result.avatar} alt={result.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
            <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px" }}>
              {result.emoji} {result.name}
            </h2>
            <p style={{ color: "#c084fc", fontSize: 14, fontWeight: 600, marginBottom: 24 }}>{result.tagline}</p>

            <button onClick={handleShare}
              style={{
                width: "100%", padding: "14px", borderRadius: 16, border: "none",
                background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "white",
                fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              <Share2 size={16} /> Share Result
            </button>
            <button onClick={() => navigate("/onboarding/vibe")}
              style={{
                width: "100%", padding: "14px", borderRadius: 16,
                background: "rgba(255,255,255,0.08)", border: "none",
                color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer",
              }}>
              Chat with {result.name} →
            </button>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
