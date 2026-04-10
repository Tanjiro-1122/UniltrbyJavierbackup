import React from "react";
import { AlertCircle, RefreshCw, X, MessageCircle } from "lucide-react";

export default function ErrorRecovery({ error, onRetry, onDismiss, onSupport }) {
  if (!error) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a0d2e 0%, #0f0920 100%)",
        border: "1px solid rgba(239,68,68,0.3)", borderRadius: 24,
        padding: 28, maxWidth: 360, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertCircle size={22} color="#ef4444" />
          </div>
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>Something went wrong</p>
            {error.context && (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>{error.context}</p>
            )}
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          {error.message}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(onRetry || error.retry) && (
            <button onClick={onRetry || error.retry} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              border: "none", borderRadius: 14, padding: "12px 20px",
              color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              <RefreshCw size={16} /> Try Again
            </button>
          )}
          {onSupport && (
            <button onClick={onSupport} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, padding: "10px 20px",
              color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              <MessageCircle size={14} /> Contact Support
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "transparent", border: "none",
              padding: "8px 20px",
              color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 13, cursor: "pointer",
            }}>
              <X size={14} /> Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
