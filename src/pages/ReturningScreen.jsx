import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

function signInWithApple(navigate, setLoading) {
  const bridge = window.ReactNativeWebView;
  if (!bridge) { navigate("/hub"); return; }
  window._rnMessageHandlers = window._rnMessageHandlers || {};
  let resolved = false;
  const handleResult = async (msg) => {
    if (resolved) return;
    if (msg.type === "APPLE_SIGN_IN_WAITING") return;
    resolved = true; cleanup();
    if (msg.type === "APPLE_SIGN_IN_SUCCESS") {
      try { bridge.postMessage(JSON.stringify({ type: "__ACK_CONFIRMED" })); } catch(e) {}
      const payload = msg.data || msg;
      const appleUserId = payload.appleUserId || payload.user;
      const email = payload.email; const fullName = payload.fullName;
      if (!appleUserId) { setLoading && setLoading(false); return; }
      localStorage.setItem("unfiltr_apple_user_id", appleUserId);
      localStorage.setItem("unfiltr_user_id", appleUserId);
      localStorage.setItem("unfiltr_auth_token", appleUserId);
      if (!localStorage.getItem("userProfileId")) localStorage.setItem("userProfileId", appleUserId);
      if (email) { localStorage.setItem("unfiltr_apple_email", email); localStorage.setItem("unfiltr_user_email", email); }
      if (payload.pushToken) localStorage.setItem("unfiltr_push_token", payload.pushToken);
      if (fullName) localStorage.setItem("unfiltr_display_name", fullName);
      if (payload.isPremium) { localStorage.setItem("unfiltr_is_premium", "true"); localStorage.setItem("unfiltr_plan", payload.plan || "pro_plan"); }
      try {
        const syncRes = await fetch("/api/syncProfile", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appleUserId, email: email || null, fullName: fullName || null, isPremium: payload.isPremium || false, plan: payload.plan || null, pushToken: payload.pushToken || localStorage.getItem("unfiltr_push_token") || null }) });
        if (syncRes.ok) {
          const syncData = await syncRes.json(); const prof = syncData?.data;
          if (prof?.profileId) {
            localStorage.setItem("userProfileId", prof.profileId);
            if (prof.is_premium || prof.annual_plan || prof.pro_plan) {
              localStorage.setItem("unfiltr_is_premium", "true");
              if (prof.annual_plan) localStorage.setItem("unfiltr_is_annual", "true");
              if (prof.pro_plan) localStorage.setItem("unfiltr_is_pro", "true");
            }
            if (prof.display_name) localStorage.setItem("unfiltr_display_name", prof.display_name);
            localStorage.setItem("unfiltr_onboarding_complete", "true");
            if (prof.companion && prof.companion.avatar_id) {
              const c = prof.companion;
              try {
                const match = COMPANIONS.find(comp => comp.id === c.avatar_id);
                if (match) {
                  const nickname = c.nickname || c.name || match.name;
                  localStorage.setItem("unfiltr_companion", JSON.stringify({ id: match.id, name: match.name, displayName: nickname, systemPrompt: "You are " + nickname + ", a supportive AI companion. " + match.tagline, tagline: match.tagline, avatar: match.avatar }));
                  localStorage.setItem("unfiltr_companion_nickname", nickname);
                  if (c.voice_gender) localStorage.setItem("unfiltr_voice_gender", c.voice_gender);
                  if (c.voice_personality) localStorage.setItem("unfiltr_voice_personality", c.voice_personality);
                  if (c.personality_vibe) localStorage.setItem("unfiltr_personality_vibe", c.personality_vibe);
                  if (c.personality_style) localStorage.setItem("unfiltr_personality_style", c.personality_style);
                  if (c.personality_humor) localStorage.setItem("unfiltr_personality_humor", c.personality_humor);
                  if (c.personality_empathy) localStorage.setItem("unfiltr_personality_empathy", c.personality_empathy);
                }
              } catch(compErr) {}
            }
          }
        }
      } catch(e) {}
      window.dispatchEvent(new Event("unfiltr_auth_updated"));
      navigate("/hub");
    } else if (msg.type === "APPLE_SIGN_IN_CANCELLED" || msg.type === "APPLE_SIGN_IN_ERROR") {
      setLoading(false); navigate("/hub");
    }
  };
  const cleanup = () => { delete window._rnMessageHandlers["APPLE_SIGN_IN_SUCCESS"]; delete window._rnMessageHandlers["APPLE_SIGN_IN_CANCELLED"]; delete window._rnMessageHandlers["APPLE_SIGN_IN_ERROR"]; delete window._rnMessageHandlers["APPLE_SIGN_IN_WAITING"]; };
  window._rnMessageHandlers["APPLE_SIGN_IN_SUCCESS"] = handleResult;
  window._rnMessageHandlers["APPLE_SIGN_IN_CANCELLED"] = handleResult;
  window._rnMessageHandlers["APPLE_SIGN_IN_ERROR"] = handleResult;
  window._rnMessageHandlers["APPLE_SIGN_IN_WAITING"] = handleResult;
  bridge.postMessage(JSON.stringify({ type: "SIGN_IN_WITH_APPLE" }));
  setTimeout(() => { if (!resolved) { resolved = true; cleanup(); setLoading && setLoading(false); navigate("/hub"); } }, 15000);
}

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
  const [loading, setLoading] = useState(false);
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
