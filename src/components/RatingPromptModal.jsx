import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/app/unfiltr/id000000000"; // replace with real ID

export default function RatingPromptModal({ visible, onClose }) {
  const handleRate = () => {
    window.open(APP_STORE_URL, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 340,
              background: "linear-gradient(180deg, #1e0d3a 0%, #130825 100%)",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 24, padding: "28px 24px",
              textAlign: "center",
              boxShadow: "0 0 60px rgba(168,85,247,0.2)",
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={14} color="rgba(255,255,255,0.4)" />
            </button>

            {/* Stars */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={28} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>

            <h3 style={{ color: "white", fontWeight: 800, fontSize: 20, margin: "0 0 10px" }}>
              Loving Unfiltr? ⭐
            </h3>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              Rate us on the App Store — it takes 5 seconds and means the world to us 🙏
            </p>

            <button
              onClick={handleRate}
              style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                border: "none", borderRadius: 14, color: "white",
                fontWeight: 700, fontSize: 15, cursor: "pointer",
                marginBottom: 10,
                boxShadow: "0 0 20px rgba(168,85,247,0.35)",
              }}
            >
              Rate Now ✨
            </button>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "12px",
                background: "rgba(255,255,255,0.05)", border: "none",
                borderRadius: 14, color: "rgba(255,255,255,0.35)",
                fontWeight: 500, fontSize: 14, cursor: "pointer",
              }}
            >
              Maybe Later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}