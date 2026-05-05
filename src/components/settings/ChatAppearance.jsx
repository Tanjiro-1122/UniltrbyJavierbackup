import React, { useState } from "react";
import { FONT_OPTIONS, BUBBLE_STYLES, loadAppearance, saveAppearance } from "@/components/chat/ChatAppearancePanel";

const SIZE_OPTIONS = [
  { id: "sm", label: "S", px: 13 },
  { id: "md", label: "M", px: 15 },
  { id: "lg", label: "L", px: 17 },
  { id: "xl", label: "XL", px: 20 },
];

export default function ChatAppearanceSettings() {
  const saved = loadAppearance();
  const [selectedFont,   setSelectedFont]   = useState(saved.font   || "default");
  const [selectedBubble, setSelectedBubble] = useState(saved.bubble || "imessage");
  const [selectedSize,   setSelectedSize]   = useState(saved.size   || "md");

  const handle = (key, val) => {
    if (key === "font")   setSelectedFont(val);
    if (key === "bubble") setSelectedBubble(val);
    if (key === "size")   setSelectedSize(val);
    saveAppearance({ [key]: val });
  };

  const currentSize = SIZE_OPTIONS.find(s => s.id === selectedSize)?.px || 15;
  const currentFont = FONT_OPTIONS.find(f => f.id === selectedFont)?.style || {};
  const currentBubble = BUBBLE_STYLES.find(b => b.id === selectedBubble);

  return (
    <div style={{ padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Text Size ── */}
      <div>
        <p style={sectionLabel}>Text Size</p>
        <div style={{ display: "flex", gap: 10 }}>
          {SIZE_OPTIONS.map(s => (
            <button key={s.id} onClick={() => handle("size", s.id)}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                border: selectedSize === s.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                background: selectedSize === s.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                color: selectedSize === s.id ? "white" : "rgba(255,255,255,0.5)",
                fontWeight: 700, fontSize: s.px, cursor: "pointer",
              }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* ── Font ── */}
      <div>
        <p style={sectionLabel}>Font Style</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FONT_OPTIONS.map(f => (
            <button key={f.id} onClick={() => handle("font", f.id)}
              style={{
                padding: "14px 16px", borderRadius: 14, textAlign: "left",
                border: selectedFont === f.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                background: selectedFont === f.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                color: selectedFont === f.id ? "white" : "rgba(255,255,255,0.55)",
                fontWeight: selectedFont === f.id ? 700 : 400,
                fontSize: 14, cursor: "pointer",
                ...f.style,
              }}>
              {f.label}
              {selectedFont === f.id && (
                <span style={{ float: "right", color: "#a855f7" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bubble Style ── */}
      <div>
        <p style={sectionLabel}>Bubble Style</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {BUBBLE_STYLES.map(b => (
            <button key={b.id} onClick={() => handle("bubble", b.id)}
              style={{
                padding: "16px 12px", borderRadius: 16, textAlign: "left",
                border: selectedBubble === b.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                background: selectedBubble === b.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                cursor: "pointer",
              }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>{b.emoji}</span>
              <span style={{ color: selectedBubble === b.id ? "white" : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13, display: "block" }}>{b.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{b.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Live Preview ── */}
      <div>
        <p style={sectionLabel}>Preview</p>
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 16, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "10px 16px", maxWidth: "75%",
              background: "linear-gradient(145deg, rgba(88,28,135,0.9), rgba(67,20,110,0.95))",
              color: "white", fontSize: currentSize,
              border: "1.5px solid rgba(196,180,252,0.2)",
              ...currentBubble?.render(false),
              ...currentFont,
            }}>
              Hey, how are you? 💜
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              padding: "10px 16px", maxWidth: "75%",
              background: "linear-gradient(140deg, #8b5cf6, #7c3aed 45%, #db2777)",
              color: "white", fontSize: currentSize,
              ...currentBubble?.render(true),
              ...currentFont,
            }}>
              I'm doing great! 😊
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionLabel = {
  color: "rgba(255,255,255,0.4)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 12,
  margin: "0 0 12px",
};
