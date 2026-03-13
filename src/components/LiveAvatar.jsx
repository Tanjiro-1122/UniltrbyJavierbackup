import React from "react";
import { COMPANIONS } from "@/components/companionData";

const MOOD_ANIMATIONS = {
  happy: `
    @keyframes avatarSway {
      0%, 100% { transform: translateX(-30px); }
      50% { transform: translateX(30px); }
    }
  `,
  neutral: `
    @keyframes avatarFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
  `,
  sad: `
    @keyframes avatarBreathe {
      0%, 100% { transform: scaleX(1); }
      50% { transform: scaleX(1.02); }
    }
  `,
};

const MOOD_ANIMATION_STYLE = {
  happy: "avatarSway 3s ease-in-out infinite",
  neutral: "avatarFloat 3s ease-in-out infinite",
  sad: "avatarBreathe 4s ease-in-out infinite",
};

export default function LiveAvatar({ companionId, mood = "neutral", isSpeaking, onClick }) {
  const companionData = COMPANIONS.find(c => c.id === companionId);
  const imageUrl = companionData?.poses?.[mood] || companionData?.avatar;

  return (
    <>
      <style>{MOOD_ANIMATIONS[mood]}</style>
      <div
        onClick={onClick}
        style={{
          cursor: "pointer",
          position: "relative",
          width: 200,
          height: 340,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* Speaking glow */}
        {isSpeaking && (
          <div
            style={{
              position: "absolute",
              inset: -16,
              borderRadius: 32,
              background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
              pointerEvents: "none",
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          />
        )}

        <img
          src={imageUrl}
          alt={companionId}
          key={`${companionId}-${mood}`}
          style={{
            width: 200,
            height: 340,
            objectFit: "contain",
            objectPosition: "center center",
            display: "block",
            userSelect: "none",
            filter: `drop-shadow(0px 20px 30px rgba(0,0,0,0.6)) ${isSpeaking ? "brightness(1.08)" : "brightness(1)"}`,
            transition: "filter 0.2s, opacity 0.3s",
            animation: MOOD_ANIMATION_STYLE[mood],
            transformOrigin: "bottom center",
          }}
          draggable={false}
        />
      </div>
    </>
  );
}