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

// Session recovery: if userProfileId is missing but apple_user_id is in localStorage,
// look up the profile by apple_user_id and restore the session.
function useProfileRecovery() {
  useEffect(() => {
    const profileId   = localStorage.getItem("userProfileId");
    const appleUserId = localStorage.getItem("unfiltr_apple_user_id");
    if (profileId) return; // already restored
    if (!appleUserId) return; // no apple id — user needs to sign in

    (async () => {
      try {
        const B44_APP = "69b332a392004d139d4ba495";
        const TOKEN   = "1156284fb9144ad9ab95afc962e848d8";
        const res = await fetch(
          `https://base44.app/api/apps/${B44_APP}/entities/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
          { headers: { "Authorization": `Bearer ${TOKEN}` } }
        );
        const data = await res.json();
        const records = Array.isArray(data) ? data : (data?.records || []);
        const p = records[0];
        if (p) {
          localStorage.setItem("userProfileId", p.id);
          if (p.display_name) localStorage.setItem("unfiltr_display_name", p.display_name);
          if (p.onboarding_complete) localStorage.setItem("unfiltr_onboarding_complete", "true");
          if (p.companion_id && p.companion_id !== "pending") {
            localStorage.setItem("companionId", p.companion_id);
            localStorage.setItem("unfiltr_companion_id", p.companion_id);
          }
          if (p.is_premium || p.annual_plan) {
            localStorage.setItem("unfiltr_is_premium", "true");
            localStorage.setItem("unfiltr_plan", p.annual_plan ? "annual_plan" : "pro_plan");
          }
          window.dispatchEvent(new Event("unfiltr_auth_updated"));
          console.log("[Recovery] Profile restored via apple_user_id:", p.id, p.display_name);
        }
      } catch (e) {
        console.warn("[Recovery] Could not restore profile:", e.message);
      }
    })();
  }, []);
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
      // They picked a companion — restore to store then send to nickname/vibe
      import("@/components/onboarding/useOnboardingStore").then(({ updateOnboardingStore }) => {
        updateOnboardingStore({ selectedCompanion: companionId });
      });
      navigate("/onboarding/nickname", { replace: true });
    }
  }, []);
  return null;
}

function useNativeBridge() {
  useEffect(() => {
    window.onMessageFromRN = (jsonStr) => {
      try {
        const msg = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        // 1. Route to __nativeBus (HomeScreen, ReturningScreen, etc.)
        if (typeof window.__nativeBus === 'function') {
          window.__nativeBus(msg);
        }
        // 2. Route to _rnMessageHandlers (useAppleSubscriptions IAP hook)
        if (window._rnMessageHandlers && window._rnMessageHandlers[msg.type]) {
          window._rnMessageHandlers[msg.type].forEach(fn => { try { fn(msg); } catch(e) {} });
        }
        // 3. Dispatch as window event for any legacy listeners
        window.dispatchEvent(new MessageEvent('message', { data: msg }));
      } catch (e) {
        console.warn('[Bridge] Parse error:', e.message, String(jsonStr).slice(0, 100));
      }
    };
  }, []);
}

const AuthenticatedApp = ({ splashDone }) => {
  useProfileRecovery();
  useNativeBridge();
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
    // ALSO skip redirect if localStorage already has user_id — means sign-in just completed
    // but AuthContext hasn't re-run checkAuth yet (race condition after Apple Sign-In)
    if (authError?.type === "new_user" && !onboardingDone) {
      const justSignedIn = !!localStorage.getItem("unfiltr_user_id");
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
