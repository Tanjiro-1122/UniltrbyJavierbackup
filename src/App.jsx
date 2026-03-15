import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BottomTabs from '@/components/BottomTabs';
import Layout from '@/Layout';
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
import FeedbackButton from './components/FeedbackButton';

// Pages where the bottom tab bar should NOT appear
const HIDE_TABS_ON = [
  "/onboarding", "/vibe", "/chat",
  "/AdminAvatarProcessor", "/AdminDashboard",
  "/PrivacyPolicy", "/admin/feedback", "/feedback"
];

// Pages where the floating feedback button should NOT appear
const HIDE_FEEDBACK_BTN_ON = [
  "/feedback", "/admin/feedback", "/onboarding", "/vibe", "/chat"
];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  const showTabs = !HIDE_TABS_ON.some(p => location.pathname.startsWith(p));
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

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/vibe" element={<VibePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/AdminAvatarProcessor" element={<AdminAvatarProcessor />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/Pricing" element={<Pricing />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/admin/feedback" element={<FeedbackAdmin />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      {showTabs && <BottomTabs />}
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