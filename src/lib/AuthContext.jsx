import React, { createContext, useState, useContext, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  const [authError, setAuthError]             = useState(null);

  useEffect(() => {
    const userId    = localStorage.getItem("unfiltr_user_id");
    const authToken = localStorage.getItem("unfiltr_auth_token");
    const onboardingComplete = localStorage.getItem("unfiltr_onboarding_complete");

    if (userId && authToken) {
      // Returning authenticated user — go straight to home
      setUser({ id: userId, email: localStorage.getItem("unfiltr_user_email") || "" });
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } else if (onboardingComplete) {
      // Completed onboarding but lost token — send to welcome to re-auth
      setIsLoadingAuth(false);
      setAuthError({ type: "logged_out" });
    } else {
      // Brand new user — send to welcome screen (not straight to onboarding)
      setIsLoadingAuth(false);
      setAuthError({ type: "logged_out" });
    }
  }, []);

  const logout = async () => {
    try { await base44.auth.logout(); } catch (e) {}
    localStorage.removeItem("unfiltr_auth_token");
    localStorage.removeItem("unfiltr_user_id");
    localStorage.removeItem("unfiltr_user_email");
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: "logged_out" });
  };

  const navigateToLogin = () => {
    setAuthError({ type: "auth_required" });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      appPublicSettings: null,
      isLoadingPublicSettings: false,
      logout,
      navigateToLogin,
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
