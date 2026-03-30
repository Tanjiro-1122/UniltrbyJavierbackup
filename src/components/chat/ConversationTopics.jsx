import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";

const TOPIC_CATEGORIES = [
  {
    title: "Self-Discovery",
    emoji: "🪞",
    topics: [
      "What's a belief you held as a kid that you've since changed?",
      "If you could master any skill overnight, what would it be?",
      "What's one thing about yourself you're secretly proud of?",
      "Describe your ideal day from morning to night.",
    ],
  },
  {
    title: "Deep Questions",
    emoji: "🌊",
    topics: [
      "What does happiness mean to you right now?",
      "If you wrote a letter to your younger self, what would you say?",
      "What's a fear you've overcome, and how did you do it?",
      "What would you do differently if nobody was watching?",
    ],
  },
  {
    title: "Gratitude",
    emoji: "🙏",
    topics: [
      "Name 3 things that made you smile this week.",
      "Who's someone you're grateful for but haven't told?",
      "What's a small comfort you often take for granted?",
      "What's a recent moment that felt really good?",
    ],
  },
  {
    title: "Fun & Light",
    emoji: "🎉",
    topics: [
      "What's your unpopular opinion that you'll defend forever?",
      "If you could live in any fictional world, which one?",
      "What's the weirdest dream you've ever had?",
      "If you had a theme song, what would it be?",
    ],
  },
];

export default function ConversationTopics({ visible, onClose, onSelect }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(6,2,15,0.97)", backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top, 12px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} color="#c084fc" />
          <h2 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: 0 }}>Conversation Topics</h2>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color="white" />
        </button>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: "0 16px 24px", overflowY: "auto" }}>
        <p style={{ color: "rgba(168,85,247,0.9)", fontSize: 14, fontWeight: 600, marginBottom: 20, lineHeight: 1.5, textAlign: "center" }}>
          ✨ Tap any topic to send it — start a real conversation
        </p>
        {TOPIC_CATEGORIES.map(cat => (
          <div key={cat.title} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              <span style={{ color: "white", fontSize: 15, fontWeight: 800 }}>{cat.title}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cat.topics.map((topic, i) => (
                <button key={i} onClick={() => { onSelect(topic); onClose(); }} style={{
                  padding: "14px 16px", borderRadius: 16, textAlign: "left",
                  background: "rgba(139,92,246,0.14)", 
                  border: "1px solid rgba(168,85,247,0.3)",
                  color: "rgba(255,255,255,0.95)", fontSize: 14, lineHeight: 1.5,
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}