/**
 * StreakMilestoneModal.jsx
 * Full-screen celebration when user hits a streak milestone.
 * Drop into ChatPage — auto-shows when `milestone` prop is truthy.
 */

import React, { useEffect } from "react";import { motion, AnimatePresence } from "framer-motion";

const MILESTONE_CONFIG = {
  3:   { emoji: "🔥", title: "3-Day Streak!", msg: "You're on a roll — 3 days in a row!", color: "#f97316" },
  7:   { emoji: "⚡", title: "One Week Strong!", msg: "A full week with your companion. You're incredible.", color: "#a855f7" },
  14:  { emoji: "🌙", title: "Two Weeks!", msg: "14 days of showing up for yourself. That's real.", color: "#818cf8" },
  30:  { emoji: "🏆", title: "30 Day Legend!", msg: "A whole month. Your companion has truly grown with you.", color: "#f59e0b" },
  60:  { emoji: "💎", title: "60 Days!", msg: "Two months of consistency. You're in a league of your own.", color: "#06b6d4" },
  100: { emoji: "🚀", title: "100 DAYS!", msg: "Triple digits. You are an Unfiltr legend.", color: "#ec4899" },
  365: { emoji: "👑", title: "ONE YEAR.", msg: "365 days. Your companion has been with you through everything.", color: "#fbbf24" },
};

// Simple confetti burst using CSS animations
function Confetti() {
  const colors = ["#a855f7","#f59e0b","#ec4899","#06b6d4","#4ade80","#fb923c"];
  const pieces = Array.from({ length: 30 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pieces.map(i => {
        const color = colors[i % colors.length];
        const left  = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const dur   = 2 + Math.random() * 2;
        const size  = 6 + Math.random() * 8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-20px",
              width: size,
              height: size,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              background: color,
              animation: `confettiFall ${dur}s ${delay}s ease-in forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function StreakMilestoneModal({ milestone, streak, longestStreak, onDismiss }) {
  const config = MILESTONE_CONFIG[milestone] || {
    emoji: "🔥",
    title: `${milestone} Day Streak!`,
    msg: `${milestone} days in a row — you're unstoppable.`,
    color: "#a855f7",
  };

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [milestone, onDismiss]);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(6,2,15,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
          onClick={onDismiss}
        >
          <Confetti />
          <motion.div
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "linear-gradient(145deg,#1a0535,#0d0520)",
              border: `1px solid ${config.color}55`,
              borderRadius: 28,
              padding: "36px 28px",
              textAlign: "center",
              width: "100%",
              maxWidth: 340,
              boxShadow: `0 0 60px ${config.color}33`,
            }}
          >
            {/* Big emoji */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.8, repeat: 2 }}
              style={{ fontSize: 72, marginBottom: 16 }}
            >
              {config.emoji}
            </motion.div>

            {/* Title */}
            <div style={{
              color: "white", fontWeight: 900, fontSize: 26,
              marginBottom: 8, letterSpacing: -0.5,
            }}>
              {config.title}
            </div>

            {/* Message */}
            <div style={{
              color: "rgba(255,255,255,0.6)", fontSize: 15,
              lineHeight: 1.5, marginBottom: 24,
            }}>
              {config.msg}
            </div>

            {/* Streak stat */}
            <div style={{
              background: `${config.color}18`,
              border: `1px solid ${config.color}44`,
              borderRadius: 16, padding: "14px 20px",
              display: "flex", justifyContent: "space-around",
              marginBottom: 24,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: config.color, fontWeight: 900, fontSize: 28 }}>{streak} 🔥</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Current Streak</div>
              </div>
              {longestStreak > streak && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#fbbf24", fontWeight: 900, fontSize: 28 }}>{longestStreak} 👑</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Personal Best</div>
                </div>
              )}
            </div>

            {/* Dismiss */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onDismiss}
              style={{
                width: "100%", padding: "15px",
                background: `linear-gradient(135deg,${config.color},#7c3aed)`,
                border: "none", borderRadius: 16,
                color: "white", fontWeight: 800, fontSize: 16,
                cursor: "pointer",
              }}
            >
              Keep it going! 💪
            </motion.button>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 12 }}>
              Tap anywhere to dismiss
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
