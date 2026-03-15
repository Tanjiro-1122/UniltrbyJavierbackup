import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BottomTabs from '@/components/BottomTabs';
import SplashScreen from '@/components/SplashScreen';
import { base44 } from '@/api/base44Client';
import HomePage from './pages/HomePage';
import VibePage from './pages/VibePage';
import ChatPage from './pages/ChatPage';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import AdminAvatarProcessor from './pages/AdminAvatarProcessor';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FeedbackPage from './pages/FeedbackPage';
import FeedbackAdmin from './pages/admin/FeedbackAdmin';
import Pricing from './pages/Pricing';
import FeedbackButton from '@/components/FeedbackButton';

// Pages where the bottom tab bar should NOT appear
const HIDE_TABS_ON = ["/onboarding", "/vibe", "/AdminAvatarProcessor", "/AdminDashboard", "/PrivacyPolicy", "/admin/feedback", "/feedback"];

// Pages where the floating feedback button should NOT appear
const HIDE_FEEDBACK_BTN_ON = ["/feedback", "/admin/feedback", "/onboarding", "/vibe", "/ChatPage"];

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileChecked, setProfileChecked] = useState(false);

  const showTabs = !HIDE_TABS_ON.some(p => location.pathname.startsWith(p));
  const showFeedbackBtn = !HIDE_FEEDBACK_BTN_ON.some(p => location.pathname.startsWith(p));

  // On app load, check if user already has a profile — if so, skip onboarding
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profiles = await base44.entities.UserProfile.list();
        if (profiles && profiles.length > 0) {
          const profile = profiles[0];
          // Restore localStorage so the rest of the app works
          localStorage.setItem("userProfileId", profile.id);
          if (profile.companion_id) {
            localStorage.setItem("companionId", profile.companion_id);
          }
          // If user lands on onboarding or root, redirect to home
          if (location.pathname === "/onboarding" || location.pathname === "/") {
            navigate("/", { replace: true });
          }
        }
      } catch {
        // No profile found — onboarding flow will handle creation
      } finally {
        setProfileChecked(true);
      }
    };

    if (!authError) {
      checkProfile();
    } else {
      setProfileChecked(true);
    }
  }, []);

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  if (!profileChecked) return null;

  return (
    <>
      <Routes>
        <Route path="/"                     element={<HomePage />} />
        <Route path="/onboarding"           element={<Onboarding />} />
        <Route path="/vibe"                 element={<VibePage />} />
        <Route path="/ChatPage"             element={<ChatPage />} />
        <Route path="/settings"             element={<Settings />} />
        <Route path="/AdminAvatarProcessor" element={<AdminAvatarProcessor />} />
        <Route path="/AdminDashboard"       element={<AdminDashboard />} />
        <Route path="/PrivacyPolicy"        element={<PrivacyPolicy />} />
        <Route path="/Pricing"              element={<Pricing />} />
        <Route path="/feedback"             element={<FeedbackPage />} />
        <Route path="/admin/feedback"       element={<FeedbackAdmin />} />
        <Route path="*"                     element={<PageNotFound />} />
      </Routes>

      {showTabs && <BottomTabs />}
      {showFeedbackBtn && <FeedbackButton />}
    </>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;