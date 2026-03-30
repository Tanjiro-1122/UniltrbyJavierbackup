import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function JournalEnter() {
  const navigate = useNavigate();

  useEffect(() => {
    // Save today's mood to history so AI greeting can use it
    const currentMood = localStorage.getItem("unfiltr_mood");
    if (currentMood) {
      const todayKey = new Date().toISOString().slice(0, 10);
      const history = JSON.parse(localStorage.getItem("unfiltr_mood_history") || "{}");
      history[todayKey] = currentMood;
      localStorage.setItem("unfiltr_mood_history", JSON.stringify(history));
    }
    const t = setTimeout(() => navigate("/journal/home", { replace: true }), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%,#0a2010 0%,#051a0a 50%,#06020f 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui,-apple-system,sans-serif",
      }}>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}
        style={{ fontSize: 80, marginBottom: 24 }}>
        📓
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ color: "white", fontWeight: 800, fontSize: 24, margin: "0 0 8px", textAlign: "center" }}>
        Your space. Your words.
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: 0, textAlign: "center" }}>
        Let's go.
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 1.4, ease: "easeInOut" }}
        style={{ marginTop: 40, width: 120, height: 3, borderRadius: 2, background: "linear-gradient(90deg,#34d399,#06b6d4)", transformOrigin: "left" }}
      />
    </motion.div>
  );
}
