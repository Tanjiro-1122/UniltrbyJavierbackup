import React, { useState, useEffect } from "react";

const VOICE_OPTIONS = {
  female: [
    { id: "warm",         emoji: "🌸", label: "Warm",         desc: "Friendly & inviting" },
    { id: "bright",       emoji: "✨", label: "Bright",       desc: "Cheerful & expressive" },
    { id: "natural",      emoji: "🍃", label: "Natural",      desc: "Conversational & real" },
    { id: "professional", emoji: "💼", label: "Professional", desc: "Clear & composed" },
    { id: "neutral",      emoji: "🎙️", label: "Neutral",      desc: "Calm & balanced" },
  ],
  male: [
    { id: "american",  emoji: "🎤", label: "American",  desc: "Warm & approachable" },
    { id: "british",   emoji: "🫖", label: "British",   desc: "Refined & smooth" },
    { id: "deep",      emoji: "🌊", label: "Deep",      desc: "Rich & resonant" },
    { id: "modern",    emoji: "⚡", label: "Modern",    desc: "Crisp & confident" },
    { id: "natural",   emoji: "🍃", label: "Natural",   desc: "Relaxed & real" },
  ],
  neutral: [
    { id: "balanced", emoji: "⚖️", label: "Balanced", desc: "Clear & ungendered" },
  ],
};

const DEFAULT_VOICE_STYLE = { female: "warm", male: "american", neutral: "balanced" };

export default function SettingsVoice({ profile, onUpdate }) {
  const [voiceGender, setVoiceGender] = useState(
    localStorage.getItem("unfiltr_voice_gender") || "female"
  );
  const [voicePersonality, setVoicePersonality] = useState(
    localStorage.getItem("unfiltr_voice_personality") || "warm"
  );
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleGenderChange = (g) => {
    setVoiceGender(g);
    const opts = VOICE_OPTIONS[g] || VOICE_OPTIONS.female;
    if (!opts.find(o => o.id === voicePersonality)) {
      setVoicePersonality(DEFAULT_VOICE_STYLE[g] || opts[0].id);
    }
  };

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
  }, [voiceGender, voicePersonality, onUpdate, profile]);

  const previewVoice = async () => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    const previewText = "Hey! This is how I sound. Pretty cool, right?";
    try {
      const profileId = localStorage.getItem("userProfileId") || null;
      const appleUserId = localStorage.getItem("unfiltr_apple_user_id") || null;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: previewText,
          voiceGender,
          voicePersonality,
          profileId,
          appleUserId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const base64 = data?.data?.audio || data?.audio;
        if (base64) {
          const audio = new Audio("data:audio/mpeg;base64," + base64);
          audio.play().catch(() => {});
          return;
        }
      }
      // Fallback to browser speech synthesis (e.g. for free users or API errors)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(previewText);
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v =>
          voiceGender === "male" ? v.name.toLowerCase().includes("male") || v.name.includes("Alex") :
          voiceGender === "female" ? v.name.toLowerCase().includes("female") || v.name.includes("Samantha") :
          true
        );
        if (match) utterance.voice = match;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // silently fail
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Voice Gender */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
        Voice Gender
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["male", "female", "neutral"].map(g => (
          <button key={g} onClick={() => handleGenderChange(g)} style={{
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

      {/* Voice Style */}
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
        Voice Style
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
        {(VOICE_OPTIONS[voiceGender] || VOICE_OPTIONS.female).map(p => (
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
      <button onClick={previewVoice} disabled={isPreviewing} style={{
        width: "100%", padding: "12px", marginBottom: 12,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14, color: isPreviewing ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, cursor: isPreviewing ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {isPreviewing ? "⏳ Loading…" : "🔊 Preview Voice"}
      </button>
    </div>
  );
}
