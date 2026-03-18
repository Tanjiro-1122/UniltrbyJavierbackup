import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppFooter from "@/components/AppFooter";
import AppShell from "@/components/shell/AppShell";
import FloatingParticles from "@/components/home/FloatingParticles";
import CompanionShowcase from "@/components/home/CompanionShowcase";
import FeaturePills from "@/components/home/FeaturePills";
import SocialProof from "@/components/home/SocialProof";

export default function HomePage() {
  const navigate = useNavigate();

  const hasSession = !!(
    localStorage.getItem("userProfileId") &&
    localStorage.getItem("unfiltr_companion") &&
    localStorage.getItem("unfiltr_env")
  );

  const getWelcomeBack = () => {
    try {
      const p = JSON.parse(localStorage.getItem("unfiltr_companion"));
      return `Welcome back — ${p.displayName || p.name} missed you 💜`;
    } catch {
      return "Welcome back!";
    }
  };

  return (
    <AppShell
      tabs={false}
      bg="#06020f"
      style={{
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0d0420 0%, #100528 30%, #1a0535 60%, #0d0220 100%)",
      }}
    >
      <FloatingParticles />

      <style>{`
        @keyframes shimmer-btn {
          0%, 100% { background-size: 200% 200%; background-position: 0% 50%; }
          50% { background-size: 200% 200%; background-position: 100% 50%; }
        }
      `}</style>

      {/* Scrollable content */}
      <div
        className="scroll-area"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: "0 20px max(20px, env(safe-area-inset-bottom, 20px))",
        }}
      >
        <div style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 32,
        }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: "relative",
              width: 100, height: 100,
              marginBottom: 16,
            }}
          >
            <div style={{
              position: "absolute", inset: -12,
              borderRadius: "24%",
              background: "conic-gradient(from 45deg, rgba(139,92,246,0.4), rgba(219,39,119,0.3), rgba(99,102,241,0.4), rgba(139,92,246,0.4))",
              filter: "blur(16px)",
              animation: "spin-slow 8s linear infinite",
            }} />
            <div style={{
              position: "relative",
              width: 100, height: 100,
              borderRadius: "22%",
              overflow: "hidden",
              border: "2px solid rgba(139,92,246,0.3)",
            }}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9710f9cf7_da0a2eaa1_generated_image.png"
                alt="Unfiltr"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "white",
              margin: "0 0 4px",
              letterSpacing: "-0.5px",
              textShadow: "0 0 40px rgba(168,85,247,0.8), 0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            Unfiltr
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{
              color: "#c084fc",
              fontSize: 14,
              fontWeight: 600,
              margin: "0 0 6px",
              letterSpacing: "0.3px",
            }}
          >
            Your AI companion, always here.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              lineHeight: 1.6,
              margin: "0 0 24px",
              maxWidth: 300,
              textAlign: "center",
            }}
          >
            {hasSession
              ? getWelcomeBack()
              : "Talk, vent, laugh, or just hang out. No judgement — just a friend who gets you."}
          </motion.p>

          {/* Companion showcase */}
          <CompanionShowcase />

          {/* Feature pills */}
          <FeaturePills />

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(hasSession ? "/chat" : "/onboarding")}
            style={{
              width: "100%",
              padding: "17px",
              borderRadius: 20,
              border: "none",
              color: "white",
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: "0.3px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777, #7c3aed)",
              backgroundSize: "200% 200%",
              animation: "shimmer-btn 4s ease infinite",
              boxShadow: "0 0 40px rgba(168,85,247,0.5), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              marginBottom: 24,
            }}
          >
            {hasSession ? "Continue chatting ✨" : "Meet your companion ✨"}
          </motion.button>

          {/* Social proof */}
          <SocialProof />

          {/* Footer */}
          <div style={{ width: "100%", paddingTop: 8 }}>
            <AppFooter dark />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  );
}