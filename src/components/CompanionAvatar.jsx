import React from "react";
import { motion } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";

export default function CompanionAvatar({ companionId, mood }) {
  const companion = COMPANIONS.find((c) => c.id === companionId);
  if (!companion) return null;

  const poseUrl = companion.poses[mood] || companion.poses.neutral;

  const animations = {
    happy: {
      animate: { x: [-30, 30, -30], rotate: [0, 2, -2, 0] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    neutral: {
      animate: { y: [0, -8, 0] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    sad: {
      animate: { scaleX: [1, 1.02, 1] },
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <motion.div className="relative w-56 h-56" {...animations[mood] || animations.neutral}>
      <img
        src={poseUrl}
        alt={companion.name}
        className="w-full h-full object-contain drop-shadow-2xl"
      />

      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 rounded-full blur-3xl pointer-events-none ${
          mood === "happy"
            ? "bg-yellow-500/20"
            : mood === "sad"
              ? "bg-blue-500/20"
              : "bg-purple-500/20"
        }`}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
}