import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError]         = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
    }).catch(() => {
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
      if (!session?.user) setAuthError(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // NO window.location calls here — App.jsx handles all navigation via React Router
  const logout = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setIsAuthenticated(false);
    // Signal App.jsx to navigate
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
