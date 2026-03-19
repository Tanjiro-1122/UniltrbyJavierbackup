import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { ShieldCheck, Lock, ExternalLink } from "lucide-react";

export default function OnboardingConsent() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleNext = () => {
    if (!agreed) return;
    localStorage.setItem("unfiltr_consent_accepted", "true");
    navigate("/onboarding/name");
  };

  return (
    <OnboardingLayout
      step={1}
      onBack={() => navigate("/onboarding")}
      onNext={handleNext}
      canAdvance={agreed}
      nextLabel="I agree — let's go →"
    >
      <div style={{ padding: "0 20px 20px", width: "100%", maxWidth: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
            Before we begin
          </h2>
          <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: 0 }}>
            A few things you should know
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 16, padding: 16,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={18} color="#a855f7" />
          </div>
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>
              How conversations work
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
              Your messages are processed by OpenAI's API to generate your companion's responses. This helps us provide thoughtful, personalized conversations.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 16, padding: 16,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={18} color="#22c55e" />
          </div>
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>
              Your data stays yours
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
              We never sell your data — period. Your conversations and personal information are never shared with advertisers or third parties.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ display: "flex", gap: 10 }}
        >
          <a
            href="https://unfiltrbyjavier.base44.app/PrivacyPolicy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 14, textDecoration: "none",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              color: "rgba(196,180,252,0.9)", fontSize: 13, fontWeight: 600,
            }}
          >
            Privacy Policy
            <ExternalLink size={13} style={{ opacity: 0.6 }} />
          </a>
          <a
            href="https://unfiltrbyjavier.base44.app/TermsOfUse"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 14, textDecoration: "none",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              color: "rgba(196,180,252,0.9)", fontSize: 13, fontWeight: 600,
            }}
          >
            Terms of Use
            <ExternalLink size={13} style={{ opacity: 0.6 }} />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setAgreed(!agreed)}
            style={{
              width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
              padding: "14px 16px", borderRadius: 14, cursor: "pointer",
              background: agreed ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${agreed ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)"}`,
              transition: "all 0.15s",
              textAlign: "left",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: `2px solid ${agreed ? "#a855f7" : "rgba(255,255,255,0.25)"}`,
              background: agreed ? "linear-gradient(135deg, #7c3aed, #db2777)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {agreed && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5 }}>
              I understand my conversations will be processed by OpenAI and I agree to the Privacy Policy and Terms of Use
            </span>
          </button>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
}