import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COMPANIONS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

export default function OnboardingNickname() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [nickname, setNickname] = useState(store.companionNickname);

  if (!store.selectedCompanion) {
    navigate("/onboarding/companion", { replace: true });
    return null;
  }

  const companion = COMPANIONS.find(c => c.id === store.selectedCompanion);

  const handleNext = () => {
    updateOnboardingStore({ companionNickname: nickname });
    navigate("/onboarding/vibe");
  };

  return (
    <OnboardingLayout
      step={5}
      onBack={() => navigate("/onboarding/companion")}
      onNext={handleNext}
      canAdvance={true}
    >
      <div style={{ flexShrink: 0, padding: "16px 20px 16px", display: "flex", flexDirection: "column", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 6px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
          Name your companion
        </h2>
        <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: "0 0 20px" }}>
          Give them a nickname — or keep their real name.
        </p>

        {companion && (
          <div style={{
            display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
            padding: "14px 16px", borderRadius: 18,
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
          }}>
            <img src={companion.avatar} alt={companion.name} style={{ width: 60, height: 60, objectFit: "contain" }} />
            <div>
              <p style={{ color: "white", fontWeight: 700, margin: "0 0 2px" }}>{companion.name}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>{companion.tagline}</p>
            </div>
          </div>
        )}

        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleNext()}
          placeholder={`Default: ${companion?.name || "companion"}`}
          maxLength={20}
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
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", margin: "10px 0 0" }}>
          Leave blank to use their default name
        </p>
      </div>
    </OnboardingLayout>
  );
}