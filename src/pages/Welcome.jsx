import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

const SPLASH_IMAGE = 'https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png';

// Tutorial slides — screenshots of the onboarding flow with captions
const TUTORIAL_SLIDES = [
  {
    emoji: "👤",
    title: "Choose Your Name",
    description: "Start by telling us what you'd like to be called. Your companion will always know you by name.",
    color: "#7c3aed",
  },
  {
    emoji: "💜",
    title: "Pick Your Companion",
    description: "Browse 12 unique AI companions — each with their own personality, style, and energy. Find the one that feels right.",
    color: "#a855f7",
  },
  {
    emoji: "🌈",
    title: "Set Your Vibe",
    description: "Choose the mood that fits how you're feeling. Unfiltr adapts to your emotional state in real time.",
    color: "#db2777",
  },
  {
    emoji: "💬",
    title: "Start Chatting",
    description: "Your companion is ready. No scripts, no filters — just real, honest conversation whenever you need it.",
    color: "#7c3aed",
  },
];

function TutorialModal({ onClose }) {
  const [slide, setSlide] = useState(0);
  const current = TUTORIAL_SLIDES[slide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(6,2,15,0.95)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <motion.div
        key={slide}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: "100%", maxWidth: 380,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24, padding: "32px 24px",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "white",
          }}
        >
          <X size={16} />
        </button>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
          {TUTORIAL_SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slide ? 20 : 6, height: 6,
                borderRadius: 3,
                background: i === slide ? current.color : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        {/* Emoji */}
        <div style={{
          width: 90, height: 90, borderRadius: 24,
          background: `${current.color}22`,
          border: `2px solid ${current.color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, margin: "0 auto 24px",
        }}>
          {current.emoji}
        </div>

        {/* Content */}
        <h2 style={{
          color: "white", fontWeight: 800, fontSize: 22,
          textAlign: "center", margin: "0 0 12px",
        }}>
          {current.title}
        </h2>
        <p style={{
          color: "rgba(255,255,255,0.6)", fontSize: 14,
          textAlign: "center", lineHeight: 1.6, margin: "0 0 32px",
        }}>
          {current.description}
        </p>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10 }}>
          {slide > 0 && (
            <button
              onClick={() => setSlide(s => s - 1)}
              style={{
                flex: 1, padding: "14px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, color: "white", fontWeight: 600,
                fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={() => slide < TUTORIAL_SLIDES.length - 1 ? setSlide(s => s + 1) : onClose()}
            style={{
              flex: 2, padding: "14px",
              background: `linear-gradient(135deg, ${current.color}, #db2777)`,
              border: "none", borderRadius: 14,
              color: "white", fontWeight: 700, fontSize: 15,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {slide < TUTORIAL_SLIDES.length - 1 ? (
              <>Next <ChevronRight size={16} /></>
            ) : (
              "Got it! 🎉"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);

  const handleGetStarted = () => {
    navigate("/onboarding");
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at top, #1a0533 0%, #0d0520 40%, #06020f 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui, -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* Main content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(40px, env(safe-area-inset-top)) 24px 20px",
        textAlign: "center",
      }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 20 }}
        >
          <img
            src={SPLASH_IMAGE}
            alt="Unfiltr"
            style={{ width: 110, height: 110, objectFit: "contain" }}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1 style={{
            color: "white", fontWeight: 900, fontSize: 36,
            margin: "0 0 8px", letterSpacing: -0.5,
          }}>
            Unfiltr
          </h1>
          <p style={{
            color: "rgba(196,180,252,0.7)", fontSize: 15,
            margin: "0 0 32px", lineHeight: 1.5,
          }}>
            Your private AI companion.<br />Always here. Never judging.
          </p>
        </motion.div>

        {/* Main CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* Meet Your Companion */}
          <button
            onClick={handleGetStarted}
            style={{
              width: "100%", padding: "18px",
              background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
              border: "none", borderRadius: 18,
              color: "white", fontWeight: 800, fontSize: 17,
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(168,85,247,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            💜 Meet Your Companion
          </button>

          {/* How It Works */}
          <button
            onClick={() => setShowTutorial(true)}
            style={{
              width: "100%", padding: "16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 18,
              color: "white", fontWeight: 600, fontSize: 15,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            📖 How It Works
          </button>

          {/* Pricing */}
          <button
            onClick={() => navigate("/Pricing")}
            style={{
              width: "100%", padding: "16px",
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 18,
              color: "rgba(196,180,252,0.85)", fontWeight: 600, fontSize: 15,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            ✨ View Plans &amp; Pricing
          </button>
        </motion.div>
      </div>

      {/* Bottom legal footer — always visible */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          padding: "16px 24px max(24px, env(safe-area-inset-bottom))",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 8 }}>
          <button
            onClick={() => navigate("/PrivacyPolicy")}
            style={{ background: "none", border: "none", color: "rgba(168,85,247,0.7)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => navigate("/TermsOfUse")}
            style={{ background: "none", border: "none", color: "rgba(168,85,247,0.7)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
          >
            Terms of Use
          </button>
          <button
            onClick={() => navigate("/Pricing")}
            style={{ background: "none", border: "none", color: "rgba(168,85,247,0.7)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
          >
            Pricing
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>
          © 2026 Unfiltr. All rights reserved.
        </p>
      </motion.div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
    </div>
  );
}
