import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

function signInWithApple(navigate, setLoading) {
  const bridge = window.ReactNativeWebView;
  if (!bridge) { navigate("/hub"); return; }

  // Ensure the global handler registry exists (set up by appleStoreKitService)
  window._rnMessageHandlers = window._rnMessageHandlers || {};

  let resolved = false;

  const handleResult = async (msg) => {
    if (resolved) return;
    if (msg.type === "APPLE_SIGN_IN_WAITING") return;
    resolved = true;
    cleanup();

    if (msg.type === "APPLE_SIGN_IN_SUCCESS") {
      // Send ACK so native wrapper stops retrying
      try { bridge.postMessage(JSON.stringify({ type: "__ACK_CONFIRMED" })); } catch(e) {}
      const payload = msg.data || msg;
      const appleUserId = payload.appleUserId || payload.user;
      const email = payload.email;
      const fullName = payload.fullName;
      if (!appleUserId) { setLoading && setLoading(false); return; }
      localStorage.setItem("unfiltr_apple_user_id", appleUserId);
      localStorage.setItem("unfiltr_user_id", appleUserId);
      localStorage.setItem("unfiltr_auth_token", appleUserId);
      if (!localStorage.getItem("userProfileId")) localStorage.setItem("userProfileId", appleUserId);
      if (email) { localStorage.setItem("unfiltr_apple_email", email); localStorage.setItem("unfiltr_user_email", email); }
      // Save push token from native bridge
      if (payload.pushToken) {
        localStorage.setItem("unfiltr_push_token", payload.pushToken);
      }
      if (fullName) localStorage.setItem("unfiltr_display_name", fullName);
      if (payload.isPremium) {
        localStorage.setItem("unfiltr_is_premium", "true");
        localStorage.setItem("unfiltr_plan", payload.plan || "pro_plan");
      }

      // Sync name/email to DB + restore full profile (premium, companion, settings)
      try {
        const syncRes = await fetch("/api/syncProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appleUserId, email: email || null, fullName: fullName || null, isPremium: payload.isPremium || false, plan: payload.plan || null, pushToken: payload.pushToken || localStorage.getItem("unfiltr_push_token") || null }),
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          const prof = syncData?.data;
          if (prof?.profileId) {
            localStorage.setItem("userProfileId", prof.profileId);
            if (prof.is_premium || prof.annual_plan || prof.pro_plan) {
              localStorage.setItem("unfiltr_is_premium", "true");
              if (prof.annual_plan) localStorage.setItem("unfiltr_is_annual", "true");
              if (prof.pro_plan)    localStorage.setItem("unfiltr_is_pro", "true");
            }
            if (prof.display_name) localStorage.setItem("unfiltr_display_name", prof.display_name);
            // If they have onboarding_complete in DB, mark it locally too
            localStorage.setItem("unfiltr_onboarding_complete", "true");

            // Restore companion from DB so new device gets the right character
            if (prof.companion && prof.companion.avatar_id) {
              const c = prof.companion;
              try {
                const { COMPANIONS } = await import("@/components/companionData");
                const match = COMPANIONS.find(comp => comp.id === c.avatar_id);
                if (match) {
                  const nickname = c.nickname || c.name || match.name;
                  localStorage.setItem("unfiltr_companion", JSON.stringify({
                    id: match.id, name: match.name, displayName: nickname,
                    systemPrompt: "You are " + nickname + ", a supportive AI companion. " + match.tagline,
                    tagline: match.tagline, avatar: match.avatar,
                  }));
                  localStorage.setItem("unfiltr_companion_nickname", nickname);
                  if (c.voice_gender)        localStorage.setItem("unfiltr_voice_gender", c.voice_gender);
                  if (c.voice_personality)   localStorage.setItem("unfiltr_voice_personality", c.voice_personality);
                  if (c.personality_vibe)    localStorage.setItem("unfiltr_personality_vibe", c.personality_vibe);
                  if (c.personality_style)   localStorage.setItem("unfiltr_personality_style", c.personality_style);
                  if (c.personality_humor)   localStorage.setItem("unfiltr_personality_humor", c.personality_humor);
                  if (c.personality_empathy) localStorage.setItem("unfiltr_personality_empathy", c.personality_empathy);
                  console.log("[ReturningScreen] Companion restored:", match.name);
                }
              } catch(compErr) {
                console.warn("[ReturningScreen] Companion restore non-fatal:", compErr);
              }
            }
          }
        }
      } catch(e) { /* non-fatal */ }

      window.dispatchEvent(new Event("unfiltr_auth_updated"));
      navigate("/hub");
    } else if (msg.type === "APPLE_SIGN_IN_CANCELLED" || msg.type === "APPLE_SIGN_IN_ERROR") {
      setLoading(false);
      navigate("/hub");
    }
  };

  // Register using the shared _rnMessageHandlers pub/sub (does NOT break other listeners)
  const TYPES = ["APPLE_SIGN_IN_SUCCESS","APPLE_SIGN_IN_CANCELLED","APPLE_SIGN_IN_ERROR","APPLE_SIGN_IN_WAITING"];
  TYPES.forEach(t => {
    window._rnMessageHandlers[t] = window._rnMessageHandlers[t] || [];
    window._rnMessageHandlers[t].push(handleResult);
  });

  // Fallback: window message event
  const windowHandler = (e) => {
    try {
      const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      if (TYPES.includes(msg?.type)) handleResult(msg);
    } catch {}
  };
  window.addEventListener("message", windowHandler);

  const cleanup = () => {
    TYPES.forEach(t => {
      if (window._rnMessageHandlers[t]) {
        window._rnMessageHandlers[t] = window._rnMessageHandlers[t].filter(f => f !== handleResult);
      }
    });
    window.removeEventListener("message", windowHandler);
  };

  bridge.postMessage(JSON.stringify({ type: "SIGN_IN_WITH_APPLE" }));

  // Safety timeout — if native never responds in 15s, unblock the user
  setTimeout(() => {
    if (!resolved) {
      console.warn("[ReturningScreen] Sign-in timeout — routing to hub");
      resolved = true;
      cleanup();
      setLoading && setLoading(false);
      navigate("/hub");
    }
  }, 15000);
}

export default function ReturningScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isNative = !!window.ReactNativeWebView;
  const companionRaw = localStorage.getItem("unfiltr_companion");
  const companion = companionRaw ? JSON.parse(companionRaw) : null;
  const nickname = localStorage.getItem("unfiltr_companion_nickname") || companion?.name || "your companion";

  // Last message preview — pull from most recent chat session
  const lastMessagePreview = (() => {
    try {
      const sessions = JSON.parse(localStorage.getItem("unfiltr_chat_sessions") || "[]");
      if (!sessions.length) return null;
      const last = sessions[0];
      const lastAI = [...(last.messages || [])].reverse().find(m => m.role === "assistant");
      return lastAI?.content?.slice(0, 80) || null;
    } catch { return null; }
  })();
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
        {lastMessagePreview
          ? `"${lastMessagePreview.length > 70 ? lastMessagePreview.slice(0, 70) + '…' : lastMessagePreview}"`
          : `${nickname} has been waiting for you.`
        }
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
           
          {loading ? (
            <>
              <div style={{ width:18, height:18, border:"2px solid #000", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 814 1000" style={{ flexShrink:0 }}>
                <path fill="#000" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 405.8 15.1 307.9 15.1 213.8c0-189.1 123.2-289.6 245-289.6 66.4 0 121.5 43.4 163.4 43.4 39.5 0 101.4-46 176.1-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
              </svg>
              <span>Sign in with Apple</span>
            </>
          )}
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

