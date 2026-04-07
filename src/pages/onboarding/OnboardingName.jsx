// v2 — skip removed, flow fixed 2026-04-07
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { getOnboardingStore, updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

export default function OnboardingName() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [displayName, setDisplayName] = useState(store.displayName || localStorage.getItem("unfiltr_display_name") || "");

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

    // Tester accounts — Apple/Google review + admin
    const trimmedLower = displayName.trim().toLowerCase();
    const isTester = trimmedLower === "demo" || trimmedLower === "javier 1122";
    updateOnboardingStore({ displayName, isTesterAccount: isTester });

    try {
      // Prefer the profileId set by HomeScreen after Apple Sign-In
      const storedProfileId = store.pendingProfileId || localStorage.getItem("userProfileId");
      const appleId = localStorage.getItem("unfiltr_apple_user_id") || null;

      if (storedProfileId) {
        // Profile already exists — just update the display name via server-side API
        await fetch("/api/syncProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            profileId: storedProfileId,
            updateData: { display_name: displayName },
          }),
        });
        updateOnboardingStore({ pendingProfileId: storedProfileId });
      } else if (appleId && !appleId.startsWith("anonymous")) {
        // No stored ID — use server-side sync to find or create (prevents duplicates)
        const res = await fetch("/api/syncProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync",
            appleUserId: appleId,
            fullName: displayName,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          const pid = result.data?.profileId;
          if (pid) {
            // Update display_name on the found/created profile
            await fetch("/api/syncProfile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "update", profileId: pid, updateData: { display_name: displayName } }),
            });
            updateOnboardingStore({ pendingProfileId: pid });
            localStorage.setItem("userProfileId", pid);
          }
        }
      } else {
        // Dev/browser mode — create via SDK (no Apple ID available)
        const profile = await base44.entities.UserProfile.create({
          display_name: displayName,
          companion_id: "pending",
          background_id: "pending",
        });
        updateOnboardingStore({ pendingProfileId: profile.id });
        localStorage.setItem("userProfileId", profile.id);
      }
    } catch { /* non-blocking */ }

    navigate("/onboarding/quiz");
  };

  return (
    <OnboardingLayout
      totalSteps={7}
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
      </div>
    </OnboardingLayout>
  );
}
