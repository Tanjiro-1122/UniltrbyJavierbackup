import React from "react";
import ThemedBubble from "./ThemedBubble";
import { X, RotateCcw, Check } from "lucide-react";

export const FONT_OPTIONS = [
  { id: "default",    label: "Default",     style: { fontFamily: "inherit" } },
  { id: "rounded",    label: "Rounded",     style: { fontFamily: "'Nunito', sans-serif" } },
  { id: "serif",      label: "Serif",       style: { fontFamily: "'Georgia', serif" } },
  { id: "mono",       label: "Mono",        style: { fontFamily: "'Courier New', monospace" } },
  { id: "playful",    label: "Playful",     style: { fontFamily: "'Comic Sans MS', cursive" } },
];

export const BUBBLE_STYLES = [
  { id: "imessage", label: "iMessage", emoji: "💬", desc: "Rounded with tail",       render: (isUser) => ({ borderRadius: "20px", ...(isUser ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }) }), tail: true },
  { id: "cloud",    label: "Thought",  emoji: "💭", desc: "Floating circles tail",   render: () => ({ borderRadius: "999px", padding: "12px 20px" }), tail: false },
  { id: "spiky",    label: "Comic",    emoji: "💥", desc: "Spiky starburst burst",   render: () => ({ borderRadius: "6px" }), tail: false, spiky: true },
  { id: "neon",     label: "Neon",     emoji: "⚡", desc: "Glowing neon glow",        render: () => ({ borderRadius: "8px" }), tail: false },
  { id: "sticky",   label: "Sticky",   emoji: "📝", desc: "Post-it note style",       render: () => ({ borderRadius: "4px" }), tail: false },
  { id: "pill",     label: "Pill",     emoji: "💊", desc: "Fully rounded pill",       render: () => ({ borderRadius: "999px", padding: "12px 22px" }), tail: false },
  { id: "minimal",  label: "Minimal",  emoji: "✏️", desc: "No fill, border only",    render: (isUser) => ({ borderRadius: "8px", background: "transparent", border: isUser ? "1.5px solid rgba(168,85,247,0.6)" : "1.5px solid rgba(196,180,252,0.3)" }), tail: false },
  { id: "retro",    label: "Retro",    emoji: "📟", desc: "Old-school SMS terminal",  render: () => ({ borderRadius: "6px" }), tail: false },
];

export function loadAppearance() {
  try {
    return JSON.parse(localStorage.getItem("unfiltr_chat_appearance") || "{}");
  } catch { return {}; }
}

export function saveAppearance(data) {
  try {
    const existing = loadAppearance();
    localStorage.setItem("unfiltr_chat_appearance", JSON.stringify({ ...existing, ...data }));
    window.dispatchEvent(new Event("unfiltr_appearance_changed"));
  } catch {}
}

const SIZE_OPTIONS = [
  { id: "sm", label: "S", px: 13 },
  { id: "md", label: "M", px: 15 },
  { id: "lg", label: "L", px: 17 },
  { id: "xl", label: "XL", px: 20 },
];

export default function ChatAppearancePanel({ onClose }) {
  const saved = loadAppearance();

  // Original values at open time — used for revert
  const [original] = React.useState({ font: saved.font || "default", bubble: saved.bubble || "imessage", size: saved.size || "md" });

  // Working (pending) state — changes preview but don't save until Save is tapped
  const [selectedFont,   setSelectedFont]   = React.useState(saved.font   || "default");
  const [selectedBubble, setSelectedBubble] = React.useState(saved.bubble || "imessage");
  const [selectedSize,   setSelectedSize]   = React.useState(saved.size   || "md");

  const isDirty = selectedFont !== original.font || selectedBubble !== original.bubble || selectedSize !== original.size;

  const handleSave = () => {
    saveAppearance({ font: selectedFont, bubble: selectedBubble, size: selectedSize });
    onClose();
  };

  const handleRevert = () => {
    setSelectedFont(original.font);
    setSelectedBubble(original.bubble);
    setSelectedSize(original.size);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end",
      WebkitBackdropFilter: "blur(8px)",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          background: "linear-gradient(180deg, #12042a 0%, #0a0118 100%)",
          borderTop: "1px solid rgba(139,92,246,0.25)",
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px 40px",
          boxSizing: "border-box",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h3 style={{ color: "white", margin: 0, fontSize: 17, fontWeight: 700 }}>✨ Chat Appearance</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="white" />
          </button>
        </div>

        {/* Size Section */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Text Size</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {SIZE_OPTIONS.map(s => (
            <button key={s.id} onClick={() => setSelectedSize(s.id)} style={{
              flex: 1, height: 44, borderRadius: 12,
              border: selectedSize === s.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
              background: selectedSize === s.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
              color: selectedSize === s.id ? "white" : "rgba(255,255,255,0.5)",
              fontWeight: 700, fontSize: s.px, cursor: "pointer",
            }}>{s.label}</button>
          ))}
        </div>

        {/* Font Section */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Font Style</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {FONT_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFont(f.id)}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: selectedFont === f.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                background: selectedFont === f.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                color: selectedFont === f.id ? "white" : "rgba(255,255,255,0.5)",
                fontWeight: selectedFont === f.id ? 700 : 400,
                fontSize: 13,
                cursor: "pointer",
                ...f.style,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bubble Section */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Bubble Style</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {BUBBLE_STYLES.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBubble(b.id)}
              style={{
                padding: "14px 12px",
                borderRadius: 14,
                border: selectedBubble === b.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                background: selectedBubble === b.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{b.emoji}</span>
              <span style={{ color: selectedBubble === b.id ? "white" : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13, display: "block" }}>{b.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{b.desc}</span>
            </button>
          ))}
        </div>

        {/* Preview */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", margin: "24px 0 12px" }}>Preview</p>
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 16, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ThemedBubble
              role="assistant"
              content="Hey, how are you? 💜"
              theme={selectedBubble}
              fontFamily={FONT_OPTIONS.find(f => f.id === selectedFont)?.style?.fontFamily}
              fontSize={SIZE_OPTIONS.find(s => s.id === selectedSize)?.px || 15}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <ThemedBubble
              role="user"
              content="I'm doing great! 😊"
              theme={selectedBubble}
              fontFamily={FONT_OPTIONS.find(f => f.id === selectedFont)?.style?.fontFamily}
              fontSize={SIZE_OPTIONS.find(s => s.id === selectedSize)?.px || 15}
            />
          </div>
        </div>

        {/* Revert + Save buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={handleRevert}
            disabled={!isDirty}
            style={{
              flex: 1, height: 48, borderRadius: 14,
              background: isDirty ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: isDirty ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)",
              fontWeight: 700, fontSize: 14, cursor: isDirty ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}
          >
            <RotateCcw size={15} />
            Revert
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)",
              border: "none",
              color: "white",
              fontWeight: 800, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: "0 4px 18px rgba(168,85,247,0.45)",
              transition: "all 0.15s",
            }}
          >
            <Check size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
