import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";
import { updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

export default function OnboardingCompanion() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(null);

  const companion = COMPANIONS[index];

  const go = (dir) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + COMPANIONS.length) % COMPANIONS.length);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const handleChoose = () => {
    updateOnboardingStore({ selectedCompanion: companion.id });
    localStorage.setItem("unfiltr_companion_id", companion.id);
    localStorage.setItem("unfiltr_companion", JSON.stringify(companion));
    navigate("/onboarding/nickname");
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.8 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.8 }),
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between"
      style={{ background: "linear-gradient(180deg, #06020f 0%, #1a0533 100%)" }}
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
            <div className="h-1 rounded-full" style={{ width: "60%", background: "linear-gradient(90deg, #a855f7, #db2777)" }} />
          </div>
          <span className="text-xs text-gray-400">Step 3 of 5</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-4">Pick your companion</h1>
        <p className="text-sm text-gray-400 mt-1">Swipe to explore · tap to select</p>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex items-center justify-center w-full relative" style={{ minHeight: 380 }}>
        {/* Left ghost */}
        {COMPANIONS[(index - 1 + COMPANIONS.length) % COMPANIONS.length] && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30 scale-75 pointer-events-none" style={{ zIndex: 1 }}>
            <img
              src={COMPANIONS[(index - 1 + COMPANIONS.length) % COMPANIONS.length].avatar}
              alt=""
              style={{ height: 220, objectFit: "contain" }}
            />
          </div>
        )}

        {/* Center card */}
        <div className="relative flex flex-col items-center" style={{ zIndex: 2, width: 240 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={companion.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex flex-col items-center"
            >
              {/* Glow behind avatar */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 180, height: 180,
                background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
                borderRadius: "50%", filter: "blur(20px)", zIndex: 0,
              }} />
              <img
                src={companion.avatar}
                alt={companion.name}
                style={{ height: 280, objectFit: "contain", position: "relative", zIndex: 1 }}
              />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={companion.id + "_name"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mt-4"
            >
              <h2 className="text-2xl font-bold text-white">{companion.name}</h2>
              <p className="text-sm mt-1" style={{ color: "#a855f7" }}>{companion.tagline}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right ghost */}
        {COMPANIONS[(index + 1) % COMPANIONS.length] && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 scale-75 pointer-events-none" style={{ zIndex: 1 }}>
            <img
              src={COMPANIONS[(index + 1) % COMPANIONS.length].avatar}
              alt=""
              style={{ height: 220, objectFit: "contain" }}
            />
          </div>
        )}

        {/* Arrow buttons */}
        <button
          onClick={() => go(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)", zIndex: 3 }}
        >
          <ChevronLeft size={22} color="#fff" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)", zIndex: 3 }}
        >
          <ChevronRight size={22} color="#fff" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mb-4">
        {COMPANIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            style={{
              width: i === index ? 20 : 8, height: 8, borderRadius: 4,
              background: i === index ? "#a855f7" : "rgba(255,255,255,0.25)",
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
          style={{ background: "linear-gradient(135deg, #a855f7, #db2777)" }}
        >
          Choose {companion.name} ✦
        </motion.button>
      </div>
    </div>
  );
}
