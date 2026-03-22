import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import BottomTabs from "@/components/BottomTabs";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState } from "react";

// Pages
import HomePage               from "./pages/HomePage";
import VibePage               from "./pages/VibePage";
import ChatPage               from "./pages/ChatPage";
import ChatHistory            from "./pages/ChatHistory";
import Onboarding             from "./pages/Onboarding";
import Settings               from "./pages/Settings";
import Pricing                from "./pages/Pricing";
import Journal                from "./pages/Journal";
import JournalHome            from "./pages/JournalHome";
import JournalEntry           from "./pages/JournalEntry";
import JournalList            from "./pages/JournalList";
import JournalSplash          from "./pages/JournalSplash";
import FeedbackPage           from "./pages/FeedbackPage";
import PersonalityQuiz        from "./pages/PersonalityQuiz";
import PinLock                from "./pages/PinLock";
import PinSetup               from "./pages/PinSetup";
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
import AgeVerification        from "./pages/AgeVerification";
import Support                 from "./pages/Support";
import Welcome                from "./pages/Welcome";

// Pages where bottom tabs should NOT appear
const HIDE_TABS_ON = [
  "/onboarding", "/vibe", "/PinLock", "/PinSetup",
  "/AdminAvatarProcessor", "/AdminDashboard", "/FeedbackAdmin",
  "/PrivacyPolicy", "/TermsOfUse", "/welcome", "/age-verification", "/support",
  "/BackgroundSelect", "/journal/entry", "/journal/list", "/journal/splash",
];

// Force black background into safe areas
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
    let viewport = document.querySelector("meta[name=viewport]");
    if (viewport && !viewport.content.includes("viewport-fit=cover")) {
      viewport.content += ", viewport-fit=cover";
    }
  }, []);
  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const showTabs = !HIDE_TABS_ON.some(p => location.pathname.startsWith(p));

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#06020f" }}>
        <div className="w-8 h-8 border-4 border-purple-900 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Public routes bypass auth entirely
  const isPublicRoute = ["/age-verification", "/welcome", "/PrivacyPolicy", "/TermsOfUse", "/support", "/Pricing"].some(
    p => location.pathname === p || location.pathname.startsWith(p)
  );

  if (!isPublicRoute) {
    if (authError) {
      if (authError.type === "user_not_registered") return <UserNotRegisteredError />;
      if (authError.type === "auth_required") { navigateToLogin(); return null; }
    }
  }

  return (
    <>
      <Routes>
        {/* Pre-auth public pages — no login required */}
        <Route path="/age-verification"      element={<AgeVerification />} />
        <Route path="/welcome"               element={<Welcome />} />

        {/* Core */}
        <Route path="/"                      element={<HomePage />} />
        <Route path="/chat"                  element={<ChatPage />} />
        <Route path="/chat-history"          element={<ChatHistory />} />
        <Route path="/vibe"                  element={<VibePage />} />
        <Route path="/settings"              element={<Settings />} />
        <Route path="/Pricing"               element={<Pricing />} />
        <Route path="/feedback"              element={<FeedbackPage />} />
        <Route path="/BackgroundSelect"      element={<BackgroundSelect />} />
        <Route path="/PersonalityQuiz"       element={<PersonalityQuiz />} />
        <Route path="/PinLock"               element={<PinLock />} />
        <Route path="/PinSetup"              element={<PinSetup />} />

        {/* Onboarding - main + sub-steps */}
        <Route path="/onboarding"            element={<Onboarding />} />
        <Route path="/onboarding/name"       element={<OnboardingName />} />
        <Route path="/onboarding/consent"    element={<OnboardingConsent />} />
        <Route path="/onboarding/companion"  element={<OnboardingCompanion />} />
        <Route path="/onboarding/nickname"   element={<OnboardingNickname />} />
        <Route path="/onboarding/vibe"       element={<OnboardingVibe />} />
        <Route path="/onboarding/background" element={<OnboardingBackground />} />

        {/* Journal */}
        <Route path="/journal"               element={<Journal />} />
        <Route path="/journal/home"          element={<JournalHome />} />
        <Route path="/journal/splash"        element={<JournalSplash />} />
        <Route path="/journal/list"          element={<JournalList />} />
        <Route path="/journal/entry"         element={<JournalEntry />} />
        <Route path="/journal/entry/:id"     element={<JournalEntry />} />

        {/* Legal */}
        <Route path="/PrivacyPolicy"         element={<PrivacyPolicy />} />
        <Route path="/support"               element={<Support />} />
        <Route path="/TermsOfUse"            element={<TermsOfUse />} />

        {/* Admin */}
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
  const [showSplash, setShowSplash] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [ageVerified, setAgeVerified] = useState(
    () => !!localStorage.getItem("unfiltr_age_verified")
  );

  const handleSplashComplete = () => {
    setShowSplash(false);
    setSplashDone(true);
    // Re-check age verification when splash ends
    setAgeVerified(!!localStorage.getItem("unfiltr_age_verified"));
  };

  // Listen for age verification being set (from AgeVerification page)
  useEffect(() => {
    const onStorage = () => {
      setAgeVerified(!!localStorage.getItem("unfiltr_age_verified"));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("unfiltr_age_verified", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("unfiltr_age_verified", onStorage);
    };
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <SafeAreaFix />
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          {splashDone && !ageVerified && (
            <Navigate to="/age-verification" replace />
          )}
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
