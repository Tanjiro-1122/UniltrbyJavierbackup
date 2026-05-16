import React, { useState } from "react";

function Toggle({ value, onChange, label, description, disabled = false, badge = null }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ color: disabled ? "rgba(255,255,255,0.45)" : "white", fontWeight: 600, fontSize: 14, margin: 0 }}>{label}</p>
          {badge && <span style={{ color: "#f0abfc", fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 999, background: "rgba(217,70,239,0.12)", border: "1px solid rgba(217,70,239,0.25)" }}>{badge}</span>}
        </div>
        {description && <p style={{ color: disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0" }}>{description}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        style={{
          width: 44, height: 26, borderRadius: 13, border: "none", cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          background: value && !disabled ? "linear-gradient(135deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.1)",
          position: "relative", flexShrink: 0, transition: "background 0.2s",
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: "50%", background: "white",
          position: "absolute", top: 3,
          left: value ? 21 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

export default function SettingsNotifications({ profile, onUpdate }) {
  const isPaid = !!(
    profile?.is_premium || profile?.premium || profile?.pro_plan || profile?.annual_plan || profile?.ultimate_friend ||
    localStorage.getItem("unfiltr_is_premium") === "true" ||
    localStorage.getItem("unfiltr_is_pro") === "true" ||
    localStorage.getItem("unfiltr_is_annual") === "true" ||
    localStorage.getItem("unfiltr_ultimate_friend") === "true"
  );
  const [dailyCheckIn, setDailyCheckIn] = useState(
    profile?.daily_checkins_enabled ?? profile?.push_enabled ?? (localStorage.getItem("unfiltr_notif_daily_checkin") !== "false")
  );
  const [timeCapsule, setTimeCapsule] = useState(
    localStorage.getItem("unfiltr_notif_time_capsule") !== "false"
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    localStorage.getItem("unfiltr_notif_reminder") === "true"
  );
  const [reminderTime, setReminderTime] = useState(
    localStorage.getItem("unfiltr_notif_reminder_time") || "20:00"
  );
  const [companionAwareness, setCompanionAwareness] = useState(
    localStorage.getItem("unfiltr_privacy_time_awareness") !== "false"
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("unfiltr_notif_daily_checkin", String(dailyCheckIn));
    localStorage.setItem("unfiltr_notif_time_capsule", String(timeCapsule));
    localStorage.setItem("unfiltr_notif_reminder", String(reminderEnabled));
    localStorage.setItem("unfiltr_notif_reminder_time", reminderTime);
    localStorage.setItem("unfiltr_privacy_time_awareness", String(isPaid ? companionAwareness : false));
    onUpdate && onUpdate({
      push_enabled: !!(dailyCheckIn || timeCapsule || reminderEnabled),
      daily_checkins_enabled: !!dailyCheckIn,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
        Notifications
      </p>
      <div style={{
        borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 20,
      }}>
        <Toggle
          value={dailyCheckIn}
          onChange={v => setDailyCheckIn(v)}
          label="Daily Check-In"
          description="Get a gentle nudge from your companion each day"
        />
        <Toggle
          value={timeCapsule}
          onChange={v => setTimeCapsule(v)}
          label="Time Capsule"
          description="Receive memories from past conversations"
        />
        <Toggle
          value={reminderEnabled}
          onChange={v => setReminderEnabled(v)}
          label="Evening Reminder"
          description="Reminder to journal or check in with your companion"
        />
        <Toggle
          value={isPaid && companionAwareness}
          onChange={v => setCompanionAwareness(v)}
          disabled={!isPaid}
          badge="PAID"
          label="Companion Awareness"
          description={isPaid ? "Let your companion notice time of day, long absences, and notification status in chat." : "Available for Plus, Pro, and Annual users."}
        />
      </div>

      {reminderEnabled && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Reminder Time
          </p>
          <input
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12,
              border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.08)",
              color: "white", fontSize: 16, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
        Note: Push notifications require the mobile app. These settings control in-app features.
      </p>

      <button onClick={handleSave} style={{
        width: "100%", padding: "13px",
        background: saved ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg,#7c3aed,#db2777)",
        border: saved ? "1px solid rgba(34,197,94,0.5)" : "none",
        borderRadius: 14, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.3s",
      }}>
        {saved ? "✓ Saved" : "Save Preferences"}
      </button>
    </div>
  );
}
