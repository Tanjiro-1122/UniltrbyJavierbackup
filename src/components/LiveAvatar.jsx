import React, { useState, useEffect, useRef } from "react";
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

export default function LiveAvatar({ companionId, mood = "neutral", isSpeaking, onClick, fullScreen = false }) {
  const companionData = COMPANIONS.find(c => c.id === companionId);
  const poseUrl = companionData?.poses?.[mood] || companionData?.poses?.neutral || companionData?.avatar;
  const fallbackUrl = companionData?.poses?.neutral || companionData?.avatar;

  // Crossfade state — keeps old image visible while new one loads
  const [displayUrl, setDisplayUrl] = useState(poseUrl);
  const [nextUrl, setNextUrl]       = useState(null);
  const [crossfading, setCrossfading] = useState(false);
  const prevKey = useRef(`${companionId}-${mood}`);

  const handleImgError = (e) => {
    if (fallbackUrl && e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    }
  };

  useEffect(() => {
    const newKey = `${companionId}-${mood}`;
    // Always act on key change — do NOT bail based on URL equality
    // (fallback URLs can be the same even when mood changed)
    if (newKey === prevKey.current) return;
    prevKey.current = newKey;

    const targetUrl = poseUrl || fallbackUrl;
    if (!targetUrl) return;

    // Preload new image, then crossfade in on top
    const img = new window.Image();
    img.onload = () => {
      setNextUrl(targetUrl);       // show new image on top (opacity 0 → 1)
      setCrossfading(true);
      setTimeout(() => {
        setDisplayUrl(targetUrl);  // swap base image
        setNextUrl(null);          // remove overlay
        setCrossfading(false);
      }, 250);
    };
    img.onerror = () => {
      // If pose fails, fall back gracefully — still update displayUrl
      setDisplayUrl(fallbackUrl || displayUrl);
      setNextUrl(null);
      setCrossfading(false);
    };
    img.src = targetUrl;
  }, [companionId, mood]);

  const baseStyle = {
    WebkitTouchCallout: "none",
    pointerEvents: "none",
    height: fullScreen ? "clamp(420px, 80dvh, 680px)" : "clamp(340px, 62dvh, 520px)",
    width: "auto",
    maxWidth: "100%",
    objectFit: "contain",
    background: "none",
    transformOrigin: "bottom center",
    filter: `drop-shadow(0px 20px 30px rgba(0,0,0,0.55)) ${isSpeaking ? "brightness(1.08)" : "brightness(1)"}`,
    display: "block",
  };

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

        {/* Base avatar — always visible, stays mounted (no flicker) */}
        <img
          src={displayUrl}
          alt={companionId}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onError={handleImgError}
          style={{
            ...baseStyle,
            animation: MOOD_ANIM_NAME[mood] || "none",
            opacity: 1,
            transition: "filter 0.2s",
          }}
        />

        {/* New mood image crossfades IN on top of old one */}
        {nextUrl && (
          <img
            src={nextUrl}
            alt=""
            draggable={false}
            style={{
              ...baseStyle,
              position: "absolute",
              bottom: 0,
              opacity: crossfading ? 1 : 0,
              transition: "opacity 0.25s ease",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </>
  );
}

