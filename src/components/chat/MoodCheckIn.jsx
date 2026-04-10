import React, { useState } from "react";
import { saveMood } from "@/components/utils/moodTracker";
import { MOODS } from "@/lib/moodConfig";

export default function MoodCheckIn({ visible, onSelect, onDismiss, companionName }) {
  const [selected, setSelected] = useState(null);

  if (!visible) return null;

  const handleSelect = (mood) => {
    setSelected(mood.value);
    saveMood(mood.value);
    setTimeout(() => onSelect(mood), 400);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }} onClick={onDismiss}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 340,
        background: "linear-gradient(180deg, #1a0a2e, #0d0118)",
        borderRadius: 24, padding: 24,
        border: "1px solid rgba(168,85,247,0.2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <p style={{ textAlign: "center", fontSize: 28, margin: "0 0 4px" }}>💜</p>
        <h3 style={{ color: "white", fontWeight: 800, fontSize: 18, textAlign: "center", margin: "0 0 4px" }}>
          How are you feeling?
        </h3>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, textAlign: "center", margin: "0 0 20px" }}>
          {companionName} wants to know
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {MOODS.map(m => (
            <button key={m.value} onClick={() => handleSelect(m)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "12px 4px", borderRadius: 14, border: "none",
                background: selected === m.value ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)",
                cursor: "pointer", transition: "all 0.2s",
                transform: selected === m.value ? "scale(1.1)" : "scale(1)",
              }}>
              <span style={{ fontSize: 24 }}>{m.emoji}</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 500 }}>{m.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onDismiss}
          style={{ width: "100%", marginTop: 16, padding: 10, background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}>
          Skip
        </button>
      </div>
    </div>
  );
}