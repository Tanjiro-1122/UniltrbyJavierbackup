import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COMPANIONS } from "../components/companionData";

const WORLDS = [
  {
    id: "cozy_apartment",
    label: "Cozy Apartment",
    emoji: "🏠",
    desc: "Warm lamp, rain on the window, city glow",
    accentColor: "#ffb347",
    glow: "rgba(255,140,40,0.55)",
    bgImage: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/133f41f0f_generated_image.png",
    bgFallback: "linear-gradient(160deg,#3d1f0a,#1a0a02)",
  },
  {
    id: "forest_cabin",
    label: "Forest Cabin",
    emoji: "🌲",
    desc: "Fireplace, pine trees, snow outside",
    accentColor: "#4ade80",
    glow: "rgba(74,222,128,0.5)",
    bgImage: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d7bb6e1b5_generated_image.png",
    bgFallback: "linear-gradient(160deg,#0f3018,#061408)",
  },
  {
    id: "late_night_cafe",
    label: "Late Night Café",
    emoji: "☕",
    desc: "Neon signs, empty café, rain outside",
    accentColor: "#c462ff",
    glow: "rgba(196,98,255,0.5)",
    bgImage: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/e0ccd0753_generated_image.png",
    bgFallback: "linear-gradient(160deg,#2a0d42,#0d0518)",
  },
  {
    id: "space_station",
    label: "Space Station",
    emoji: "🌌",
    desc: "Stars, floating in zero gravity",
    accentColor: "#63b3ff",
    glow: "rgba(99,179,255,0.45)",
    bgImage: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/2da8b6d3e_generated_image.png",
    bgFallback: "linear-gradient(160deg,#0a1535,#020510)",
  },
  {
    id: "beach_house",
    label: "Beach House",
    emoji: "🏖️",
    desc: "Sunset, waves, golden hour glow",
    accentColor: "#fbbf24",
    glow: "rgba(251,191,36,0.45)",
    bgImage: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/19c79bde2_generated_image.png",
    bgFallback: "linear-gradient(160deg,#3d2a06,#1a1202)",
  },
  {
    id: "rooftop",
    label: "Rooftop",
    emoji: "🌆",
    desc: "City skyline, night breeze, string lights",
    accentColor: "#f472b6",
    glow: "rgba(244,114,182,0.5)",
    bgImage: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/6e20d0458_generated_image.png",
    bgFallback: "linear-gradient(160deg,#2a103a,#0d0518)",
  },
];

