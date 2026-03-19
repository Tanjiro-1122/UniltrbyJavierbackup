import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";

const MOOD_ANIMATIONS = {
  happy:       `@keyframes avatarSway { 0%, 100% { transform: translateX(-30px); } 50% { transform: translateX(30px); } }`,
  neutral:     `@keyframes avatarFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }`,
  sad:         `@keyframes avatarBreathe { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(1.02); } }`,
  fear:        `@keyframes avatarShiver { 0%, 100% { transform: translateX(-2px) rotate(-1deg); } 25% { transform: translateX(2px) rotate(1deg); } 50% { transform: translateX(-3px) rotate(-2deg); } 75% { transform: translateX(3px) rotate(2deg); } }`,
  disgust:     `@keyframes avatarRecoil { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-5px) rotate(-3deg); } }`,
  surprise:    `@keyframes avatarJolt { 0%, 100% { transform: scale(1); } 10% { transform: scale(1.06) translateY(-10px); } 20% { transform: scale(1) translateY(0px); } }`,
  anger:       `@keyframes avatarRumble { 0%, 100% { transform: translateX(0px); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }`,
  contentment: `@keyframes avatarGlow { 0%, 100% { transform: scale(1) translateY(0px); } 50% { transform: scale(1.02) translateY(-4px); } }`,
  fatigue:     `@keyframes avatarDroop { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(6px) rotate(1deg); } }`,
};

const MOOD_ANIMATION_STYLE = {
  happy:       "avatarSway 3s ease-in-out infinite",
  neutral:     "avatarFloat 3s ease-in-out infinite",
  sad:         "avatarBreathe 4s ease-in-out infinite",
  fear:        "avatarShiver 0.3s ease-in-out infinite",
  disgust:     "avatarRecoil 2s ease-in-out infinite",
  surprise:    "avatarJolt 2s ease-in-out infinite",
  anger:       "avatarRumble 0.2s ease-in-out infinite",
  contentment: "avatarGlow 3s ease-in-out infinite",
  fatigue:     "avatarDroop 5s ease-in-out infinite",
};

const MOOD_ENTER_VARIANTS = {
  happy:       { scale: [0.92, 1.04, 1],   filter: ["blur(6px) brightness(1.3)", "blur(2px) brightness(1.1)", "blur(0px) brightness(1)"], y: [10, -6, 0] },
  neutral:     { scale: [0.96, 1],          filter: ["blur(4px)", "blur(0px)"],                                                             y: [0, 0] },
  sad:         { scale: [1.02, 0.98, 1],    filter: ["blur(5px) brightness(0.7)", "blur(2px) brightness(0.9)", "blur(0px) brightness(1)"], y: [-8, 4, 0] },
  fear:        { scale: [1.05, 0.97, 1],    filter: ["blur(6px) brightness(0.6)", "blur(2px)", "blur(0px)"],                               y: [-12, 2, 0] },
  disgust:     { scale: [1, 0.97, 1],       filter: ["blur(4px) brightness(0.8)", "blur(1px)", "blur(0px)"],                               y: [0, 4, 0] },
  surprise:    { scale: [0.85, 1.08, 1],    filter: ["blur(8px) brightness(1.4)", "blur(3px) brightness(1.1)", "blur(0px) brightness(1)"], y: [15, -10, 0] },
  anger:       { scale: [1.06, 0.98, 1],    filter: ["blur(5px) brightness(1.2) saturate(1.5)", "blur(2px)", "blur(0px)"],                 y: [-6, 2, 0] },
  contentment: { scale: [0.95, 1.02, 1],    filter: ["blur(4px) brightness(1.1)", "blur(1px)", "blur(0px)"],                               y: [6, -2, 0] },
  fatigue:     { scale: [1.01, 0.99, 1],    filter: ["blur(5px) brightness(0.7)", "blur(2px) brightness(0.9)", "blur(0px) brightness(1)"], y: [-4, 6, 0] },
};

const MOOD_TRANSITION_DURATION = {
  happy: 0.5, neutral: 0.4, sad: 0.6, fear: 0.35, disgust: 0.45,
  surprise: 0.4, anger: 0.35, contentment: 0.55, fatigue: 0.65,
};

export default function LiveAvatar({ companionId, mood = "neutral", isSpeaking, onClick }) {
  const companionData = COMPANIONS.find(c => c.id === companionId);
  const imageUrl = companionData?.poses?.[mood] || companionData?.poses?.neutral || companionData?.avatar;
  const [prevMood, setPrevMood] = useState(mood);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (mood !== prevMood) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevMood(mood);
      }, (MOOD_TRANSITION_DURATION[mood] || 0.5) * 1000 + 100);
      return () => clearTimeout(timer);
    }
  }, [mood, prevMood]);

  const enterVariant = MOOD_ENTER_VARIANTS[mood] || MOOD_ENTER_VARIANTS.neutral;
  const duration = MOOD_TRANSITION_DURATION[mood] || 0.5;

  return (
    <>
      <style>{MOOD_ANIMATIONS[mood]}</style>
      <style>{`
        @keyframes speakRing { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.06)} }
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

        <AnimatePresence mode="sync">
          <motion.img
            key={`${companionId}-${mood}`}
            src={imageUrl}
            alt={companionId}
            draggable={false}
            initial={{
              opacity: 0,
              scale: enterVariant.scale[0],
              filter: enterVariant.filter[0],
              y: enterVariant.y[0],
            }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px) brightness(1) saturate(1)",
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              filter: "blur(8px) brightness(0.8)",
              y: -5,
            }}
            transition={{
              duration: duration,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: "absolute",
              height: "clamp(312px, 54dvh, 468px)",
              width: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              background: "none",
              animation: isTransitioning ? "none" : MOOD_ANIMATION_STYLE[mood],
              transformOrigin: "bottom center",
              filter: `drop-shadow(0px 20px 30px rgba(0,0,0,0.55)) ${isSpeaking ? "brightness(1.08)" : "brightness(1)"}`,
              display: "block",
            }}
          />
        </AnimatePresence>
      </div>
    </>
  );
}