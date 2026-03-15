import React, { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function NotificationSettings({ profileId, initialEnabled }) {
  const [enabled, setEnabled] = useState(initialEnabled || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(initialEnabled || false);
  }, [initialEnabled]);

  const toggle = async () => {
    if (!profileId) return;
    setSaving(true);
    const newVal = !enabled;
    setEnabled(newVal);
    await base44.entities.UserProfile.update(profileId, {
      daily_checkins_enabled: newVal,
    });
    setSaving(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: 16,
        background: "rgba(139,92,246,0.1)",
        border: `1px solid ${enabled ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: enabled ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {enabled
            ? <Bell size={16} color="#a855f7" />
            : <BellOff size={16} color="rgba(255,255,255,0.3)" />
          }
        </div>
        <div style={{ textAlign: "left" }}>
          <p style={{ color: "white", fontSize: 14, fontWeight: 600, margin: 0 }}>
            Daily Check-ins
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "2px 0 0" }}>
            "Good morning" & "How was your day?" messages
          </p>
        </div>
      </div>
      <div style={{
        width: 44, height: 24, borderRadius: 999,
        background: enabled ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.12)",
        position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "white",
          position: "absolute", top: 2,
          left: enabled ? 22 : 2,
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </div>
    </button>
  );
}