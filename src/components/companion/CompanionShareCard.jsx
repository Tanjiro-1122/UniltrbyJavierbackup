import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2 } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";

export default function CompanionShareCard({ visible, onClose, companionId, companionName, daysTogether }) {
  if (!visible) return null;

  const comp = COMPANIONS.find(c => c.id === companionId) || COMPANIONS[0];

  const handleShare = async () => {
    const text = `Meet my AI bestie ${comp.name} ${comp.emoji} — we've been vibing for ${daysTogether || "?"} days on Unfiltr! 💜\n\nGet yours: unfiltrbyjavier.base44.app`;
    if (navigator.share) {
      await navigator.share({ title: `Meet ${comp.name}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", maxWidth: 340 }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="white" />
            </button>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #7c3aed, #db2777)",
            borderRadius: 24, padding: "32px 24px", textAlign: "center",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{
              width: 100, height: 100, borderRadius: 20, overflow: "hidden",
              margin: "0 auto 16px", border: "3px solid rgba(255,255,255,0.3)",
            }}>
              <img src={comp.avatar} alt={comp.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Meet my AI bestie</p>
            <h2 style={{ color: "white", fontWeight: 900, fontSize: 24, margin: "0 0 4px" }}>
              {comp.emoji} {companionName || comp.name}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 4 }}>{comp.tagline}</p>
            {daysTogether > 0 && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "8px 0 0" }}>
                {daysTogether} days together 💜
              </p>
            )}
            <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>💜</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>Unfiltr</span>
            </div>
          </div>

          <button onClick={handleShare}
            style={{
              width: "100%", padding: "14px", marginTop: 12,
              background: "white", border: "none", borderRadius: 14,
              color: "#1a0a2e", fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            <Share2 size={16} /> Share
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}