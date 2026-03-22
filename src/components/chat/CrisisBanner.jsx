import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone } from "lucide-react";

export default function CrisisBanner({ visible, onDismiss }) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{
          flexShrink: 0,
          margin: "0 12px 8px",
          background: "linear-gradient(135deg, rgba(220,38,38,0.2), rgba(168,85,247,0.15))",
          border: "1px solid rgba(220,38,38,0.35)",
          borderRadius: 16,
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>💜 You're not alone</span>
          <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <X size={14} color="rgba(255,255,255,0.4)" />
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5, margin: "0 0 10px" }}>
          If you're going through a tough time, please reach out to someone who can help.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="tel:988" style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 12,
            background: "rgba(220,38,38,0.25)", border: "1px solid rgba(220,38,38,0.4)",
            color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}>
            <Phone size={14} /> Call 988
          </a>
          <a href="sms:741741&body=HELLO" style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 12,
            background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)",
            color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}>
            💬 Text 741741
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}