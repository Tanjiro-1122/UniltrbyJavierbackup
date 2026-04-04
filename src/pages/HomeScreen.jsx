import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Shield, FileText, HeadphonesIcon, Star } from "lucide-react";
import { debugLog } from "@/components/DebugPanel";
import { base44 } from "@/api/base44Client";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

// ── Restore a returning user's data from DB into localStorage ─────────────────
async function restoreProfileFromDB(appleUserId, email, fullName) {
  try {
    // Look up UserProfile by apple_user_id
    const profiles = await base44.entities.UserProfile.filter({ apple_user_id: appleUserId });
    const profile = profiles?.[0];
    if (!profile) return false; // new user

    debugLog(`[WEB] ✅ Found existing profile for Apple ID: ${appleUserId}`);

    // Restore identity keys
    localStorage.setItem("userProfileId", profile.id);
    localStorage.setItem("unfiltr_user_id", profile.id);
    localStorage.setItem("unfiltr_auth_token", profile.id);
    localStorage.setItem("unfiltr_apple_user_id", appleUserId);
    if (email) { localStorage.setItem("unfiltr_apple_email", email); localStorage.setItem("unfiltr_user_email", email); }
    if (profile.display_name) localStorage.setItem("unfiltr_user_display_name", profile.display_name);
    if (fullName && !profile.display_name) localStorage.setItem("unfiltr_display_name", fullName);

    // Restore premium status
    localStorage.setItem("unfiltr_is_premium", String(!!profile.is_premium));
    localStorage.setItem("unfiltr_is_annual", String(!!profile.annual_plan));
    localStorage.setItem("unfiltr_is_pro", String(!!profile.pro_plan));
    if (profile.bonus_messages) localStorage.setItem("unfiltr_bonus_messages", String(profile.bonus_messages));

    // Restore companion
    if (profile.companion_id) {
      localStorage.setItem("companionId", profile.companion_id);
      localStorage.setItem("unfiltr_companion_id", profile.companion_id);
      try {
        const companion = await base44.entities.Companion.get(profile.companion_id);
        if (companion) {
          const displayName = localStorage.getItem("unfiltr_companion_nickname") || companion.name;
          localStorage.setItem("unfiltr_companion", JSON.stringify({
            id: companion.avatar_id || companion.id,
            name: companion.name,
            displayName,
            systemPrompt: `You are ${displayName}, a supportive AI companion.`,
          }));
          localStorage.setItem("unfiltr_companion_nickname", displayName);
          if (companion.personality_vibe)      localStorage.setItem("unfiltr_personality_vibe",      companion.personality_vibe);
          if (companion.personality_empathy)   localStorage.setItem("unfiltr_personality_empathy",   companion.personality_empathy);
          if (companion.personality_humor)     localStorage.setItem("unfiltr_personality_humor",     companion.personality_humor);
          if (companion.personality_curiosity) localStorage.setItem("unfiltr_personality_curiosity", companion.personality_curiosity);
          if (companion.personality_style)     localStorage.setItem("unfiltr_personality_style",     companion.personality_style);
        }
      } catch (e) { debugLog('[WEB] Companion fetch failed (non-blocking):', e); }
    }

    // Mark onboarding complete so they skip straight to hub
    localStorage.setItem("unfiltr_onboarding_complete", "true");
    if (profile.preferred_mood) localStorage.setItem("unfiltr_vibe", profile.preferred_mood);

    // Update last_active in background
    base44.entities.UserProfile.update(profile.id, { last_active: new Date().toISOString() }).catch(() => {});

    window.dispatchEvent(new Event("unfiltr_auth_updated"));
    return true; // returning user — go to hub

  } catch (e) {
    debugLog('[WEB] Profile lookup failed:', e);
    return false; // treat as new user on error
  }
}

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

  // Unregister any leftover handlers from a previous tap
  if (window.__nativeBus) {
    window.__nativeBus.off("APPLE_SIGN_IN_SUCCESS");
    window.__nativeBus.off("APPLE_SIGN_IN_CANCELLED");
    window.__nativeBus.off("APPLE_SIGN_IN_ERROR");
  }

  const done = (fn) => {
    if (window.__nativeBus) {
      window.__nativeBus.off("APPLE_SIGN_IN_SUCCESS");
      window.__nativeBus.off("APPLE_SIGN_IN_CANCELLED");
      window.__nativeBus.off("APPLE_SIGN_IN_ERROR");
    }
    fn();
  };

  if (window.__nativeBus) {
    window.__nativeBus.on("APPLE_SIGN_IN_SUCCESS", (msg) => {
      done(async () => {
        const payload = msg.data || msg;
        const appleUserId = payload.appleUserId || payload.user;
        const email = payload.email;
        const fullName = payload.fullName;
        debugLog(`[WEB] ✅ Apple ID: ${appleUserId}`);
        if (!appleUserId) { setLoading(false); return; }

        // Always persist Apple ID locally first
        localStorage.setItem("unfiltr_apple_user_id", appleUserId);
        localStorage.setItem("unfiltr_user_id", appleUserId);
        localStorage.setItem("unfiltr_auth_token", appleUserId);
        if (email) { localStorage.setItem("unfiltr_apple_email", email); localStorage.setItem("unfiltr_user_email", email); }
        if (fullName) localStorage.setItem("unfiltr_display_name", fullName);

        // ── Cross-device sync: look up existing profile in DB ──
        const isReturningUser = await restoreProfileFromDB(appleUserId, email, fullName);
        window.dispatchEvent(new Event("unfiltr_auth_updated"));

        if (isReturningUser) {
          debugLog('[WEB] Returning user — going to hub');
          navigate("/hub");
        } else {
          debugLog('[WEB] New user — going to onboarding');
          if (!localStorage.getItem("userProfileId")) localStorage.setItem("userProfileId", appleUserId);
          navigate("/onboarding/consent");
        }
      });
    });

    window.__nativeBus.on("APPLE_SIGN_IN_CANCELLED", () => {
      done(() => {
        debugLog('[WEB] 🚫 Apple sign-in cancelled');
        setLoading(false);
      });
    });

    window.__nativeBus.on("APPLE_SIGN_IN_ERROR", (msg) => {
      done(() => {
        debugLog(`[WEB] ❌ Apple sign-in error: ${msg.error}`);
        setLoading(false);
      });
    });
  }

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
            {loading ? "Restoring your account..." : "Sign in with Apple"}
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
              <button key={label}
                style={{ padding: "12px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                onClick={() => action ? action() : navigate(path)}>
                <Icon size={16} color={color} />
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
