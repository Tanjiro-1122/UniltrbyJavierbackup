import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Save, Sparkles, Loader2, Image, Smile, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StickerPicker from "./StickerPicker";

const MOODS = [
  { id: "happy", emoji: "😄", label: "Happy" },
  { id: "contentment", emoji: "😌", label: "Content" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "fear", emoji: "😰", label: "Anxious" },
  { id: "anger", emoji: "😤", label: "Frustrated" },
  { id: "disgust", emoji: "🤢", label: "Disgusted" },
  { id: "surprise", emoji: "😮", label: "Surprised" },
  { id: "fatigue", emoji: "😴", label: "Tired" },
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
  const [images, setImages] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [showStickers, setShowStickers] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImages(prev => [...prev, file_url]);
    setUploadingImage(false);
    e.target.value = "";
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));
  const removeSticker = (idx) => setStickers(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!content.trim() && images.length === 0 && stickers.length === 0) {
      setSaveError("Write something first before saving.");
      return;
    }
    setSaveError("");
    setSaving(true);

    let title = "Untitled Entry";
    if (content.trim()) {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a short, poetic journal entry title (3-6 words max) for this text. Return ONLY the title, nothing else:\n\n${content.slice(0, 300)}`,
      });
      if (res && typeof res === "string") title = res.trim().replace(/^["']|["']$/g, "");
    }

    const entry = {
      id: Date.now().toString(),
      title,
      content: content.trim(),
      mood: mood || "neutral",
      images,
      stickers,
      created_date: new Date().toISOString(),
    };

    onSave(entry);
    setSaving(false);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const hasContent = content.trim() || images.length > 0 || stickers.length > 0;

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
            {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount} chars
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: hasContent ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
              border: hasContent ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "8px 16px", cursor: "pointer",
              opacity: saving ? 0.6 : 1,
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
        {saveError && (
          <p style={{ color: "#f87171", fontSize: 12, marginTop: 8, fontWeight: 500 }}>
            ⚠ {saveError}
          </p>
        )}
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
            width: "100%", minHeight: 200, background: "transparent", border: "none",
            outline: "none", resize: "none",
            color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.9,
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: 0.3,
            caretColor: "#a855f7",
          }}
        />

        {/* Stickers inline */}
        {stickers.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {stickers.map((s, i) => (
              <div key={i} style={{ position: "relative", display: "inline-flex" }}>
                <span style={{ fontSize: 40 }}>{s}</span>
                <button onClick={() => removeSticker(i)} style={{
                  position: "absolute", top: -4, right: -4,
                  background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                  width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  <X size={10} color="white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded images */}
        {(images.length > 0 || uploadingImage) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                <img src={url} alt="" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
                <button onClick={() => removeImage(i)} style={{
                  position: "absolute", top: 4, right: 4,
                  background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                  width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  <X size={12} color="white" />
                </button>
              </div>
            ))}
            {uploadingImage && (
              <div style={{
                width: 100, height: 100, borderRadius: 12, background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Loader2 size={20} color="#a855f7" style={{ animation: "spin 0.8s linear infinite" }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div style={{
        flexShrink: 0, padding: "8px 16px 16px", position: "relative",
      }}>
        {showStickers && (
          <StickerPicker
            onSelect={(s) => { setStickers(prev => [...prev, s]); setShowStickers(false); }}
            onClose={() => setShowStickers(false)}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {/* Photo upload */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          <button onClick={() => fileInputRef.current?.click()} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            <Image size={16} color="rgba(255,255,255,0.5)" />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500 }}>Photo</span>
          </button>

          {/* Sticker picker */}
          <button onClick={() => setShowStickers(!showStickers)} style={{
            background: showStickers ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.06)",
            border: showStickers ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            <Smile size={16} color={showStickers ? "#c084fc" : "rgba(255,255,255,0.5)"} />
            <span style={{ color: showStickers ? "#c084fc" : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500 }}>Stickers</span>
          </button>

          {/* Voice */}
          <button onClick={toggleVoice} style={{
            background: listening ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
            border: listening ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            {listening ? (
              <>
                <MicOff size={16} color="#ef4444" />
                <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 500 }}>Stop</span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s ease-in-out infinite" }} />
              </>
            ) : (
              <>
                <Mic size={16} color="rgba(255,255,255,0.5)" />
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500 }}>Voice</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}