import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
  { emoji: "😊", label: "Good" },
  { emoji: "😌", label: "Calm" },
  { emoji: "😔", label: "Low" },
  { emoji: "😤", label: "Stressed" },
  { emoji: "🥱", label: "Tired" },
  { emoji: "🔥", label: "Hyped" },
];

const CHECK_IN_KEY = "unfiltr_last_checkin";

/**
 * CompanionCheckIn — shows once per day when user opens chat.
 * "How are you feeling today?" with 6 mood buttons.
 * On pick: saves to moodTracker, dismisses automatically.
 * Additive only — reads/writes localStorage, does not touch any existing state.
 */
export default function CompanionCheckIn({ companionName, onMoodPicked }) {
  const [visible, setVisible] = useState(false);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem(CHECK_IN_KEY);
    // Show only once per day, after a short delay
    if (last !== today) {
      const t = setTimeout(() => setVisible(true), 2200);
      return () => clearTimeout(t);
    }
  }, []);

  const handlePick = (mood) => {
    setPicked(mood);
    const today = new Date().toDateString();
    localStorage.setItem(CHECK_IN_KEY, today);

    // Save to mood week tracker (same format as moodTracker util)
    try {
      const week = JSON.parse(localStorage.getItem("unfiltr_mood_week") || "[]");
      const dayIdx = new Date().getDay(); // 0=Sun
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const entry = { day: days[dayIdx], mood: mood.emoji, date: today };
      const filtered = week.filter(e => e.date !== today);
      filtered.push(entry);
      localStorage.setItem("unfiltr_mood_week", JSON.stringify(filtered.slice(-7)));
    } catch {}

    if (onMoodPicked) onMoodPicked(mood);

    // Auto-dismiss after showing confirmation
    setTimeout(() => setVisible(false), 1800);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          style={{
            margin: "8px 16px 0",
            padding: "14px 14px",
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.1))",
            border: "1px solid rgba(168,85,247,0.25)",
            flexShrink: 0,
          }}
        >
          {picked ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "4px 0" }}
            >
              <span style={{ fontSize: 28 }}>{picked.emoji}</span>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "6px 0 0", fontWeight: 500 }}>
                {companionName} heard you 💜
              </p>
            </motion.div>
          ) : (
            <>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, margin: "0 0 12px", textAlign: "center" }}>
                How are you feeling today?
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                {MOODS.map(m => (
                  <button
                    key={m.label}
                    onClick={() => handlePick(m)}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      padding: "8px 4px", borderRadius: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>{m.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { localStorage.setItem(CHECK_IN_KEY, new Date().toDateString()); setVisible(false); }}
                style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 11, cursor: "pointer" }}
              >
                Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
