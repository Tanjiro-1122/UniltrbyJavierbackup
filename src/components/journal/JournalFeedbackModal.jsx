import React from "react";
import { X, Loader2 } from "lucide-react";

const MOOD_EMOJI = {
  happy: "😄",
  contentment: "😌",
  neutral: "😐",
  sad: "😢",
  fear: "😰",
  anger: "😤",
  disgust: "🤢",
  surprise: "😮",
  fatigue: "😴",
};

const MOOD_LABEL = {
  happy: "Happy",
  contentment: "Content",
  neutral: "Neutral",
  sad: "Sad",
  fear: "Anxious",
  anger: "Frustrated",
  disgust: "Disgusted",
  surprise: "Surprised",
  fatigue: "Tired",
};

export default function JournalFeedbackModal({ visible, onClose, companionName, entryMood, feedback, loading }) {
  if (!visible) return null;

  const emoji = MOOD_EMOJI[entryMood] || "💜";
  const moodLabel = MOOD_LABEL[entryMood] || entryMood;
  const displayName = companionName || "Your Companion";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(6,2,15,0.92)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 env(safe-area-inset-bottom, 0)",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(180deg, #130d22 0%, #0a0612 100%)",
        border: "1px solid rgba(168,85,247,0.2)",
        borderRadius: "24px 24px 0 0",
        padding: "24px 20px 32px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <div>
              <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 15, margin: 0 }}>
                {displayName}
              </p>
              <p style={{ color: "rgba(168,85,247,0.7)", fontSize: 11, margin: 0 }}>
                responding to your {moodLabel.toLowerCase()} entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(168,85,247,0.12)" }} />

        {/* Feedback content */}
        <div style={{
          background: "rgba(168,85,247,0.07)", borderRadius: 16,
          border: "1px solid rgba(168,85,247,0.15)",
          padding: "16px",
          minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Loader2 size={22} color="#a855f7" style={{ animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>
                {displayName} is reading your entry…
              </p>
            </div>
          ) : (
            <p style={{
              color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 1.7,
              margin: 0, fontStyle: "italic",
            }}>
              {feedback || "I read every word. Thank you for trusting me with this 💜"}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            background: "rgba(168,85,247,0.15)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 24, padding: "12px 24px", cursor: "pointer",
            color: "#c084fc", fontSize: 14, fontWeight: 600,
            width: "100%",
          }}
        >
          Continue Journaling
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
