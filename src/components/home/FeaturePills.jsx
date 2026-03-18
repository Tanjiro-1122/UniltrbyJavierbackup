import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mic, Sparkles, Heart, Brain, Palette } from "lucide-react";

const FEATURES = [
  { icon: MessageCircle, label: "Deep convos", color: "#a855f7" },
  { icon: Mic, label: "Voice chat", color: "#6366f1" },
  { icon: Sparkles, label: "9 companions", color: "#db2777" },
  { icon: Heart, label: "No judgement", color: "#f472b6" },
  { icon: Brain, label: "Remembers you", color: "#8b5cf6" },
  { icon: Palette, label: "Custom vibes", color: "#c084fc" },
];

export default function FeaturePills() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8,
      width: "100%",
      marginBottom: 20,
    }}>
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            borderRadius: 14,
            padding: "12px 4px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <f.icon size={16} style={{ color: f.color, filter: `drop-shadow(0 0 6px ${f.color}66)` }} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 600, letterSpacing: "0.2px" }}>
            {f.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}