import React, { useMemo } from "react";

const NEW_USER_STARTERS = [
  { emoji: "✨", text: "How's my day looking?" },
  { emoji: "🧠", text: "Tell me something cool" },
  { emoji: "😤", text: "I need to vent" },
  { emoji: "😂", text: "Make me laugh" },
  { emoji: "💭", text: "Ask me something deep" },
];

const RETURNING_STARTERS = [
  { emoji: "💬", text: "Let's pick up where we left off" },
  { emoji: "✨", text: "What should I do today?" },
  { emoji: "😤", text: "I need to vent about something" },
  { emoji: "🧠", text: "Tell me something I don't know" },
  { emoji: "💜", text: "I just wanted to say hi" },
];

const TIME_STARTERS = {
  morning: [
    { emoji: "☀️", text: "Help me start my day right" },
    { emoji: "📋", text: "What should I focus on today?" },
  ],
  evening: [
    { emoji: "🌙", text: "How was my day? Let me tell you" },
    { emoji: "😴", text: "Help me wind down" },
  ],
};

export default function ConversationStarters({ onSelect, visible, isReturning }) {
  if (!visible) return null;

  const starters = useMemo(() => {
    const hour = new Date().getHours();
    const base = isReturning ? RETURNING_STARTERS : NEW_USER_STARTERS;
    
    // Mix in a time-appropriate starter
    let timeStarter = null;
    if (hour < 11) timeStarter = TIME_STARTERS.morning[Math.floor(Math.random() * TIME_STARTERS.morning.length)];
    else if (hour >= 20) timeStarter = TIME_STARTERS.evening[Math.floor(Math.random() * TIME_STARTERS.evening.length)];
    
    if (timeStarter) {
      // Replace the last item with a time-based one
      return [...base.slice(0, 4), timeStarter];
    }
    return base;
  }, [isReturning]);

  return (
    <div style={{
      display: "flex", gap: 6, overflowX: "auto",
      padding: "6px 12px", flexShrink: 0,
      scrollbarWidth: "none", msOverflowStyle: "none",
      WebkitOverflowScrolling: "touch", touchAction: "pan-x",
    }}>
      {starters.map((s, i) => (
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