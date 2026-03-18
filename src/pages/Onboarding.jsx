import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import OnboardingTutorial from "@/components/OnboardingTutorial";

export default function Onboarding() {
  const [showTutorial, setShowTutorial] = useState(true);

  if (showTutorial) {
    return <OnboardingTutorial profileId={null} onComplete={() => setShowTutorial(false)} />;
  }

  return <Navigate to="/onboarding/vibe" replace />;
}
