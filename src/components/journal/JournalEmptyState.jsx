import React from "react";
import { BookOpen, Sparkles } from "lucide-react";

export default function JournalEmptyState({ onStartJournal }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <BookOpen size={36} color="rgba(168,85,247,0.5)" />
      </div>
      <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
        Your journal is empty
      </h2>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, margin: "0 0 6px" }}>
        Write freely, speak your thoughts, or just reflect.
      </p>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.5, margin: "0 0 28px" }}>
        Your journal is a private space — type or use your voice to capture what's on your mind.
      </p>
      <button
        onClick={onStartJournal}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
          borderRadius: 24, padding: "10px 24px", cursor: "pointer",
          color: "#c084fc", fontSize: 14, fontWeight: 600,
        }}
      >
        <Sparkles size={16} />
        Start Journaling
      </button>
    </div>
  );
}