import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BACKGROUNDS, COMPANIONS } from "@/components/companionData";

// Accent colors per background for glow theming
const ACCENTS = {
  living_room: { color: "#ffb347", glow: "rgba(255,140,40,0.55)" },
  "cozy-living-room-real": { color: "#ffb347", glow: "rgba(255,140,40,0.55)" },
  park: { color: "#4ade80", glow: "rgba(74,222,128,0.5)" },
  "sunny-park-real": { color: "#4ade80", glow: "rgba(74,222,128,0.5)" },
  beach: { color: "#fbbf24", glow: "rgba(251,191,36,0.5)" },
  "sunset-beach-real": { color: "#fbbf24", glow: "rgba(251,191,36,0.5)" },
  underwater: { color: "#22d3ee", glow: "rgba(34,211,238,0.5)" },
  "deep-ocean-real": { color: "#22d3ee", glow: "rgba(34,211,238,0.5)" },
  blossom: { color: "#f9a8d4", glow: "rgba(249,168,212,0.5)" },
  skyislands: { color: "#93c5fd", glow: "rgba(147,197,253,0.5)" },
  forest: { color: "#86efac", glow: "rgba(134,239,172,0.5)" },
  "enchanted-forest-real": { color: "#86efac", glow: "rgba(134,239,172,0.5)" },
  cafe: { color: "#c462ff", glow: "rgba(196,98,255,0.5)" },
  "rainy-cafe-real": { color: "#c462ff", glow: "rgba(196,98,255,0.5)" },
  rooftop: { color: "#f472b6", glow: "rgba(244,114,182,0.5)" },
  "tokyo-rooftop-real": { color: "#f472b6", glow: "rgba(244,114,182,0.5)" },
  cabin: { color: "#a3e635", glow: "rgba(163,230,53,0.5)" },
  "winter-cabin-real": { color: "#a3e635", glow: "rgba(163,230,53,0.5)" },
  cyberpunk: { color: "#f472b6", glow: "rgba(244,114,182,0.55)" },
  "cyberpunk-city-real": { color: "#f472b6", glow: "rgba(244,114,182,0.55)" },
  "outer-space-real": { color: "#818cf8", glow: "rgba(129,140,248,0.55)" },
};

function getAccent(id) {
  return ACCENTS[id] || { color: "#a78bfa", glow: "rgba(167,139,250,0.5)" };
}

// Use only the "real" (photorealistic/painterly) versions — they look better full-screen
// Use all backgrounds — filter out duplicates by preferring "-real" versions
const WORLDS = (() => {
  const seen = new Set();
  const result = [];
  // First pass: add all "-real" versions
  for (const b of BACKGROUNDS) {
    if (b.id.endsWith("-real")) {
      const base = b.id.replace("-real","");
      seen.add(base);
      result.push(b);
    }
  }
  // Second pass: add non-real ones that don't have a real counterpart
  for (const b of BACKGROUNDS) {
    if (!b.id.endsWith("-real") && !seen.has(b.id)) {
      result.push(b);
    }
  }
  return result;
})();

