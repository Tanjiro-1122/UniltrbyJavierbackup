import React from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import AppShell from "@/components/shell/AppShell";

const MOOD_EMOJI = {
  happy: "😊", neutral: "😐", sad: "😢", anxious: "😰",
  grateful: "🙏", reflective: "🪞", excited: "🎉",
};

const MOOD_LABELS = {
  happy: "Feeling Happy", neutral: "Feeling Neutral", sad: "Feeling Sad",
  anxious: "Feeling Anxious", grateful: "Feeling Grateful",
  reflective: "Feeling Reflective", excited: "Feeling Excited",
};

export default function JournalEntryDetail({ entry, onBack, onDelete }) {
  const mood = entry.mood || "reflective";

  return (
    <AppShell tabs={false} bg="#06020f">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}>{entry.title || "Journal Entry"}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
              {new Date(entry.created_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => { onDelete(entry.id); onBack(); }}
            style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Trash2 size={15} color="rgba(239,68,68,0.6)" />
          </button>
        </div>

        {/* Mood badge */}
        <div style={{ padding: "0 20px 8px", flexShrink: 0 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "rgba(255,255,255,0.6)",
          }}>
            <span style={{ fontSize: 16 }}>{MOOD_EMOJI[mood] || "📓"}</span>
            {MOOD_LABELS[mood] || mood}
          </span>
        </div>

        {/* Content */}
        <div className="scroll-area" style={{ flex: 1, padding: "12px 20px 32px", overflowY: "auto" }}>
          {entry.content && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {entry.content}
            </p>
          )}

          {/* Stickers */}
          {entry.stickers?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {entry.stickers.map((s, i) => (
                <span key={i} style={{ fontSize: 40 }}>{s}</span>
              ))}
            </div>
          )}

          {/* Images */}
          {entry.images?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              {entry.images.map((url, i) => (
                <img key={i} src={url} alt="" style={{
                  width: "100%", maxWidth: 280, borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                }} />
              ))}
            </div>
          )}

          {entry.companion_name && (
            <p style={{ color: "rgba(168,85,247,0.45)", fontSize: 11, marginTop: 28, fontStyle: "italic" }}>
              Written with {entry.companion_name}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}