import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

const VISIBLE = COMPANIONS.filter(c => !c.testerOnly);

export default function OnboardingCompanion() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const initIdx = Math.max(0, VISIBLE.findIndex(c => c.id === store.selectedCompanion));
  const [idx, setIdx] = useState(initIdx);
  const [dir, setDir] = useState(0);
  const [imgLoaded, setImgLoaded] = useState({});
  const startX = useRef(null);

  if (!store.displayName.trim()) {
    navigate("/onboarding", { replace: true });
    return null;
  }

  // Preload companion avatars in small batches — prevents WebView freeze on large images
  useEffect(() => {
    let cancelled = false;
    const preloadBatch = async () => {
      for (let i = 0; i < VISIBLE.length; i++) {
        if (cancelled) break;
        const c = VISIBLE[i];
        await new Promise((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            if (!cancelled) setImgLoaded(prev => ({ ...prev, [c.id]: true }));
            resolve();
          };
          img.onerror = () => {
            if (!cancelled) setImgLoaded(prev => ({ ...prev, [c.id]: true }));
            resolve();
          };
          img.src = c.avatar;
          setTimeout(resolve, 3000);
        });
        if (i < VISIBLE.length - 1) await new Promise(r => setTimeout(r, 80));
      }
    };
    preloadBatch();
    return () => { cancelled = true; };
  }, []);

  const go = (d) => {
    setDir(d);
    setIdx(i => Math.min(Math.max(i + d, 0), VISIBLE.length - 1));
  };

  const handleSelect = () => {
    const c = VISIBLE[idx];
    updateOnboardingStore({ selectedCompanion: c.id });
    // If coming from quiz "choose myself", go to mode selection
    // otherwise normal onboarding path continues to nickname
    const fromQuiz = localStorage.getItem("unfiltr_quiz_companion_id");
    if (fromQuiz === null) {
      // Normal path: they haven't taken quiz, still go to nickname
      navigate("/onboarding/nickname");
    }
  };

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  const companion = VISIBLE[idx];

  const getStyle = (i) => {
    const diff = i - idx;
    if (Math.abs(diff) > 2) return null;
    const scale = diff === 0 ? 1 : Math.abs(diff) === 1 ? 0.72 : 0.52;
    const opacity = diff === 0 ? 1 : Math.abs(diff) === 1 ? 0.55 : 0.25;
    const x = diff * 160;
    // FIX: zIndex must be set as inline style, NOT inside animate — framer can't interpolate it
    const zIndex = diff === 0 ? 10 : Math.abs(diff) === 1 ? 5 : 2;
    const brightness = diff === 0 ? 1 : 0.35;
    return { scale, opacity, x, zIndex, brightness };
  };

  return (
    <OnboardingLayout
      totalSteps={7} step={3} onBack={() => {
              const fromQuiz = localStorage.getItem("unfiltr_quiz_companion_id");
              navigate(fromQuiz !== null ? "/onboarding/quiz" : "/onboarding/name");
            }} canAdvance={false}>
      {/* Title */}
      <div style={{ flexShrink: 0, padding: "0 24px 8px", textAlign: "center" }}>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: 26, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
          Pick your companion
        </h2>
        <p style={{ color: "rgba(196,180,252,0.6)", fontSize: 13, margin: 0 }}>
          Swipe to explore · tap to select
        </p>
      </div>

      {/* Carousel */}
      <div
        style={{
          height: 300, flexShrink: 0, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Glow platform under selected */}
        <div style={{
          position: "absolute", bottom: "18%", left: "50%", transform: "translateX(-50%)",
          width: 180, height: 24, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(168,85,247,0.5) 0%, transparent 70%)",
          filter: "blur(10px)", zIndex: 1, pointerEvents: "none",
        }} />

        {VISIBLE.map((c, i) => {
          const s = getStyle(i);
          if (!s) return null;
          return (
            <motion.div
              key={c.id}
              // FIX: zIndex pulled OUT of animate and set as static inline style
              // so it never mid-animates to a value that covers the whole screen
              style={{
                position: "absolute",
                display: "flex", flexDirection: "column", alignItems: "center",
                cursor: i !== idx ? "pointer" : "default",
                filter: `brightness(${s.brightness})`,
                zIndex: s.zIndex,  // ← static, not animated
              }}
              animate={{ x: s.x, scale: s.scale, opacity: s.opacity }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={() => {
                if (i !== idx) go(i - idx > 0 ? 1 : -1);
              }}
            >
              {/* Emoji placeholder — visible until image loads */}
              <div style={{
                position: "absolute",
                height: 260, width: 160,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: imgLoaded[c.id] ? 0 : 1,
                transition: "opacity 0.3s",
                pointerEvents: "none",
              }}>
                <span style={{ fontSize: 48 }}>{c.emoji}</span>
              </div>
              <img
                src={c.avatar}
                alt={c.name}
                style={{
                  height: 260, width: "auto", maxWidth: 180,
                  objectFit: "contain", objectPosition: "bottom",
                  opacity: imgLoaded[c.id] ? 1 : 0,
                  transition: "opacity 0.3s, filter 0.3s",
                  filter: i === idx
                    ? "drop-shadow(0 16px 40px rgba(168,85,247,0.7)) drop-shadow(0 0 80px rgba(168,85,247,0.3))"
                    : "none",
                  // FIX: prevent image from being a click-blocker when off-screen
                  pointerEvents: i === idx ? "auto" : "none",
                }}
                onLoad={() => setImgLoaded(prev => ({ ...prev, [c.id]: true }))}
                onError={() => setImgLoaded(prev => ({ ...prev, [c.id]: true }))}
              />
            </motion.div>
          );
        })}

        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: idx === 0 ? "not-allowed" : "pointer", zIndex: 20,
            opacity: idx === 0 ? 0.3 : 1, transition: "opacity 0.2s",
          }}
        >
          <ChevronLeft size={22} color="white" />
        </button>
        <button
          onClick={() => go(1)}
          disabled={idx === VISIBLE.length - 1}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: idx === VISIBLE.length - 1 ? "not-allowed" : "pointer", zIndex: 20,
            opacity: idx === VISIBLE.length - 1 ? 0.3 : 1, transition: "opacity 0.2s",
          }}
        >
          <ChevronRight size={22} color="white" />
        </button>
      </div>

      {/* Name + tagline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={companion.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          style={{ flexShrink: 0, textAlign: "center", padding: "0 24px 8px" }}
        >
          <p style={{ color: "white", fontWeight: 900, fontSize: 24, margin: "0 0 4px", letterSpacing: -0.5 }}>{companion.name}</p>
          <p style={{ color: "rgba(196,180,252,0.65)", fontSize: 13, margin: 0 }}>{companion.tagline}</p>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", gap: 5, padding: "4px 0 12px" }}>
        {VISIBLE.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i - idx)}
            style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 999, border: "none", padding: 0,
              background: i === idx ? "#a855f7" : "rgba(255,255,255,0.2)",
              cursor: "pointer", transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Select button */}
      <div style={{ flexShrink: 0, padding: "0 24px max(16px, env(safe-area-inset-bottom, 16px))" }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSelect}
          style={{
            width: "100%", padding: "16px",
            borderRadius: 18, border: "none",
            background: "linear-gradient(135deg, #7c3aed, #db2777)",
            color: "white", fontWeight: 800, fontSize: 17,
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(124,58,237,0.5)",
          }}
        >
          Choose {companion.name} ✶
        </motion.button>
      </div>
    </OnboardingLayout>
  );
}
