import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import BottomTabs from "@/components/BottomTabs";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState } from "react";

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

const HIDE_TABS_ON = [
  "/onboarding", "/vibe",   "/AdminAvatarProcessor", "/AdminDashboard", "/FeedbackAdmin",
  "/PrivacyPolicy", "/TermsOfUse", "/home-screen", "/returning-screen", "/age-verification",
  "/support", "/BackgroundSelect",
  "/chat-enter", "/journal-enter", "/mood", "/hub", "/meditate",
  "/journal/immersive",
  "/journal/world", "/journal/splash",
  "/Pricing", "/chat", "/feedback", "/PersonalityQuiz",
  "/chat-history",
];

const PUBLIC_PATHS = [
  "/age-verification", "/home-screen", "/returning-screen", "/PrivacyPolicy",
  "/TermsOfUse", "/support", "/Pricing", "/onboarding",
  "/how-it-works", "/AdminDashboard", "/FeedbackAdmin", "/AdminAvatarProcessor",
];

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

// One-time recovery: if userProfileId is missing but display_name exists, find profile by name
function useProfileRecovery() {
  useEffect(() => {
    const profileId = localStorage.getItem("userProfileId");
    const displayName = localStorage.getItem("unfiltr_display_name");
    const onboardingDone = localStorage.getItem("unfiltr_onboarding_complete");
    if (profileId || !onboardingDone) return; // already set or not onboarded yet

    // Try to find profile by display_name
    (async () => {
      try {
        let profiles = [];
        if (displayName) {
          profiles = await base44.entities.UserProfile.filter({ display_name: displayName });
        }
        // If no match by name, grab the most recent profile (last resort)
        if (!profiles || profiles.length === 0) {
          const all = await base44.entities.UserProfile.list({ limit: 1, sort: "-created_date" });
          profiles = all || [];
        }
        if (profiles.length > 0) {
          const p = profiles[0];
          localStorage.setItem("userProfileId", p.id);
          localStorage.setItem("unfiltr_user_id", p.id);
          localStorage.setItem("unfiltr_auth_token", p.id);
          if (p.display_name) localStorage.setItem("unfiltr_display_name", p.display_name);
          if (p.companion_id) {
            localStorage.setItem("companionId", p.companion_id);
            localStorage.setItem("unfiltr_companion_id", p.companion_id);
          }
          window.dispatchEvent(new Event("unfiltr_auth_updated"));
          console.log("[Recovery] Profile restored:", p.id, p.display_name);
        }
      } catch (e) {
        console.warn("[Recovery] Could not restore profile:", e);
      }
    })();
  }, []);
}

const AuthenticatedApp = ({ splashDone }) => {
  useProfileRecovery();
  const { isAuthenticated, isLoadingAuth, authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showTabs = !HIDE_TABS_ON.some(p => location.pathname.startsWith(p));
  const isPublicPath = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));

  // Step 1: Age gate — always first
  useEffect(() => {
    if (!splashDone) return;
    if (isPublicPath) return;
    const ageVerified = !!localStorage.getItem("unfiltr_age_verified");
    if (!ageVerified) {
      navigate("/age-verification", { replace: true });
    }
  }, [splashDone, location.pathname]);

  // Step 2: Route based on auth + onboarding state
  useEffect(() => {
    if (!splashDone || isLoadingAuth) return;
    if (isPublicPath) return;
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
    if (authError?.type === "new_user" && !onboardingDone) {
      navigate("/home-screen", { replace: true });
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
        <Route path="/TermsOfUse"            element={<TermsOfUse />} />
        <Route path="/support"               element={<Support />} />

        {/* Onboarding */}
        <Route path="/onboarding"            element={<Navigate to="/onboarding/consent" replace />} />
        <Route path="/onboarding/consent"    element={<OnboardingConsent />} />
        <Route path="/onboarding/name"       element={<OnboardingName />} />
        <Route path="/onboarding/companion"  element={<OnboardingCompanion />} />
        <Route path="/onboarding/nickname"   element={<OnboardingNickname />} />
        <Route path="/onboarding/vibe"       element={<OnboardingVibe />} />
        <Route path="/onboarding/background" element={<OnboardingBackground />} />

        {/* PIN gate + splash transitions */}
        <Route path="/chat-enter"            element={<ChatEnter />} />
        <Route path="/mood"                  element={<MoodPicker />} />
        <Route path="/journal-enter"         element={<JournalEnter />} />

        {/* Main app */}
        <Route path="/"                      element={<HomePage />} />
        <Route path="/chat"                  element={<ChatPage />} />
        <Route path="/chat-history"          element={<ChatHistory />} />
        <Route path="/vibe"                  element={<VibePage />} />
        <Route path="/settings"              element={<Settings />} />
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
        <Route path="/journal/immersive"     element={<JournalImmersive />} />
        <Route path="/journal/entry/:id"     element={<JournalEntry />} />
        <Route path="/AdminAvatarProcessor"  element={<AdminAvatarProcessor />} />
        <Route path="/AdminDashboard"        element={<AdminDashboard />} />
        <Route path="/FeedbackAdmin"         element={<FeedbackAdmin />} />
        <Route path="*"                      element={<PageNotFound />} />
      </Routes>
      {showTabs && <BottomTabs />}
    </>
  );
};

function App() {
  // Only show splash on true first launch — skip if user already verified/onboarded
  const isFirstLaunch = !localStorage.getItem("unfiltr_age_verified") && !localStorage.getItem("unfiltr_onboarding_complete");
  const [showSplash, setShowSplash] = useState(isFirstLaunch);
  const [splashDone, setSplashDone] = useState(!isFirstLaunch);

  return (
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
  );
}

export default App;



