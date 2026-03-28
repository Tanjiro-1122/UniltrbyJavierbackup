import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AgeVerification() {
  const navigate = useNavigate();

  const handleConfirm = () => {
    localStorage.setItem("unfiltr_age_verified", "true");
    window.dispatchEvent(new Event("unfiltr_age_verified"));
    navigate("/home-screen");
  };

  const handleExit = () => {
    // Close the app or go to a blank screen
    // On mobile we can't close the app — show a locked screen instead
    document.body.innerHTML = '<div style="background:#06020f;height:100vh;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-family:system-ui;font-size:16px;text-align:center;padding:24px">This app is for ages 18+.<br/><br/>Please close this tab.</div>';
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.3) 0%, #06020f 65%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'SF Pro Display',system-ui,-apple-system,sans-serif",
      padding: "0 32px",
    }}>

      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 340, textAlign: "center", position: "relative", zIndex: 1 }}
      >
        {/* Icon */}
        <div style={{
          fontSize: 64, marginBottom: 24,
          filter: "drop-shadow(0 0 20px rgba(168,85,247,0.5))",
        }}>🔞</div>

        {/* Title */}
        <h1 style={{
          color: "white", fontWeight: 900, fontSize: 28,
          margin: "0 0 12px", letterSpacing: -0.5,
        }}>
          Are you 18 or older?
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.4)", fontSize: 15,
          margin: "0 0 48px", lineHeight: 1.5,
        }}>
          This app contains mature themes and is intended for adults only.
        </p>

        {/* YES button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleConfirm}
          style={{
            width: "100%", padding: "18px 0",
            background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
            border: "none", borderRadius: 18,
            color: "white", fontWeight: 800, fontSize: 18,
            cursor: "pointer", marginBottom: 14,
            boxShadow: "0 8px 32px rgba(124,58,237,0.45)",
            letterSpacing: 0.2,
          }}
        >
          Yes, I'm 18 or older →
        </motion.button>

        {/* NO button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleExit}
          style={{
            width: "100%", padding: "16px 0",
            background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 18,
            color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: 16,
            cursor: "pointer",
          }}
        >
          No, I'm under 18
        </motion.button>

        {/* Fine print */}
        <p style={{
          color: "rgba(255,255,255,0.18)", fontSize: 11,
          marginTop: 28, lineHeight: 1.6,
        }}>
          By continuing you agree to our Terms of Use and Privacy Policy.
          If you're in crisis, call or text <b style={{ color: "rgba(255,255,255,0.35)" }}>988</b>.
        </p>
      </motion.div>
    </div>
  );
}
