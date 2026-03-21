import React from "react";
import { Trash2 } from "lucide-react";

const MOOD_EMOJI = {
  happy: "😊", neutral: "😐", sad: "😢", anxious: "😰",
  grateful: "🙏", reflective: "🪞", excited: "🎉",
};

const MOOD_COLORS = {
  happy: "rgba(250,204,21,0.15)",
  neutral: "rgba(148,163,184,0.12)",
  sad: "rgba(96,165,250,0.15)",
  anxious: "rgba(251,146,60,0.15)",
  grateful: "rgba(74,222,128,0.15)",
  reflective: "rgba(168,85,247,0.15)",
  excited: "rgba(244,114,182,0.15)",
};

export default function JournalEntryCard({ entry, onSelect, onDelete }) {
  const mood = entry.mood || "reflective";
  const bgColor = MOOD_COLORS[mood] || "rgba(139,92,246,0.08)";

  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%", textAlign: "left", padding: "14px 16px",
        background: bgColor,
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, cursor: "pointer", position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 26 }}>{MOOD_EMOJI[mood] || "📓"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.title || "Untitled"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
              {new Date(entry.created_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            {entry.companion_name && (
              <span style={{ color: "rgba(168,85,247,0.5)", fontSize: 10 }}>
                with {entry.companion_name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <Trash2 size={13} color="rgba(239,68,68,0.6)" />
        </button>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "10px 0 0", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {entry.content}
      </p>
    </button>
  );
}