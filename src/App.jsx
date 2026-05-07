import { hasPin } from "@/lib/pinHash";
import React from "react";
// build: 2026-04-08-2054
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import BottomTabs from "@/components/BottomTabs";
import SplashScreen from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import FeatureErrorBoundary from "@/components/FeatureErrorBoundary";
import { useStorageCleanup } from "@/hooks/useStorageCleanup";
import { useEffect, useState } from "react";
import { ensureBridgeInstalled } from "@/lib/nativeBridge";
import { runConfigChecks } from "@/lib/configCheck";
import useProfileRecovery from "@/hooks/useProfileRecovery";
import { motion, AnimatePresence } from "framer-motion";

import HomePage               from "./pages/HomePage";
import VibePage               from "./pages/VibePage";
import ChatPage               from "./pages/ChatPage";
import ChatHistory            from "./pages/ChatHistory";
import Settings               from "./pages/Settings";
import Pricing                from "./pages/Pricing";
import JournalHome            from "./pages/JournalHome";
import JournalEntry           from "./pages/JournalEntry";
import JournalList            from "./pages/JournalList";
import JournalSplash          from "./pages/JournalSplash";
import FeedbackPage           from "./pages/FeedbackPage";
import PersonalityQuiz        from "./pages/PersonalityQuiz";
import BackgroundSelect       from "./pages/BackgroundSelect";
import PrivacyPolicy          from "./pages/PrivacyPolicy";
import TermsOfUse             from "./pages/TermsOfUse";
import DeleteAccount         from "./pages/DeleteAccount";
import AdminAvatarProcessor   from "./pages/AdminAvatarProcessor";
import AdminDashboard         from "./pages/AdminDashboard";
import FeedbackAdmin          from "./pages/admin/FeedbackAdmin";
import OnboardingBackground   from "./pages/onboarding/OnboardingBackground";
import OnboardingCompanion    from "./pages/onboarding/OnboardingCompanion";
import OnboardingConsent      from "./pages/onboarding/OnboardingConsent";
import OnboardingName         from "./pages/onboarding/OnboardingName";
import OnboardingNickname     from "./pages/onboarding/OnboardingNickname";
import OnboardingVibe         from "./pages/onboarding/OnboardingVibe";
import OnboardingPin          from "./pages/onboarding/OnboardingPin";
import OnboardingMode         from "./pages/onboarding/OnboardingMode";
import AgeVerification        from "./pages/AgeVerification";
import Support                from "./pages/Support";
import HomeScreen             from "./pages/HomeScreen";
import ReturningScreen        from "./pages/ReturningScreen";
import ChatEnter              from "./pages/ChatEnter";
import MoodPicker             from "./pages/MoodPicker";
import JournalEnter           from "./pages/JournalEnter";
import JournalWorldPicker     from "./pages/JournalWorldPicker";
import JournalImmersive       from "./pages/JournalImmersive";
import HubPage               from "./pages/HubPage";
import { DebugPanel } from '@/components/DebugPanel';
import { base44 } from "@/api/base44Client";
import MeditatePage          from "./pages/MeditatePage";
import PinGate               from "./pages/PinGate";
import AdMaker               from "./pages/AdMaker";

const HIDE_TABS_ON = [
  "/onboarding", "/vibe",   "/AdminAvatarProcessor", "/AdminDashboard", "/FeedbackAdmin",
  "/PrivacyPolicy", "/TermsOfUse", "/DeleteAccount", "/home-screen", "/returning-screen", "/age-verification",
  "/support", "/BackgroundSelect",
  "/chat-enter", "/journal-enter", "/mood", "/hub", "/meditate",
  "/journal/immersive",
  "/journal/world", "/ad-maker", "/journal/splash",
  "/Pricing", "/chat", "/feedback", "/PersonalityQuiz",
  "/chat-history",
];

const PUBLIC_PATHS = [
  "/age-verification", "/home-screen", "/returning-screen", "/PrivacyPolicy",
  "/TermsOfUse", "/DeleteAccount", "/support", "/Pricing", "/onboarding",
  "/how-it-works", "/pin-gate",
];

// Admin routes bypass ALL auth/onboarding/age-gate redirects.
// They are guarded only by the AdminRoute component (admin code check).
const ADMIN_PATHS = ["/AdminDashboard", "/FeedbackAdmin", "/AdminAvatarProcessor"];

