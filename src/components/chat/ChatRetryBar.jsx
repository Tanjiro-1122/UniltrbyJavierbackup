import React from "react";
import { RotateCcw } from "lucide-react";

export default function ChatRetryBar({ onRetry }) {
  return (
    <div style={{
      display: "flex", justifyContent: "center",
      padding: "6px 16px", flexShrink: 0,
    }}>
      <button onClick={onRetry}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 20px", borderRadius: 999,
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#fca5a5", fontSize: 13, fontWeight: 600,
          cursor: "pointer",
        }}>
        <RotateCcw size={14} />
        Tap to retry
      </button>
    </div>
  );
}