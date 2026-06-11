import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mic, MessageCircle } from "lucide-react";
import AppFooter from "@/components/AppFooter";
import AppShell from "@/components/shell/AppShell";

export default function HomePage() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(
    !!(
      localStorage.getItem("unfiltr_apple_user_id") &&
      localStorage.getItem("unfiltr_onboarding_complete") === "true"
    )
  );

  return (
    <AppShell tabs={false}>
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="flex flex-col items-center max-w-md px-4 pt-20 pb-12">
          <h1 className="text-4xl font-bold text-center mb-2">Unfiltr By Javier</h1>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-gold" />
            <Sparkles className="w-6 h-6 text-gold" />
            <Sparkles className="w-6 h-6 text-gold" />
          </div>
          <p className="text-center text-sm text-muted-foreground mb-6 max-w-xs">
            {hasSession
              ? `Welcome back — Luna missed you 497`
              : "Talk, vent, laugh, or just hang out. No judgement. Just a friend who gets you."
            }
          </p>
          <div className="flex gap-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate(hasSession ? "/chat" : "/onboarding")}
            >
              Continue chatting 496
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/about")}
            >
              About
            </button>
          </div>
        </div>
      </div>
      <AppFooter dark />
    </AppShell>
  );
}