// ─── AdminRoute ───────────────────────────────────────────────────────────────
// Standalone admin gate: checks localStorage/sessionStorage for admin unlock.
// If not authenticated, renders an inline password prompt (same style as
// Settings.jsx handleAdminTap / handleCodeSubmit flow).
function AdminRoute({ children }) {
  const isUnlocked =
    localStorage.getItem("unfiltr_admin_unlocked") === "true" ||
    sessionStorage.getItem("unfiltr_admin_session") === "true";

  const [unlocked, setUnlocked]   = useState(isUnlocked);
  const [code, setCode]           = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/utils", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verifySpecialCode", code: code.trim() }),
      });
      if (!res.ok) {
        setError(res.status === 403 ? "Access blocked (403). Check your connection." : `Server error (${res.status}).`);
        setCode("");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.type === "admin") {
        localStorage.setItem("unfiltr_admin_unlocked", "true");
        sessionStorage.setItem("unfiltr_admin_session", "true");
        sessionStorage.setItem("unfiltr_admin_token", code.trim());
        setUnlocked(true);
      } else {
        setError("Invalid code.");
        setCode("");
      }
    } catch {
      setError("Network error — could not reach the server.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) return children;

  return (
    <div style={{ minHeight: "100vh", background: "#06020f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: "#0d0520", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 320 }}>
        <p style={{ color: "white", fontWeight: 700, fontSize: 18, textAlign: "center", margin: "0 0 8px" }}>🛡️ Admin Access</p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", margin: "0 0 20px" }}>Enter the admin code to unlock.</p>
        <input
          type="password"
          value={code}
          onChange={e => { setCode(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Admin code..."
          autoFocus
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", color: "white", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
        />
        {error && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 8px", textAlign: "center" }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
        >{loading ? "Verifying…" : "Unlock"}</button>
      </motion.div>
    </div>
  );
}

function SafeAreaFix() {
  useEffect(() => {
    const color = "#06020f";
    let meta = document.querySelector("meta[name=theme-color]");
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.content = color;
    document.documentElement.style.background = color;
    document.documentElement.style.backgroundColor = color;
    document.body.style.background = color;
    document.body.style.backgroundColor = color;
  }, []);
  return null;
}

// ─── Global Native Bridge ────────────────────────────────────────────────────
// Must be in App.jsx so it's always alive before any page component mounts.
// HomeScreen/ReturningScreen/IAP components chain onto window.__nativeBus.
// Smart resume: figures out where the user left off in onboarding
function OnboardingResume() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const consentDone = localStorage.getItem("unfiltr_consent_accepted") === "true";
    const nameDone    = !!localStorage.getItem("unfiltr_display_name");
    const companionId = localStorage.getItem("unfiltr_selected_companion_id") ||
                        localStorage.getItem("unfiltr_quiz_companion_id");
    const onboardingDone = localStorage.getItem("unfiltr_onboarding_complete") === "true";

    if (onboardingDone) {
      navigate("/hub", { replace: true });
    } else if (!consentDone) {
      navigate("/onboarding/consent", { replace: true });
    } else if (!nameDone) {
      navigate("/onboarding/name", { replace: true });
    } else if (!companionId) {
      navigate("/onboarding/companion", { replace: true });
    } else {
      // They picked a companion — restore to store then send to nickname or mode
      import("@/components/onboarding/useOnboardingStore").then(({ updateOnboardingStore }) => {
        updateOnboardingStore({ selectedCompanion: companionId });
      });
      // If nickname is already saved, skip to the mode step
      const nicknameDone = !!localStorage.getItem("unfiltr_companion_nickname");
      if (nicknameDone) {
        navigate("/onboarding/mode", { replace: true });
      } else {
        navigate("/onboarding/nickname", { replace: true });
      }
    }
  }, []);
  return null;
}

function useNativeBridge() {
  useEffect(() => {
    // Use the shared helper — installs exactly once (guarded by __rnBridgeInstalled).
    ensureBridgeInstalled();
    // Always ensure __nativeBus default exists so pages can safely chain onto it
    if (!window.__nativeBus) window.__nativeBus = () => {};
  }, []);
}

const AuthenticatedApp = ({ splashDone }) => {
  useProfileRecovery();
  useNativeBridge();
  useStorageCleanup();
  const { isAuthenticated, isLoadingAuth, authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showTabs = !HIDE_TABS_ON.some(p => location.pathname.startsWith(p));
  const isPublicPath = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some(p => location.pathname.startsWith(p));

  // Step 1: Age gate — always first
  useEffect(() => {
    if (!splashDone) return;
    if (isPublicPath || isAdminPath) return;
    const ageVerified = !!localStorage.getItem("unfiltr_age_verified");
    if (!ageVerified) {
      navigate("/age-verification", { replace: true });
    }
  }, [splashDone, location.pathname]);

  // Step 1.5: PIN gate — fires ONCE after splash, never again this session
  useEffect(() => {
    if (!splashDone) return;
    if (location.pathname === "/pin-gate") return; // already there
    if (location.pathname === "/ad-maker") return; // ad maker is admin-only, no PIN needed
    if (isPublicPath || isAdminPath) return;
    const ageVerified = !!localStorage.getItem("unfiltr_age_verified");
    if (!ageVerified) return;
    const onboardingDone = !!localStorage.getItem("unfiltr_onboarding_complete");
    if (!onboardingDone) return; // don't pin-gate new users
    const pinVerified = !!sessionStorage.getItem("pin_verified");
    if (!pinVerified && hasPin()) {
      navigate("/pin-gate?dest=app", { replace: true });
    }
  }, [splashDone]); // ← only runs once when splash completes, NOT on every nav


  // Step 2: Route based on auth + onboarding state
  useEffect(() => {
    if (!splashDone || isLoadingAuth) return;
    if (isPublicPath || isAdminPath) return;
    const ageVerified = !!localStorage.getItem("unfiltr_age_verified");
    if (!ageVerified) return;

    const onboardingDone = !!localStorage.getItem("unfiltr_onboarding_complete");
    const isLanding = location.pathname === "/home-screen" || location.pathname === "/returning-screen";

    if (authError?.type === "logged_out") {
      if (!onboardingDone) {
        navigate("/home-screen", { replace: true });
        return;
      }
      // Onboarding done — only redirect if they're on a landing/root page, not mid-session
      const activePaths = ["/chat", "/chat-enter", "/mood", "/journal", "/settings", "/vibe", "/feedback", "/Pricing"];
      const isActive = activePaths.some(p => location.pathname.startsWith(p));
      if (!isActive) {
        navigate("/returning-screen", { replace: true });
      }
      return;
    }
    // new_user but onboarding is done means they just finished — don't redirect back to home-screen
    // ALSO skip redirect if localStorage already has user_id — means sign-in just completed
    // but AuthContext hasn't re-run checkAuth yet (race condition after Apple Sign-In)
    if (authError?.type === "new_user" && !onboardingDone) {
      const justSignedIn = !!(
        localStorage.getItem("unfiltr_user_id") ||
        localStorage.getItem("unfiltr_apple_user_id")
      );
      if (!justSignedIn) {
        navigate("/home-screen", { replace: true });
        return;
      }
      // They just signed in — let the navigation from HomeScreen.jsx proceed uninterrupted
      return;
    }

    if (authError?.type === "auth_required") {
      const isOnAppPage = !["/", "/home-screen", "/returning-screen"].includes(location.pathname);
      if (!isOnAppPage) {
        navigate("/home-screen", { replace: true });
        return;
      }
    }

    if (!onboardingDone && (location.pathname === "/" || isLanding)) {
      navigate("/home-screen", { replace: true });
      return;
    }

    if (onboardingDone && isLanding) {
      navigate("/returning-screen", { replace: true });
    }
  }, [splashDone, isLoadingAuth, isAuthenticated, authError?.type]);

  if (!splashDone || isLoadingAuth) return null;
  if (authError?.type === "user_not_registered") return <UserNotRegisteredError />;

  return (
    <>
      <Routes>
        {/* Public / pre-auth */}
        <Route path="/age-verification"      element={<AgeVerification />} />
        <Route path="/home-screen"           element={<HomeScreen />} />
        <Route path="/returning-screen"      element={<ReturningScreen />} />
        <Route path="/PrivacyPolicy"         element={<PrivacyPolicy />} />
        <Route path="/DeleteAccount"         element={<DeleteAccount />} />
        <Route path="/TermsOfUse"            element={<TermsOfUse />} />
        <Route path="/support"               element={<Support />} />

        {/* Onboarding */}
        <Route path="/onboarding"            element={<OnboardingResume />} />
        <Route path="/onboarding/consent"    element={<OnboardingConsent />} />
        <Route path="/onboarding/pin"       element={<OnboardingPin />} />
        <Route path="/onboarding/name"       element={<OnboardingName />} />
        <Route path="/onboarding/companion"  element={<OnboardingCompanion />} />
        <Route path="/onboarding/nickname"   element={<OnboardingNickname />} />
        <Route path="/onboarding/quiz"       element={<PersonalityQuiz />} />
        <Route path="/onboarding/mode"       element={<OnboardingMode />} />
        <Route path="/onboarding/vibe"       element={<OnboardingVibe />} />
        <Route path="/onboarding/background" element={<OnboardingBackground />} />

        {/* PIN gate + splash transitions */}
        <Route path="/pin-gate"              element={<PinGate />} />
        <Route path="/chat-enter"            element={<ChatEnter />} />
        <Route path="/mood"                  element={<MoodPicker />} />
        <Route path="/journal-enter"         element={<JournalEnter />} />

        {/* Main app */}
        <Route path="/"                      element={<HomePage />} />
        <Route path="/chat"                  element={<FeatureErrorBoundary feature="Chat"><ChatPage /></FeatureErrorBoundary>} />
        <Route path="/chat-history"          element={<ChatHistory />} />
        <Route path="/vibe"                  element={<VibePage />} />
        <Route path="/settings"              element={<FeatureErrorBoundary feature="Settings"><Settings /></FeatureErrorBoundary>} />
        <Route path="/Pricing"               element={<Pricing />} />
        <Route path="/pricing"               element={<Pricing />} />
        <Route path="/feedback"              element={<FeedbackPage />} />
        <Route path="/BackgroundSelect"      element={<BackgroundSelect />} />
        <Route path="/hub"                      element={<HubPage />} />
        <Route path="/meditate"               element={<MeditatePage />} />
        <Route path="/PersonalityQuiz"       element={<PersonalityQuiz />} />
        <Route path="/journal"               element={<JournalSplash />} />
        <Route path="/journal/splash"        element={<JournalSplash />} />
        <Route path="/journal/home"          element={<JournalHome />} />
        <Route path="/journal/list"          element={<JournalList />} />
        <Route path="/journal/entry"         element={<JournalEntry />} />
        <Route path="/journal/world"         element={<JournalWorldPicker />} />
        <Route path="/journal/immersive"     element={<FeatureErrorBoundary feature="Journal"><JournalImmersive /></FeatureErrorBoundary>} />
        <Route path="/journal/entry/:id"     element={<JournalEntry />} />
        <Route path="/AdminAvatarProcessor"  element={<AdminRoute><AdminAvatarProcessor /></AdminRoute>} />
        <Route path="/AdminDashboard"        element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/FeedbackAdmin"         element={<AdminRoute><FeedbackAdmin /></AdminRoute>} />
        <Route path="/ad-maker"              element={<AdMaker />} />
        <Route path="*"                      element={<PageNotFound />} />
      </Routes>
      {showTabs && <BottomTabs />}
    </>
  );
};

function App() {
  // Run config sanity checks once at startup (warns only, never fatal)
  React.useEffect(() => { runConfigChecks(); }, []);

  // Ensure a stable anonymous identifier exists before Apple Sign-In completes.
  // ChatPage and ChatHistory both use apple_user_id || device_id, so without this
  // users who haven't completed Apple Sign-In would silently drop all history saves.
  // Use crypto.getRandomValues for a cryptographically strong identifier.
  if (!localStorage.getItem("unfiltr_apple_user_id") && !localStorage.getItem("unfiltr_device_id")) {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    const hex   = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem("unfiltr_device_id", "device_" + hex);
  }

  // Only show splash on true first launch — skip if user already verified/onboarded
  const isFirstLaunch = !localStorage.getItem("unfiltr_age_verified") && !localStorage.getItem("unfiltr_onboarding_complete");
  const [showSplash, setShowSplash] = useState(isFirstLaunch);
  const [splashDone, setSplashDone] = useState(!isFirstLaunch);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <SafeAreaFix />
            {showSplash && (
              <SplashScreen onComplete={() => {
                setShowSplash(false);
                setSplashDone(true);
              }} />
            )}
            <AuthenticatedApp splashDone={splashDone} />
          </Router>
          <Toaster />
        </QueryClientProvider>
        <DebugPanel />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
