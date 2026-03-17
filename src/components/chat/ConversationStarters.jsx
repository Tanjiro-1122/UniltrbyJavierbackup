import React from "react";

const STARTERS = [
  { emoji: "✨", text: "How's my day looking?" },
  { emoji: "🧠", text: "Tell me something cool" },
  { emoji: "😤", text: "I need to vent" },
  { emoji: "😂", text: "Make me laugh" },
  { emoji: "💭", text: "Ask me something deep" },
];

export default function ConversationStarters({ onSelect, visible }) {
  if (!visible) return null;
  
  return (
    <div style={{
      display: "flex", gap: 6, overflowX: "auto",
      padding: "6px 12px", flexShrink: 0,
      scrollbarWidth: "none", msOverflowStyle: "none",
      WebkitOverflowScrolling: "touch",
    }}>
      {STARTERS.map((s, i) => (
        <button key={i} onClick={() => onSelect(s.text)}
          style={{
            flexShrink: 0, padding: "7px 14px",
            borderRadius: 999, border: "1px solid rgba(139,92,246,0.3)",
            background: "rgba(139,92,246,0.1)",
            color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500,
            cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.15s",
          }}>
          <span>{s.emoji}</span> {s.text}
        </button>
      ))}
    </div>
  );
}