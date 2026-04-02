import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Shield, FileText, HeadphonesIcon, Star } from "lucide-react";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

function signInWithApple(navigate) {
  const bridge = window.ReactNativeWebView;
  if (!bridge) {
    // Fallback — no native bridge, go to onboarding normally
    navigate("/onboarding/consent");
    return;
  }

  // Listen for Apple sign-in response
  const handler = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === "APPLE_SIGN_IN_SUCCESS") {
        window.removeEventListener("message", handler);
        const { appleUserId, email, fullName } = msg.data || {};
        // Store Apple identity
        localStorage.setItem("unfiltr_apple_user_id", appleUserId);
        localStorage.setItem("unfiltr_user_id", appleUserId);
        localStorage.setItem("unfiltr_auth_token", appleUserId);
        if (email) localStorage.setItem("unfiltr_apple_email", email);
        if (fullName) localStorage.setItem("unfiltr_display_name", fullName);
        // If onboarding already done, go straight to hub
        const onboardingDone = !!localStorage.getItem("unfiltr_onboarding_complete");
        navigate(onboardingDone ? "/hub" : "/onboarding/consent");
      } else if (msg.type === "APPLE_SIGN_IN_CANCELLED" || msg.type === "APPLE_SIGN_IN_ERROR") {
        window.removeEventListener("message", handler);
        // Just go to normal onboarding on cancel/error
        navigate("/onboarding/consent");
      }
    } catch {}
  };
  window.addEventListener("message", handler);
  bridge.postMessage(JSON.stringify({ type: "SIGN_IN_WITH_APPLE" }));
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isNative = !!window.ReactNativeWebView;

  const handleAppleSignIn = () => {
    setLoading(true);
    signInWithApple(navigate);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 0%, #1a0535 0%, #0d0520 40%, #06020f 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui,-apple-system,sans-serif",
      overflow: "hidden",
    }}>
      {/* Top glow */}
      <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "max(3rem,env(safe-area-inset-top)) 24px 24px" }}>

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

        {/* Sign in with Apple (native only) */}
        {isNative && (
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAppleSignIn}
            disabled={loading}
            style={{
              width: "100%", padding: "18px",
              background: "white",
              border: "none", borderRadius: 20,
              color: "#000", fontWeight: 800, fontSize: 17,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 12,
              opacity: loading ? 0.7 : 1,
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
              <path d="M16.125 1C14.297 1.063 12.156 2.234 10.922 3.781c-1.125 1.406-2.063 3.547-1.688 5.641 2.016.156 4.078-.969 5.281-2.531C15.719 5.328 16.594 3.172 16.125 1zM20.953 17.813c-.938 1.953-1.391 2.828-2.609 4.547-1.688 2.391-4.078 5.375-7.031 5.406-2.625.031-3.313-1.703-6.891-1.688-3.578.016-4.313 1.719-6.938 1.688-2.953-.031-5.203-2.688-6.891-5.078C-14.25 16.734-14.578 8.578-11.641 4.281c2.016-3.047 5.203-4.828 8.219-4.828 3.063 0 4.984 1.719 7.516 1.719 2.453 0 3.953-1.719 7.5-1.719 2.688 0 5.531 1.453 7.547 3.969-6.625 3.641-5.547 13.125.812 14.391z"/>
            </svg>
            {loading ? "Signing in..." : "Sign in with Apple"}
          </motion.button>
        )}

        {/* Primary CTA */}
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

        {/* How It Works */}
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

          {/* Info links */}
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
