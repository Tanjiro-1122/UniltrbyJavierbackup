import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [companionName, setCompanionName] = useState("your companion");
  const [companionAvatar, setCompanionAvatar] = useState(null);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  // Preload all world backgrounds
  useEffect(() => {
    WORLDS.forEach(w => {
      const img = new window.Image();
      img.onload  = () => setLoaded(prev => ({ ...prev, [w.id]: true }));
      img.onerror = () => setLoaded(prev => ({ ...prev, [w.id]: false }));
      img.src = w.bgImage;
    });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unfiltr_companion");
      if (saved) {
        const p = JSON.parse(saved);
        setCompanionName(p.displayName || p.name || "your companion");
        setCompanionAvatar(p.avatar || null);
      }
      const savedWorld = localStorage.getItem("unfiltr_journal_world");
      if (savedWorld) {
        const i = WORLDS.findIndex(w => w.id === savedWorld);
        if (i >= 0) setIdx(i);
      }
    } catch (e) {}
  }, []);

  const goTo = useCallback((newIdx) => {
    setIdx(Math.max(0, Math.min(WORLDS.length - 1, newIdx)));
  }, []);

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

  return (
    <div
      style={{
        position: "fixed", inset: 0, display: "flex", flexDirection: "column",
        fontFamily: "system-ui,-apple-system,sans-serif", overflow: "hidden",
        background: "#06020f",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={() => navigate("/journal")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px",
          fontWeight: 500
        }}
      >
        ← Back
      </button>
      {/* Hidden preload triggers */}
      <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0, overflow: "hidden" }}>
        {WORLDS.map(w => <img key={w.id} src={w.bgImage} alt="" />)}
      </div>

      {/* Full-screen background layers — fallback always visible, image fades in on top */}
      {WORLDS.map((w, i) => (
        <div key={w.id} style={{
          position: "absolute", inset: 0, zIndex: 0,
          opacity: i === idx ? 1 : 0,
          transition: "opacity 0.45s ease",
          pointerEvents: "none",
        }}>
          {/* Gradient fallback always present */}
          <div style={{ position: "absolute", inset: 0, background: w.bgFallback }} />
          {/* Image layer fades in when loaded */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: loaded[w.id] ? `url(${w.bgImage})` : "none",
            backgroundSize: "cover", backgroundPosition: "center",
            transition: "opacity 0.4s ease",
            opacity: loaded[w.id] ? 1 : 0,
          }} />
        </div>
      ))}

      {/* Dark gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.95) 100%)",
      }} />

      {/* Companion avatar — centered in background, behind cards */}
      {companionAvatar && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
          paddingBottom: "18%",
        }}>
          <img
            src={companionAvatar}
            alt={companionName}
            style={{
              height: "52%", width: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 12px 36px rgba(0,0,0,0.65))",
              opacity: 0.9,
            }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{
        flexShrink: 0, position: "relative", zIndex: 20,
        padding: "max(1.5rem, env(safe-area-inset-top, 1.5rem)) 20px 10px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate("/journal/home")}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 20, margin: 0, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            🎨 Pick Your Space
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" }}>
            {companionName} will hang out here with you ✨
          </p>
        </div>
      </div>

      {/* World cards carousel */}
      <div style={{
        flex: 1, position: "relative", display: "flex", alignItems: "center",
        justifyContent: "center", overflow: "hidden", zIndex: 10,
      }}>
        {WORLDS.map((w, i) => {
          const diff = i - idx;
          if (Math.abs(diff) > 1) return null;
          const isActive = diff === 0;

          return (
            <div
              key={w.id}
              onClick={() => !isActive && goTo(i)}
              style={{
                position: "absolute",
                width: 218, height: 296, borderRadius: 24, overflow: "hidden",
                border: `2.5px solid ${isActive ? w.accentColor : "rgba(255,255,255,0.12)"}`,
                boxShadow: isActive
                  ? `0 0 0 1px ${w.accentColor}33, 0 0 40px ${w.glow}, 0 20px 60px rgba(0,0,0,0.7)`
                  : "0 8px 32px rgba(0,0,0,0.4)",
                transform: `translateX(${diff * 236}px) scale(${isActive ? 1 : 0.78})`,
                opacity: isActive ? 1 : 0.5,
                zIndex: isActive ? 10 : 5,
                cursor: isActive ? "default" : "pointer",
                background: w.bgFallback,
                transition: "transform 0.32s cubic-bezier(.4,0,.2,1), opacity 0.32s ease, border-color 0.25s, box-shadow 0.25s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* Card bg image */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: loaded[w.id] ? `url(${w.bgImage})` : "none",
                backgroundSize: "cover", backgroundPosition: "center",
              }} />
              {/* Card overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: isActive
                  ? "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.48) 55%, rgba(0,0,0,0.92) 100%)"
                  : "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.97) 100%)",
                pointerEvents: "none",
              }} />
              {/* Card label */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "12px 16px 18px", textAlign: "center", pointerEvents: "none",
              }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{w.emoji}</div>
                <p style={{ color: isActive ? w.accentColor : "rgba(255,255,255,0.7)", fontWeight: 800, fontSize: 15, margin: "0 0 3px" }}>
                  {w.label}
                </p>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>
                  {w.desc}
                </p>
              </div>
            </div>
          );
        })}

        {/* Prev button */}
        <button
          onClick={(e) => { e.stopPropagation(); goTo(idx - 1); }}
          disabled={idx === 0}
          style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 30, opacity: idx === 0 ? 0.25 : 1,
            cursor: idx === 0 ? "default" : "pointer",
            transition: "opacity 0.2s", WebkitTapHighlightColor: "transparent",
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>

        {/* Next button */}
        <button
          onClick={(e) => { e.stopPropagation(); goTo(idx + 1); }}
          disabled={idx === WORLDS.length - 1}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 30, opacity: idx === WORLDS.length - 1 ? 0.25 : 1,
            cursor: idx === WORLDS.length - 1 ? "default" : "pointer",
            transition: "opacity 0.2s", WebkitTapHighlightColor: "transparent",
          }}
        >
          <ChevronRight size={20} color="white" />
        </button>
      </div>

      {/* Dots */}
      <div style={{
        flexShrink: 0, display: "flex", justifyContent: "center", gap: 6,
        padding: "6px 0", zIndex: 20, position: "relative",
      }}>
        {WORLDS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === idx ? 22 : 6, height: 6, borderRadius: 99, border: "none",
              background: i === idx ? world.accentColor : "rgba(255,255,255,0.22)",
              cursor: "pointer", padding: 0,
              transition: "all 0.3s",
              boxShadow: i === idx ? `0 0 10px ${world.glow}` : "none",
              WebkitTapHighlightColor: "transparent",
            }}
          />
        ))}
      </div>

      {/* Enter button */}
      <div style={{
        flexShrink: 0, padding: "10px 24px",
        paddingBottom: "max(26px, calc(env(safe-area-inset-bottom, 0px) + 18px))",
        position: "relative", zIndex: 20,
      }}>
        <button
          onClick={handleEnter}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
            background: `linear-gradient(135deg, ${world.accentColor}dd, ${world.accentColor}88)`,
            boxShadow: `0 0 28px ${world.glow}, 0 8px 24px rgba(0,0,0,0.45)`,
            color: "white", fontWeight: 900, fontSize: 17, cursor: "pointer",
            transition: "background 0.4s, box-shadow 0.4s",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Enter {world.label} {world.emoji}
        </button>
      </div>
    </div>
  );
}
