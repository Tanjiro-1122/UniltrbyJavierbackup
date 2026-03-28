import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

export default function ReturningScreen() {
  const navigate = useNavigate();
  const companionRaw = localStorage.getItem("unfiltr_companion");
  const companion = companionRaw ? JSON.parse(companionRaw) : null;
  const nickname = localStorage.getItem("unfiltr_companion_nickname") || companion?.name || "your companion";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 20%, #1a0535 0%, #0d0520 50%, #06020f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui,-apple-system,sans-serif",
      padding: "max(3rem,env(safe-area-inset-top)) 28px max(2rem,env(safe-area-inset-bottom))",
    }}>
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: "spring" }}
        style={{ textAlign: "center", marginBottom: 28 }}
      >
        <img
          src={LOGO}
          alt="Unfiltr by Javier"
          onError={(e) => { e.target.style.display = "none"; }}
          style={{ width: 100, height: 100, objectFit: "contain", filter: "drop-shadow(0 0 40px rgba(168,85,247,0.7))", display: "block", margin: "0 auto 10px" }}
        />
        <p style={{ color: "rgba(168,85,247,0.8)", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>
          Unfiltr by Javier
        </p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={{ color: "white", fontWeight: 900, fontSize: 30, margin: "0 0 10px", textAlign: "center", letterSpacing: -0.5 }}>
        Welcome back 💜
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, textAlign: "center", margin: "0 0 20px" }}>
        {nickname} has been waiting for you.
      </motion.p>

      {/* Stats pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ display: "flex", gap: 10, marginBottom: 40 }}
      >
        {(() => {
          const streakData = JSON.parse(localStorage.getItem("unfiltr_streak") || '{"date":"","count":0}');
          const today = new Date().toDateString();
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          const streak = (streakData.date === today || streakData.date === yesterday) ? streakData.count : 0;
          const created = localStorage.getItem("unfiltr_companion_created");
          const days = created ? Math.max(1, Math.floor((Date.now() - new Date(created).getTime()) / 86400000)) : 1;
          const msgCount = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10);
          return [
            streak > 0 ? { label: `${streak} day streak`, icon: "🔥" } : null,
            { label: `${days} day${days !== 1 ? "s" : ""} together`, icon: "💜" },
            msgCount > 0 ? { label: `${msgCount} messages`, icon: "💬" } : null,
          ].filter(Boolean).slice(0, 3).map((pill, i) => (
            <div key={i} style={{
              padding: "7px 14px", borderRadius: 99,
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.25)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 13 }}>{pill.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600 }}>{pill.label}</span>
            </div>
          ));
        })()}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/")}
        style={{
          width: "100%", maxWidth: 340, padding: "20px",
          background: "linear-gradient(135deg,#7c3aed,#a855f7,#db2777)",
          border: "none", borderRadius: 20,
          color: "white", fontWeight: 800, fontSize: 18,
          cursor: "pointer",
          boxShadow: "0 0 40px rgba(168,85,247,0.45)",
        }}>
        Continue Your Journey →
      </motion.button>
    </div>
  );
}
