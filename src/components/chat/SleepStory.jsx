import React, { useState } from "react";
import { X, Moon, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { playAudioFromBase64, resumeAudioContext, stopCurrentAudio } from "@/components/utils/audioUnlock";

const THEMES = [
  { id: "forest", emoji: "🌲", label: "Enchanted Forest" },
  { id: "ocean", emoji: "🌊", label: "Ocean Waves" },
  { id: "stars", emoji: "🌌", label: "Starry Night" },
  { id: "rain", emoji: "🌧️", label: "Rainy Evening" },
];

export default function SleepStory({ visible, onClose, companionName }) {
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);

  if (!visible) return null;

  const generateStory = async (theme) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ${companionName || "a gentle companion"}. Write a short, soothing bedtime story (about 150 words) with the theme "${theme.label}". Use calm, gentle language. End with "Goodnight... 🌙". No headers or titles.`,
      });
      const text = typeof res === "string" ? res : res?.text || res?.content || JSON.stringify(res);
      setStory({ theme, text });
    } catch (e) {
      console.error("SleepStory error:", e);
      setError("Couldn't load the story right now. Tap a theme to try again.");
    } finally {
      setLoading(false);
    }
  };

  const playStory = async () => {
    if (!story) return;
    setPlaying(true);
    setError(null);
    try {
      await resumeAudioContext().catch(() => {});
      const profileId = localStorage.getItem("userProfileId") || null;
      const appleUserId = localStorage.getItem("unfiltr_apple_user_id") || null;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: story.text.slice(0, 4096),
          voiceGender: localStorage.getItem("unfiltr_voice_gender") || "female",
          voicePersonality: localStorage.getItem("unfiltr_voice_personality") || "warm",
          profileId,
          appleUserId,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData?.error || "Couldn't play the story right now.");
        setPlaying(false);
        return;
      }
      const data = await res.json();
      const base64 = data?.data?.audio || data?.audio;
      if (base64) await playAudioFromBase64(base64);
    } catch (e) {
      console.error("SleepStory playStory error:", e);
      setError("Couldn't play the story right now. Please try again.");
    } finally {
      setPlaying(false);
    }
  };

  const stopStory = () => {
    stopCurrentAudio();
    setPlaying(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(6,2,15,0.97)", backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top, 12px)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Moon size={18} color="#c084fc" />
          <h2 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: 0 }}>Sleep Stories</h2>
        </div>
        <button onClick={() => { setStory(null); setError(null); onClose(); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color="white" />
        </button>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: "0 16px 24px", overflowY: "auto" }}>
        {!story && !loading && (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>
              Choose a theme and {companionName || "your companion"} will tell you a bedtime story.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => generateStory(t)} style={{
                  padding: "20px 12px", borderRadius: 16,
                  background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                  cursor: "pointer", textAlign: "center",
                }}>
                  <span style={{ fontSize: 32, display: "block", marginBottom: 6 }}>{t.emoji}</span>
                  <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {loading && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <Loader2 size={32} color="#a855f7" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Writing your story...</p>
          </div>
        )}

        {story && (
          <div style={{ paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{story.theme.emoji}</span>
              <span style={{ color: "#c084fc", fontSize: 15, fontWeight: 700 }}>{story.theme.label}</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {story.text}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {playing ? (
                <button onClick={stopStory} style={{
                  flex: 1, padding: "14px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                  color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                  ⏹ Stop
                </button>
              ) : (
                <button onClick={playStory} style={{
                  flex: 1, padding: "14px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                  🔊 Listen
                </button>
              )}
              <button onClick={() => setStory(null)} style={{
                flex: 1, padding: "14px", borderRadius: 14,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
                New Story
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}