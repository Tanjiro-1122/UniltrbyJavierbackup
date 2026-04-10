import React, { useState } from "react";
import { Check } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";

const PERSONALITY_VIBES = [
  { id: "chill", emoji: "😌", label: "Chill", desc: "Low-key, easy" },
  { id: "playful", emoji: "😄", label: "Playful", desc: "Light & fun" },
  { id: "deep", emoji: "🌌", label: "Deep", desc: "Thoughtful" },
  { id: "motivating", emoji: "🔥", label: "Motivating", desc: "Hype you up" },
  { id: "sarcastic", emoji: "😏", label: "Sarcastic", desc: "Witty edge" },
];

export default function SettingsCompanion({ profile, companion, onCompanionChange, onUpdate }) {
  const [savingCompanion, setSavingCompanion] = useState(false);
  const [nick, setNick] = useState(localStorage.getItem("unfiltr_companion_nickname") || "");
  const [nickSaved, setNickSaved] = useState(false);
  const [nickError, setNickError] = useState("");
  const [personalityVibe, setPersonalityVibe] = useState(
    localStorage.getItem("unfiltr_personality_vibe") || "chill"
  );

  const handleChangeCompanion = async (c) => {
    if (savingCompanion) return;
    setSavingCompanion(true);
    await onCompanionChange(c);
    setSavingCompanion(false);
  };

  const saveNick = () => {
    const trimmed = nick.trim();
    if (!trimmed) { setNickError("Nickname cannot be empty."); return; }
    if (trimmed.length > 30) { setNickError("Max 30 characters."); return; }
    setNickError("");
    localStorage.setItem("unfiltr_companion_nickname", trimmed);
    setNickSaved(true);
    setTimeout(() => setNickSaved(false), 2000);
  };

  const saveVibe = () => {
    localStorage.setItem("unfiltr_personality_vibe", personalityVibe);
    onUpdate && onUpdate({ personality_vibe: personalityVibe });
  };

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Companion Selector */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
        Your Companion
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {COMPANIONS.map(c => {
          const sel = companion?.name === c.name;
          return (
            <button key={c.id} onClick={() => handleChangeCompanion(c)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{
                position: "relative", width: 58, height: 70, borderRadius: 15, overflow: "hidden",
                border: sel ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.07)",
                background: sel ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                transform: sel ? "scale(1.07)" : "scale(1)", transition: "all 0.15s",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
              }}>
                <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }} />
                {sel && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={14} color="white" />
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, color: sel ? "#c4b5fd" : "rgba(255,255,255,0.4)", fontWeight: sel ? 700 : 400 }}>{c.name}</span>
            </button>
          );
        })}
      </div>
      {savingCompanion && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", marginBottom: 16 }}>Saving...</p>}

      {/* Companion Nickname */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
        Companion Nickname
      </p>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 10 }}>
          Give your companion a personal nickname only you call them.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={nick}
            onChange={e => { setNick(e.target.value); setNickError(""); }}
            onKeyDown={e => e.key === "Enter" && saveNick()}
            placeholder={`e.g. "Max", "Luna babe"`}
            maxLength={30}
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 12,
              border: nickError ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(139,92,246,0.25)",
              background: "rgba(139,92,246,0.08)", color: "white", fontSize: 14, outline: "none",
            }}
          />
          <button
            onClick={saveNick}
            disabled={!nick.trim()}
            style={{
              padding: "11px 18px", borderRadius: 12, border: "none", color: "white",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: nickSaved ? "rgba(34,197,94,0.35)" : "linear-gradient(135deg,#7c3aed,#db2777)",
              opacity: !nick.trim() ? 0.3 : 1,
            }}
          >
            {nickSaved ? "✓" : "Save"}
          </button>
        </div>
        {nickError && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{nickError}</p>}
      </div>

      {/* Personality Vibe */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
        Personality Vibe
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {PERSONALITY_VIBES.map(o => (
          <button key={o.id} onClick={() => setPersonalityVibe(o.id)} style={{
            padding: "12px 8px", borderRadius: 13,
            border: personalityVibe === o.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
            background: personalityVibe === o.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
            cursor: "pointer", textAlign: "center",
          }}>
            <span style={{ fontSize: 22, display: "block", marginBottom: 3 }}>{o.emoji}</span>
            <span style={{ color: personalityVibe === o.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: personalityVibe === o.id ? 700 : 500, fontSize: 12, display: "block" }}>{o.label}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{o.desc}</span>
          </button>
        ))}
      </div>
      <button onClick={saveVibe} style={{
        width: "100%", padding: "13px", background: "linear-gradient(135deg,#7c3aed,#db2777)",
        border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
      }}>
        Save Personality
      </button>
    </div>
  );
}
