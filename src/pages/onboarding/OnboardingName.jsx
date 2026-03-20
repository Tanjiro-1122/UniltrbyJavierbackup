import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

export default function OnboardingName() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [displayName, setDisplayName] = useState(store.displayName);

  // Must consent before entering name
  if (!localStorage.getItem("unfiltr_consent_accepted")) {
    navigate("/onboarding/consent", { replace: true });
    return null;
  }

  const handleNameChange = (val) => {
    setDisplayName(val);
    updateOnboardingStore({ displayName: val });
  };

  const handleNext = async () => {
    if (!displayName.trim()) return;
    updateOnboardingStore({ displayName });

    try {
      if (store.pendingProfileId) {
        await base44.entities.UserProfile.update(store.pendingProfileId, { display_name: displayName });
      } else {
        const profile = await base44.entities.UserProfile.create({
          display_name: displayName,
          companion_id: "pending",
          background_id: "pending",
        });
        updateOnboardingStore({ pendingProfileId: profile.id });
        localStorage.setItem("userProfileId", profile.id);
      }
    } catch { /* non-blocking */ }

    navigate("/onboarding/companion");
  };

  return (
    <OnboardingLayout
      step={2}
      onBack={() => navigate("/onboarding/consent")}
      onNext={handleNext}
      canAdvance={displayName.trim().length > 0}
    >
      <div style={{ flexShrink: 0, padding: "8px 20px 16px", display: "flex", flexDirection: "column", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
          What's your name?
        </h2>
        <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: "0 0 14px" }}>
          This is what your companion will call you.
        </p>
        <input
          type="text"
          value={displayName}
          onChange={e => handleNameChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleNext()}
          placeholder="Enter display name"
          autoFocus
          style={{
            width: "100%", maxWidth: "100%", boxSizing: "border-box",
            padding: "14px 16px", borderRadius: 18,
            border: "1px solid rgba(139,92,246,0.2)",
            background: "rgba(139,92,246,0.1)", color: "white",
            fontSize: 16, outline: "none", caretColor: "#a855f7",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.6)"}
          onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.2)"}
        />
        {isTester && (
          <div style={{
            marginTop: 10, padding: "8px 14px", borderRadius: 12,
            background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <span style={{ color: "rgba(196,180,252,0.9)", fontSize: 13 }}>
              <strong style={{ color: "#c084fc" }}>Premium Demo Account</strong> — full access enabled
            </span>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}