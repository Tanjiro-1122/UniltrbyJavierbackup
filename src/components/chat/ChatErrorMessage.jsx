import React from "react";
import { Zap, RefreshCw } from "lucide-react";

export default function ChatErrorMessage({ onRetry }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 8,
      padding: "10px 14px",
      maxWidth: "80%",
      background: "rgba(139,92,246,0.1)",
      border: "1px solid rgba(139,92,246,0.25)",
      borderRadius: 16,
      borderTopLeftRadius: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Zap style={{ width: 14, height: 14, color: "rgba(196,180,252,0.9)" }} />
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          My brain is disconnected 🧠 please plug it in again!
        </span>
      </div>
      <button
        onClick={onRetry}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          background: "rgba(139,92,246,0.25)",
          border: "1px solid rgba(139,92,246,0.4)",
          borderRadius: 999,
          color: "rgba(196,180,252,0.95)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <RefreshCw style={{ width: 12, height: 12 }} />
        Try again
      </button>
    </div>
  );
}