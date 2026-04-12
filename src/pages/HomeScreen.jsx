/**
 * HomeScreen.jsx — First launch sign-in screen.
 * Uses the unified handleAppleSignIn() from db.js.
 * After sign-in: new users → /onboarding/consent, returning → /hub
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Route ALL profile operations through /api/syncProfile (server-side, authenticated)
async function handleAppleSignIn({ appleUserId, email, fullName, isPremiumFromRC, identityToken }) {
  const res = await fetch("/api/syncProfile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sync",
      appleUserId,
      email:         email         || "",
      fullName:      fullName      || "",
      isPremium:     isPremiumFromRC || false,
      identityToken: identityToken || "",
    }),
  });
  if (!res.ok) throw new Error(`syncProfile failed: ${res.status}`);
  const result = await res.json();
  const profile = result.data;
  const isNewUser = result.isNewUser === true;

  if (profile?.profileId) {
    // Clear fresh-start guard now that the user has explicitly signed in
    localStorage.removeItem("unfiltr_fresh_start");
    localStorage.removeItem("unfiltr_signed_out");
    localStorage.setItem("unfiltr_apple_user_id", appleUserId);
    // Set unfiltr_user_id to apple user ID for backward compatibility with
    // AuthContext.checkAuth and any other code that checks unfiltr_user_id.
    localStorage.setItem("unfiltr_user_id", appleUserId);
    if (email) {
      localStorage.setItem("unfiltr_apple_email", email);
      localStorage.setItem("unfiltr_user_email", email);
    }
    localStorage.setItem("userProfileId", profile.profileId);
    if (profile.display_name) localStorage.setItem("unfiltr_display_name", profile.display_name);
    // Restore companion ID from the UserProfile record first (most reliable)
    if (profile.companion_id && profile.companion_id !== "pending") {
      localStorage.setItem("unfiltr_companion_id", profile.companion_id);
    }
    // Set all three canonical premium flags consistently
    const isAnnual  = !!(profile.annual_plan);
    const isPro     = !!(profile.pro_plan);
    const isPremium = !!(profile.is_premium || isPro || isAnnual);
    localStorage.setItem("unfiltr_is_premium", String(isPremium));
    localStorage.setItem("unfiltr_is_annual",  String(isAnnual));
    localStorage.setItem("unfiltr_is_pro",     String(isPro));
    // Notify all mounted components that auth state changed
    window.dispatchEvent(new Event("unfiltr_auth_updated"));
  }

  // Restore companion details if returning user
  if (!isNewUser && profile?.companion) {
    const comp = profile.companion;
    // avatar_id is the companion's display asset id — use as companion id if available,
    // but profile.companion_id (set above) takes priority for ChatHistory keying.
    if (comp.avatar_id)           localStorage.setItem("unfiltr_companion_id",          comp.avatar_id);
    if (comp.name)                localStorage.setItem("unfiltr_companion_name",         comp.name);
    if (comp.nickname)            localStorage.setItem("unfiltr_companion_nickname",     comp.nickname);
    if (comp.voice_gender)        localStorage.setItem("unfiltr_voice_gender",           comp.voice_gender);
    if (comp.voice_personality)   localStorage.setItem("unfiltr_voice_personality",      comp.voice_personality);
    if (comp.personality_vibe)    localStorage.setItem("unfiltr_personality_vibe",       comp.personality_vibe);
    if (comp.personality_style)   localStorage.setItem("unfiltr_personality_style",      comp.personality_style);
    if (comp.personality_humor)   localStorage.setItem("unfiltr_personality_humor",      comp.personality_humor);
    if (comp.personality_empathy) localStorage.setItem("unfiltr_personality_empathy",    comp.personality_empathy);
    // Persist a full companion JSON so ChatPage can load it without a DB round-trip.
    // Prefer profile.companion_id (the canonical key used in ChatHistory records) and
    // look it up in COMPANIONS for the full object (avatar URL, poses, etc.).
    const companionId = (profile.companion_id && profile.companion_id !== "pending")
      ? profile.companion_id
      : comp.avatar_id;
    if (companionId) {
      const existingRaw = localStorage.getItem("unfiltr_companion");
      const existing = existingRaw ? (() => { try { return JSON.parse(existingRaw); } catch { return null; } })() : null;
      if (!existing || existing.id !== companionId) {
        // Lazy-load COMPANIONS to find the full object (avatar URL, poses, systemPrompt…)
        try {
          const { COMPANIONS: COMP_LIST } = await import("@/components/companionData");
          const found = COMP_LIST.find(c => c.id === companionId);
          const companionObj = found
            ? { ...found, displayName: comp.nickname || found.displayName || found.name }
            : { id: companionId, name: comp.name || "", displayName: comp.nickname || comp.name || "" };
          localStorage.setItem("unfiltr_companion", JSON.stringify(companionObj));
        } catch {
          // Fallback: minimal object — ChatPage will enrich from DB on first load
          localStorage.setItem("unfiltr_companion", JSON.stringify({
            id: companionId, name: comp.name || "", displayName: comp.nickname || comp.name || "",
          }));
        }
      }
    }
  }

  return { profile, isNewUser };
}
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
          // Apple only sends fullName on very first sign-in ever.
          // After delete+re-sign-in, fullName is null — fall back to localStorage name.
          const storedName = localStorage.getItem("unfiltr_display_name") || "";
          const { profile, isNewUser } = await handleAppleSignIn({
            appleUserId,
            email: payload.email || localStorage.getItem("unfiltr_apple_email") || "",
            fullName: payload.fullName || storedName,
            isPremiumFromRC: payload.isPremium,
            identityToken: payload.identityToken || "",
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
          // If syncProfile wiped the account (pending-deletion), isNewUser=true handles it
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
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, fontFamily: "-apple-system,BlinkMacSystemFont,SF Pro Display,sans-serif", color: "#000" }}>&#xF8FF;</span>
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
