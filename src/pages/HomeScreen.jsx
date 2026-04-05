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

  // Tear down any previous sign-in listener before starting fresh
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

      // ACK immediately so native side stops retrying
      try {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "__ACK_CONFIRMED" }));
      } catch(e) {}

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
      if (payload.isPremium) {
        localStorage.setItem("unfiltr_is_premium", "true");
        localStorage.setItem("unfiltr_plan", "pro_plan");
        debugLog("[WEB] 💎 Premium status restored from RevenueCat on sign-in");
      }
      window.dispatchEvent(new Event("unfiltr_auth_updated"));
      const onboardingDone = !!localStorage.getItem("unfiltr_onboarding_complete");
      navigate(onboardingDone ? "/hub" : "/onboarding/consent");
    } else if (msg.type === "APPLE_SIGN_IN_CANCELLED") {
      debugLog('[WEB] 🚫 Apple sign-in cancelled — resetting');
      setLoading(false);
    } else if (msg.type === "APPLE_SIGN_IN_ERROR") {
      debugLog(`[WEB] ❌ Apple sign-in error: ${msg.error}`);
      setLoading(false);
    }
  };

  // ── Use __nativeBus (the unified bridge) — do NOT overwrite window.onMessageFromRN ──
  const cleanup = () => {
    if (window.__nativeBus) {
      window.__nativeBus.off('APPLE_SIGN_IN_SUCCESS');
      window.__nativeBus.off('APPLE_SIGN_IN_CANCELLED');
      window.__nativeBus.off('APPLE_SIGN_IN_ERROR');
      window.__nativeBus.off('APPLE_SIGN_IN_WAITING');
    }
    window.__appleSignInCleanup = null;
  };

  if (window.__nativeBus) {
    window.__nativeBus.on('APPLE_SIGN_IN_SUCCESS',   handleResult);
    window.__nativeBus.on('APPLE_SIGN_IN_CANCELLED', handleResult);
    window.__nativeBus.on('APPLE_SIGN_IN_ERROR',     handleResult);
    window.__nativeBus.on('APPLE_SIGN_IN_WAITING',   handleResult);
    debugLog('[WEB] ✅ Registered on __nativeBus');
  } else {
    // Fallback: direct onMessageFromRN (should not be needed but kept as safety net)
    debugLog('[WEB] ⚠️ __nativeBus not ready — falling back to onMessageFromRN');
    const prevHandler = window.onMessageFromRN;
    window.onMessageFromRN = (jsonStr) => {
      try {
        const msg = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
        debugLog(`[WEB] onMessageFromRN fallback: ${msg.type}`);
        handleResult(msg);
      } catch(e) { debugLog(`[WEB] parse error: ${e.message}`); }
      if (typeof prevHandler === "function") prevHandler(jsonStr);
    };
    const origCleanup = cleanup;
    window.__appleSignInCleanup = () => {
      window.onMessageFromRN = prevHandler;
      origCleanup();
    };
  }

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
    // Safety timeout — if no response in 30s, reset button
    setTimeout(() => {
      setLoadingRef.current(false);
    }, 30000);
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
          <>
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
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, overflow: "visible",
                marginBottom: 6,
                opacity: loading ? 0.7 : 1,
              }}>
              <span style={{fontSize: 20, lineHeight: 1, flexShrink: 0}}>🍎</span>
              {loading ? "Signing in..." : "Sign in with Apple"}
            </motion.button>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", margin: "0 0 10px", lineHeight: 1.4 }}>
              First time? The app may take a moment to load — if nothing happens, wait 3 seconds and tap again.
            </motion.p>
          </>
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
              { emoji: "💜", title: "Pick your companion", desc: "Choose from 12 unique AI companions with their own personality and vibe." },
              { emoji: "🧠", title: "It remembers you", desc: "Your companion learns your story over time and brings it into every conversation." },
              { emoji: "🔒", title: "No judgment, ever", desc: "This is your private space. Talk freely — it's just you and your companion." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div style={{ display: "flex", justifyContent: "center", gap: 20, paddingBottom: "max(1rem,env(safe-area-inset-bottom))" }}>
          {[
            { icon: <Shield size={13}/>, label: "Privacy Policy", path: "/PrivacyPolicy" },
            { icon: <FileText size={13}/>, label: "Terms of Use", path: "/TermsOfUse" },
            { icon: <HeadphonesIcon size={13}/>, label: "Support", path: "/support" },
          ].map((item, i) => (
            <button key={i} onClick={() => navigate(item.path)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
