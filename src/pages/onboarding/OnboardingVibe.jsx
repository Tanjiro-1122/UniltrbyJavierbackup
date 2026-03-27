import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

const VIBES = [
  { id: "chill",      emoji: "😌", label: "Chill",      sub: "LOW-KEY",    desc: "Just hanging out.\nNo agenda, no pressure.",        color: "#0f766e", glow: "#14b8a6" },
  { id: "vent",       emoji: "👻", label: "Vent",       sub: "RELEASE",    desc: "Need to let it all out?\nI'm here, no judgment.",    color: "#6d28d9", glow: "#a855f7" },
  { id: "hype",       emoji: "🔥", label: "Hype",       sub: "LET'S GO",   desc: "Big moment coming up?\nLet's get you READY.",        color: "#b45309", glow: "#f59e0b" },
  { id: "deep_talk",  emoji: "🌙", label: "Deep Talk",  sub: "REAL",       desc: "Go somewhere deeper.\nNo small talk.",               color: "#1d4ed8", glow: "#60a5fa" },
  { id: "journal",    emoji: "✏️",  label: "Journal",    sub: "PRIVATE",    desc: "Write freely.\nSpeak your truth. Save it.",          color: "#065f46", glow: "#10b981" },
];

export default function OnboardingVibe() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(null);

  const vibe = VIBES[index];

  const go = (dir) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + VIBES.length) % VIBES.length);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const handleChoose = () => {
    updateOnboardingStore({ selectedVibe: vibe.id });
    localStorage.setItem("unfiltr_default_vibe", vibe.id);
    // Complete onboarding
    localStorage.setItem("unfiltr_onboarding_complete", "true");
    navigate("/vibe");
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.85 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.85 }),
  };

  const isJournal = vibe.id === "journal";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between"
      style={{ background: `linear-gradient(180deg, #06020f 0%, ${vibe.color}55 100%)`, transition: "background 0.5s ease" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="w-full px-4 pt-10 pb-2">
        <div className="flex items-center mb-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div className="flex-1 mx-4 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="h-1 rounded-full" style={{ width: "100%", background: `linear-gradient(90deg, ${vibe.glow}, #db2777)`, transition: "background 0.5s" }} />
          </div>
          <span className="text-xs text-gray-400">Step 5 of 5</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-4">What's your vibe?</h1>
        <p className="text-sm text-gray-400 mt-1">How do you want to show up today?</p>
      </div>

      {/* Carousel */}
      <div
        className="flex-1 flex items-center justify-center w-full relative px-12"
        style={{ minHeight: 340 }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={vibe.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center justify-center rounded-3xl p-8 w-full"
            style={{
              background: `linear-gradient(135deg, ${vibe.color}cc, ${vibe.color}66)`,
              border: `2px solid ${vibe.glow}55`,
              boxShadow: `0 0 40px ${vibe.glow}33`,
              minHeight: 300,
            }}
          >
            <span style={{ fontSize: 64 }}>{vibe.emoji}</span>
            <h2 className="text-3xl font-bold mt-4" style={{ color: vibe.glow }}>{vibe.label}</h2>
            <p className="text-xs font-semibold tracking-widest mt-1 text-white opacity-60">{vibe.sub}</p>
            <p className="text-center text-white text-sm mt-4 leading-relaxed opacity-90" style={{ whiteSpace: "pre-line" }}>{vibe.desc}</p>
            {isJournal && (
              <span className="mt-4 px-3 py-1 rounded-full text-xs font-bold border" style={{ borderColor: vibe.glow, color: vibe.glow }}>PRIVATE</span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Arrows */}
        <button
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,0.12)" }}
        >
          <ChevronLeft size={20} color="#fff" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,0.12)" }}
        >
          <ChevronRight size={20} color="#fff" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mb-4">
        {VIBES.map((v, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            style={{
              width: i === index ? 20 : 8, height: 8, borderRadius: 4,
              background: i === index ? vibe.glow : "rgba(255,255,255,0.25)",
              transition: "all 0.3s ease", border: "none", cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="w-full px-6 pb-10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleChoose}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg"
          style={{ background: isJournal ? `linear-gradient(135deg, ${vibe.color}, ${vibe.glow})` : `linear-gradient(135deg, ${vibe.glow}, #db2777)` }}
        >
          {isJournal ? "Start journaling →" : `Pick your world →`}
        </motion.button>
      </div>
    </div>
  );
}
