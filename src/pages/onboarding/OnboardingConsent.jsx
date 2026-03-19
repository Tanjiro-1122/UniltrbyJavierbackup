import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, resetOnboardingStore } from "@/components/onboarding/useOnboardingStore";
import { ShieldCheck, Lock, ExternalLink } from "lucide-react";

export default function OnboardingConsent() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!store.selectedBackground) {
    navigate("/onboarding/background", { replace: true });
    return null;
  }

  const handleFinish = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      const companionData = COMPANIONS.find(c => c.id === store.selectedCompanion);
      const companion = await base44.entities.Companion.create({
        name: companionData.name,
        avatar_url: companionData.avatar,
        mood_mode: "neutral",
        personality: companionData.tagline,
      });

      const profileData = {
        display_name: store.displayName,
        companion_id: companion.id,
        background_id: store.selectedBackground,
        premium: store.isTesterAccount,
        is_premium: store.isTesterAccount,
        session_memory: store.isTesterAccount ? [{
          date: "Mar 14, 2026",
          summary: "This is a demo account for app review. The user wanted to explore all premium features including companion memory, unlimited messages, and voice responses.",
        }] : [],
      };

      let userProfile;
      if (store.pendingProfileId) {
        userProfile = await base44.entities.UserProfile.update(store.pendingProfileId, profileData);
      } else {
        userProfile = await base44.entities.UserProfile.create(profileData);
      }

      localStorage.setItem("userProfileId", userProfile.id);
      localStorage.setItem("companionId", companion.id);

      const finalName = store.companionNickname.trim() || companionData.name;
      localStorage.setItem("unfiltr_companion_nickname", store.companionNickname.trim());
      localStorage.setItem("unfiltr_companion", JSON.stringify({
        id: companionData.id,
        name: companionData.name,
        displayName: finalName,
        systemPrompt: `You are ${finalName}, a supportive AI companion. ${companionData.tagline}`,
      }));

      const bg = BACKGROUNDS.find(b => b.id === store.selectedBackground);
      localStorage.setItem("unfiltr_env", JSON.stringify({
        id: bg.id, label: bg.label, bg: bg.url,
      }));

      localStorage.setItem("unfiltr_consent_accepted", "true");
      resetOnboardingStore();
      navigate("/vibe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={5}
      onBack={() => navigate("/onboarding/background")}
      onNext={handleFinish}
      canAdvance={agreed}
      loading={loading}
      nextLabel={loading ? "Setting up…" : "Enter this world →"}
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

        {/* Card 1 — OpenAI processing */}
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

        {/* Card 2 — Data privacy */}
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

        {/* Links */}
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

        {/* Checkbox */}
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