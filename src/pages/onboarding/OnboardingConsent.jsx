import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Lock, ExternalLink, AlertTriangle, Eye } from "lucide-react";

export default function OnboardingConsent() {
  const navigate = useNavigate();
  const [aiConsent, setAiConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const allAgreed = aiConsent && privacyConsent;

  const handleNext = () => {
    if (!allAgreed) return;
    localStorage.setItem("unfiltr_consent_accepted", "true");
    localStorage.setItem("unfiltr_ai_consent", "true");
    navigate("/onboarding/pin");
  };

  return (
    <OnboardingLayout
      totalSteps={7}
      step={1}
      onBack={() => navigate("/home-screen")}
      onNext={handleNext}
      canAdvance={allAgreed}
      nextLabel="I agree — let's go →"
    >
      <div style={{
        padding: "0 20px 20px", width: "100%", maxWidth: "100%",
        boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14,
      }}>

        <div>
          <h2 style={{ color: "white", fontWeight: 900, fontSize: 26, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
            Before we begin
          </h2>
          <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: 0 }}>
            Please read and agree to the following
          </p>
        </div>

        {/* AI Data Disclosure — Apple 5.1.1 required */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 16, padding: 16,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Eye size={18} color="#f87171" />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>
                AI Data Sharing Disclosure
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
                To generate your companion's responses, <b style={{ color: "white" }}>your chat messages are sent to OpenAI's API</b>.
              </p>
              <ul style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5, lineHeight: 1.8, margin: "8px 0 0", paddingLeft: 16 }}>
                <li><b style={{ color: "rgba(255,255,255,0.85)" }}>What is sent:</b> Your text messages</li>
                <li><b style={{ color: "rgba(255,255,255,0.85)" }}>Who receives it:</b> OpenAI (openai.com)</li>
                <li><b style={{ color: "rgba(255,255,255,0.85)" }}>Why:</b> To generate AI responses</li>
                <li><b style={{ color: "rgba(255,255,255,0.85)" }}>OpenAI Privacy:</b> openai.com/privacy</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setAiConsent(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 0 0", width: "100%", textAlign: "left",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: aiConsent ? "linear-gradient(135deg, #7c3aed, #db2777)" : "rgba(255,255,255,0.08)",
              border: `1.5px solid ${aiConsent ? "transparent" : "rgba(255,255,255,0.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {aiConsent && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <p style={{ color: aiConsent ? "white" : "rgba(255,255,255,0.55)", fontSize: 12.5, margin: 0, lineHeight: 1.4 }}>
              I understand and <b>consent to my messages being sent to OpenAI</b> to generate AI responses.
            </p>
          </button>
        </motion.div>

        {/* Privacy & Terms */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 16, padding: 16,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Lock size={18} color="#22c55e" />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>
                Your Privacy & Data Rights
              </p>
              <ul style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5, lineHeight: 1.8, margin: 0, paddingLeft: 16 }}>
                <li>We <b style={{ color: "white" }}>never sell</b> your personal data</li>
                <li>Never shared with advertisers</li>
                <li>Delete your account & all data anytime</li>
                <li>Crisis messages may be flagged for your safety</li>
              </ul>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <a href="https://unfiltrbyjavier2.vercel.app/PrivacyPolicy" target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, padding: "9px 12px",
                background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 10, color: "#a78bfa", fontSize: 12, fontWeight: 600,
                textDecoration: "none", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
              <ExternalLink size={11} /> Privacy Policy
            </a>
            <a href="https://unfiltrbyjavier2.vercel.app/TermsOfUse" target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, padding: "9px 12px",
                background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 10, color: "#a78bfa", fontSize: 12, fontWeight: 600,
                textDecoration: "none", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
              <ExternalLink size={11} /> Terms of Use
            </a>
          </div>
          <button
            onClick={() => setPrivacyConsent(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer",
              padding: 0, width: "100%", textAlign: "left",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: privacyConsent ? "linear-gradient(135deg, #7c3aed, #db2777)" : "rgba(255,255,255,0.08)",
              border: `1.5px solid ${privacyConsent ? "transparent" : "rgba(255,255,255,0.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {privacyConsent && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <p style={{ color: privacyConsent ? "white" : "rgba(255,255,255,0.55)", fontSize: 12.5, margin: 0, lineHeight: 1.4 }}>
              I have read and agree to the <b>Privacy Policy</b> and <b>Terms of Use</b>.
            </p>
          </button>
        </motion.div>

        {/* Crisis note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 14, padding: "12px 14px",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            <b style={{ color: "#fbbf24" }}>Mental health emergency?</b> Call or text <b style={{ color: "white" }}>988</b> anytime. This app is not a substitute for professional help.
          </p>
        </motion.div>

        {/* Nudge if not all agreed yet */}
        {!allAgreed && (
          <p style={{
            color: "rgba(168,85,247,0.7)", fontSize: 12,
            textAlign: "center", margin: "4px 0 0",
            fontWeight: 600,
          }}>
            ☝️ Check both boxes above to continue
          </p>
        )}

      </div>
    </OnboardingLayout>
  );
}
