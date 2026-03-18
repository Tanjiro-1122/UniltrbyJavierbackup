import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/shell/AppShell";
import FloatingParticles from "@/components/home/FloatingParticles";
import CompanionShowcase from "@/components/home/CompanionShowcase";
import FeaturePills from "@/components/home/FeaturePills";
import SocialProof from "@/components/home/SocialProof";

export default function HomePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const pid = localStorage.getItem("userProfileId");
          if (pid) {
            navigate("/vibe");
            return;
          }
          // Check if profile exists
          const user = await base44.auth.me();
          if (user) {
            const profiles = await base44.entities.UserProfile.filter({ created_by: user.email }, "-created_date", 1);
            if (profiles.length > 0) {
              localStorage.setItem("userProfileId", profiles[0].id);
              if (profiles[0].companion_id) {
                // Load companion data for chat
                try {
                  const comp = await base44.entities.Companion.get(profiles[0].companion_id);
                  if (comp) {
                    const { COMPANIONS, BACKGROUNDS } = await import("@/components/companionData");
                    const localComp = COMPANIONS.find(c => c.name.toLowerCase() === comp.name?.toLowerCase()) || COMPANIONS[0];
                    localStorage.setItem("unfiltr_companion", JSON.stringify(localComp));
                    const bg = BACKGROUNDS.find(b => b.id === profiles[0].background_id) || BACKGROUNDS[0];
                    localStorage.setItem("unfiltr_env", JSON.stringify(bg));
                  }
                } catch {}
              }
              navigate("/vibe");
              return;
            }
            // No profile — send to onboarding
            navigate("/onboarding");
            return;
          }
        }
      } catch {}
      setChecking(false);
    };
    check();
  }, []);

  if (checking) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#06020f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AppShell tabs={false}>
      <FloatingParticles />

      <div className="scroll-area" style={{
        flex: 1, minHeight: 0, overflowY: "auto",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "60px 24px 40px",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo / Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 28 }}
        >
          <h1 style={{
            fontSize: 36, fontWeight: 900, margin: "0 0 6px",
            background: "linear-gradient(135deg, #c084fc, #f0abfc, #a855f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px",
          }}>
            Unfiltr
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Your AI companion that actually<br />gets you. No filter needed.
          </p>
        </motion.div>

        {/* Companion showcase */}
        <CompanionShowcase />

        {/* Features */}
        <FeaturePills />

        {/* Social proof */}
        <SocialProof />

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}
        >
          <button
            onClick={() => base44.auth.redirectToLogin()}
            style={{
              width: "100%", padding: "16px 0", borderRadius: 999, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
              color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer",
              boxShadow: "0 4px 24px rgba(168,85,247,0.4)",
              letterSpacing: "0.3px",
            }}
          >
            Get Started — It's Free ✨
          </button>

          <button
            onClick={() => base44.auth.redirectToLogin()}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14,
              cursor: "pointer",
            }}
          >
            I already have an account
          </button>
        </motion.div>

        {/* Footer links */}
        <div style={{ display: "flex", gap: 16, marginTop: 24, marginBottom: 20 }}>
          <a href="/PrivacyPolicy" style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textDecoration: "none" }}>Privacy</a>
          <a href="/TermsOfUse" style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textDecoration: "none" }}>Terms</a>
        </div>
      </div>
    </AppShell>
  );
}