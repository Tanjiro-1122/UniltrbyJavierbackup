import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const EXERCISES = [
  { id: "box",    label: "Box Breathing",   emoji: "🫧", inhale: 4, hold: 4, exhale: 4, holdOut: 4, rounds: 4 },
  { id: "calm",   label: "Calming Breath",  emoji: "🌊", inhale: 4, hold: 7, exhale: 8, holdOut: 0, rounds: 3 },
  { id: "energy", label: "Energy Boost",    emoji: "⚡", inhale: 2, hold: 0, exhale: 2, holdOut: 0, rounds: 10 },
];

export default function GuidedMeditation({ visible, onClose, companionName }) {
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState(null); // "inhale" | "hold" | "exhale" | "holdOut"
  const [round, setRound] = useState(0);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running || !selected) return;
    const ex = EXERCISES.find(e => e.id === selected);
    const sequence = [
      { phase: "inhale", dur: ex.inhale },
      ...(ex.hold > 0 ? [{ phase: "hold", dur: ex.hold }] : []),
      { phase: "exhale", dur: ex.exhale },
      ...(ex.holdOut > 0 ? [{ phase: "holdOut", dur: ex.holdOut }] : []),
    ];

    let stepIdx = 0;
    let currentRound = 0;
    let countdown = sequence[0].dur;
    setPhase(sequence[0].phase);
    setTimer(countdown);
    setRound(1);

    intervalRef.current = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        stepIdx++;
        if (stepIdx >= sequence.length) {
          stepIdx = 0;
          currentRound++;
          if (currentRound >= ex.rounds) {
            clearInterval(intervalRef.current);
            setPhase("done");
            setRunning(false);
            return;
          }
          setRound(currentRound + 1);
        }
        countdown = sequence[stepIdx].dur;
        setPhase(sequence[stepIdx].phase);
      }
      setTimer(countdown);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, selected]);

  const handleStart = (id) => {
    setSelected(id);
    setRunning(true);
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSelected(null);
    setPhase(null);
  };

  if (!visible) return null;

  const phaseLabels = { inhale: "Breathe In", hold: "Hold", exhale: "Breathe Out", holdOut: "Hold", done: "Complete ✨" };
  const phaseColors = { inhale: "#7c3aed", hold: "#f59e0b", exhale: "#db2777", holdOut: "#6366f1", done: "#22c55e" };
  const circleScale = phase === "inhale" ? 1.3 : phase === "exhale" ? 0.7 : 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        onClick={!running ? onClose : undefined}
      >
        <motion.div onClick={e => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ width: "90%", maxWidth: 360, textAlign: "center" }}
        >
          <button onClick={() => { handleStop(); onClose(); }}
            style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
            <X size={18} color="white" />
          </button>

          {!running && !phase ? (
            <>
              <p style={{ fontSize: 40, marginBottom: 8 }}>🧘</p>
              <h2 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>
                Breathe with {companionName || "me"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24 }}>Choose an exercise</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {EXERCISES.map(ex => (
                  <button key={ex.id} onClick={() => handleStart(ex.id)}
                    style={{
                      padding: "16px", borderRadius: 16,
                      background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                    }}>
                    <span style={{ fontSize: 28 }}>{ex.emoji}</span>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>{ex.label}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{ex.rounds} rounds</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Breathing circle */}
              <motion.div
                animate={{ scale: circleScale }}
                transition={{ duration: phase === "done" ? 0.3 : (EXERCISES.find(e=>e.id===selected)?.[phase === "inhale" ? "inhale" : "exhale"] || 2), ease: "easeInOut" }}
                style={{
                  width: 180, height: 180, borderRadius: "50%", margin: "0 auto 24px",
                  background: `radial-gradient(circle, ${phaseColors[phase] || "#7c3aed"}44, transparent)`,
                  border: `3px solid ${phaseColors[phase] || "#7c3aed"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <p style={{ color: "white", fontWeight: 800, fontSize: 36, margin: 0 }}>{phase === "done" ? "✓" : timer}</p>
              </motion.div>
              <p style={{ color: phaseColors[phase] || "white", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
                {phaseLabels[phase] || ""}
              </p>
              {phase !== "done" && (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 24 }}>
                  Round {round} of {EXERCISES.find(e=>e.id===selected)?.rounds}
                </p>
              )}
              <button onClick={() => { handleStop(); if(phase === "done") onClose(); }}
                style={{
                  padding: "12px 32px", borderRadius: 999,
                  background: phase === "done" ? "linear-gradient(135deg, #7c3aed, #db2777)" : "rgba(255,255,255,0.1)",
                  border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                {phase === "done" ? "Done 💜" : "Stop"}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}