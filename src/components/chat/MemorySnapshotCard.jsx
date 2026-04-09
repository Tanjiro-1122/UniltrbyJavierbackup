import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Lock } from "lucide-react";

// ── MemorySnapshotCard ────────────────────────────────────────────────────────
// A warm teaser shown on the Hub / HomeScreen.
// Premium: shows 2-3 real facts the companion remembers. 
// Free: blurred teaser to drive upgrade curiosity.

const FREE_TEASERS = [
  "what makes you laugh",
  "something you've been working through",
  "a goal you mentioned once",
];

export default function MemorySnapshotCard({ userFacts, companionName, isPremium, sessionCount = 0, onViewAll }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  // Build 2-3 real snippets from facts
  const snippets = [];
  if (isPremium && userFacts) {
    if (userFacts.name) snippets.push(`Your name is ${userFacts.name}`);
    if (userFacts.recurring_struggles?.length) snippets.push(`You've been dealing with ${userFacts.recurring_struggles[0]}`);
    if (userFacts.goals?.length) snippets.push(`You're working toward ${userFacts.goals[0]}`);
    if (userFacts.occupation) snippets.push(`You work as ${userFacts.occupation}`);
    if (userFacts.hobbies?.length) snippets.push(`You're into ${userFacts.hobbies[0]}`);
    if (userFacts.important_people?.length) {
      const p = userFacts.important_people[0];
      snippets.push(`${p.name} is your ${p.role}`);
    }
  }

  const show = snippets.slice(0, 2);

  if (isPremium && show.length === 0 && sessionCount < 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      style={{
        borderRadius: 18,
        background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.06))",
        border: "1px solid rgba(168,85,247,0.18)",
        padding: "14px 16px",
        marginBottom: 14,
        cursor: onViewAll ? "pointer" : "default",
      }}
      onClick={onViewAll}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Brain size={14} color="#a855f7" />
        <span style={{ color: "rgba(168,85,247,0.9)", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          What {companionName || "I"} remember about you
        </span>
        {!isPremium && <Lock size={11} color="rgba(255,255,255,0.25)" style={{ marginLeft: "auto" }} />}
      </div>

      {isPremium ? (
        show.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {show.map((s, i) => (
              <div key={i} style={{
                padding: "7px 10px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  💜 {s}
                </span>
              </div>
            ))}
            {onViewAll && (
              <div style={{ textAlign: "right", marginTop: 2 }}>
                <span style={{ color: "rgba(168,85,247,0.6)", fontSize: 11 }}>Edit memory →</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.5 }}>
            Keep chatting — {companionName || "your companion"} is just starting to learn about you. 💜
          </div>
        )
      ) : (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, filter: "blur(4px)", userSelect: "none", pointerEvents: "none" }}>
            {FREE_TEASERS.map((t, i) => (
              <div key={i} style={{
                padding: "7px 10px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>💜 {t}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <span style={{ color: "rgba(168,85,247,0.7)", fontSize: 12 }}>
              ✨ Upgrade to unlock memory
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
