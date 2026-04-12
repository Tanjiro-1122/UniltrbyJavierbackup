import React from "react";

const PREF_KEY = "unfiltr_save_preference";

/** Returns the stored save preference: "auto" | "ask" | null (not set yet) */
export function getSavePreference() {
  return localStorage.getItem(PREF_KEY) || null;
}

/** Persist the user's save preference */
export function setSavePreference(pref) {
  localStorage.setItem(PREF_KEY, pref);
}

/**
 * SaveProgressModal
 *
 * Shown after 8 consecutive messages in chat (or periodically in journal).
 * Lets the user choose to save immediately, set auto-save, or set always-ask.
 *
 * Props:
 *  visible       {boolean}  – whether to show the modal
 *  context       {string}   – "chat" | "journal"
 *  onSave        {function} – called when user taps Save Now
 *  onAutoSave    {function} – called when user picks "Always auto-save"
 *  onAlwaysAsk   {function} – called when user picks "Always ask me"
 *  onDismiss     {function} – called on backdrop tap or Skip
 *  companionName {string}   – companion display name (for personalised copy)
 */
export default function SaveProgressModal({
  visible,
  context = "chat",
  onSave,
  onAutoSave,
  onAlwaysAsk,
  onDismiss,
  companionName = "your companion",
}) {
  if (!visible) return null;

  const isChat = context === "chat";

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        zIndex: 300,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          background: "linear-gradient(160deg, #1a0a2e 0%, #0d0520 100%)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 24px",
          paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
          border: "1px solid rgba(168,85,247,0.25)",
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(88,28,135,0.45)",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 999, margin: "0 auto 18px" }} />

        {/* Icon + headline */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌟</div>
          <h3 style={{ color: "white", fontWeight: 800, fontSize: 18, margin: "0 0 6px" }}>
            You're making real progress!
          </h3>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {isChat
              ? `Would you like to save your conversation with ${companionName}?`
              : "Would you like to save this as a journal entry?"}
          </p>
        </div>

        {/* Primary action */}
        <button
          onClick={onSave}
          style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg, #7c3aed, #db2777)",
            border: "none", borderRadius: 14,
            color: "white", fontWeight: 700, fontSize: 15,
            cursor: "pointer", marginBottom: 10,
            boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
          }}
        >
          {isChat ? "💾 Save my chat" : "📓 Save journal entry"}
        </button>

        {/* Preference buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button
            onClick={onAutoSave}
            style={{
              flex: 1, padding: "11px 8px",
              background: "rgba(168,85,247,0.13)",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: 12, color: "rgba(255,255,255,0.85)",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            🔄 Always auto-save
          </button>
          <button
            onClick={onAlwaysAsk}
            style={{
              flex: 1, padding: "11px 8px",
              background: "rgba(168,85,247,0.13)",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: 12, color: "rgba(255,255,255,0.85)",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            ❓ Always ask me
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={onDismiss}
          style={{
            width: "100%", padding: "11px",
            background: "rgba(255,255,255,0.06)",
            border: "none", borderRadius: 12,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
