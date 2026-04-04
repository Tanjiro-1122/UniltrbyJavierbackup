import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

function signInWithApple(navigate, setLoading) {
  const bridge = window.ReactNativeWebView;
  if (!bridge) {
    navigate("/hub");
    return;
  }

  let resolved = false;

  const handleResult = (msg) => {
    if (resolved) return;

    // Ignore WAITING — just means the native overlay appeared
    if (msg.type === "APPLE_SIGN_IN_WAITING") return;

    resolved = true;
    cleanup();

    if (msg.type === "APPLE_SIGN_IN_SUCCESS") {
      const payload = msg.data || msg;
      const appleUserId = payload.appleUserId || payload.user;
      const email = payload.email;
      const fullName = payload.fullName;
      if (!appleUserId) { setLoading && setLoading(false); return; }
      localStorage.setItem("unfiltr_apple_user_id", appleUserId);
      localStorage.setItem("unfiltr_user_id", appleUserId);
      localStorage.setItem("unfiltr_auth_token", appleUserId);
      if (!localStorage.getItem("userProfileId")) {
        localStorage.setItem("userProfileId", appleUserId);
      }
      if (email) {
        localStorage.setItem("unfiltr_apple_email", email);
        localStorage.setItem("unfiltr_user_email", email);
      }
      if (fullName) localStorage.setItem("unfiltr_display_name", fullName);
      window.dispatchEvent(new Event("unfiltr_auth_updated"));
      navigate("/hub");
    } else if (msg.type === "APPLE_SIGN_IN_CANCELLED" || msg.type === "APPLE_SIGN_IN_ERROR") {
      setLoading(false);
      navigate("/hub");
    }
  };

  // PRIMARY: onMessageFromRN — matches our fixed bridge in index.tsx
  const prevHandler = window.onMessageFromRN;
  window.onMessageFromRN = (jsonStr) => {
    try {
      const msg = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
      handleResult(msg);
    } catch {}
    if (typeof prevHandler === "function") prevHandler(jsonStr);
  };

  // FALLBACK: window message event
  const windowHandler = (e) => {
    try {
      const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      if (["APPLE_SIGN_IN_SUCCESS","APPLE_SIGN_IN_CANCELLED","APPLE_SIGN_IN_ERROR","APPLE_SIGN_IN_WAITING"].includes(msg.type)) {
        handleResult(msg);
      }
    } catch {}
  };
  window.addEventListener("message", windowHandler);

  const cleanup = () => {
    window.onMessageFromRN = prevHandler;
    window.removeEventListener("message", windowHandler);
  };

  bridge.postMessage(JSON.stringify({ type: "SIGN_IN_WITH_APPLE" }));
}

export default function ReturningScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isNative = !!window.ReactNativeWebView;
  const companionRaw = localStorage.getItem("unfiltr_companion");
  const companion = companionRaw ? JSON.parse(companionRaw) : null;
  const nickname = localStorage.getItem("unfiltr_companion_nickname") || companion?.name || "your companion";
  const hasAppleId = !!localStorage.getItem("unfiltr_apple_user_id");

  const handleAppleSignIn = () => {
    setLoading(true);
    signInWithApple(navigate, setLoading);
  };

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
        <img src={LOGO} alt="Unfiltr by Javier" onError={(e) => { e.target.style.display = "none"; }}
          style={{ width: 100, height: 100, objectFit: "contain", filter: "drop-shadow(0 0 40px rgba(168,85,247,0.7))", display: "block", margin: "0 auto 10px" }} />
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
        style={{ display: "flex", gap: 10, marginBottom: 32 }}
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
            <div key={i} style={{ padding: "7px 14px", borderRadius: 99, background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>{pill.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600 }}>{pill.label}</span>
            </div>
          ));
        })()}
      </motion.div>

      {/* Sign in with Apple — shown if native and no apple ID stored yet */}
      {isNative && !hasAppleId && (
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAppleSignIn}
          disabled={loading}
          style={{
            width: "100%", maxWidth: 340, padding: "18px",
            background: "white",
            border: "none", borderRadius: 20,
            color: "#000", fontWeight: 800, fontSize: 17,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            marginBottom: 12,
            opacity: loading ? 0.7 : 1,
          }}>
          <svg width="20" height="20" viewBox="0 0 814 1000" fill="black">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-47.4-150.2-110.1C87 453.9 65 270.7 65 218.9c0-36.3 .1-86 28.9-134.4 37.4-62.5 94.6-101.2 175.5-101.2 74.3 0 130.7 47.4 173.2 47.4 41.3 0 105.7-50.1 190.9-50.1 30.4 0 109 2.6 165.2 86.1zm-85.5-112.1c19.8-25.4 34-61.6 34-97.8 0-5.1-.4-10.3-1.3-14.8-32.4 1.3-71.3 22.3-94.3 50.8-18.6 22.3-35.4 58.1-35.4 94.9 0 5.8 1 11.5 1.6 13.4 2.3 .4 6 .6 9.7 .6 29.7 0 67.9-19.5 85.7-47.1z"/>
          </svg>
          {loading ? "Signing in..." : "Sign in with Apple"}
        </motion.button>
      )}

      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/hub")}
        style={{
          width: "100%", maxWidth: 340, padding: "20px",
          background: "linear-gradient(135deg,#7c3aed,#a855f7,#db2777)",
          border: "none", borderRadius: 20,
          color: "white", fontWeight: 800, fontSize: 18,
          cursor: "pointer",
          boxShadow: "0 0 40px rgba(168,85,247,0.45)",
        }}>
        {hasAppleId ? "Continue Your Journey →" : "Continue as Guest →"}
      </motion.button>
    </div>
  );
}
