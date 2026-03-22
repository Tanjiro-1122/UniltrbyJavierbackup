import React from "react";
import { COMPANIONS } from "@/components/companionData";

const MOOD_ANIMATIONS = {
  happy:       `@keyframes avatarSway      { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }`,
  neutral:     `@keyframes avatarFloat     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }`,
  sad:         `@keyframes avatarBreathe   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.01)} }`,
  fear:        `@keyframes avatarShiver    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-3px)} }`,
  disgust:     `@keyframes avatarRecoil    { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-3px) rotate(-1deg)} }`,
  surprise:    `@keyframes avatarJolt      { 0%,100%{transform:scale(1)} 10%{transform:scale(1.03) translateY(-6px)} 20%{transform:scale(1) translateY(0px)} }`,
  anger:       `@keyframes avatarRumble    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-4px)} }`,
  contentment: `@keyframes avatarGlow      { 0%,100%{transform:scale(1) translateY(0px)} 50%{transform:scale(1.01) translateY(-3px)} }`,
  fatigue:     `@keyframes avatarDroop     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(4px)} }`,
};

const MOOD_ANIM_NAME = {
  happy:       "avatarSway      3.5s ease-in-out infinite",
  neutral:     "avatarFloat     4s ease-in-out infinite",
  sad:         "avatarBreathe   5s ease-in-out infinite",
  fear:        "avatarShiver    3s ease-in-out infinite",
  disgust:     "avatarRecoil    3s ease-in-out infinite",
  surprise:    "avatarJolt      3s ease-in-out infinite",
  anger:       "avatarRumble    3s ease-in-out infinite",
  contentment: "avatarGlow      4s ease-in-out infinite",
  fatigue:     "avatarDroop     5s ease-in-out infinite",
};

export default function LiveAvatar({ companionId, mood = "neutral", isSpeaking, onClick }) {
  const companionData = COMPANIONS.find(c => c.id === companionId);
  const poseUrl = companionData?.poses?.[mood] || companionData?.poses?.neutral || companionData?.avatar;
  const imageUrl = poseUrl;

  return (
    <>
      <style>{MOOD_ANIMATIONS[mood] || ""}</style>
      <style>{`
        @keyframes speakRing { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.06)} }
        @keyframes spin       { to { transform:rotate(360deg) } }

      `}</style>

      <div
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          cursor: "pointer",
          position: "relative",
          display: "inline-flex",
          alignItems: "flex-end",
          justifyContent: "center",
          background: "none",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        {isSpeaking && (
          <div style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.32) 0%, transparent 70%)",
            pointerEvents: "none",
            animation: "speakRing 1.2s ease-in-out infinite",
          }} />
        )}

        {/* Main avatar */}
        <img
          src={imageUrl}
          alt={companionId}
          key={`${companionId}-${mood}`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            WebkitTouchCallout: "none",
            pointerEvents: "none",
            height: "clamp(312px, 54dvh, 468px)",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            background: "none",
            animation: MOOD_ANIM_NAME[mood] || "none",
            transformOrigin: "bottom center",
            filter: `drop-shadow(0px 20px 30px rgba(0,0,0,0.55)) ${isSpeaking ? "brightness(1.08)" : "brightness(1)"}`,
            transition: "filter 0.2s",
            display: "block",
          }}
        />

        {/* Mouth movement overlay — clipped to lower-face region, animated while speaking */}
        {isSpeaking && (
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "clamp(312px, 54dvh, 468px)",
              objectFit: "contain",
              pointerEvents: "none",
              WebkitTouchCallout: "none",
              animation: "mouthMove 0.35s steps(2, jump-none) infinite",
              transformOrigin: "center 30%",
              opacity: 0.92,
              mixBlendMode: "normal",
            }}
          />
        )}
      </div>
    </>
  );
}