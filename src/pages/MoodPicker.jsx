import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const NOTO = "https://fonts.gstatic.com/s/e/notoemoji/latest";

const MOODS = [
  {
    id: "happy",
    emoji: `${NOTO}/1f604/512.webp`,
    label: "Happy", sub: "Feeling good",
    desc: "Riding a good wave today.\nLet's keep that energy going.",
    gradient: "linear-gradient(135deg,#f59e0b,#f97316)",
    orb: "rgba(251,191,36,0.45)", glow: "rgba(245,158,11,0.4)",
    bg: "#160d00", accent: "#fbbf24", cardBorder: "rgba(251,191,36,0.6)",
  },
  {
    id: "contentment",
    emoji: `${NOTO}/1f60a/512.webp`,
    label: "Content", sub: "At peace",
    desc: "Calm and settled.\nNothing to prove right now.",
    gradient: "linear-gradient(135deg,#10b981,#34d399)",
    orb: "rgba(16,185,129,0.45)", glow: "rgba(16,185,129,0.4)",
    bg: "#011a10", accent: "#34d399", cardBorder: "rgba(52,211,153,0.6)",
  },
  {
    id: "neutral",
    emoji: `${NOTO}/1f610/512.webp`,
    label: "Neutral", sub: "Just here",
    desc: "Not great, not bad.\nJust existing for now.",
    gradient: "linear-gradient(135deg,#64748b,#94a3b8)",
    orb: "rgba(100,116,139,0.45)", glow: "rgba(148,163,184,0.35)",
    bg: "#0a0c10", accent: "#94a3b8", cardBorder: "rgba(148,163,184,0.5)",
  },
  {
    id: "sad",
    emoji: `${NOTO}/1f622/512.webp`,
    label: "Sad", sub: "Down today",
    desc: "Feeling low and that's okay.\nI'm here with you.",
    gradient: "linear-gradient(135deg,#3b82f6,#6366f1)",
    orb: "rgba(59,130,246,0.45)", glow: "rgba(99,102,241,0.4)",
    bg: "#020818", accent: "#93c5fd", cardBorder: "rgba(99,102,241,0.6)",
  },
  {
    id: "fear",
    emoji: `${NOTO}/1f628/512.webp`,
    label: "Anxious", sub: "On edge",
    desc: "Nerves running high.\nLet's slow it down together.",
    gradient: "linear-gradient(135deg,#7c3aed,#a855f7)",
    orb: "rgba(124,58,237,0.45)", glow: "rgba(167,139,250,0.4)",
    bg: "#0d0218", accent: "#c4b5fd", cardBorder: "rgba(167,139,250,0.6)",
  },
  {
    id: "anger",
    emoji: `${NOTO}/1f621/512.webp`,
    label: "Angry", sub: "Fired up",
    desc: "Something's got you heated.\nVent it out — no filter.",
    gradient: "linear-gradient(135deg,#dc2626,#f97316)",
    orb: "rgba(220,38,38,0.5)", glow: "rgba(239,68,68,0.4)",
    bg: "#1a0000", accent: "#f87171", cardBorder: "rgba(248,113,113,0.6)",
  },
  {
    id: "surprise",
    emoji: `${NOTO}/1f62e/512.webp`,
    label: "Surprised", sub: "Caught off guard",
    desc: "Something unexpected hit.\nTell me everything.",
    gradient: "linear-gradient(135deg,#0ea5e9,#22d3ee)",
    orb: "rgba(14,165,233,0.45)", glow: "rgba(6,182,212,0.4)",
    bg: "#001218", accent: "#67e8f9", cardBorder: "rgba(103,232,249,0.6)",
  },
  {
    id: "disgust",
    emoji: `${NOTO}/1f922/512.webp`,
    label: "Grossed Out", sub: "Not feeling it",
    desc: "Something's off and you know it.\nLet's talk about it.",
    gradient: "linear-gradient(135deg,#65a30d,#84cc16)",
    orb: "rgba(101,163,13,0.45)", glow: "rgba(132,204,22,0.35)",
    bg: "#060f00", accent: "#bef264", cardBorder: "rgba(190,242,100,0.5)",
  },
  {
    id: "fatigue",
    emoji: `${NOTO}/1f62a/512.webp`,
    label: "Tired", sub: "Running on empty",
    desc: "Exhausted and drained.\nNo pressure — just rest here.",
    gradient: "linear-gradient(135deg,#6d28d9,#4c1d95)",
    orb: "rgba(109,40,217,0.45)", glow: "rgba(109,40,217,0.35)",
    bg: "#0a0218", accent: "#a78bfa", cardBorder: "rgba(167,139,250,0.5)",
  },
];

