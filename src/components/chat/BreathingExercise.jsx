import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PHASES = [
  { label: "Breathe In", duration: 4000, scale: 1.6, color: "rgba(139,92,246,0.6)" },
  { label: "Hold", duration: 4000, scale: 1.6, color: "rgba(168,85,247,0.5)" },
  { label: "Breathe Out", duration: 4000, scale: 1, color: "rgba(88,28,135,0.4)" },
];

export default function BreathingExercise({ visible, onClose }) {
  const [phase, setPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [active, setActive] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!visible) { setActive(false); setPhase(0); setCycles(0); return; }
  }, [visible]);

  useEffect(() => {
    if (!active) return;
    timer.current = setTimeout(() => {
      const next = (phase + 1) % 3;
      setPhase(next);
      if (next === 0) setCycles(c => c + 1);
    }, PHASES[phase].duration);
    return () => clearTimeout(timer.current);
  }, [phase, active]);

  if (!visible) return null;
  const p = PHASES[phase];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(6,2,15,0.95)", backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          paddingTop: "env(safe-area-inset-top, 12px)",
          background: "rgba(255,255,255,0.1)", border: "none",
          borderRadius: "50%", width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <X size={18} color="white" />
        </button>

        {!active ? (
          <div style={{ textAlign: "center", padding: "0 32px" }}>
            <p style={{ fontSize: 48, marginBottom: 8 }}>🫁</p>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Breathing Exercise</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              4-4-4 box breathing. Calms your nervous system in just a few cycles.
            </p>
            <button onClick={() => setActive(true)} style={{
              padding: "14px 48px", borderRadius: 999, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer",
            }}>
              Start
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <motion.div
              animate={{ scale: p.scale }}
              transition={{ duration: p.duration / 1000, ease: "easeInOut" }}
              style={{
                width: 120, height: 120, borderRadius: "50%",
                background: `radial-gradient(circle, ${p.color}, transparent)`,
                border: "2px solid rgba(168,85,247,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: `0 0 60px ${p.color}`,
              }}
            >
              <span style={{ color: "white", fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
                {p.label}
              </span>
            </motion.div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              Cycle {cycles + 1}
            </p>
            <button onClick={() => { setActive(false); setPhase(0); setCycles(0); }}
              style={{
                marginTop: 32, padding: "10px 32px", borderRadius: 999,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
              End Session
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}