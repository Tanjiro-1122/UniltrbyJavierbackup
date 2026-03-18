import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";

const SHOWCASE = COMPANIONS.slice(0, 5);

export default function CompanionShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive(i => (i + 1) % SHOWCASE.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const companion = SHOWCASE[active];

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
      {/* Avatar ring */}
      <div style={{
        position: "relative",
        width: 130, height: 130,
        marginBottom: 12,
      }}>
        {/* Glowing ring */}
        <div style={{
          position: "absolute", inset: -4,
          borderRadius: "50%",
          background: "conic-gradient(from 0deg, #7c3aed, #db2777, #a855f7, #6366f1, #7c3aed)",
          animation: "spin-slow 6s linear infinite",
          opacity: 0.6,
        }} />
        <div style={{
          position: "absolute", inset: -1,
          borderRadius: "50%",
          background: "#0d0420",
        }} />

        <AnimatePresence mode="wait">
          <motion.img
            key={companion.id}
            src={companion.poses.happy}
            alt={companion.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "relative",
              width: 130, height: 130,
              borderRadius: "50%",
              objectFit: "cover",
              zIndex: 1,
            }}
          />
        </AnimatePresence>
      </div>

      {/* Name + tagline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={companion.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: "center" }}
        >
          <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>
            {companion.emoji} {companion.name}
          </p>
          <p style={{ color: "rgba(192,132,252,0.8)", fontSize: 12, margin: 0 }}>
            {companion.tagline}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {SHOWCASE.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActive(i)}
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              borderRadius: 3,
              border: "none",
              cursor: "pointer",
              background: i === active
                ? "linear-gradient(135deg, #a855f7, #db2777)"
                : "rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}