export default function MoodPicker() {
  const navigate = useNavigate();
  const location = useLocation();
  const dest = new URLSearchParams(location.search).get("dest") || "chat";
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  // Define goTo FIRST before any useEffect that references it
  const goTo = useCallback((i) => {
    setIdx(Math.max(0, Math.min(MOODS.length - 1, i)));
  }, []);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  // Keyboard + mouse drag support
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") goTo(idx - 1);
      if (e.key === "ArrowRight") goTo(idx + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [idx, goTo]);

  const mouseStartX = useRef(null);
  const handleMouseDown = (e) => { mouseStartX.current = e.clientX; };
  const handleMouseUp = (e) => {
    if (mouseStartX.current === null) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 35) goTo(idx + (dx < 0 ? 1 : -1));
    mouseStartX.current = null;
  };

  const mood = MOODS[idx];

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
    localStorage.setItem("unfiltr_mood", mood.id);
    sessionStorage.setItem("unfiltr_mood_session", new Date().toDateString());
    // Also write into the mood history so the AI greeting can reference it
    const todayKey = new Date().toISOString().slice(0, 10);
    const history = JSON.parse(localStorage.getItem("unfiltr_mood_history") || "{}");
    history[todayKey] = mood.id;
    localStorage.setItem("unfiltr_mood_history", JSON.stringify(history));

    // 💾 Save mood to DB (fire-and-forget — never blocks navigation)
    const appleId = localStorage.getItem("unfiltr_apple_user_id");
    if (appleId) {
      try {
        const B44_APP = "69b332a392004d139d4ba495";
        const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;
        const DB_TOKEN = "1156284fb9144ad9ab95afc962e848d8";
        fetch(`${B44_BASE}/MoodEntry`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${DB_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            apple_user_id: appleId,
            mood: mood.id,
            mood_label: mood.label || mood.id,
            date: todayKey,
            created_date: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch(e) {}
    }

    if (dest === "journal") {
      navigate("/journal-enter");
    } else {
      navigate("/chat-enter");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, overflow: "hidden",
        fontFamily: "'SF Pro Display',system-ui,-apple-system,sans-serif",
        display: "flex", flexDirection: "column",
        background: `radial-gradient(ellipse at 50% 20%, ${mood.orb} 0%, ${mood.bg} 45%, #03000d 100%)`,
        transition: "background 0.55s ease",
      }}
    >
      {/* Glow orb */}
      <AnimatePresence mode="wait">
        <motion.div key={mood.id}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
            width: 440, height: 440, borderRadius: "50%",
            background: `radial-gradient(circle, ${mood.orb} 0%, transparent 70%)`,
            filter: "blur(55px)", pointerEvents: "none", zIndex: 0,
          }}
        />
      </AnimatePresence>

      {/* Header */}
      <div style={{
        flexShrink: 0, padding: "max(1.4rem,env(safe-area-inset-top)) 18px 8px",
        display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 5,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: "-0.5px" }}>
            How are you feeling?
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0, fontWeight: 500 }}>
            Swipe to find your emotion right now
          </p>
        </div>
      </div>

      {/* Carousel */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          flex: 1, position: "relative", zIndex: 5,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
        {MOODS.map((m, i) => {
          const diff = i - idx;
          if (Math.abs(diff) > 1) return null;
          const isActive = diff === 0;
          return (
            <motion.div key={m.id}
              onClick={() => !isActive && goTo(i)}
              animate={{ x: diff * 262, scale: isActive ? 1 : 0.74, opacity: isActive ? 1 : 0.38 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "absolute", width: 232, height: 330, borderRadius: 32,
                border: `2px solid ${isActive ? m.cardBorder : "rgba(255,255,255,0.09)"}`,
                boxShadow: isActive
                  ? `0 0 0 1px ${m.glow}, 0 0 55px ${m.glow}, 0 28px 64px rgba(0,0,0,0.75)`
                  : "0 8px 24px rgba(0,0,0,0.4)",
                background: isActive
                  ? "linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.03) 100%)"
                  : "rgba(255,255,255,0.04)",
                backdropFilter: "blur(22px)",
                cursor: isActive ? "default" : "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "24px 22px 28px", zIndex: isActive ? 10 : 5,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{
                width: 110, height: 110, marginBottom: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                filter: isActive ? `drop-shadow(0 0 30px ${m.glow}) drop-shadow(0 8px 20px rgba(0,0,0,0.6))` : "none",
              }}>
                <img src={m.emoji} alt={m.label} style={{
                  width: "100%", height: "100%", objectFit: "contain",
                  opacity: isActive ? 1 : 0.5,
                }} />
              </div>

              <p style={{
                fontWeight: 900, fontSize: 26, margin: "0 0 3px", letterSpacing: "-0.5px",
                background: isActive ? m.gradient : "none",
                WebkitBackgroundClip: isActive ? "text" : "initial",
                WebkitTextFillColor: isActive ? "transparent" : "rgba(255,255,255,0.45)",
                color: isActive ? undefined : "rgba(255,255,255,0.45)",
              }}>{m.label}</p>

              <p style={{
                color: isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                fontSize: 11, fontWeight: 700, margin: "0 0 14px",
                textTransform: "uppercase", letterSpacing: "0.14em",
              }}>{m.sub}</p>

              {isActive && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35 }}
                  style={{
                    color: "rgba(255,255,255,0.52)", fontSize: 13, lineHeight: 1.55,
                    textAlign: "center", margin: 0, whiteSpace: "pre-line",
                  }}
                >
                  {m.desc}
                </motion.p>
              )}
            </motion.div>
          );
        })}

        <button onClick={() => goTo(idx - 1)} disabled={idx === 0} style={{
            position: "absolute", left: 14, zIndex: 20,
            width: 42, height: 42, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}>
            <ChevronLeft size={22} color="white" />
          </button>
        <button onClick={() => goTo(idx + 1)} disabled={idx === MOODS.length - 1} style={{
            position: "absolute", right: 14, zIndex: 20,
            width: 42, height: 42, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}>
            <ChevronRight size={22} color="white" />
          </button>
      </div>

      {/* Dots */}
      <div style={{
        flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 5,
        padding: "8px 0", zIndex: 5, position: "relative",
      }}>
        {MOODS.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === idx ? 20 : 6, height: 6, borderRadius: 99, border: "none",
            background: i === idx ? mood.accent : "rgba(255,255,255,0.18)",
            boxShadow: i === idx ? `0 0 10px ${mood.glow}` : "none",
            cursor: "pointer", padding: 0, transition: "all 0.3s ease",
            WebkitTapHighlightColor: "transparent",
          }} />
        ))}
      </div>

      {/* CTA */}
      <div style={{
        flexShrink: 0, padding: "10px 20px max(22px,env(safe-area-inset-bottom))",
        position: "relative", zIndex: 5,
      }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue} style={{
          width: "100%", padding: "17px 0", borderRadius: 22, border: "none",
          background: mood.gradient,
          boxShadow: `0 8px 36px ${mood.glow}`,
          color: "white", fontWeight: 800, fontSize: 17, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          WebkitTapHighlightColor: "transparent", transition: "all 0.35s ease",
        }}>
          I'm feeling {mood.label} <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}
