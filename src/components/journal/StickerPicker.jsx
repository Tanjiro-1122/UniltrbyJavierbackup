import React, { useState } from "react";
import { X } from "lucide-react";

const STICKER_CATEGORIES = [
  {
    label: "Moods",
    stickers: ["😊", "😂", "🥰", "😎", "🤩", "😴", "😤", "🥺", "😭", "🤯", "😇", "🫠"],
  },
  {
    label: "Vibes",
    stickers: ["✨", "🔥", "💫", "🌈", "🦋", "🌸", "🍀", "⭐", "💎", "🎵", "🌊", "🌙"],
  },
  {
    label: "Love",
    stickers: ["❤️", "💜", "💖", "💕", "🫶", "💗", "💝", "🥹", "😘", "🤗", "💛", "🩷"],
  },
  {
    label: "Fun",
    stickers: ["🎉", "🎈", "🎯", "🏆", "🚀", "🎮", "🎨", "📸", "🧸", "🍕", "🧁", "☕"],
  },
  {
    label: "Nature",
    stickers: ["🌻", "🌺", "🍂", "❄️", "🌅", "🏔️", "🌿", "🐾", "🐝", "🦜", "🌵", "🍄"],
  },
];

export default function StickerPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div style={{
      position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 8,
      background: "rgba(15,9,32,0.97)", border: "1px solid rgba(168,85,247,0.2)",
      borderRadius: 20, overflow: "hidden", zIndex: 10,
      backdropFilter: "blur(12px)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px 6px",
      }}>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>Stickers</span>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
          width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <X size={13} color="rgba(255,255,255,0.5)" />
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 4, padding: "0 12px 8px", overflowX: "auto" }}>
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(i)}
            style={{
              padding: "4px 10px", borderRadius: 12, cursor: "pointer", whiteSpace: "nowrap",
              background: activeCategory === i ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
              border: activeCategory === i ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              color: activeCategory === i ? "#c084fc" : "rgba(255,255,255,0.35)",
              fontSize: 11, fontWeight: 500,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4,
        padding: "4px 12px 14px", maxHeight: 160, overflowY: "auto",
      }}>
        {STICKER_CATEGORIES[activeCategory].stickers.map((sticker, i) => (
          <button
            key={i}
            onClick={() => onSelect(sticker)}
            style={{
              background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 12,
              padding: 8, cursor: "pointer", fontSize: 28, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.1s",
            }}
            onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.85)"}
            onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            onPointerLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {sticker}
          </button>
        ))}
      </div>
    </div>
  );
}