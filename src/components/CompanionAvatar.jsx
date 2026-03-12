import React from "react";
import { motion } from "framer-motion";

export default function CompanionAvatar({ mood }) {
  const animations = {
    happy: {
      animate: { y: [0, -8, 0], rotate: [0, 1, 0] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
    neutral: {
      animate: { y: [0, -4, 0] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    sad: {
      animate: { y: [0, 2, 0], scale: [1, 0.98, 1] },
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      className="relative"
      {...animations[mood] || animations.neutral}
    >
      {/* Placeholder Avatar Circle */}
      <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-purple-500/50">
        <span className="text-6xl">✨</span>
      </div>

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 opacity-20 blur-2xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
}