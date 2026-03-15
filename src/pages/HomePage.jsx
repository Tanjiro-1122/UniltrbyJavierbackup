import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mic, MessageCircle, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AppFooter from "@/components/AppFooter";

export default function HomePage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [checking, setChecking] = useState(true);

  // Auto-redirect returning premium users straight to chat
  useEffect(() => {
    const checkReturningUser = async () => {
      const profileId = localStorage.getItem("userProfileId");
      const companion = localStorage.getItem("unfiltr_companion");
      const env = localStorage.getItem("unfiltr_env");

      if (profileId && companion && env) {
        try {
          const profile = await base44.entities.UserProfile.get(profileId);
          if (profile?.is_premium || profile?.premium) {
            // Set a flag so ChatPage shows a "welcome back" greeting
            localStorage.setItem("unfiltr_welcome_back", "1");
            navigate("/vibe", { replace: true });
            return;
          }
        } catch { /* profile not found, show homepage */ }
      }
      setChecking(false);
    };
    checkReturningUser();
  }, []);

  useEffect(() => {
    if (!checking) {
      const t = setTimeout(() => setLoaded(true), 300);
      return () => clearTimeout(t);
    }
  }, [checking]);

  if (checking) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#06020f" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      className="screen"
      style={{
        background: "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── STAR FIELD ── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: Math.random() * 2 + 0.5,
            height: Math.random() * 2 + 0.5,
            borderRadius: "50%",
            background: "white",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            opacity: Math.random() * 0.7 + 0.1,
            animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + "s",
          }} />
        ))}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(219,39,119,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:1} }
        @keyframes float   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%,100%{opacity:0.88} 50%{opacity:1} }
        @keyframes logoSpin { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(360deg)} }
        @keyframes holoGlow {
          0%  { filter: drop-shadow(0 0 16px rgba(168,85,247,0.9)) drop-shadow(0 0 32px rgba(168,85,247,0.5)) brightness(1); }
          25% { filter: drop-shadow(0 0 24px rgba(219,39,119,0.9)) drop-shadow(0 0 48px rgba(219,39,119,0.5)) brightness(1.15); }
          50% { filter: drop-shadow(0 0 32px rgba(99,102,241,0.9)) drop-shadow(0 0 64px rgba(99,102,241,0.6)) brightness(1.2); }
          75% { filter: drop-shadow(0 0 24px rgba(236,72,153,0.9)) drop-shadow(0 0 48px rgba(236,72,153,0.5)) brightness(1.15); }
          100%{ filter: drop-shadow(0 0 16px rgba(168,85,247,0.9)) drop-shadow(0 0 32px rgba(168,85,247,0.5)) brightness(1); }
        }
        @keyframes holoSheen {
          0%   { opacity: 0; transform: translateX(-100%) rotate(30deg); }
          20%  { opacity: 0.6; }
          40%  { opacity: 0; transform: translateX(200%) rotate(30deg); }
          100% { opacity: 0; transform: translateX(200%) rotate(30deg); }
        }
      `}</style>

      {/* ── SCROLLABLE CONTENT ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 28 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="scroll-area"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          padding: "max(2.5rem, env(safe-area-inset-top, 2.5rem)) 24px max(2rem, env(safe-area-inset-bottom, 2rem))",
        }}
      >
        {/* Logo */}
        <div style={{
          position: "relative",
          width: 200, height: 200,
          marginBottom: 16,
          perspective: "800px",
        }}>
          {/* Outer glow ring */}
          <div style={{
            position: "absolute", inset: -12, borderRadius: "28%",
            background: "conic-gradient(from 0deg, rgba(168,85,247,0.5), rgba(219,39,119,0.5), rgba(99,102,241,0.5), rgba(168,85,247,0.5))",
            animation: "logoSpin 6s linear infinite",
            filter: "blur(12px)",
            zIndex: 0,
          }} />
          {/* Inner ring */}
          <div style={{
            position: "absolute", inset: -4, borderRadius: "22%",
            background: "conic-gradient(from 0deg, rgba(168,85,247,0.8), rgba(219,39,119,0.8), rgba(99,102,241,0.9), rgba(168,85,247,0.8))",
            animation: "logoSpin 4s linear infinite reverse",
            filter: "blur(4px)",
            zIndex: 0,
          }} />
          {/* Logo image */}
          <div style={{ position: "relative", zIndex: 1, width: 200, height: 200, borderRadius: "20%", overflow: "hidden" }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9710f9cf7_da0a2eaa1_generated_image.png"
              alt="Unfiltr By Javier"
              style={{
                width: "100%", height: "100%",
                objectFit: "contain",
                animation: "holoGlow 4s ease-in-out infinite",
              }}
            />
            {/* Holographic sheen overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
              animation: "holoSheen 3s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 34, fontWeight: 900, color: "white",
          margin: "0 0 4px",
          textShadow: "0 0 30px rgba(168,85,247,0.9), 0 2px 8px rgba(0,0,0,0.8)",
          letterSpacing: "-0.5px",
        }}>
          Unfiltr By Javier
        </h1>

        <p style={{ color: "#c084fc", fontSize: 14, fontWeight: 600, margin: "0 0 6px", letterSpacing: "0.5px" }}>
          Your AI companion, always here.
        </p>

        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: "0 0 24px", maxWidth: 280 }}>
          Talk, vent, laugh, or just hang out. No judgement. No scripts. Just a friend who gets you.
        </p>

        {/* Feature tiles */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10, width: "100%", marginBottom: 24,
        }}>
          {[
            { icon: <MessageCircle size={22} />, label: "Real convos" },
            { icon: <Mic          size={22} />, label: "Voice chat"  },
            { icon: <Sparkles     size={22} />, label: "9 companions" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              borderRadius: 16, padding: "12px 8px",
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 0 16px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}>
              <div style={{ color: "#a78bfa", filter: "drop-shadow(0 0 6px rgba(168,85,247,0.7))" }}>{f.icon}</div>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate("/onboarding")}
          style={{
            width: "100%", padding: "16px 0",
            borderRadius: 18, border: "none",
            color: "white", fontWeight: 900, fontSize: 17,
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
            boxShadow: "0 0 30px rgba(168,85,247,0.5), 0 4px 20px rgba(0,0,0,0.4)",
            animation: "shimmer 3s ease-in-out infinite",
            cursor: "pointer", marginBottom: 10,
            transition: "transform 0.1s",
          }}
          onPointerDown={e => e.currentTarget.style.transform = "scale(0.97)"}
          onPointerUp={e => e.currentTarget.style.transform   = "scale(1)"}
        >
          Meet your companion ✨
        </button>

        {/* Secondary CTA */}
        <button
          onClick={() => {
            const profileId = localStorage.getItem("userProfileId");
            const companion = localStorage.getItem("unfiltr_companion");
            const env = localStorage.getItem("unfiltr_env");
            if (profileId && companion && env) {
              navigate("/vibe");
            } else {
              navigate("/onboarding");
            }
          }}
          style={{
            width: "100%", padding: "13px 0",
            borderRadius: 18, border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14,
            background: "rgba(255,255,255,0.05)",
            cursor: "pointer", marginBottom: 8,
            transition: "transform 0.1s",
          }}
          onPointerDown={e => e.currentTarget.style.transform = "scale(0.97)"}
          onPointerUp={e => e.currentTarget.style.transform   = "scale(1)"}
        >
          I already have one → Continue
        </button>

        {/* Footer */}
        <AppFooter dark />
      </motion.div>
    </div>
  );
}