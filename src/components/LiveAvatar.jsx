import React from "react";
import { COMPANIONS } from "@/components/companionData";

/*
  Avatar height is responsive:
  - Uses CSS clamp so it's smaller on short phones (iPhone SE) 
    and larger on tall phones (iPhone Pro Max)
  - min 200px, preferred 38dvh, max 320px
*/

const MOOD_ANIMATIONS = {
  happy:       `@keyframes avatarSway      { 0%,100%{transform:translateX(-6px)} 50%{transform:translateX(6px)} }`,
  neutral:     `@keyframes avatarFloat     { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-8px)} }`,
  sad:         `@keyframes avatarBreathe   { 0%,100%{transform:scaleX(1)}        50%{transform:scaleX(1.02)} }`,
  fear:        `@keyframes avatarShiver    { 0%,100%{transform:translateX(-2px) rotate(-1deg)} 25%{transform:translateX(2px) rotate(1deg)} 50%{transform:translateX(-3px) rotate(-2deg)} 75%{transform:translateX(3px) rotate(2deg)} }`,
  disgust:     `@keyframes avatarRecoil    { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-5px) rotate(-3deg)} }`,
  surprise:    `@keyframes avatarJolt      { 0%,100%{transform:scale(1)} 10%{transform:scale(1.06) translateY(-10px)} 20%{transform:scale(1) translateY(0px)} }`,
  anger:       `@keyframes avatarRumble    { 0%,100%{transform:translateX(0px)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }`,
  contentment: `@keyframes avatarGlow      { 0%,100%{transform:scale(1) translateY(0px)} 50%{transform:scale(1.02) translateY(-4px)} }`,
  fatigue:     `@keyframes avatarDroop     { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(6px) rotate(1deg)} }`,
};

const MOOD_ANIM_NAME = {
  happy:       "avatarSway      3s ease-in-out infinite",
  neutral:     "avatarFloat     3s ease-in-out infinite",
  sad:         "avatarBreathe   4s ease-in-out infinite",
  fear:        "avatarShiver    0.3s ease-in-out infinite",
  disgust:     "avatarRecoil    2s ease-in-out infinite",
  surprise:    "avatarJolt      2s ease-in-out infinite",
  anger:       "avatarRumble    0.2s ease-in-out infinite",
  contentment: "avatarGlow      3s ease-in-out infinite",
  fatigue:     "avatarDroop     5s ease-in-out infinite",
};

export default function LiveAvatar({ companionId, mood = "neutral", isSpeaking, onClick }) {
  const companionData = COMPANIONS.find(c => c.id === companionId);
  const imageUrl      = companionData?.poses?.[mood] || companionData?.avatar;

  return (
    <>
      <style>{MOOD_ANIMATIONS[mood] || ""}</style>
      <style>{`
        @keyframes speakRing { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.06)} }
        @keyframes spin       { to { transform:rotate(360deg) } }
      `}</style>

      <div
        onClick={onClick}
        style={{
          cursor: "pointer",
          position: "relative",
          display: "inline-flex",
          alignItems: "flex-end",
          justifyContent: "center",
          background: "none",
        }}
      >
        {/* Speaking halo */}
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

        <img
          src={imageUrl}
          alt={companionId}
          key={`${companionId}-${mood}`}
          draggable={false}
          style={{
            height: "clamp(200px, 36dvh, 310px)",
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
      </div>
    </>
  );
}