export default function JournalWorldPicker() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [companion, setCompanion] = useState(null);
  const [companionName, setCompanionName] = useState("your companion");
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  // Preload all world backgrounds
  useEffect(() => {
    WORLDS.forEach(w => {
      const img = new window.Image();
      img.onload = () => setLoaded(prev => ({ ...prev, [w.id]: true }));
      img.src = w.bgImage;
    });
  }, []);

  // Load companion data
  useEffect(() => {
    try {
      const saved = localStorage.getItem("unfiltr_companion");
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = COMPANIONS.find(c => c.id === parsed.id || c.name === parsed.name);
        if (found) {
          setCompanion(found);
          setCompanionName(parsed.companionNickname || found.displayName || found.name || "your companion");
        } else if (COMPANIONS.length > 0) {
          setCompanion(COMPANIONS[0]);
        }
      } else if (COMPANIONS.length > 0) {
        setCompanion(COMPANIONS[0]);
      }

      const savedWorld = localStorage.getItem("unfiltr_journal_world");
      if (savedWorld) {
        const i = WORLDS.findIndex(w => w.id === savedWorld);
        if (i >= 0) setIdx(i);
      }
    } catch (e) {}
  }, []);

  const goTo = useCallback((newIdx) => {
    const clamped = Math.max(0, Math.min(WORLDS.length - 1, newIdx));
    if (clamped === idx) return;
    setTransitioning(true);
    setTimeout(() => {
      setIdx(clamped);
      setTransitioning(false);
    }, 180);
  }, [idx]);

  const handleEnter = () => {
    localStorage.setItem("unfiltr_journal_world", WORLDS[idx].id);
    navigate("/journal/immersive");
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 10 && dx > dy) isSwiping.current = true;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (isSwiping.current && Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
    isSwiping.current = false;
  };

  const world = WORLDS[idx];
  const companionImg = companion?.poses?.neutral || companion?.poses?.happy || companion?.avatar || "";

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        fontFamily: "system-ui,-apple-system,sans-serif",
        overflow: "hidden",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Preload hidden imgs */}
      <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0, overflow: "hidden" }}>
        {WORLDS.map(w => <img key={w.id} src={w.bgImage} alt="" />)}
      </div>

      {/* Full-screen world backgrounds — all stacked, fade between */}
      {WORLDS.map((w, i) => (
        <div key={w.id} style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: w.bgFallback,
          backgroundImage: loaded[w.id] ? `url(${w.bgImage})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: i === idx ? (transitioning ? 0 : 1) : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }} />
      ))}

      {/* Gradient overlay — heavier at top and bottom */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: `linear-gradient(
          to bottom,
          rgba(0,0,0,0.72) 0%,
          rgba(0,0,0,0.1) 28%,
          rgba(0,0,0,0.05) 45%,
          rgba(0,0,0,0.35) 65%,
          rgba(0,0,0,0.88) 100%
        )`,
      }} />

      {/* Accent glow from world color — bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%", height: "40%",
        zIndex: 1, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 100%, ${world.glow} 0%, transparent 70%)`,
        opacity: transitioning ? 0 : 1,
        transition: "opacity 0.5s ease, background 0.5s ease",
      }} />

      {/* ── HEADER ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        zIndex: 20,
        paddingTop: "max(52px, env(safe-area-inset-top, 52px))",
        padding: "max(52px, env(safe-area-inset-top, 52px)) 20px 0",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate("/journal/home")}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent",
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 20, margin: 0, textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>
            📓 Choose Your World
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "2px 0 0" }}>
            {companionName} will meet you there ✨
          </p>
        </div>
      </div>

      {/* ── COMPANION AVATAR — center stage ── */}
      {companionImg ? (
        <div style={{
          position: "absolute",
          bottom: "28%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          width: 220,
          height: 280,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          opacity: avatarLoaded ? 1 : 0,
          transition: "opacity 0.45s ease",
          filter: `drop-shadow(0 8px 32px ${world.glow})`,
        }}>
          <img
            src={companionImg}
            alt={companionName}
            onLoad={() => setAvatarLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
          />
        </div>
      ) : null}

      {/* ── LEFT / RIGHT nav arrows ── */}
      <button
        onClick={(e) => { e.stopPropagation(); goTo(idx - 1); }}
        disabled={idx === 0}
        style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 20, opacity: idx === 0 ? 0.2 : 1,
          cursor: idx === 0 ? "default" : "pointer",
          transition: "opacity 0.2s", WebkitTapHighlightColor: "transparent",
        }}
      >
        <ChevronLeft size={20} color="white" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); goTo(idx + 1); }}
        disabled={idx === WORLDS.length - 1}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 20, opacity: idx === WORLDS.length - 1 ? 0.2 : 1,
          cursor: idx === WORLDS.length - 1 ? "default" : "pointer",
          transition: "opacity 0.2s", WebkitTapHighlightColor: "transparent",
        }}
      >
        <ChevronRight size={20} color="white" />
      </button>

      {/* ── WORLD INFO + DOTS + ENTER — bottom ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        zIndex: 20,
        padding: "0 24px",
        paddingBottom: "max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        opacity: 1,
        transition: "opacity 0.35s ease",
      }}>
        {/* World name & desc */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            color: world.accentColor, fontWeight: 900, fontSize: 24, margin: "0 0 4px",
            textShadow: `0 0 20px ${world.glow}, 0 2px 8px rgba(0,0,0,0.8)`,
          }}>
            {world.emoji} {world.label}
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>
            {world.desc}
          </p>
        </div>

        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {WORLDS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === idx ? 24 : 7, height: 7, borderRadius: 99, border: "none", padding: 0,
                background: i === idx ? world.accentColor : "rgba(255,255,255,0.2)",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: i === idx ? `0 0 12px ${world.glow}` : "none",
                WebkitTapHighlightColor: "transparent",
              }}
            />
          ))}
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
            background: `linear-gradient(135deg, ${world.accentColor}ee, ${world.accentColor}77)`,
            boxShadow: `0 0 32px ${world.glow}, 0 8px 28px rgba(0,0,0,0.55)`,
            color: "white", fontWeight: 900, fontSize: 17, cursor: "pointer",
            textShadow: "0 1px 6px rgba(0,0,0,0.6)",
            transition: "background 0.4s, box-shadow 0.4s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Enter {world.label} {world.emoji}
        </button>
      </div>
    </div>
  );
}

