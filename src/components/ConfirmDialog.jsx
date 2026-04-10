import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  visible,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  countdown = 0,
  onConfirm,
  onCancel,
}) {
  const [timer, setTimer] = useState(countdown);

  useEffect(() => {
    if (!visible) { setTimer(countdown); return; }
    if (countdown <= 0) return;
    setTimer(countdown);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, countdown]);

  if (!visible) return null;

  const confirmBg = confirmVariant === "danger"
    ? "linear-gradient(135deg, #dc2626, #b91c1c)"
    : "linear-gradient(135deg, #7c3aed, #db2777)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a0d2e 0%, #0f0920 100%)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
        padding: 28, maxWidth: 340, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={22} color="#f59e0b" />
          </div>
          <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</p>
        </div>
        {message && (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            {message}
          </p>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px", background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
            color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={timer > 0}
            style={{
              flex: 1, padding: "12px", background: timer > 0 ? "rgba(255,255,255,0.05)" : confirmBg,
              border: "none", borderRadius: 14,
              color: timer > 0 ? "rgba(255,255,255,0.25)" : "white",
              fontWeight: 700, fontSize: 14, cursor: timer > 0 ? "default" : "pointer",
              transition: "all 0.3s",
            }}
          >
            {timer > 0 ? `${confirmLabel} (${timer})` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
