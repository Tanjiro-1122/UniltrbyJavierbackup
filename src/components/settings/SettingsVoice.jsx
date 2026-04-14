import React, { useState, useEffect } from "react";

const VOICE_PERSONALITIES = [
  { id: "cheerful", emoji: "😊", label: "Cheerful", desc: "Bright & upbeat" },
  { id: "calm", emoji: "🧘", label: "Calm", desc: "Slow & soothing" },
  { id: "energetic", emoji: "⚡", label: "Energetic", desc: "Fast & lively" },
  { id: "professional", emoji: "💼", label: "Professional", desc: "Clear & steady" },
];

export default function SettingsVoice({ profile, onUpdate }) {
  const [voiceGender, setVoiceGender] = useState(
    localStorage.getItem("unfiltr_voice_gender") || "female"
  );
  const [voicePersonality, setVoicePersonality] = useState(
    localStorage.getItem("unfiltr_voice_personality") || "cheerful"
  );

  // Auto-save whenever gender or personality changes (debounced 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("unfiltr_voice_gender", voiceGender);
      localStorage.setItem("unfiltr_voice_personality", voicePersonality);
      onUpdate && onUpdate({ voice_gender: voiceGender, voice_personality: voicePersonality });

      // Persist to the Companion DB record so ChatPage init doesn't override
      // localStorage with stale DB values on next load.
      const companionId = (profile?.companion_id && profile.companion_id !== "pending")
        ? profile.companion_id
        : localStorage.getItem("unfiltr_companion_id");
      if (companionId && companionId !== "pending") {
        fetch('/api/utils', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateCompanion',
            companionId,
            updateData: { voice_gender: voiceGender, voice_personality: voicePersonality },
          }),
        }).catch(() => {});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [voiceGender, voicePersonality]);

  const previewVoice = () => {
    const msg = "Hey! This is how I sound. Pretty cool, right?";
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg);
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v =>
      voiceGender === "male" ? v.name.toLowerCase().includes("male") || v.name.includes("Alex") :
      voiceGender === "female" ? v.name.toLowerCase().includes("female") || v.name.includes("Samantha") :
      true
    );
    if (match) utterance.voice = match;
    utterance.rate = voicePersonality === "energetic" ? 1.3 : voicePersonality === "calm" ? 0.85 : 1;
    utterance.pitch = voicePersonality === "cheerful" ? 1.2 : voicePersonality === "calm" ? 0.9 : 1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Voice Gender */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
        Voice Gender
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["male", "female", "neutral"].map(g => (
          <button key={g} onClick={() => setVoiceGender(g)} style={{
            flex: 1, padding: "11px 8px", borderRadius: 12,
            border: voiceGender === g ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
            background: voiceGender === g ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
            color: voiceGender === g ? "white" : "rgba(255,255,255,0.45)",
            fontWeight: voiceGender === g ? 700 : 500, fontSize: 12, cursor: "pointer", textTransform: "capitalize",
          }}>
            {g === "male" ? "🎤 Male" : g === "female" ? "✨ Female" : "🤖 Neutral"}
          </button>
        ))}
      </div>

      {/* Voice Personality */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
        Voice Personality
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
        {VOICE_PERSONALITIES.map(p => (
          <button key={p.id} onClick={() => setVoicePersonality(p.id)} style={{
            padding: "12px 10px", borderRadius: 13,
            border: voicePersonality === p.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
            background: voicePersonality === p.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
            cursor: "pointer", textAlign: "center",
          }}>
            <span style={{ fontSize: 20, display: "block", marginBottom: 3 }}>{p.emoji}</span>
            <span style={{ color: voicePersonality === p.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: voicePersonality === p.id ? 700 : 500, fontSize: 12, display: "block" }}>{p.label}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{p.desc}</span>
          </button>
        ))}
      </div>

      {/* TTS Preview */}
      <button onClick={previewVoice} style={{
        width: "100%", padding: "12px", marginBottom: 12,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14, color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        🔊 Preview Voice
      </button>
    </div>
  );
}
