import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Shield, FileText, HeadphonesIcon, Star } from "lucide-react";
import { debugLog } from "@/components/DebugPanel";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

function doAppleSignIn(navigateRef, setLoadingRef) {
  const navigate = (...args) => navigateRef.current(...args);
  const setLoading = (...args) => setLoadingRef.current(...args);
  const bridge = window.ReactNativeWebView;
  debugLog(`[WEB] signInWithApple called, bridge=${!!bridge}`);

  if (!bridge) {
    debugLog('[WEB] No native bridge — going to onboarding');
    navigate("/onboarding/consent");
    return;
  }

  // Always tear down any previous sign-in listener before starting a new one
  if (window.__appleSignInCleanup) {
    debugLog('[WEB] cleaning up previous sign-in listener');
    window.__appleSignInCleanup();
    window.__appleSignInCleanup = null;
  }

  let resolved = false;

  const handleResult = (msg) => {
    if (resolved) return;
    if (msg.type === "APPLE_SIGN_IN_WAITING") {
      debugLog('[WEB] 🍎 Waiting for user tap...');
      return;
    }

    resolved = true;
    cleanup();

    if (msg.type === "APPLE_SIGN_IN_SUCCESS") {
      const payload = msg.data || msg;
      const appleUserId = payload.appleUserId || payload.user;
      const email = payload.email;
      const fullName = payload.fullName;
      debugLog(`[WEB] ✅ Apple ID: ${appleUserId}`);
      if (!appleUserId) {
        debugLog('[WEB] ❌ No appleUserId in payload');
        setLoading(false);
        return;
      }
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
      const onboardingDone = !!localStorage.getItem("unfiltr_onboarding_complete");
      navigate(onboardingDone ? "/hub" : "/onboarding/consent");
    } else if (msg.type === "APPLE_SIGN_IN_CANCELLED") {
      // Just reset the button — do NOT navigate away, let them try again
      debugLog('[WEB] 🚫 Apple sign-in cancelled — resetting button');
      setLoading(false);
    } else if (msg.type === "APPLE_SIGN_IN_ERROR") {
      debugLog(`[WEB] ❌ Apple sign-in error: ${msg.error}`);
      setLoading(false);
    }
  };

  const prevHandler = window.onMessageFromRN;
  window.onMessageFromRN = (jsonStr) => {
    try {
      const msg = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
      debugLog(`[WEB] onMessageFromRN: ${msg.type}`);
      handleResult(msg);
    } catch(e) { debugLog(`[WEB] parse error: ${e.message}`); }
    if (typeof prevHandler === "function") prevHandler(jsonStr);
  };

  const windowHandler = (e) => {
    try {
      const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      if (["APPLE_SIGN_IN_SUCCESS","APPLE_SIGN_IN_CANCELLED","APPLE_SIGN_IN_ERROR","APPLE_SIGN_IN_WAITING"].includes(msg?.type)) {
        debugLog(`[WEB] window message fallback: ${msg.type}`);
        handleResult(msg);
      }
    } catch {}
  };
  window.addEventListener("message", windowHandler);

  const cleanup = () => {
    window.__appleSignInCleanup = null;
    window.onMessageFromRN = prevHandler;
    window.removeEventListener("message", windowHandler);
  };

  // Store cleanup so next tap can tear down this listener first
  window.__appleSignInCleanup = cleanup;

  debugLog('[WEB] posting SIGN_IN_WITH_APPLE to native...');
  bridge.postMessage(JSON.stringify({ type: "SIGN_IN_WITH_APPLE" }));
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isNative = !!window.ReactNativeWebView;
  const navigateRef = React.useRef(navigate);
  const setLoadingRef = React.useRef(setLoading);
  React.useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  React.useEffect(() => { setLoadingRef.current = setLoading; }, [setLoading]);

  const handleAppleSignIn = () => {
    setLoading(true);
    doAppleSignIn(navigateRef, setLoadingRef);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 0%, #1a0535 0%, #0d0520 40%, #06020f 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui,-apple-system,sans-serif",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "max(3rem,env(safe-area-inset-top)) 24px 24px" }}>

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <motion.img src={LOGO} alt="Unfiltr"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            style={{ width: 90, height: 90, objectFit: "contain", filter: "drop-shadow(0 0 30px rgba(168,85,247,0.6))", display: "block", margin: "0 auto 16px" }}
          />
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ color: "white", fontWeight: 900, fontSize: 32, margin: "0 0 6px", letterSpacing: -0.5 }}>
            Unfiltr by Javier
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: 0 }}>
            Talk, vent, laugh — with a companion that actually gets you.
          </motion.p>
        </div>

        {/* Sign in with Apple */}
        {isNative && (
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAppleSignIn}
            disabled={loading}
            style={{
              width: "100%", padding: "18px",
              background: "white", border: "none", borderRadius: 20,
              color: "#000", fontWeight: 800, fontSize: 17,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 12,
              opacity: loading ? 0.7 : 1,
            }}>
            <svg width="20" height="20" viewBox="0 0 814 1000" fill="black">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-47.4-150.2-110.1C87 453.9 65 270.7 65 218.9c0-36.3.1-86 28.9-134.4 37.4-62.5 94.6-101.2 175.5-101.2 74.3 0 130.7 47.4 173.2 47.4 41.3 0 105.7-50.1 190.9-50.1 30.4 0 109 2.6 165.2 86.1zm-85.5-112.1c19.8-25.4 34-61.6 34-97.8 0-5.1-.4-10.3-1.3-14.8-32.4 1.3-71.3 22.3-94.3 50.8-18.6 22.3-35.4 58.1-35.4 94.9 0 5.8 1 11.5 1.6 13.4 2.3.4 6 .6 9.7.6 29.7 0 67.9-19.5 85.7-47.1z"/>
            </svg>
            {loading ? "Signing in..." : "Sign in with Apple"}
          </motion.button>
        )}

        {/* Continue as Guest / Meet companion */}
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/onboarding/consent")}
          style={{
            width: "100%", padding: "20px",
            background: "linear-gradient(135deg,#7c3aed,#a855f7,#db2777)",
            border: "none", borderRadius: 20,
            color: "white", fontWeight: 800, fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 0 40px rgba(168,85,247,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            marginBottom: 28,
          }}>
          <Users size={22} />
          {isNative ? "Continue as Guest" : "✨ Meet Your Companion"}
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 600, letterSpacing: 2 }}>HOW IT WORKS</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {[
              { emoji: "💜", title: "Pick your companion", desc: "Choose from 12 unique personalities built just for you." },
              { emoji: "💬", title: "Talk about anything", desc: "No scripts. No judgment. Just real conversation." },
              { emoji: "🧠", title: "They remember you", desc: "Your companion grows with you over time." },
              { emoji: "🔒", title: "Always private", desc: "Your conversations stay yours. Always." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
                <div>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>{title}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[
              { icon: Shield,         label: "Privacy Policy", path: "/PrivacyPolicy", color: "#22c55e" },
              { icon: FileText,       label: "Terms of Use",   path: "/TermsOfUse",    color: "#3b82f6" },
              { icon: HeadphonesIcon, label: "Support",        path: "/support",       color: "#f59e0b" },
              { icon: Star,           label: "Rate Us",        path: null,             color: "#a855f7",
                action: () => window.open("https://apps.apple.com/app/id6760604917", "_blank") },
            ].map(({ icon: Icon, label, path, color, action }) => (
              <motion.button key={label} whileTap={{ scale: 0.96 }}
                onClick={() => action ? action() : navigate(path)}
                style={{ padding: "14px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={color} />
                </div>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textAlign: "center" }}>{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
        <div style={{ height: "max(24px,env(safe-area-inset-bottom))" }} />
      </div>
    </div>
  );
}
