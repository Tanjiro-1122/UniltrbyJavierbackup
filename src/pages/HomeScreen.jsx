/**
 * HomeScreen.jsx — First launch sign-in screen.
 * Uses the unified handleAppleSignIn() from db.js.
 * After sign-in: new users → /onboarding/consent, returning → /hub
 */
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { handleAppleSignIn } from "@/lib/db";
import { debugLog } from "@/components/DebugPanel";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

export default function HomeScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isNative = !!window.ReactNativeWebView;

  // Safety: if somehow already authenticated, skip straight to hub
  useEffect(() => {
    const appleId = localStorage.getItem("unfiltr_apple_user_id");
    const onboarded = localStorage.getItem("unfiltr_onboarding_complete");
    if (appleId && onboarded) {
      navigate("/hub", { replace: true });
    }
  }, []);

  const handleAppleSignInClick = () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    const bridge = window.ReactNativeWebView;
    if (!bridge) {
      // Browser/dev mode — skip sign-in, go straight to onboarding
      debugLog("[HomeScreen] No native bridge — dev mode, skipping to onboarding");
      navigate("/onboarding/consent");
      return;
    }

    let resolved = false;
    let safetyTimer = null;

    const finish = () => {
      resolved = true;
      clearTimeout(safetyTimer);
      // Detach from __nativeBus
      window.__nativeBus = prevBus;
    };

    const handleMsg = async (msg) => {
      if (resolved) return;
      if (msg.type === "APPLE_SIGN_IN_WAITING") {
        debugLog("[HomeScreen] Native overlay shown — waiting for user...");
        return;
      }
      if (msg.type !== "APPLE_SIGN_IN_SUCCESS" &&
          msg.type !== "APPLE_SIGN_IN_CANCELLED" &&
          msg.type !== "APPLE_SIGN_IN_ERROR") return;

      finish();

      if (msg.type === "APPLE_SIGN_IN_SUCCESS") {
        const payload = msg.data || msg;
        const appleUserId = payload.appleUserId || payload.user;
        debugLog(`[HomeScreen] ✅ Got Apple ID: ${appleUserId}`);

        if (!appleUserId) {
          setError("Sign-in failed — no user ID received.");
          setLoading(false);
          return;
        }

        try {
          const { profile, isNewUser } = await handleAppleSignIn({
            appleUserId,
            email: payload.email,
            fullName: payload.fullName,
            isPremiumFromRC: payload.isPremium,
          });

          // Send ACK back to native so it stops retrying
          try {
            bridge.postMessage(JSON.stringify({ type: "__ACK_CONFIRMED" }));
          } catch {}

          // Routing logic:
          // - Brand new user (no DB profile existed) → onboarding
          // - Returning user (profile found in DB) → hub ALWAYS
          //   (they may need to re-onboard their local settings, but DB profile exists)
          const dbOnboarded = profile?.onboarding_complete === true;
          const localOnboarded = !!localStorage.getItem("unfiltr_onboarding_complete");
          const hasCompanion = profile?.companion_id && profile.companion_id !== "pending";
          const onboardingDone = !isNewUser && (dbOnboarded || localOnboarded || hasCompanion);
          debugLog(`[HomeScreen] Routing → ${onboardingDone ? "hub" : "onboarding"} | isNewUser=${isNewUser} dbOnboarded=${dbOnboarded} localOnboarded=${localOnboarded} hasCompanion=${hasCompanion}`);
          navigate(onboardingDone ? "/hub" : "/onboarding/consent", { replace: true });
        } catch (e) {
          debugLog(`[HomeScreen] DB error: ${e.message}`);
          // Non-blocking: still route them forward
          navigate("/onboarding/consent", { replace: true });
        }

      } else if (msg.type === "APPLE_SIGN_IN_CANCELLED") {
        debugLog("[HomeScreen] Sign-in cancelled");
        setLoading(false);
      } else if (msg.type === "APPLE_SIGN_IN_ERROR") {
        debugLog(`[HomeScreen] Sign-in error: ${msg.error}`);
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    };

    // Hook into the unified __nativeBus (set up in App.jsx)
    const prevBus = window.__nativeBus;
    window.__nativeBus = (msg) => {
      handleMsg(msg);
      if (typeof prevBus === "function") prevBus(msg);
    };

    // Safety timeout — 30s
    safetyTimer = setTimeout(() => {
      if (!resolved) {
        finish();
        setLoading(false);
        setError("Sign-in timed out. Please try again.");
        debugLog("[HomeScreen] ⚠️ Sign-in timed out");
      }
    }, 30000);

    debugLog("[HomeScreen] Sending SIGN_IN_WITH_APPLE to native...");
    bridge.postMessage(JSON.stringify({ type: "SIGN_IN_WITH_APPLE" }));
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 0%, #1a0535 0%, #0d0520 40%, #06020f 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui,-apple-system,sans-serif",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
        padding: "max(3rem,env(safe-area-inset-top)) 24px 24px"
      }}>

        {/* Logo + Title */}
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

        {/* Feature pills */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {[
            { icon: "💬", label: "AI companions that remember you" },
            { icon: "📓", label: "Private journaling with mood tracking" },
            { icon: "🧘", label: "Guided meditation & breathing" },
            { icon: "🔒", label: "100% private, never shared" },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 15 }}>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 16, textAlign: "center",
              color: "#fca5a5", fontSize: 14 }}>
            {error}
          </motion.div>
        )}

        {/* Sign in with Apple */}
        {isNative ? (
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAppleSignInClick}
            disabled={loading}
            style={{
              width: "100%", padding: "18px",
              background: loading ? "rgba(255,255,255,0.8)" : "white",
              border: "none", borderRadius: 20,
              color: "#000", fontWeight: 800, fontSize: 17,
              cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 12, transition: "all 0.2s",
            }}>
            {loading ? (
              <>
                <div style={{
                  width: 20, height: 20, border: "2px solid #000",
                  borderTopColor: "transparent", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 814 1000" style={{ flexShrink: 0 }}>
                  <path fill="#000" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 405.8 15.1 307.9 15.1 213.8c0-189.1 123.2-289.6 245-289.6 66.4 0 121.5 43.4 163.4 43.4 39.5 0 101.4-46 176.1-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
                <span>Continue with Apple</span>
              </>
            )}
          </motion.button>
        ) : (
          // Web/dev mode — just go straight to onboarding
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/onboarding/consent")}
            style={{
              width: "100%", padding: "18px",
              background: "white", border: "none", borderRadius: 20,
              color: "#000", fontWeight: 800, fontSize: 17,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 12,
            }}>
            <span style={{ fontSize: 20 }}>🚀</span>
            <span>Get Started</span>
          </motion.button>
        )}

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", lineHeight: 1.5, marginTop: 8 }}>
          By continuing you agree to our{" "}
          <span onClick={() => navigate("/TermsOfUse")} style={{ color: "rgba(168,85,247,0.7)", cursor: "pointer" }}>Terms</span>
          {" & "}
          <span onClick={() => navigate("/PrivacyPolicy")} style={{ color: "rgba(168,85,247,0.7)", cursor: "pointer" }}>Privacy Policy</span>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
