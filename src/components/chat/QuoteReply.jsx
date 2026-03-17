import React from "react";
import { X } from "lucide-react";

export default function QuoteReply({ quote, onClear }) {
  if (!quote) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px", marginBottom: 4,
      background: "rgba(139,92,246,0.1)",
      borderLeft: "3px solid #a855f7",
      borderRadius: "0 8px 8px 0",
    }}>
      <p style={{ flex: 1, color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {quote}
      </p>
      <button onClick={onClear} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 2 }}>
        <X size={12} color="rgba(255,255,255,0.3)" />
      </button>
    </div>
  );
}