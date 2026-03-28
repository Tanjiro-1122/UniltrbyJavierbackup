import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";

/**
 * MemoryCard — shows "Luna remembers X things about you"
 * Parses the memory_summary string to count remembered facts.
 * Purely additive — just reads from localStorage/profile, never writes.
 */
export default function MemoryCard({ memorySummary, companionName, isPremium, onUpgrade }) {
  const [expanded, setExpanded] = useState(false);

  if (!memorySummary && !isPremium) return null;

  // Count bullet points / sentences as distinct memories
  const lines = memorySummary
    ? memorySummary.split(/[\n•\-]/).map(l => l.trim()).filter(l => l.length > 10)
    : [];
  const count = Math.max(lines.length, memorySummary ? 3 : 0);

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        onClick={onUpgrade}
        style={{
          margin: "8px 16px 0",
          padding: "10px 14px",
          borderRadius: 14,
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.18)",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Brain size={14} color="#a855f7" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, margin: 0 }}>
            🔒 Memory locked
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "1px 0 0" }}>
            Upgrade so {companionName} can remember you
          </p>
        </div>
        <span style={{ color: "#a855f7", fontSize: 11, fontWeight: 700 }}>Unlock →</span>
      </motion.div>
    );
  }

  if (!memorySummary || count === 0) return null;

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
          borderBottom: expanded ? "none" : undefined,
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
        <span style={{ color: "rgba(168,85,247,0.6)", fontSize: 13, transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "rgba(139,92,246,0.07)",
              border: "1px solid rgba(139,92,246,0.22)",
              borderTop: "none",
              borderRadius: "0 0 14px 14px",
              padding: "10px 14px 12px",
            }}>
              {lines.slice(0, 6).map((line, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                  <span style={{ color: "#a855f7", fontSize: 10, marginTop: 2, flexShrink: 0 }}>●</span>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>{line}</p>
                </div>
              ))}
              {lines.length > 6 && (
                <p style={{ color: "rgba(168,85,247,0.5)", fontSize: 10, margin: "4px 0 0", textAlign: "center" }}>+{lines.length - 6} more memories</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
