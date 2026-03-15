import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Mic, MessageCircle } from "lucide-react";
import AppFooter from "@/components/AppFooter";

export default function HomePage() {
  const navigate = useNavigate();
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

  if (checking) {
    return (
      <div className="screen" style={{ alignItems: "center", justifyContent: "center", background: "#06020f" }}>
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Stars background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: Math.random() * 2 + 0.5,
            height: Math.random() * 2 + 0.5,
            borderRadius: "50%",
            background: "white",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            opacity: Math.random() * 0.6 + 0.1,
            animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + "s",
          }} />
        ))}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
        }} />
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:0.88} 50%{opacity:1} }
        @keyframes holoGlow {
          0%  { filter: drop-shadow(0 0 16px rgba(168,85,247,0.9)) drop-shadow(0 0 32px rgba(168,85,247,0.5)) brightness(1); }
          50% { filter: drop-shadow(0 0 32px rgba(99,102,241,0.9)) drop-shadow(0 0 64px rgba(99,102,241,0.6)) brightness(1.2); }
          100%{ filter: drop-shadow(0 0 16px rgba(168,85,247,0.9)) drop-shadow(0 0 32px rgba(168,85,247,0.5)) brightness(1); }
        }
        @keyframes holoSheen {
          0%   { opacity: 0; transform: translateX(-100%) rotate(30deg); }
          20%  { opacity: 0.6; }
          40%  { opacity: 0; transform: translateX(200%) rotate(30deg); }
          100% { opacity: 0; transform: translateX(200%) rotate(30deg); }
        }
      `}</style>

      {/* Content — centered flex column, no scrolling */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: 430,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "0 24px",
        paddingBottom: "calc(74px + env(safe-area-inset-bottom, 0px))",
      }}>
        {/* Logo — smaller to fit */}
        <div style={{
          position: "relative",
          width: 140, height: 140,
          marginBottom: 12,
          flexShrink: 0,
        }}>
          <div style={{ position: "relative", zIndex: 1, width: 140, height: 140, borderRadius: "20%", overflow: "hidden" }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9710f9cf7_da0a2eaa1_generated_image.png"
              alt="Unfiltr By Javier"
              style={{
                width: "100%", height: "100%",
                objectFit: "contain",
                animation: "holoGlow 4s ease-in-out infinite",
              }}
            />
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
          fontSize: 28, fontWeight: 900, color: "white",
          margin: "0 0 2px",
          textShadow: "0 0 30px rgba(168,85,247,0.9), 0 2px 8px rgba(0,0,0,0.8)",
        }}>
          Unfiltr By Javier
        </h1>

        <p style={{ color: "#c084fc", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
          Your AI companion, always here.
        </p>

        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5, margin: "0 0 16px", maxWidth: 260 }}>
          Talk, vent, laugh, or just hang out. No judgement. Just a friend who gets you.
        </p>

        {/* Feature tiles */}
        <div style={{
          display: "flex", gap: 10, width: "100%", marginBottom: 18,
          justifyContent: "center",
        }}>
          {[
            { icon: <MessageCircle size={18} />, label: "Real convos" },
            { icon: <Mic size={18} />, label: "Voice chat" },
            { icon: <Sparkles size={18} />, label: "9 companions" },
          ].map((f, i) => (
            <div key={i} style={{
              flex: 1, maxWidth: 110,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              borderRadius: 14, padding: "10px 6px",
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}>
              <div style={{ color: "#a78bfa", filter: "drop-shadow(0 0 6px rgba(168,85,247,0.7))" }}>{f.icon}</div>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 600 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <button
          onClick={() => navigate("/onboarding")}
          style={{
            width: "100%", padding: "14px 0",
            borderRadius: 18, border: "none",
            color: "white", fontWeight: 900, fontSize: 16,
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
            boxShadow: "0 0 24px rgba(168,85,247,0.5), 0 4px 16px rgba(0,0,0,0.4)",
            animation: "shimmer 3s ease-in-out infinite",
            cursor: "pointer", marginBottom: 8,
          }}
        >
          Meet your companion ✨
        </button>

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
            width: "100%", padding: "12px 0",
            borderRadius: 18, border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13,
            background: "rgba(255,255,255,0.05)",
            cursor: "pointer", marginBottom: 6,
          }}
        >
          I already have one → Continue
        </button>

        {/* Footer links */}
        <AppFooter dark />
      </div>
    </div>
  );
}