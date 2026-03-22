import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const STREAK_REWARDS = {
  3:   { emoji: "🌟", reward: "Unlocked: New conversation topics!" },
  7:   { emoji: "🔥", reward: "1 week! Unlocked: Deep Talk vibe" },
  14:  { emoji: "⭐", reward: "2 weeks! Unlocked: Late Night mode" },
  30:  { emoji: "💎", reward: "1 month! You're legendary!" },
  60:  { emoji: "👑", reward: "2 months! True companion bond" },
  90:  { emoji: "🏆", reward: "3 months! Unfiltr Champion!" },
  180: { emoji: "💜", reward: "6 months! Soulmate level!" },
  365: { emoji: "🌈", reward: "1 YEAR! You're family now!" },
};

export function getStreakReward(streak) {
  return STREAK_REWARDS[streak] || null;
}

export default function StreakRewardBanner({ streak, visible }) {
  const reward = getStreakReward(streak);
  if (!visible || !reward) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ type: "spring", damping: 15 }}
        style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, rgba(234,88,12,0.95), rgba(239,68,68,0.95))",
          backdropFilter: "blur(12px)", borderRadius: 16,
          padding: "8px 16px", zIndex: 20, whiteSpace: "nowrap",
          boxShadow: "0 4px 24px rgba(239,68,68,0.5)",
          textAlign: "center", maxWidth: "90%",
        }}
      >
        <span style={{ fontSize: 20, display: "block", marginBottom: 2 }}>{reward.emoji}</span>
        <span style={{ color: "white", fontWeight: 800, fontSize: 12, display: "block" }}>
          🔥 {streak} day streak!
        </span>
        <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 10, display: "block", marginTop: 2 }}>
          {reward.reward}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}