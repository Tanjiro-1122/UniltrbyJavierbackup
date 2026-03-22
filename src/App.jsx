import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BottomTabs from '@/components/BottomTabs';
import SplashScreen from '@/components/SplashScreen';
import HomePage from './pages/HomePage';
import VibePage from './pages/VibePage';
import ChatPage from './pages/ChatPage';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import AdminAvatarProcessor from './pages/AdminAvatarProcessor';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { useEffect, useState } from 'react';

// Pages where the bottom tab bar should NOT appear
const HIDE_TABS_ON = ["/onboarding", "/vibe", "/AdminAvatarProcessor", "/AdminDashboard", "/PrivacyPolicy"];

// ── Force black background into safe areas ────────────────────────────────────
function SafeAreaFix() {
  useEffect(() => {
    const color = '#06020f';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
    document.documentElement.style.background = color;
    document.documentElement.style.backgroundColor = color;
    document.body.style.background = color;
    document.body.style.backgroundColor = color;
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && !viewport.content.includes('viewport-fit=cover')) {
      viewport.content += ', viewport-fit=cover';
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

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <Routes>
        <Route path="/"                     element={<HomePage />} />
        <Route path="/onboarding"           element={<Onboarding />} />
        <Route path="/vibe"                 element={<VibePage />} />
        <Route path="/chat"                 element={<ChatPage />} />
        <Route path="/settings"             element={<Settings />} />
        <Route path="/AdminAvatarProcessor" element={<AdminAvatarProcessor />} />
        <Route path="/AdminDashboard"       element={<AdminDashboard />} />
        <Route path="/PrivacyPolicy"        element={<PrivacyPolicy />} />
        <Route path="*"                     element={<PageNotFound />} />
      </Routes>
      {showTabs && <BottomTabs />}
    </>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <SafeAreaFix />
          {showSplash && (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          )}
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
