import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { clearEntitlements } from "@/lib/entitlements";

const AuthContext = createContext();

const PROFILE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  const [authError, setAuthError]             = useState(null);

  // UserProfile cache: { data, timestamp }
  const profileCache = useRef(null);

  const checkAuth = () => {
    const userId      = localStorage.getItem("unfiltr_user_id");
    const authToken   = localStorage.getItem("unfiltr_auth_token");
    const appleUserId = localStorage.getItem("unfiltr_apple_user_id");
    const onboardingComplete = localStorage.getItem("unfiltr_onboarding_complete");

    // Treat Apple Sign-In as authenticated (unfiltr_apple_user_id is set after sign-in).
    // Also accept legacy base44 SDK auth (unfiltr_user_id + unfiltr_auth_token).
    if (appleUserId || (userId && authToken)) {
      setUser({
        id:    userId || appleUserId,
        email: localStorage.getItem("unfiltr_user_email") ||
               localStorage.getItem("unfiltr_apple_email") || "",
      });
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

  useEffect(() => {
    checkAuth();
    // Re-check auth if another tab or onboarding flow sets localStorage
    const handler = () => checkAuth();
    window.addEventListener("storage", handler);
    window.addEventListener("unfiltr_auth_updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("unfiltr_auth_updated", handler);
    };
  }, []);

  /**
   * getCachedProfile — returns a cached UserProfile, refreshing if expired.
   * @param {string} profileId - The Base44 UserProfile record ID
   * @returns {Promise<Object|null>}
   */
  const getCachedProfile = async (profileId) => {
    if (!profileId) return null;
    const now = Date.now();
    if (profileCache.current && profileCache.current.id === profileId &&
        now - profileCache.current.timestamp < PROFILE_CACHE_TTL_MS) {
      return profileCache.current.data;
    }
    try {
      const profile = await base44.entities.UserProfile.get(profileId);
      profileCache.current = { id: profileId, data: profile, timestamp: now };
      return profile;
    } catch (e) {
      console.warn("[AuthContext] getCachedProfile failed:", e?.message);
      return profileCache.current?.data || null;
    }
  };

  /** Invalidate the profile cache (call after settings changes). */
  const invalidateProfileCache = () => {
    profileCache.current = null;
  };

  const logout = async () => {
    try { await base44.auth.logout(); } catch (e) {}
    profileCache.current = null;

    // Preserve apple_user_id and companion identity so chat history restores
    // instantly when the user signs back in. These are identifiers, not auth tokens.
    const appleUserId  = localStorage.getItem("unfiltr_apple_user_id");
    const companionId  = localStorage.getItem("unfiltr_companion_id");
    const companionRaw = localStorage.getItem("unfiltr_companion");
    const displayName  = localStorage.getItem("unfiltr_display_name");
    const profileId    = localStorage.getItem("userProfileId");

    // Clear actual auth tokens + session data
    localStorage.removeItem("unfiltr_auth_token");
    localStorage.removeItem("unfiltr_user_id");
    localStorage.removeItem("unfiltr_user_email");
    localStorage.removeItem("unfiltr_apple_email");
    localStorage.removeItem("unfiltr_google_user_id");
    localStorage.removeItem("unfiltr_chat_history");
    localStorage.removeItem("unfiltr_current_chat_db_id");

    // Clear premium/subscription flags so they don't survive to the next user on
    // a shared device. clearEntitlements() removes all canonical tier keys.
    clearEntitlements();

    // Restore identity anchor (apple_user_id only) so chat history can reload on next sign-in.
    // NOTE: Do NOT restore unfiltr_user_id here — checkAuth() uses it to determine
    // isAuthenticated, and restoring it would immediately re-authenticate the user after logout.
    if (appleUserId) {
      localStorage.setItem("unfiltr_apple_user_id", appleUserId);
      // unfiltr_user_id is intentionally NOT restored here
    }
    if (companionId)  localStorage.setItem("unfiltr_companion_id", companionId);
    if (companionRaw) localStorage.setItem("unfiltr_companion", companionRaw);
    if (displayName)  localStorage.setItem("unfiltr_display_name", displayName);
    if (profileId)    localStorage.setItem("userProfileId", profileId);

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
      getCachedProfile,
      invalidateProfileCache,
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

