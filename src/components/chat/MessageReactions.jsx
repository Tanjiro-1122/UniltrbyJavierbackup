import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticLight } from "@/components/utils/haptics";

const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

export default function MessageReactions({ messageIndex, reactions, onReact }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleLongPress = () => {
    hapticLight();
    setShowPicker(true);
  };

  const handleReact = (emoji) => {
    hapticLight();
    onReact(messageIndex, emoji);
    setShowPicker(false);
  };

  return (
    <>
      {/* Long-press trigger area — rendered by parent */}
      <div
        onContextMenu={(e) => { e.preventDefault(); handleLongPress(); }}
        onTouchStart={() => {
          const timer = setTimeout(handleLongPress, 500);
          window.__reactionTimer = timer;
        }}
        onTouchEnd={() => clearTimeout(window.__reactionTimer)}
        onTouchMove={() => clearTimeout(window.__reactionTimer)}
        style={{ display: "contents" }}
      />

      {/* Existing reactions */}
      {reactions?.length > 0 && (
        <div style={{ display: "flex", gap: 2, marginTop: 2, flexWrap: "wrap" }}>
          {reactions.map((r, i) => (
            <span key={i} style={{
              fontSize: 12, background: "rgba(255,255,255,0.08)",
              borderRadius: 999, padding: "1px 5px",
              cursor: "pointer",
            }} onClick={() => handleReact(r)}>
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Reaction picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            style={{
              position: "absolute", bottom: "100%", left: 0,
              display: "flex", gap: 4, padding: "6px 8px",
              background: "rgba(26,5,51,0.95)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(168,85,247,0.3)", borderRadius: 999,
              zIndex: 50, marginBottom: 4,
            }}
          >
            {REACTIONS.map(emoji => (
              <button key={emoji} onClick={() => handleReact(emoji)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "none", border: "none", fontSize: 18,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.1s",
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(1.3)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close picker */}
      {showPicker && (
        <div onClick={() => setShowPicker(false)}
          style={{ position: "fixed", inset: 0, zIndex: 49 }} />
      )}
    </>
  );
}