import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import TopTabs from '@/components/TopTabs';
import Layout from '@/Layout';
import HomePage from './pages/HomePage';
import VibePage from './pages/VibePage';
import ChatPage from './pages/ChatPage';
import Onboarding from './pages/Onboarding';
import OnboardingName from './pages/onboarding/OnboardingName';
import OnboardingCompanion from './pages/onboarding/OnboardingCompanion';
import OnboardingNickname from './pages/onboarding/OnboardingNickname';
import OnboardingBackground from './pages/onboarding/OnboardingBackground';
import OnboardingVibe from './pages/onboarding/OnboardingVibe';
import OnboardingConsent from './pages/onboarding/OnboardingConsent';
import Settings from './pages/Settings';
import AdminAvatarProcessor from './pages/AdminAvatarProcessor';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import FeedbackPage from './pages/FeedbackPage';
import FeedbackAdmin from './pages/admin/FeedbackAdmin';
import Pricing from './pages/Pricing';
import BackgroundSelect from './pages/BackgroundSelect';
import FeedbackButton from './components/FeedbackButton';
import JournalSplash from './pages/JournalSplash';
import JournalHome from './pages/JournalHome';
import JournalEntry from './pages/JournalEntry';
import JournalList from './pages/JournalList';
import ChatHistory from './pages/ChatHistory';
import PersonalityQuiz from './pages/PersonalityQuiz';
import PinSetup from './pages/PinSetup';
import PinLock from './pages/PinLock';

// Pages where the bottom tab bar should NOT appear
const HIDE_TABS_ON = [
  "/onboarding",
  "/background",
  "/HomePage", "/",
  "/AdminAvatarProcessor", "/AdminDashboard",
  "/PrivacyPolicy", "/TermsOfUse", "/admin/feedback", "/feedback",
  "/Pricing",
  "/chat",
  "/vibe",
  "/background",
  "/journal-splash",
  "/journal",
  "/journal-entry",
  "/journal-list",
  "/ChatHistory",
  "/PersonalityQuiz",
  "/pin-setup",
  "/pin-lock"
];

// Pages where the floating feedback button should NOT appear
const HIDE_FEEDBACK_BTN_ON = [
  "/feedback", "/admin/feedback", "/onboarding", "/vibe", "/chat", "/HomePage", "/", "/journal-splash", "/journal", "/journal-entry", "/journal-list", "/ChatHistory", "/PersonalityQuiz", "/pin-setup", "/pin-lock"
];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  const showTabs = !HIDE_TABS_ON.some(p => p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));
  const showFeedbackBtn = !HIDE_FEEDBACK_BTN_ON.some(p => location.pathname.startsWith(p));

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#06020f',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid rgba(168,85,247,0.3)',
          borderTopColor: '#a855f7',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  // ── PIN LOCK CHECK ──
  const savedPin = localStorage.getItem("unfiltr_pin");
  const lastActive = localStorage.getItem("unfiltr_last_active");
  const isPinPage = location.pathname === "/pin-lock" || location.pathname === "/pin-setup";
  const isLocked = (() => {
    if (!savedPin || isPinPage) return false;
    if (!lastActive) return true;
    const minutesInactive = (Date.now() - parseInt(lastActive)) / 1000 / 60;
    return minutesInactive > 5;
  })();

  React.useEffect(() => {
    if (!savedPin) return;
    const interval = setInterval(() => {
      localStorage.setItem("unfiltr_last_active", Date.now().toString());
    }, 30000);
    return () => clearInterval(interval);
  }, [savedPin]);

  if (isLocked) {
    return (
      <Routes>
        <Route path="*" element={<PinLock />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/name" element={<OnboardingName />} />
        <Route path="/onboarding/companion" element={<OnboardingCompanion />} />
        <Route path="/onboarding/nickname" element={<OnboardingNickname />} />
        <Route path="/onboarding/vibe" element={<OnboardingVibe />} />
        <Route path="/onboarding/background" element={<OnboardingBackground />} />
        <Route path="/onboarding/consent" element={<OnboardingConsent />} />
        <Route path="/vibe" element={<VibePage />} />
        <Route path="/background" element={<BackgroundSelect />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/AdminAvatarProcessor" element={<AdminAvatarProcessor />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/TermsOfUse" element={<TermsOfUse />} />
        <Route path="/Pricing" element={<Pricing />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/journal-splash" element={<JournalSplash />} />
        <Route path="/journal" element={<JournalHome />} />
        <Route path="/journal-entry" element={<JournalEntry />} />
        <Route path="/journal-list" element={<JournalList />} />
        <Route path="/ChatHistory" element={<ChatHistory />} />
        <Route path="/PersonalityQuiz" element={<PersonalityQuiz />} />
        <Route path="/pin-setup" element={<PinSetup />} />
        <Route path="/pin-lock" element={<PinLock />} />
        <Route path="/admin/feedback" element={<FeedbackAdmin />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      {showTabs && <TopTabs />}
      {showFeedbackBtn && <FeedbackButton />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Layout>
          <Router>
            <AuthenticatedApp />
          </Router>
        </Layout>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;