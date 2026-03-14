import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2 } from "lucide-react";

export default function ShareCardModal({ visible, onClose, message, companionName, mood }) {
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
  };

  const gradient = moodGradients[mood] || moodGradients.neutral;

  const handleShare = async () => {
    const text = `"${message}"\n\n— ${companionName} on Unfiltr\n\nYour private AI companion 💜\nunfiltrbyjavier.base44.app`;
    if (navigator.share) {
      await navigator.share({ title: "Unfiltr", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  };

  if (!visible) return null;

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
                borderRadius: 24, padding: "32px 28px",
                marginBottom: 16, position: "relative", overflow: "hidden",
              }}
            >
              {/* Decorative orb */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(0,0,0,0.15)", pointerEvents: "none" }} />

              {/* Companion name */}
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {companionName} says
              </p>

              {/* Quote */}
              <p style={{ color: "white", fontSize: 18, fontWeight: 700, lineHeight: 1.55, margin: "0 0 24px", position: "relative", zIndex: 1 }}>
                "{message}"
              </p>

              {/* Branding */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14 }}>💜</span>
                </div>
                <div>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>Unfiltr</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>Your private AI companion</p>
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