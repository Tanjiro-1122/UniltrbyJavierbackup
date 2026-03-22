import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

const SPLASH_IMAGE = 'https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png';

// Tutorial slides — show what each onboarding step looks like
const TUTORIAL_SLIDES = [
  {
    title: "Give It a Name",
    description: "Pick a name for your companion — something that feels personal to you.",
    color: "#7c3aed",
    screen: (
      <div style={{
        background: "linear-gradient(180deg, #06020f 0%, #1a0535 100%)",
        borderRadius: 16, padding: "24px 20px", border: "1px solid rgba(168,85,247,0.3)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0, letterSpacing: 2 }}>STEP 2 OF 5</p>
        <h3 style={{ color: "white", fontWeight: 800, fontSize: 18, margin: 0, textAlign: "center" }}>Give your companion a name</h3>
        <div style={{
          width: "100%", padding: "14px 16px",
          background: "rgba(168,85,247,0.1)", border: "2px solid rgba(168,85,247,0.5)",
          borderRadius: 14, color: "white", fontSize: 16, textAlign: "center",
        }}>Luna ✨</div>
        <div style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg, #7c3aed, #db2777)",
          borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, textAlign: "center",
        }}>Next →</div>
      </div>
    ),
  },
  {
    title: "Pick a Background",
    description: "Choose the world your companion lives in — cozy cabin, cyberpunk city, enchanted forest and more.",
    color: "#a855f7",
    screen: (
      <div style={{
        background: "linear-gradient(180deg, #06020f 0%, #1a0535 100%)",
        borderRadius: 16, padding: "20px 16px", border: "1px solid rgba(168,85,247,0.3)",
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 10px", letterSpacing: 2, textAlign: "center" }}>STEP 3 OF 5</p>
        <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: "0 0 12px", textAlign: "center" }}>Choose a background</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {["🏠 Cozy", "🌆 City", "🌲 Forest", "🏖️ Beach", "🚀 Space", "☕ Café"].map((bg, i) => (
            <div key={i} style={{
              padding: "10px 4px", borderRadius: 10, textAlign: "center",
              background: i === 0 ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${i === 0 ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.1)"}`,
              color: "white", fontSize: 11, fontWeight: 600,
            }}>{bg}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Set Your Mood",
    description: "Tell your companion how you're feeling. They'll match your energy every time.",
    color: "#db2777",
    screen: (
      <div style={{
        background: "linear-gradient(180deg, #06020f 0%, #1a0535 100%)",
        borderRadius: 16, padding: "20px 16px", border: "1px solid rgba(168,85,247,0.3)",
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 10px", letterSpacing: 2, textAlign: "center" }}>STEP 5 OF 5</p>
        <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: "0 0 14px", textAlign: "center" }}>What's your vibe today?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { emoji: "😊", label: "Happy", color: "#22c55e", active: false },
            { emoji: "😌", label: "Chill", color: "#a855f7", active: true },
            { emoji: "😔", label: "Sad", color: "#3b82f6", active: false },
          ].map((v, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderRadius: 14,
              background: v.active ? `${v.color}22` : "rgba(255,255,255,0.04)",
              border: `2px solid ${v.active ? v.color : "rgba(255,255,255,0.08)"}`,
            }}>
              <span style={{ fontSize: 22 }}>{v.emoji}</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{v.label}</span>
              {v.active && <span style={{ marginLeft: "auto", color: v.color, fontWeight: 800 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Start Chatting",
    description: "Your companion is ready. Real conversations, no filters — whenever you need them.",
    color: "#7c3aed",
    screen: (
      <div style={{
        background: "linear-gradient(180deg, #06020f 0%, #1a0535 100%)",
        borderRadius: 16, padding: "20px 16px", border: "1px solid rgba(168,85,247,0.3)",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{
            background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: "16px 16px 16px 4px", padding: "10px 14px",
            color: "white", fontSize: 13, maxWidth: "80%",
          }}>Hey! I'm Luna 🌙 — what's on your mind?</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{
            background: "rgba(219,39,119,0.2)", border: "1px solid rgba(219,39,119,0.3)",
            borderRadius: "16px 16px 4px 16px", padding: "10px 14px",
            color: "white", fontSize: 13, maxWidth: "80%",
          }}>I just needed someone to talk to 💜</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{
            background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: "16px 16px 16px 4px", padding: "10px 14px",
            color: "white", fontSize: 13, maxWidth: "80%",
          }}>I'm here. Always. Tell me everything 💜</div>
        </div>
      </div>
    ),
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

        {/* Screen preview */}
        <div style={{ marginBottom: 16 }}>
          {current.screen}
        </div>

        {/* Content */}
        <h2 style={{
          color: "white", fontWeight: 800, fontSize: 20,
          textAlign: "center", margin: "0 0 8px",
        }}>
          {current.title}
        </h2>
        <p style={{
          color: "rgba(255,255,255,0.6)", fontSize: 13,
          textAlign: "center", lineHeight: 1.6, margin: "0 0 24px",
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
    navigate("/onboarding/consent");
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
