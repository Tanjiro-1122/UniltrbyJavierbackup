import React, { createContext, useState, useContext, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  const [authError, setAuthError]             = useState(null);

  const checkAuth = () => {
    const userId    = localStorage.getItem("unfiltr_user_id");
    const authToken = localStorage.getItem("unfiltr_auth_token");
    const onboardingComplete = localStorage.getItem("unfiltr_onboarding_complete");

    if (userId && authToken) {
      setUser({ id: userId, email: localStorage.getItem("unfiltr_user_email") || "" });
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthError(null);
    } else if (onboardingComplete) {
      setIsLoadingAuth(false);
      setAuthError({ type: "logged_out" });
    } else {
      setIsLoadingAuth(false);
      setAuthError({ type: "new_user" });
    }
  };

  useEffect(() => { checkAuth(); }, []);

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
      checkAppState: checkAuth,
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
