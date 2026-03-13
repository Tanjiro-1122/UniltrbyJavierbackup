import React from "react";
import { COMPANIONS } from "@/components/companionData";

const MOOD_ANIMATIONS = {
  happy: `@keyframes avatarSway { 0%,100%{transform:translateX(-20px)} 50%{transform:translateX(20px)} }`,
  neutral: `@keyframes avatarFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }`,
  sad: `@keyframes avatarBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }`,
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
          width: 240,
          height: 360,
        }}
      >
        {isSpeaking && (
          <div style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
            animation: "pulse 1.2s ease-in-out infinite",
            zIndex: 0,
          }} />
        )}
        <img
          src={imageUrl}
          alt={companionId}
          key={`${companionId}-${mood}`}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom center",
            animation: MOOD_ANIMATION_STYLE[mood],
            transformOrigin: "bottom center",
            filter: `drop-shadow(0 16px 32px rgba(0,0,0,0.5)) ${isSpeaking ? "brightness(1.1)" : "brightness(1)"}`,
            transition: "filter 0.3s",
            zIndex: 1,
          }}
        />
      </div>
    </>
  );
}