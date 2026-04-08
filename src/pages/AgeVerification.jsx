import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 0.8,
  top: Math.random() * 100,
  left: Math.random() * 100,
  opacity: Math.random() * 0.45 + 0.08,
  delay: Math.random() * 5,
  dur: Math.random() * 3 + 2.5,
}));

export default function AgeVerification() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleConfirm = () => {
    localStorage.setItem("unfiltr_age_verified", "true");
    window.dispatchEvent(new Event("unfiltr_age_verified"));
    navigate("/home-screen");
  };

  const handleExit = () => {
    setLeaving(true);
    setTimeout(() => {
      document.body.innerHTML = '<div style="background:#030010;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-family:system-ui;font-size:15px;text-align:center;padding:32px;gap:12px"><div style="font-size:48px;margin-bottom:8px">🔒</div><div>This app is for ages 18+.</div><div style="font-size:13px;margin-top:4px">Please close this app.</div></div>';
    }, 400);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
      background: "radial-gradient(ellipse at 50% 10%, #2d0a6e 0%, #120428 40%, #06020f 75%, #020008 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Stars */}
      {STARS.map(s => (
        <motion.div key={s.id}
          animate={{ opacity: [s.opacity, s.opacity * 2.2, s.opacity] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", borderRadius: "50%", background: "white",
            width: s.size, height: s.size,
            top: `${s.top}%`, left: `${s.left}%`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Top nebula */}
      <div style={{
        position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
        width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, rgba(80,10,180,0.2) 45%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-5%", right: "-10%",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(219,39,119,0.2) 0%, transparent 65%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: leaving ? 0 : 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative", zIndex: 5,
          width: "100%", maxWidth: 340,
          textAlign: "center",
          padding: "0 28px",
        }}
      >
        {/* Glowing logo */}
        <motion.div
          animate={{
            filter: [
              "drop-shadow(0 0 18px rgba(168,85,247,0.5))",
              "drop-shadow(0 0 38px rgba(168,85,247,0.9))",
              "drop-shadow(0 0 18px rgba(168,85,247,0.5))",
            ]
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ marginBottom: 24 }}
        >
          <img src={LOGO} alt="Unfiltr"
            style={{ width: 90, height: 90, objectFit: "contain", display: "block", margin: "0 auto" }} />
        </motion.div>

        {/* App name */}
        <p style={{
          background: "linear-gradient(135deg, #e879f9, #a78bfa)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          fontWeight: 800, fontSize: 13, letterSpacing: "0.12em",
          margin: "0 0 20px", textTransform: "uppercase",
        }}>
          Unfiltr by Javier
        </p>

        {/* Title */}
        <h1 style={{
          color: "white", fontWeight: 900, fontSize: 30,
          margin: "0 0 10px", letterSpacing: "-0.6px",
          textShadow: "0 2px 20px rgba(168,85,247,0.4)",
          lineHeight: 1.15,
        }}>
          Before we begin ✨
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.38)", fontSize: 15,
          margin: "0 0 44px", lineHeight: 1.55,
          fontWeight: 400,
        }}>
          This app explores emotional depth and mature themes. It's designed for adults ready to go there.
        </p>

        {/* YES */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleConfirm}
          style={{
            width: "100%", padding: "20px 0",
            background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
            border: "none", borderRadius: 20,
            color: "white", fontWeight: 900, fontSize: 18,
            cursor: "pointer", marginBottom: 12,
            boxShadow: "0 0 50px rgba(124,58,237,0.5), 0 12px 36px rgba(0,0,0,0.5)",
            letterSpacing: "-0.2px",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          I'm 18 or older — Let's go →
        </motion.button>

        {/* NO */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleExit}
          style={{
            width: "100%", padding: "16px 0",
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 18,
            color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 15,
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        >
          I'm under 18
        </motion.button>

        <p style={{
          color: "rgba(255,255,255,0.15)", fontSize: 11,
          marginTop: 28, lineHeight: 1.7,
        }}>
          By continuing you agree to our Terms & Privacy Policy.{"\n"}
          If you're in crisis, call or text{" "}
          <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>988</span>.
        </p>
      </motion.div>
    </div>
  );
}
