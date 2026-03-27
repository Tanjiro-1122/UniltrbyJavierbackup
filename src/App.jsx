import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import Support                from "./pages/Support";
import Welcome                from "./pages/Welcome";

const HIDE_TABS_ON = [
  "/onboarding", "/vibe", "/PinLock", "/PinSetup",
  "/AdminAvatarProcessor", "/AdminDashboard", "/FeedbackAdmin",
  "/PrivacyPolicy", "/TermsOfUse", "/welcome", "/age-verification", "/support",
  "/BackgroundSelect", "/journal/entry", "/journal/list", "/journal/splash",
];

const PUBLIC_PATHS = [
  "/age-verification", "/welcome", "/PrivacyPolicy",
  "/TermsOfUse", "/support", "/Pricing", "/onboarding",
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

const AuthenticatedApp = ({ splashDone }) => {
  const { isLoadingAuth, authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showTabs = !HIDE_TABS_ON.some(p => location.pathname.startsWith(p));
  const isPublicPath = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));

  // Step 1: Age gate — fires once after splash
  useEffect(() => {
    if (!splashDone) return;
    if (isPublicPath) return;
    const ageVerified = !!localStorage.getItem("unfiltr_age_verified");
    if (!ageVerified) {
      navigate("/age-verification", { replace: true });
    }
  }, [splashDone]); // eslint-disable-line

  // Step 2: Auth gate — fires once after splash + auth done, handles logout too
  useEffect(() => {
    if (!splashDone || isLoadingAuth) return;
    if (isPublicPath) return;
    if (authError?.type === "auth_required" || authError?.type === "logged_out") {
      navigate("/welcome", { replace: true });
      return;
    }
    // Authenticated returning user — check PIN
    if (!authError && !isLoadingAuth) {
      const pin = localStorage.getItem("unfiltr_pin");
      if (pin) {
        navigate("/PinLock", { replace: true });
      }
      // No PIN → stay on current route (/ = HomePage)
    }
  }, [splashDone, isLoadingAuth, authError?.type]); // eslint-disable-line

  // Don't render anything until splash is done AND auth check is complete
  if (!splashDone || isLoadingAuth) return null;

  if (authError?.type === "user_not_registered") return <UserNotRegisteredError />;

  return (
    <>
      <Routes>
        <Route path="/age-verification"      element={<AgeVerification />} />
        <Route path="/welcome"               element={<Welcome />} />
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
        <Route path="/onboarding"            element={<Onboarding />} />
        <Route path="/onboarding/name"       element={<OnboardingName />} />
        <Route path="/onboarding/consent"    element={<OnboardingConsent />} />
        <Route path="/onboarding/companion"  element={<OnboardingCompanion />} />
        <Route path="/onboarding/nickname"   element={<OnboardingNickname />} />
        <Route path="/onboarding/vibe"       element={<OnboardingVibe />} />
        <Route path="/onboarding/background" element={<OnboardingBackground />} />
        <Route path="/journal"               element={<Journal />} />
        <Route path="/journal/home"          element={<JournalHome />} />
        <Route path="/journal/splash"        element={<JournalSplash />} />
        <Route path="/journal/list"          element={<JournalList />} />
        <Route path="/journal/entry"         element={<JournalEntry />} />
        <Route path="/journal/entry/:id"     element={<JournalEntry />} />
        <Route path="/PrivacyPolicy"         element={<PrivacyPolicy />} />
        <Route path="/support"               element={<Support />} />
        <Route path="/TermsOfUse"            element={<TermsOfUse />} />
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
    </AuthProvider>
  );
}

export default App;
