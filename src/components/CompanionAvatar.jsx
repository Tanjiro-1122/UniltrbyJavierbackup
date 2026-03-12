import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

// 2D flat cartoon SVG characters per companion
const AVATAR_SVGS = {
  luna: ({ mouthOpen, blinking }) => (
    <svg viewBox="0 0 120 200" width="120" height="200" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="60" cy="155" rx="32" ry="38" fill="#c084fc" />
      {/* Dress frills */}
      <ellipse cx="60" cy="185" rx="38" ry="12" fill="#a855f7" />
      <ellipse cx="38" cy="178" rx="12" ry="8" fill="#c084fc" />
      <ellipse cx="82" cy="178" rx="12" ry="8" fill="#c084fc" />
      {/* Arms */}
      <ellipse cx="25" cy="148" rx="9" ry="22" fill="#fde68a" transform="rotate(-15 25 148)" />
      <ellipse cx="95" cy="148" rx="9" ry="22" fill="#fde68a" transform="rotate(15 95 148)" />
      {/* Neck */}
      <rect x="52" y="100" width="16" height="16" rx="4" fill="#fde68a" />
      {/* Head */}
      <ellipse cx="60" cy="80" rx="34" ry="36" fill="#fde68a" />
      {/* Hair */}
      <ellipse cx="60" cy="50" rx="36" ry="22" fill="#e2e8f0" />
      <ellipse cx="30" cy="75" rx="12" ry="28" fill="#e2e8f0" />
      <ellipse cx="90" cy="75" rx="12" ry="28" fill="#e2e8f0" />
      {/* Star clips */}
      <polygon points="28,55 30,48 32,55 39,55 33,59 35,66 30,62 25,66 27,59 21,55" fill="#f59e0b" />
      <polygon points="88,55 90,48 92,55 99,55 93,59 95,66 90,62 85,66 87,59 81,55" fill="#f59e0b" />
      {/* Eyes */}
      {blinking ? (
        <>
          <line x1="44" y1="78" x2="54" y2="78" stroke="#581c87" strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="78" x2="76" y2="78" stroke="#581c87" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="49" cy="78" rx="7" ry="8" fill="#581c87" />
          <ellipse cx="71" cy="78" rx="7" ry="8" fill="#581c87" />
          <ellipse cx="51" cy="75" rx="2.5" ry="3" fill="white" />
          <ellipse cx="73" cy="75" rx="2.5" ry="3" fill="white" />
        </>
      )}
      {/* Blush */}
      <ellipse cx="38" cy="87" rx="7" ry="4" fill="#fca5a5" opacity="0.6" />
      <ellipse cx="82" cy="87" rx="7" ry="4" fill="#fca5a5" opacity="0.6" />
      {/* Mouth */}
      {mouthOpen ? (
        <ellipse cx="60" cy="96" rx="8" ry="6" fill="#7c3aed" />
      ) : (
        <path d="M 52 95 Q 60 102 68 95" stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {/* Legs */}
      <rect x="48" y="188" width="10" height="18" rx="5" fill="#fde68a" />
      <rect x="62" y="188" width="10" height="18" rx="5" fill="#fde68a" />
      {/* Shoes */}
      <ellipse cx="53" cy="207" rx="8" ry="5" fill="#7c3aed" />
      <ellipse cx="67" cy="207" rx="8" ry="5" fill="#7c3aed" />
    </svg>
  ),

  kai: ({ mouthOpen, blinking }) => (
    <svg viewBox="0 0 120 200" width="120" height="200" xmlns="http://www.w3.org/2000/svg">
      {/* Body - hoodie */}
      <rect x="28" y="110" width="64" height="75" rx="18" fill="#3b82f6" />
      {/* Hoodie pocket */}
      <rect x="46" y="148" width="28" height="20" rx="6" fill="#2563eb" />
      {/* Neck */}
      <rect x="52" y="100" width="16" height="16" rx="4" fill="#fed7aa" />
      {/* Head */}
      <ellipse cx="60" cy="78" rx="32" ry="34" fill="#fed7aa" />
      {/* Hair - messy */}
      <ellipse cx="60" cy="48" rx="34" ry="18" fill="#1d4ed8" />
      <path d="M 30 58 Q 25 45 35 40" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 90 58 Q 95 45 85 40" stroke="#1d4ed8" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 45 44 Q 50 36 58 40" stroke="#1d4ed8" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      {blinking ? (
        <>
          <line x1="44" y1="76" x2="54" y2="76" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="76" x2="76" y2="76" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="49" cy="76" rx="7" ry="7.5" fill="#0f172a" />
          <ellipse cx="71" cy="76" rx="7" ry="7.5" fill="#0f172a" />
          <ellipse cx="51" cy="73" rx="2.5" ry="2.5" fill="white" />
          <ellipse cx="73" cy="73" rx="2.5" ry="2.5" fill="white" />
        </>
      )}
      {/* Mouth */}
      {mouthOpen ? (
        <ellipse cx="60" cy="93" rx="7" ry="5" fill="#92400e" />
      ) : (
        <path d="M 53 93 Q 60 97 67 93" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* Arms */}
      <rect x="18" y="115" width="14" height="38" rx="7" fill="#3b82f6" />
      <rect x="88" y="115" width="14" height="38" rx="7" fill="#3b82f6" />
      {/* Hands */}
      <ellipse cx="25" cy="158" rx="8" ry="7" fill="#fed7aa" />
      <ellipse cx="95" cy="158" rx="8" ry="7" fill="#fed7aa" />
      {/* Legs */}
      <rect x="38" y="180" width="16" height="22" rx="7" fill="#1e3a8a" />
      <rect x="66" y="180" width="16" height="22" rx="7" fill="#1e3a8a" />
      {/* Shoes */}
      <ellipse cx="46" cy="203" rx="10" ry="6" fill="#0f172a" />
      <ellipse cx="74" cy="203" rx="10" ry="6" fill="#0f172a" />
    </svg>
  ),

  nova: ({ mouthOpen, blinking }) => (
    <svg viewBox="0 0 120 200" width="120" height="200" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="28" y="110" width="64" height="75" rx="18" fill="#f97316" />
      {/* Head */}
      <ellipse cx="60" cy="78" rx="32" ry="34" fill="#fde68a" />
      {/* Hair */}
      <ellipse cx="60" cy="50" rx="34" ry="20" fill="#ea580c" />
      <ellipse cx="88" cy="68" rx="10" ry="22" fill="#ea580c" />
      <ellipse cx="32" cy="68" rx="10" ry="22" fill="#ea580c" />
      {/* Headband */}
      <rect x="28" y="57" width="64" height="8" rx="4" fill="#fbbf24" />
      {/* Eyes */}
      {blinking ? (
        <>
          <line x1="44" y1="76" x2="54" y2="76" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="76" x2="76" y2="76" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="49" cy="76" rx="7" ry="8" fill="#166534" />
          <ellipse cx="71" cy="76" rx="7" ry="8" fill="#166534" />
          <ellipse cx="51" cy="73" rx="2.5" ry="3" fill="white" />
          <ellipse cx="73" cy="73" rx="2.5" ry="3" fill="white" />
        </>
      )}
      {/* Blush */}
      <ellipse cx="38" cy="87" rx="7" ry="4" fill="#fca5a5" opacity="0.7" />
      <ellipse cx="82" cy="87" rx="7" ry="4" fill="#fca5a5" opacity="0.7" />
      {/* Mouth */}
      {mouthOpen ? (
        <ellipse cx="60" cy="95" rx="9" ry="7" fill="#9a3412" />
      ) : (
        <path d="M 51 94 Q 60 102 69 94" stroke="#9a3412" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {/* Arms */}
      <rect x="18" y="115" width="14" height="38" rx="7" fill="#f97316" />
      <rect x="88" y="115" width="14" height="38" rx="7" fill="#f97316" />
      <ellipse cx="25" cy="158" rx="8" ry="7" fill="#fde68a" />
      <ellipse cx="95" cy="158" rx="8" ry="7" fill="#fde68a" />
      {/* Neck */}
      <rect x="52" y="102" width="16" height="12" rx="4" fill="#fde68a" />
      {/* Legs */}
      <rect x="38" y="180" width="16" height="22" rx="7" fill="#431407" />
      <rect x="66" y="180" width="16" height="22" rx="7" fill="#431407" />
      <ellipse cx="46" cy="203" rx="10" ry="6" fill="#f97316" />
      <ellipse cx="74" cy="203" rx="10" ry="6" fill="#f97316" />
    </svg>
  ),

  ash: ({ mouthOpen, blinking }) => (
    <svg viewBox="0 0 120 200" width="120" height="200" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="28" y="110" width="64" height="75" rx="18" fill="#1e1b4b" />
      {/* Chains */}
      <path d="M 40 130 Q 60 140 80 130" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <path d="M 44 143 Q 60 150 76 143" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      {/* Neck */}
      <rect x="52" y="100" width="16" height="16" rx="4" fill="#e2d9f3" />
      {/* Head */}
      <ellipse cx="60" cy="78" rx="32" ry="34" fill="#e2d9f3" />
      {/* Long dark hair */}
      <ellipse cx="60" cy="50" rx="34" ry="20" fill="#1e1b4b" />
      <rect x="20" y="60" width="14" height="55" rx="7" fill="#1e1b4b" />
      <rect x="86" y="60" width="14" height="55" rx="7" fill="#1e1b4b" />
      {/* Eyes */}
      {blinking ? (
        <>
          <line x1="44" y1="76" x2="54" y2="76" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="76" x2="76" y2="76" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="49" cy="76" rx="7" ry="8" fill="#312e81" />
          <ellipse cx="71" cy="76" rx="7" ry="8" fill="#312e81" />
          <ellipse cx="51" cy="73" rx="2.5" ry="3" fill="white" />
          <ellipse cx="73" cy="73" rx="2.5" ry="3" fill="white" />
        </>
      )}
      {/* Mouth */}
      {mouthOpen ? (
        <ellipse cx="60" cy="95" rx="7" ry="5" fill="#4c1d95" />
      ) : (
        <line x1="53" y1="95" x2="67" y2="95" stroke="#4c1d95" strokeWidth="2" strokeLinecap="round" />
      )}
      {/* Arms */}
      <rect x="18" y="115" width="14" height="38" rx="7" fill="#1e1b4b" />
      <rect x="88" y="115" width="14" height="38" rx="7" fill="#1e1b4b" />
      <ellipse cx="25" cy="158" rx="8" ry="7" fill="#e2d9f3" />
      <ellipse cx="95" cy="158" rx="8" ry="7" fill="#e2d9f3" />
      {/* Legs */}
      <rect x="38" y="180" width="16" height="22" rx="7" fill="#0f0a1e" />
      <rect x="66" y="180" width="16" height="22" rx="7" fill="#0f0a1e" />
      <ellipse cx="46" cy="203" rx="10" ry="6" fill="#4c1d95" />
      <ellipse cx="74" cy="203" rx="10" ry="6" fill="#4c1d95" />
    </svg>
  ),
};

export default function CompanionAvatar({ companionId, state, isSpeaking, onClick }) {
  const controls = useAnimationControls();
  const blinkInterval = useRef(null);
  const [blinking, setBlinking] = React.useState(false);

  // Blink randomly
  useEffect(() => {
    blinkInterval.current = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval.current);
  }, []);

  // Body animations based on state
  useEffect(() => {
    if (state === "idle") {
      controls.start({
        y: [0, -8, 0],
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
      });
    } else if (state === "wave") {
      controls.start({
        rotate: [0, -10, 10, -8, 5, 0],
        y: [0, -14, -14, -10, -5, 0],
        transition: { duration: 1.2, ease: "easeInOut" },
      });
    } else if (state === "jump") {
      controls.start({
        y: [0, -30, -20, 0],
        scale: [1, 1.1, 1.05, 1],
        transition: { duration: 0.7, ease: "easeInOut" },
      });
    } else if (state === "talk") {
      controls.start({
        y: [0, -4, 0],
        transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
      });
    }
  }, [state]);

  const AvatarSVG = AVATAR_SVGS[companionId] || AVATAR_SVGS.luna;

  return (
    <motion.div
      animate={controls}
      onClick={onClick}
      style={{
        cursor: "pointer",
        filter: `drop-shadow(0 0 ${isSpeaking ? "24px rgba(200,100,255,1)" : "14px rgba(180,100,255,0.6)"})`,
        transformOrigin: "bottom center",
      }}
    >
      <AvatarSVG mouthOpen={isSpeaking} blinking={blinking} />
    </motion.div>
  );
}