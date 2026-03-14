import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BottomTabs from '@/components/BottomTabs';
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
import FeedbackButton from './components/FeedbackButton';

// Pages where the bottom tab bar should NOT appear
const HIDE_TABS_ON = ["/onboarding", "/vibe", "/AdminAvatarProcessor", "/AdminDashboard", "/PrivacyPolicy", "/admin/feedback", "/feedback"];

// Pages where the floating feedback button should NOT appear
const HIDE_FEEDBACK_BTN_ON = ["/feedback", "/admin/feedback", "/onboarding"];

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