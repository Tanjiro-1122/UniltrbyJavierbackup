import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2 } from "lucide-react";

// Unfiltr logo — purple heart circle (inline SVG so it always works, no external deps)
function UnfiltrLogo({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "rgba(168,85,247,0.25)",
      border: "1.5px solid rgba(168,85,247,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.55 }}>💜</span>
    </div>
  );
}

export default function ShareCardModal({ visible, onClose, message, companionName, companionAvatar, mood }) {
  const cardRef = useRef(null);

  const moodGradients = {
    happy:       "linear-gradient(135deg, #7c3aed, #f59e0b)",
    neutral:     "linear-gradient(135deg, #7c3aed, #db2777)",
    sad:         "linear-gradient(135deg, #1e3a5f, #4b5563)",
    contentment: "linear-gradient(135deg, #065f46, #7c3aed)",
    surprise:    "linear-gradient(135deg, #db2777, #f59e0b)",
    anger:       "linear-gradient(135deg, #7f1d1d, #dc2626)",
    fear:        "linear-gradient(135deg, #1a0a2e, #4c1d95)",
    disgust:     "linear-gradient(135deg, #14532d, #365314)",
    fatigue:     "linear-gradient(135deg, #1e1b4b, #374151)",
    anxious:     "linear-gradient(135deg, #1e1b4b, #6d28d9)",
    excited:     "linear-gradient(135deg, #dc2626, #f97316)",
    hopeful:     "linear-gradient(135deg, #065f46, #7c3aed)",
  };

  const gradient = moodGradients[mood] || moodGradients.neutral;

  const handleShare = async () => {
    const text = `"${message}"\n\n— ${companionName || "Your companion"} on Unfiltr\n\nYour private AI companion 💜\nget it at: unfiltrbyjavier2.vercel.app`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${companionName || "Unfiltr"} says...`, text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
      }
    } catch(e) {
      // User cancelled share — that's fine
    }
  };

  if (!visible) return null;

  const displayName = companionName || "Your companion";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 360 }}
          >
            {/* Close */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="white" />
              </button>
            </div>

            {/* Card */}
            <div
              ref={cardRef}
              style={{
                background: gradient,
                borderRadius: 24, padding: "28px 24px 20px",
                marginBottom: 16, position: "relative", overflow: "hidden",
              }}
            >
              {/* Decorative orbs */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(0,0,0,0.15)", pointerEvents: "none" }} />

              {/* Companion identity row — avatar + name at TOP */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, position: "relative", zIndex: 1 }}>
                {companionAvatar ? (
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.25)",
                    background: "rgba(0,0,0,0.2)", flexShrink: 0,
                  }}>
                    <img src={companionAvatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom" }} />
                  </div>
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 20 }}>✨</span>
                  </div>
                )}
                <div>
                  <p style={{ color: "white", fontWeight: 800, fontSize: 15, margin: 0 }}>{displayName}</p>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0 }}>your AI companion</p>
                </div>
              </div>

              {/* Quote */}
              <p style={{ color: "white", fontSize: 17, fontWeight: 600, lineHeight: 1.6, margin: "0 0 20px", position: "relative", zIndex: 1 }}>
                "{message}"
              </p>

              {/* Unfiltr branding at bottom */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 14,
                position: "relative", zIndex: 1,
              }}>
                <UnfiltrLogo size={26} />
                <div>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 12, margin: 0 }}>Unfiltr by Javier</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, margin: 0 }}>Your private AI companion</p>
                </div>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                width: "100%", padding: "14px",
                background: "white", border: "none", borderRadius: 14,
                color: "#1a0a2e", fontWeight: 700, fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Share2 size={18} />
              Share this moment
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
