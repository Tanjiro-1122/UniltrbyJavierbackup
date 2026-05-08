import React, { useState } from "react";
import DisplayNameEditor from "@/components/settings/DisplayNameEditor";
import { isFamilyUnlimited, getPlanLabel } from "@/lib/entitlements";

function NicknameField() {
  const [nick, setNick] = useState(localStorage.getItem("unfiltr_companion_nickname") || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    const trimmed = nick.trim();
    if (!trimmed) { setError("Nickname cannot be empty."); return; }
    if (trimmed.length > 30) { setError("Max 30 characters."); return; }
    setError("");
    // Always write locally first — immediate effect even if DB fails
    localStorage.setItem("unfiltr_companion_nickname", trimmed);
    // Dispatch event so ChatPage and other listeners can pick up the new name
    window.dispatchEvent(new CustomEvent("unfiltr_companion_changed"));
    // Persist to DB so it survives device reinstall / cross-device login
    const profileId   = localStorage.getItem("userProfileId");
    const appleUserId = localStorage.getItem("unfiltr_apple_user_id") || localStorage.getItem("unfiltr_user_id") || "";
    if (profileId && appleUserId) {
      try {
        await fetch("/api/syncProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:     "update",
            profileId,
            appleUserId,
            updateData: { companion_nickname: trimmed },
          }),
        });
      } catch (e) {
        console.warn("[NicknameField] DB sync failed (local saved):", e.message);
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 10 }}>
        Give your companion a personal nickname only you call them.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={nick}
          onChange={e => { setNick(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && save()}
          placeholder={`e.g. "Max", "Luna babe"`}
          maxLength={30}
          style={{
            flex: 1, padding: "11px 14px", borderRadius: 12,
            border: error ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(139,92,246,0.25)",
            background: "rgba(139,92,246,0.08)", color: "white", fontSize: 14, outline: "none",
          }}
        />
        <button
          onClick={save}
          disabled={!nick.trim()}
          style={{
            padding: "11px 18px", borderRadius: 12, border: "none", color: "white",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: saved ? "rgba(34,197,94,0.35)" : "linear-gradient(135deg,#7c3aed,#db2777)",
            opacity: !nick.trim() ? 0.3 : 1,
          }}
        >
          {saved ? "✓" : "Save"}
        </button>
      </div>
      {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}

export default function SettingsProfile({ profile, onUpdate, onSignOut }) {
  // Stats should come from the loaded DB profile first. LocalStorage is only a fallback
  // for users whose profile has not finished loading yet.
  const msgCount = (() => {
    const raw = profile?.message_count;
    const n = raw !== undefined && raw !== null
      ? Number(raw)
      : Number(localStorage.getItem("unfiltr_message_count") || localStorage.getItem("unfiltr_msg_total") || 0);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  })();

  const memberSince = (() => {
    const raw = profile?.created_date
      || profile?.created_at
      || profile?.joined_date
      || localStorage.getItem("unfiltr_joined_date")
      || localStorage.getItem("unfiltr_first_launch");
    if (!raw) return "—";
    try {
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  })();

  const planLabel = (() => {
    if (profile?.family_plan || profile?.family_unlimited || isFamilyUnlimited()) return "Family";
    if (profile?.ultimate_friend || localStorage.getItem("unfiltr_ultimate_friend") === "true") return "Ultimate";
    if (profile?.annual_plan || localStorage.getItem("unfiltr_is_annual") === "true") return "Annual";
    if (profile?.pro_plan || localStorage.getItem("unfiltr_is_pro") === "true") return "Pro";
    if (profile?.is_premium || profile?.premium || localStorage.getItem("unfiltr_is_premium") === "true") return getPlanLabel();
    return "Free";
  })();

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Display Name */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Display Name
        </p>
        <DisplayNameEditor
          userProfile={profile}
          onSave={n => onUpdate && onUpdate({ display_name: n })}
        />
      </div>

      {/* Companion Nickname */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Companion Nickname
        </p>
        <NicknameField />
      </div>

      {/* Profile Stats */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Stats
        </p>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "12px 16px", display: "flex",
        }}>
          {[
            { label: "Messages", value: msgCount, sub: "total sent" },
            { label: "Member Since", value: memberSince, sub: "joined" },
            { label: "Plan", value: planLabel, sub: "current plan" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 16, margin: 0 }}>{s.value}</p>
              <p style={{ color: "white", fontWeight: 600, fontSize: 11, margin: "2px 0 0" }}>{s.label}</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "1px 0 0" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div style={{ marginTop: 8 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Account
        </p>
        <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={onSignOut}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "13px 16px", background: "none", border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.8)", fontWeight: 500, fontSize: 15,
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span> Sign Out
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, padding: "10px 16px", margin: 0 }}>
            To delete your account, go to Settings → Account.
          </p>
        </div>
      </div>
    </div>
  );
}
