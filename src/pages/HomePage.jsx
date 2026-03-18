import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Mic, MessageCircle } from "lucide-react";
import AppFooter from "@/components/AppFooter";
import AppShell from "@/components/shell/AppShell";

// Pre-generate stars once outside component to avoid re-renders
const STARS = Array.from({ length: 40 }, (_, i) => ({
  key: i,
  width: Math.random() * 2 + 0.5,
  height: Math.random() * 2 + 0.5,
  top: Math.random() * 100 + "%",
  left: Math.random() * 100 + "%",
  opacity: Math.random() * 0.6 + 0.1,
  duration: Math.random() * 4 + 2,
  delay: Math.random() * 4,
}));

export default function HomePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // Check if user already has a saved session
  const hasSession = !!(
    localStorage.getItem("userProfileId") &&
    localStorage.getItem("unfiltr_companion") &&
    localStorage.getItem("unfiltr_env")
  );

  return (
    <AppShell
      tabs={false}
      bg="#06020f"
      style={{ alignItems: "center", justifyContent: "center", overflow: "hidden", background: "linear-gradient(180deg, #0d0420 0%, #120626 40%, #1a0535 70%, #0d0220 100%)" }}>

      {/* Stars background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {STARS.map(s =>
        <div key={s.key} style={{
          position: "absolute",
          width: s.width,
          height: s.height,
          borderRadius: "50%",
          background: "white",
          top: s.top,
          left: s.left,
          opacity: s.opacity,
          animation: `twinkle ${s.duration}s ease-in-out infinite`,
          animationDelay: s.delay + "s"
        }} />
        )}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)"
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

      {/* Content — scrollable */}
      <div className="scroll-area" style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        padding: "0 16px max(16px, env(safe-area-inset-bottom, 16px))",
        boxSizing: "border-box",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          boxSizing: "border-box",
        }}>
          {/* Logo */}
          <div style={{
            position: "relative",
            width: 156, height: 156,
            marginBottom: 10,
            flexShrink: 0
          }}>
            <div style={{ position: "relative", zIndex: 1, width: 156, height: 156, borderRadius: "20%", overflow: "hidden" }}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9710f9cf7_da0a2eaa1_generated_image.png"
                alt="Unfiltr By Javier"
                style={{
                  width: "100%", height: "100%",
                  objectFit: "contain",
                  animation: "holoGlow 4s ease-in-out infinite"
                }} />

              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
                animation: "holoSheen 3s ease-in-out infinite",
                pointerEvents: "none"
              }} />
            </div>
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 900, color: "white",
            margin: "0 0 2px",
            textShadow: "0 0 30px rgba(168,85,247,0.9), 0 2px 8px rgba(0,0,0,0.8)"
          }}>
            Unfiltr By Javier
          </h1>

          <p style={{ color: "#c084fc", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
            Your AI companion, always here.
          </p>

          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.6, margin: "0 0 18px", maxWidth: 280 }}>
            {hasSession
              ? `Welcome back${(() => { try { const p = JSON.parse(localStorage.getItem("unfiltr_companion")); return ` — ${p.displayName || p.name} missed you 💜`; } catch { return "!"; } })()}`
              : "Talk, vent, laugh, or just hang out. No judgement. Just a friend who gets you."
            }
          </p>

          <div style={{
            display: "flex", gap: 8, width: "100%", marginBottom: 18,
          }}>
            {[
            { icon: <MessageCircle size={18} />, label: "Real convos" },
            { icon: <Mic size={18} />, label: "Voice chat" },
            { icon: <Sparkles size={18} />, label: "9 companions" }].
            map((f, i) =>
            <div key={i} style={{
              flex: 1,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              borderRadius: 16, padding: "14px 4px",
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
            }}>
                <div style={{ color: "#c084fc", filter: "drop-shadow(0 0 8px rgba(192,132,252,0.8))" }}>{f.icon}</div>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2px" }}>{f.label}</span>
              </div>
            )}
          </div>

          {hasSession ? (
            /* Returning user — single "Continue" button goes straight to chat */
            <button
              onClick={() => navigate("/chat")}
              style={{
                width: "100%", padding: "16px",
                borderRadius: 18, border: "none",
                color: "white", fontWeight: 900, fontSize: 17,
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
                boxShadow: "0 0 32px rgba(168,85,247,0.55), 0 4px 20px rgba(0,0,0,0.5)",
                animation: "shimmer 3s ease-in-out infinite",
                cursor: "pointer",
                letterSpacing: "0.2px",
              }}>
              Continue chatting ✨
            </button>
          ) : (
            /* New user — onboarding */
            <button
              onClick={() => navigate("/onboarding")}
              style={{
                width: "100%", padding: "16px",
                borderRadius: 18, border: "none",
                color: "white", fontWeight: 900, fontSize: 17,
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
                boxShadow: "0 0 32px rgba(168,85,247,0.55), 0 4px 20px rgba(0,0,0,0.5)",
                animation: "shimmer 3s ease-in-out infinite",
                cursor: "pointer",
                letterSpacing: "0.2px",
              }}>
              Meet your companion ✨
            </button>
          )}
        </div>

        <div style={{ width: "100%", flexShrink: 0, paddingTop: 18 }}>
          <AppFooter dark />
        </div>
      </div>
    </AppShell>);

}