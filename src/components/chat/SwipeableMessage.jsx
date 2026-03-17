import React, { useRef, useState } from "react";
import { hapticLight } from "@/components/utils/haptics";

export default function SwipeableMessage({ children, onSwipeReply, message }) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientX - startX.current;
    // Only allow right-to-left swipe for reply (negative diff) — capped at -60
    if (diff < 0) setOffset(Math.max(diff, -60));
  };
  const handleTouchEnd = () => {
    if (offset < -40) {
      hapticLight();
      onSwipeReply(message.content);
    }
    setOffset(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${offset}px)`,
        transition: offset === 0 ? "transform 0.2s ease" : "none",
        position: "relative",
      }}
    >
      {offset < -20 && (
        <div style={{
          position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
          fontSize: 16, opacity: Math.min(1, Math.abs(offset) / 40),
        }}>
          ↩️
        </div>
      )}
      {children}
    </div>
  );
}