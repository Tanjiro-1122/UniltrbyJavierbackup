import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";
import { applyProfileSnapshot } from "@/lib/profileSnapshot";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

// Floating star particle
function Star({ style }) {
  return <div style={{ position: "absolute", borderRadius: "50%", background: "white", ...style }} />;
}

const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.5 + 0.1,
  delay: Math.random() * 4,
  dur: Math.random() * 3 + 2,
}));

export default function ReturningScreen() {
  const navigate = useNavigate();
  const [companion, setCompanion] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const name = localStorage.getItem("unfiltr_display_name") || null;
  const nickname = localStorage.getItem("unfiltr_companion_nickname") || null;
  const hasAppleId = !!localStorage.getItem("unfiltr_apple_user_id");

  const streakRaw = localStorage.getItem("unfiltr_streak") || '{"date":"","count":0}';
  const streakData = (() => { try { return JSON.parse(streakRaw); } catch { return { date: "", count: 0 }; } })();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const streak = (streakData.date === today || streakData.date === yesterday) ? streakData.count : 0;
  const msgCount = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unfiltr_companion");
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = COMPANIONS.find(c => c.id === parsed.id || c.name === parsed.name);
        if (found) setCompanion(found);
        else if (COMPANIONS.length > 0) setCompanion(COMPANIONS[0]);
      } else if (COMPANIONS.length > 0) {
        setCompanion(COMPANIONS[0]);
      }
    } catch {}
  }, []);

  const companionImg = companion?.poses?.happy || companion?.poses?.neutral || companion?.avatar || "";
  const companionDisplayName = nickname || companion?.displayName || companion?.name || "your companion";

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
      background: "radial-gradient(ellipse at 50% 0%, #2d0a6e 0%, #150530 35%, #08021a 65%, #030010 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Animated stars */}
      {STARS.map(s => (
        <motion.div key={s.id}
          animate={{ opacity: [s.opacity, s.opacity * 2.5, s.opacity], scale: [1, 1.4, 1] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", borderRadius: "50%", background: "white",
            width: s.size, height: s.size,
            top: `${s.top}%`, left: `${s.left}%`,
            pointerEvents: "none", zIndex: 0,
          }}
        />
      ))}

      {/* Deep purple nebula glow */}
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(120,40,240,0.45) 0%, rgba(80,10,160,0.25) 40%, transparent 70%)",
        filter: "blur(55px)", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "15%", left: "-10%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(219,39,119,0.2) 0%, transparent 65%)",
        filter: "blur(45px)", pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── COMPANION AVATAR — large, cinematic ── */}
      {companionImg && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: avatarLoaded ? 1 : 0, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{
            position: "absolute",
            bottom: "28%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 240, height: 340,
            zIndex: 2,
            filter: "drop-shadow(0 0 40px rgba(168,85,247,0.6)) drop-shadow(0 20px 60px rgba(0,0,0,0.8))",
          }}
        >
          <img
            src={companionImg}
            alt={companionDisplayName}
            onLoad={() => setAvatarLoaded(true)}
            onError={() => setAvatarLoaded(true)}
            style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }}
          />
        </motion.div>
      )}

      {/* Ground glow under avatar */}
      <div style={{
        position: "absolute", bottom: "27%", left: "50%", transform: "translateX(-50%)",
        width: 200, height: 40, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(168,85,247,0.4) 0%, transparent 70%)",
        filter: "blur(14px)", pointerEvents: "none", zIndex: 1,
      }} />

      {/* ── TOP: logo + title ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          position: "relative", zIndex: 5, textAlign: "center",
          paddingTop: "max(60px, env(safe-area-inset-top, 60px))",
          paddingLeft: 24, paddingRight: 24,
        }}
      >
        <motion.img
          src={LOGO} alt="Unfiltr"
          animate={{ filter: ["drop-shadow(0 0 20px rgba(168,85,247,0.5))", "drop-shadow(0 0 40px rgba(168,85,247,0.9))", "drop-shadow(0 0 20px rgba(168,85,247,0.5))"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 72, height: 72, objectFit: "contain", display: "block", margin: "0 auto 14px" }}
        />
        <h1 style={{
          color: "white", fontWeight: 900, fontSize: 32,
          margin: "0 0 6px", letterSpacing: "-0.8px",
          textShadow: "0 2px 20px rgba(168,85,247,0.5)",
        }}>
          {name ? `Welcome back,` : "Continue Your"}
        </h1>
        <h1 style={{
          background: "linear-gradient(135deg, #e879f9, #a78bfa, #60a5fa)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          fontWeight: 900, fontSize: 32, margin: "0 0 8px", letterSpacing: "-0.8px",
        }}>
          {name ? name.split(" ")[0] + " ✨" : "Journey ✨"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, fontWeight: 500 }}>
          {companionDisplayName !== "your companion"
            ? `${companionDisplayName} has been waiting for you 💜`
            : "Your companion is ready"}
        </p>
      </motion.div>

      {/* ── Stats pills ── */}
      {(streak > 0 || msgCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            position: "relative", zIndex: 5,
            display: "flex", gap: 10, marginTop: 16,
            flexWrap: "wrap", justifyContent: "center",
          }}
        >
          {streak > 0 && (
            <div style={{
              padding: "7px 16px", borderRadius: 99,
              background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700 }}>{streak} day streak</span>
            </div>
          )}
          {msgCount > 0 && (
            <div style={{
              padding: "7px 16px", borderRadius: 99,
              background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700 }}>{msgCount} messages</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ── BOTTOM: CTA buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          zIndex: 10,
          padding: "0 24px",
          paddingBottom: "max(40px, calc(env(safe-area-inset-bottom, 0px) + 32px))",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/hub")}
          style={{
            width: "100%", padding: "20px 0",
            background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
            border: "none", borderRadius: 22,
            color: "white", fontWeight: 900, fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 0 50px rgba(168,85,247,0.5), 0 12px 40px rgba(0,0,0,0.5)",
            letterSpacing: "-0.2px",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Continue Your Journey →
        </motion.button>
      </motion.div>
    </div>
  );
}