export default function BackgroundSelect() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [companion, setCompanion] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  // Preload all bg images
  useEffect(() => {
    WORLDS.forEach(w => {
      const img = new window.Image();
      img.onload = () => setLoaded(prev => ({ ...prev, [w.id]: true }));
      img.src = w.url;
    });
  }, []);

  // Load companion
  useEffect(() => {
    try {
      const saved = localStorage.getItem("unfiltr_companion");
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = COMPANIONS.find(c => c.id === parsed.id || c.name === parsed.name);
        if (found) setCompanion(found);
        else if (COMPANIONS.length > 0) setCompanion(COMPANIONS[0]);
      } else if (COMPANIONS.length > 0) {
        setCompanion(COMPANIONS[0]);
      }
      // Restore last used background
      const saved_env = localStorage.getItem("unfiltr_env");
      if (saved_env) {
        const env = JSON.parse(saved_env);
        const i = WORLDS.findIndex(w => w.id === env.id);
        if (i >= 0) setIdx(i);
      }
    } catch {}
  }, []);

  const goTo = useCallback((newIdx) => {
    const clamped = Math.max(0, Math.min(WORLDS.length - 1, newIdx));
    if (clamped === idx) return;
    setIdx(clamped);
  }, [idx]);

  const handleEnter = () => {
    const w = WORLDS[idx];
    localStorage.setItem("unfiltr_env", JSON.stringify({ id: w.id, label: w.label, bg: w.url }));
    navigate("/chat");
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
    touchStartX.current = null; isSwiping.current = false;
  };

  const world = WORLDS[idx];
  const accent = getAccent(world.id);
  const companionImg = companion?.poses?.neutral || companion?.poses?.happy || companion?.avatar || "";
  const nickName = localStorage.getItem("unfiltr_companion_nickname") || companion?.displayName || companion?.name || "your companion";

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Preload */}
      <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0, overflow: "hidden" }}>
        {WORLDS.map(w => <img key={w.id} src={w.url} alt="" />)}
      </div>

      {/* Full-screen world backgrounds */}
      {WORLDS.map((w, i) => (
        <div key={w.id} style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: loaded[w.id] ? `url(${w.url})` : undefined,
          background: loaded[w.id] ? undefined : "#06020f",
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: i === idx ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }} />
      ))}

      {/* Gradient overlays */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 28%, rgba(0,0,0,0.05) 48%, rgba(0,0,0,0.38) 65%, rgba(0,0,0,0.9) 100%)",
      }} />
      {/* Accent glow from world color */}
      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%", height: "38%",
        zIndex: 1, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 100%, ${accent.glow} 0%, transparent 70%)`,
        transition: "background 0.5s ease",
      }} />

      {/* ── HEADER ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: "max(52px, env(safe-area-inset-top, 52px))",
        padding: "max(52px, env(safe-area-inset-top, 52px)) 20px 0",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => navigate("/vibe")} style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent",
        }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 20, margin: 0, textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>
            🎨 Pick Your Space
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "2px 0 0" }}>
            {nickName} will hang out here with you ✨
          </p>
        </div>
      </div>

      {/* ── COMPANION AVATAR ── */}
      {companionImg && (
        <div style={{
          position: "absolute",
          bottom: "28%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          width: 210, height: 270,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          opacity: avatarLoaded ? 1 : 0,
          transition: "opacity 0.5s ease",
          filter: `drop-shadow(0 8px 32px ${accent.glow})`,
        }}>
          <img
            src={companionImg}
            alt={nickName}
            onLoad={() => setAvatarLoaded(true)}
            style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }}
          />
        </div>
      )}

      {/* Ground glow */}
      <div style={{
        position: "absolute", bottom: "27%", left: "50%", transform: "translateX(-50%)",
        width: 180, height: 36, borderRadius: "50%",
        background: `radial-gradient(ellipse, ${accent.glow} 0%, transparent 70%)`,
        filter: "blur(12px)", pointerEvents: "none", zIndex: 1,
        transition: "background 0.5s ease",
      }} />

      {/* ── NAV ARROWS ── */}
      <button onClick={(e) => { e.stopPropagation(); goTo(idx - 1); }} disabled={idx === 0}
        style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 20, opacity: idx === 0 ? 0.2 : 1,
          cursor: idx === 0 ? "default" : "pointer",
          transition: "opacity 0.2s", WebkitTapHighlightColor: "transparent",
        }}>
        <ChevronLeft size={20} color="white" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); goTo(idx + 1); }} disabled={idx === WORLDS.length - 1}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 20, opacity: idx === WORLDS.length - 1 ? 0.2 : 1,
          cursor: idx === WORLDS.length - 1 ? "default" : "pointer",
          transition: "opacity 0.2s", WebkitTapHighlightColor: "transparent",
        }}>
        <ChevronRight size={20} color="white" />
      </button>

      {/* ── BOTTOM INFO + ENTER ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: "0 24px",
        paddingBottom: "max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            color: accent.color, fontWeight: 900, fontSize: 26, margin: "0 0 4px",
            textShadow: `0 0 22px ${accent.glow}, 0 2px 8px rgba(0,0,0,0.8)`,
          }}>
            {world.emoji} {world.label}
          </p>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {WORLDS.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === idx ? 24 : 7, height: 7, borderRadius: 99, border: "none", padding: 0,
              background: i === idx ? accent.color : "rgba(255,255,255,0.2)",
              cursor: "pointer", transition: "all 0.3s",
              boxShadow: i === idx ? `0 0 12px ${accent.glow}` : "none",
              WebkitTapHighlightColor: "transparent",
            }} />
          ))}
        </div>

        <button onClick={handleEnter} style={{
          width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
          background: `linear-gradient(135deg, ${accent.color}ee, ${accent.color}77)`,
          boxShadow: `0 0 32px ${accent.glow}, 0 8px 28px rgba(0,0,0,0.55)`,
          color: "white", fontWeight: 900, fontSize: 17, cursor: "pointer",
          textShadow: "0 1px 6px rgba(0,0,0,0.6)",
          transition: "background 0.4s, box-shadow 0.4s",
          WebkitTapHighlightColor: "transparent",
        }}>
          Chat in {world.label} {world.emoji}
        </button>
      </div>
    </div>
  );
}

