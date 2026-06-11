import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mic, MessageCircle } from "lucide-react";
import AppFooter from "@/components/AppFooter";
import AppShell from "@/components/shell/AppShell";

const canUseStorage = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function getCompanionName() {
  if (!canUseStorage) return null;
  try {
    const p = JSON.parse(localStorage.getItem("unfiltr_companion"));
    return p.displayName || p.name || null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(
      canUseStorage &&
      !!localStorage.getItem("unfiltr_apple_user_id") &&
      localStorage.getItem("unfiltr_onboarding_complete") === "true"
    );
  }, []);

  const companionName = getCompanionName() || "Luna";
  const welcomeText = hasSession
    ? `Welcome back — ${companionName} missed you 💜`
    : "Talk, vent, laugh, or just hang out. No judgement. Just a friend who gets you.";

  return (
    <AppShell>
      <main className="flex flex-col flex-grow items-center justify-center px-4">
        <Sparkles className="mb-4 h-8 w-8 text-gold" />
        <p className="mb-6 max-w-xs text-center text-sm text-white/70">{welcomeText}</p>
        <div className="flex gap-4">
          <button
            className="flex items-center gap-2 rounded bg-gold px-4 py-2 font-semibold text-black hover:bg-gold/90"
            onClick={() => {
              window.location.href = "/chat";
            }}
          >
            <MessageCircle className="h-5 w-5" />
            Continue chatting
          </button>
          <button
            className="flex items-center gap-2 rounded border border-white/20 px-4 py-2 font-semibold text-white hover:bg-white/10"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            <Mic className="h-5 w-5" />
            Voice input
          </button>
        </div>
      </main>
      <AppFooter />
    </AppShell>
  );
}
