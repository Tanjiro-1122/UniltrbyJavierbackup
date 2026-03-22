import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Save, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MOODS = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "reflective", emoji: "🪞", label: "Reflective" },
  { id: "excited", emoji: "🎉", label: "Excited" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "anxious", emoji: "😰", label: "Anxious" },
];

const PROMPTS = [
  "What's on your mind right now?",
  "What made you smile today?",
  "What are you grateful for?",
  "What's something you want to let go of?",
  "How are you really feeling?",
  "What would make tomorrow great?",
  "What's a small win you had today?",
];

export default function JournalWriter({ onSave, onBack }) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(null);
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-focus textarea
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 300);
  }, []);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = content;

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
          setContent(finalTranscript);
        } else {
          interim += transcript;
        }
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);

    // Generate a title using LLM
    let title = "Untitled Entry";
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a short, poetic journal entry title (3-6 words max) for this text. Return ONLY the title, nothing else:\n\n${content.slice(0, 300)}`,
    });
    if (res && typeof res === "string") title = res.trim().replace(/^["']|["']$/g, "");

    const entry = {
      id: Date.now().toString(),
      title,
      content: content.trim(),
      mood: mood || "reflective",
      created_date: new Date().toISOString(),
    };

    onSave(entry);
    setSaving(false);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
      background: "linear-gradient(180deg, #0a0612 0%, #0f0920 50%, #0a0612 100%)",
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
      }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: content.trim() ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
              border: content.trim() ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "8px 16px", cursor: content.trim() ? "pointer" : "default",
              opacity: content.trim() ? 1 : 0.4,
            }}
          >
            {saving ? (
              <Loader2 size={14} color="#4ade80" style={{ animation: "spin 0.8s linear infinite" }} />
            ) : (
              <Save size={14} color="#4ade80" />
            )}
            <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600 }}>
              {saving ? "Saving..." : "Save"}
            </span>
          </button>
        </div>
      </div>

      {/* Mood Picker */}
      <div style={{ flexShrink: 0, padding: "4px 16px 12px" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>
          HOW ARE YOU FEELING?
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MOODS.map(m => (
            <button
              key={m.id}
              onClick={() => setMood(mood === m.id ? null : m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                background: mood === m.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                border: mood === m.id ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 14 }}>{m.emoji}</span>
              <span style={{ color: mood === m.id ? "#c084fc" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider line */}
      <div style={{ margin: "0 20px", height: 1, background: "rgba(168,85,247,0.1)", flexShrink: 0 }} />

      {/* Writing Area */}
      <div className="scroll-area" style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
        <p style={{
          color: "rgba(168,85,247,0.35)", fontSize: 13, fontStyle: "italic", margin: "0 0 12px",
        }}>
          <Sparkles size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
          {prompt}
        </p>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          style={{
            width: "100%", minHeight: 300, background: "transparent", border: "none",
            outline: "none", resize: "none",
            color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.9,
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: 0.3,
            caretColor: "#a855f7",
          }}
        />
      </div>

      {/* Voice Button */}
      <div style={{
        flexShrink: 0, display: "flex", justifyContent: "center",
        padding: "12px 16px 16px",
      }}>
        <button
          onClick={toggleVoice}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 28, cursor: "pointer",
            background: listening
              ? "rgba(239,68,68,0.15)"
              : "rgba(168,85,247,0.1)",
            border: listening
              ? "1px solid rgba(239,68,68,0.3)"
              : "1px solid rgba(168,85,247,0.25)",
            transition: "all 0.2s",
          }}
        >
          {listening ? (
            <>
              <MicOff size={18} color="#ef4444" />
              <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}>Stop Recording</span>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
                animation: "pulse 1s ease-in-out infinite",
              }} />
            </>
          ) : (
            <>
              <Mic size={18} color="#a855f7" />
              <span style={{ color: "#c084fc", fontSize: 13, fontWeight: 600 }}>Speak your thoughts</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}