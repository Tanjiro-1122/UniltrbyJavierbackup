import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lock } from "lucide-react";

// Teaser snippets shown to free users — blurred out to create FOMO
const FREE_TEASERS = [
  "your favorite topics to talk about",
  "how you feel on tough days",
  "what makes you laugh",
  "the things that stress you out",
  "your goals and dreams",
];

/**
 * MemoryCard — shows what companion remembers (premium) or
 * a blurred teaser of what they WOULD remember (free).
 * Purely additive read-only component.
 */
export default function MemoryCard({ memorySummary, companionName, isPremium, onUpgrade }) {
  const [expanded, setExpanded] = useState(false);

  // Free user — show teaser with blurred locked items
  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        onClick={onUpgrade}
        style={{
          margin: "8px 16px 0",
          padding: "11px 14px",
          borderRadius: 14,
          background: "rgba(139,92,246,0.07)",
          border: "1px solid rgba(139,92,246,0.15)",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Brain size={13} color="#a855f7" />
          </div>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, margin: 0, flex: 1 }}>
            {companionName} forgets you after every chat
          </p>
          <span style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>Unlock</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {FREE_TEASERS.slice(0, 3).map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Lock size={9} color="rgba(168,85,247,0.4)" style={{ flexShrink: 0 }} />
              <p style={{
                color: "rgba(255,255,255,0.18)",
                fontSize: 11,
                margin: 0,
                filter: "blur(3.5px)",
                userSelect: "none",
                letterSpacing: "0.02em",
              }}>{t}</p>
            </div>
          ))}
        </div>
        <p style={{ color: "rgba(168,85,247,0.5)", fontSize: 10, margin: "8px 0 0", textAlign: "center" }}>
          ✨ Upgrade so {companionName} never forgets you
        </p>
      </motion.div>
    );
  }

  // Premium — show actual memories
  if (!memorySummary) return null;

  const lines = memorySummary
    .split(/[\n•\-]/)
    .map(l => l.trim())
    .filter(l => l.length > 10);
  const count = Math.max(lines.length, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ margin: "8px 16px 0" }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", padding: "10px 14px",
          borderRadius: expanded ? "14px 14px 0 0" : 14,
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.22)",
          borderBottom: expanded ? "1px solid transparent" : undefined,
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Brain size={14} color="#a855f7" />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: 0 }}>
            {companionName} remembers {count} thing{count !== 1 ? "s" : ""} about you
          </p>
        </div>
        <span style={{ color: "rgba(168,85,247,0.5)", fontSize: 13, display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.22)",
              borderTop: "none",
              borderRadius: "0 0 14px 14px",
              padding: "10px 14px 12px",
            }}>
              {lines.slice(0, 6).map((line, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                  <span style={{ color: "#a855f7", fontSize: 10, marginTop: 2, flexShrink: 0 }}>●</span>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{line}</p>
                </div>
              ))}
              {lines.length > 6 && (
                <p style={{ color: "rgba(168,85,247,0.4)", fontSize: 10, margin: "4px 0 0", textAlign: "center" }}>+{lines.length - 6} more memories</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
