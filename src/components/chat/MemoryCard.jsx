import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lock, ChevronDown, User, Heart, Target, Sparkles, Calendar } from "lucide-react";

// Teaser snippets for free users — blurred to create desire
const FREE_TEASERS = [
  "your name and what you go through",
  "the people who matter most to you",
  "your goals and what stresses you out",
  "how you feel on your hard days",
  "your sense of humor and how you laugh",
];

// Section config — maps fact keys to display labels and icons
const FACT_SECTIONS = [
  {
    id: "identity",
    label: "About You",
    icon: User,
    color: "#a855f7",
    keys: ["name", "age", "location", "occupation", "relationship_status"],
    format: (facts) => {
      const lines = [];
      if (facts.name)                lines.push(`Name: ${facts.name}`);
      if (facts.age)                 lines.push(`Age: ${facts.age}`);
      if (facts.location)            lines.push(`Location: ${facts.location}`);
      if (facts.occupation)          lines.push(`Works as: ${facts.occupation}`);
      if (facts.relationship_status) lines.push(`Relationship: ${facts.relationship_status}`);
      return lines;
    },
  },
  {
    id: "people",
    label: "People in Your Life",
    icon: Heart,
    color: "#ec4899",
    keys: ["important_people"],
    format: (facts) => {
      if (!facts.important_people?.length) return [];
      return facts.important_people
        .slice(0, 6)
        .map(p => `${p.name} — ${p.role}${p.note ? ` (${p.note})` : ""}`);
    },
  },
  {
    id: "inner",
    label: "What You Carry",
    icon: Sparkles,
    color: "#06b6d4",
    keys: ["recurring_struggles", "core_values"],
    format: (facts) => {
      const lines = [];
      if (facts.recurring_struggles?.length) {
        lines.push(...facts.recurring_struggles.slice(0, 3).map(s => `Struggle: ${s}`));
      }
      if (facts.core_values?.length) {
        lines.push(...facts.core_values.slice(0, 3).map(v => `Value: ${v}`));
      }
      return lines;
    },
  },
  {
    id: "goals",
    label: "Dreams & Goals",
    icon: Target,
    color: "#f59e0b",
    keys: ["goals", "hobbies"],
    format: (facts) => {
      const lines = [];
      if (facts.goals?.length) {
        lines.push(...facts.goals.slice(0, 3));
      }
      if (facts.hobbies?.length) {
        lines.push(`Into: ${facts.hobbies.join(", ")}`);
      }
      return lines;
    },
  },
];

function countKnownFacts(facts = {}) {
  let count = 0;
  if (facts.name) count++;
  if (facts.age) count++;
  if (facts.location) count++;
  if (facts.occupation) count++;
  if (facts.relationship_status) count++;
  if (facts.important_people?.length) count += Math.min(facts.important_people.length, 3);
  if (facts.recurring_struggles?.length) count += Math.min(facts.recurring_struggles.length, 2);
  if (facts.goals?.length) count += Math.min(facts.goals.length, 2);
  if (facts.hobbies?.length) count++;
  if (facts.core_values?.length) count++;
  return count;
}

export default function MemoryCard({ memorySummary, userFacts = {}, sessionMemory = [], companionName, isPremium, onUpgrade }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("facts");

  // ── Free user — locked teaser ─────────────────────────────────────────────
  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        onClick={onUpgrade}
        style={{
          margin: "8px 16px 0",
          padding: "12px 14px",
          borderRadius: 14,
          background: "rgba(139,92,246,0.07)",
          border: "1px solid rgba(139,92,246,0.15)",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
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
                color: "rgba(255,255,255,0.18)", fontSize: 11, margin: 0,
                filter: "blur(3.5px)", userSelect: "none", letterSpacing: "0.02em",
              }}>{t}</p>
            </div>
          ))}
        </div>
        <p style={{ color: "rgba(168,85,247,0.5)", fontSize: 10, margin: "9px 0 0", textAlign: "center" }}>
          ✨ Upgrade so {companionName} never forgets you
        </p>
      </motion.div>
    );
  }

  const factCount  = countKnownFacts(userFacts);
  const hasData    = factCount > 0 || sessionMemory.length > 0 || memorySummary;

  if (!hasData) return null;

  // What to show in the collapsed header
  const headerText = factCount > 0
    ? `${companionName} knows ${factCount} thing${factCount !== 1 ? "s" : ""} about you`
    : sessionMemory.length > 0
    ? `${companionName} remembers ${sessionMemory.length} conversation${sessionMemory.length !== 1 ? "s" : ""}`
    : `${companionName} remembers you`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ margin: "8px 16px 0" }}
    >
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", padding: "10px 14px",
          borderRadius: expanded ? "14px 14px 0 0" : 14,
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.22)",
          borderBottom: expanded ? "1px solid transparent" : undefined,
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Brain size={14} color="#a855f7" />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: 0 }}>
            {headerText}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} color="rgba(168,85,247,0.6)" />
        </motion.div>
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "rgba(139,92,246,0.05)",
              border: "1px solid rgba(139,92,246,0.22)",
              borderTop: "none",
              borderRadius: "0 0 14px 14px",
              overflow: "hidden",
            }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { id: "facts", label: "About You" },
                  { id: "sessions", label: "History" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1, padding: "8px 0", border: "none", background: "none",
                      color: activeTab === tab.id ? "#a855f7" : "rgba(255,255,255,0.3)",
                      fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 500,
                      borderBottom: activeTab === tab.id ? "2px solid #a855f7" : "2px solid transparent",
                      cursor: "pointer", WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Facts tab */}
              {activeTab === "facts" && (
                <div style={{ padding: "10px 14px 12px" }}>
                  {factCount === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>
                      Chat more — {companionName} is still learning about you ✨
                    </p>
                  ) : (
                    FACT_SECTIONS.map(section => {
                      const lines = section.format(userFacts);
                      if (!lines.length) return null;
                      const Icon = section.icon;
                      return (
                        <div key={section.id} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                            <Icon size={11} color={section.color} />
                            <span style={{ color: section.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                              {section.label}
                            </span>
                          </div>
                          {lines.map((line, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 3 }}>
                              <span style={{ color: section.color, fontSize: 9, marginTop: 4, flexShrink: 0, opacity: 0.6 }}>●</span>
                              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{line}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Sessions tab */}
              {activeTab === "sessions" && (
                <div style={{ padding: "10px 14px 12px" }}>
                  {sessionMemory.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>
                      No sessions saved yet
                    </p>
                  ) : (
                    sessionMemory.slice(0, 6).map((s, i) => (
                      <div key={i} style={{
                        marginBottom: 8, paddingBottom: 8,
                        borderBottom: i < Math.min(sessionMemory.length, 6) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                          <Calendar size={9} color="rgba(168,85,247,0.5)" />
                          <span style={{ color: "rgba(168,85,247,0.6)", fontSize: 9, fontWeight: 700 }}>{s.date}</span>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                          {s.summary}
                        </p>
                      </div>
                    ))
                  )}
                  {sessionMemory.length > 6 && (
                    <p style={{ color: "rgba(168,85,247,0.4)", fontSize: 10, textAlign: "center", margin: "4px 0 0" }}>
                      +{sessionMemory.length - 6} more sessions
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
