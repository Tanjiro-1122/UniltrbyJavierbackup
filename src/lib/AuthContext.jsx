import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // App uses requiresAuth: false — no auth check needed on load
  // Auth loads instantly, no blocking spinner
  useEffect(() => {
    setIsLoadingAuth(false);
    setIsLoadingPublicSettings(false);
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      if (shouldRedirect) {
        base44.auth.logout(window.location.href);
      } else {
        base44.auth.logout();
      }
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  const navigateToLogin = () => {
    try {
      base44.auth.redirectToLogin(window.location.href);
    } catch (e) {
      console.warn('Redirect to login error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
