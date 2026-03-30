import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NOTO = "https://fonts.gstatic.com/s/e/notoemoji/latest";

const VIBES = [
  {
    id: "chill",
    emoji: `${NOTO}/1f60c/512.webp`,
    label: "Chill", sub: "Low-key",
    desc: "Just hanging out.\nNo agenda, no pressure.",
    gradient: "linear-gradient(135deg,#0f766e,#0ea5e9)",
    orb: "rgba(13,148,136,0.5)", glow: "rgba(13,148,136,0.4)",
    bg: "#031a18", accent: "#5eead4", cardBorder: "rgba(20,184,166,0.6)",
  },
  {
    id: "vent",
    emoji: `${NOTO}/1f32c/512.webp`,
    label: "Vent", sub: "Let it out",
    desc: "Need to let it all out?\nI'm here, no judgment.",
    gradient: "linear-gradient(135deg,#2563eb,#7c3aed)",
    orb: "rgba(59,130,246,0.5)", glow: "rgba(99,102,241,0.4)",
    bg: "#020818", accent: "#93c5fd", cardBorder: "rgba(99,102,241,0.6)",
  },
  {
    id: "hype",
    emoji: `${NOTO}/1f525/512.webp`,
    label: "Hype", sub: "Let's GO",
    desc: "Big moment coming up?\nLet's get you READY.",
    gradient: "linear-gradient(135deg,#ea580c,#facc15)",
    orb: "rgba(249,115,22,0.5)", glow: "rgba(234,88,12,0.4)",
    bg: "#180800", accent: "#fdba74", cardBorder: "rgba(251,146,60,0.6)",
  },
  {
    id: "deep",
    emoji: `${NOTO}/1f30c/512.webp`,
    label: "Deep Talk", sub: "Real talk",
    desc: "2am thoughts, existential\nquestions, real talk.",
    gradient: "linear-gradient(135deg,#7c3aed,#db2777)",
    orb: "rgba(124,58,237,0.5)", glow: "rgba(167,139,250,0.4)",
    bg: "#0d0218", accent: "#c4b5fd", cardBorder: "rgba(167,139,250,0.6)",
  },
];

export default function VibePage() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  const vibe = VIBES[idx];

  const goTo = useCallback((i) => {
    setIdx(Math.max(0, Math.min(VIBES.length - 1, i)));
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };
  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 8 && dx > dy) isSwiping.current = true;
  };
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (isSwiping.current && Math.abs(dx) > 35) goTo(idx + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
    isSwiping.current = false;
  };

  const handleContinue = () => {
    localStorage.setItem("unfiltr_vibe", vibe.id);
    navigate("/mood?dest=chat");
  };

  const btnLabel = "Pick your world →";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed", inset: 0, overflow: "hidden",
        fontFamily: "'SF Pro Display',system-ui,-apple-system,sans-serif",
        display: "flex", flexDirection: "column",
        background: `radial-gradient(ellipse at 50% 20%, ${vibe.orb} 0%, ${vibe.bg} 45%, #03000d 100%)`,
        transition: "background 0.6s ease",
      }}
    >
      {/* Glow orb */}
      <AnimatePresence mode="wait">
        <motion.div key={vibe.id}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
            width: 440, height: 440, borderRadius: "50%",
            background: `radial-gradient(circle, ${vibe.orb} 0%, transparent 70%)`,
            filter: "blur(55px)", pointerEvents: "none", zIndex: 0,
          }}
        />
      </AnimatePresence>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "max(1.4rem,env(safe-area-inset-top)) 18px 8px",
        display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 5,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>
            What's your vibe?
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0 }}>
            How do you want to show up today?
          </p>
        </div>
      </div>

      {/* Carousel */}
      <div style={{
        flex: 1, position: "relative", zIndex: 5,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {VIBES.map((v, i) => {
          const diff = i - idx;
          if (Math.abs(diff) > 1) return null;
          const isActive = diff === 0;
          return (
            <motion.div key={v.id}
              onClick={() => !isActive && goTo(i)}
              animate={{ x: diff * 262, scale: isActive ? 1 : 0.74, opacity: isActive ? 1 : 0.38 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "absolute", width: 232, height: 322, borderRadius: 32,
                border: `2px solid ${isActive ? v.cardBorder : "rgba(255,255,255,0.09)"}`,
                boxShadow: isActive
                  ? `0 0 0 1px ${v.glow}, 0 0 55px ${v.glow}, 0 28px 64px rgba(0,0,0,0.75)`
                  : "0 8px 24px rgba(0,0,0,0.4)",
                background: isActive
                  ? "linear-gradient(160deg,rgba(255,255,255,0.11) 0%,rgba(255,255,255,0.03) 100%)"
                  : "rgba(255,255,255,0.04)",
                backdropFilter: "blur(22px)",
                cursor: isActive ? "default" : "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "24px 22px 28px", zIndex: isActive ? 10 : 5,
              }}
            >
              <div style={{
                width: 100, height: 100, marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                filter: isActive ? `drop-shadow(0 0 28px ${v.glow}) drop-shadow(0 6px 18px rgba(0,0,0,0.6))` : "none",
              }}>
                <img src={v.emoji} alt={v.label} style={{ width: 88, height: 88, objectFit: "contain" }} />
              </div>
              <h2 style={{
                color: isActive ? v.accent : "rgba(255,255,255,0.5)",
                fontWeight: 800, fontSize: 26, margin: "0 0 4px",
                letterSpacing: "-0.5px", textAlign: "center",
                transition: "color 0.4s",
              }}>{v.label}</h2>
              <p style={{
                color: "rgba(255,255,255,0.35)", fontSize: 11,
                fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
                margin: "0 0 12px",
              }}>{v.sub}</p>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    color: "rgba(255,255,255,0.65)", fontSize: 14, textAlign: "center",
                    lineHeight: 1.5, margin: 0, whiteSpace: "pre-line",
                  }}
                >{v.desc}</motion.p>
              )}

            </motion.div>
          );
        })}

        {/* Arrow buttons */}
        {idx > 0 && (
          <button onClick={() => goTo(idx - 1)} style={{
            position: "absolute", left: 12, zIndex: 20,
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
          </button>
        )}
        {idx < VIBES.length - 1 && (
          <button onClick={() => goTo(idx + 1)} style={{
            position: "absolute", right: 12, zIndex: 20,
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
          </button>
        )}
      </div>

      {/* Dots */}
      <div style={{
        flexShrink: 0, display: "flex", justifyContent: "center",
        gap: 8, paddingBottom: 20, position: "relative", zIndex: 5,
      }}>
        {VIBES.map((_, i) => (
          <div key={i} onClick={() => goTo(i)} style={{
            width: i === idx ? 22 : 7, height: 7, borderRadius: 4,
            background: i === idx ? vibe.accent : "rgba(255,255,255,0.18)",
            boxShadow: i === idx ? `0 0 10px ${vibe.glow}` : "none",
            transition: "all 0.35s ease", cursor: "pointer",
          }} />
        ))}
      </div>

      {/* CTA Button */}
      <div style={{
        flexShrink: 0,
        padding: "0 24px max(1.4rem,env(safe-area-inset-bottom))",
        position: "relative", zIndex: 5,
      }}>
        <button onClick={handleContinue} style={{
          width: "100%", padding: "17px 0", borderRadius: 18, border: "none",
          background: vibe.gradient,
          boxShadow: `0 8px 36px ${vibe.glow}`,
          color: "white", fontWeight: 800, fontSize: 17, cursor: "pointer",
          letterSpacing: 0.3,
        }}>
          {btnLabel}
        </button>
      </div>
    </div>
  );
}
