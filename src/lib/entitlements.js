/**
 * entitlements.js
 * Single source of truth for tier/plan detection and identity reset.
 *
 * Tier hierarchy (highest → lowest):
 *   annual  – Annual plan ($59.99/yr)  → unlimited history, unlimited messages
 *   pro     – Pro plan   ($14.99/mo)  → 100 history, 200 msg/day
 *   plus    – Monthly    ($9.99/mo)   → 20 history, 100 msg/day
 *   free    – No plan                 → 2 history, 20 msg/day
 */

// ─── Plan constants ───────────────────────────────────────────────────────────

export const HISTORY_LIMITS = { free: 2, plus: 20, pro: 100, annual: 9999 };

export const DAILY_MSG_LIMITS = { free: 20, plus: 100, pro: 200, annual: 99999 };

/** Human-readable label shown in UI (e.g. badge in Settings header) */
export const PLAN_LABELS = {
  free:   "Free",
  plus:   "Premium (Monthly)",
  pro:    "Pro",
  annual: "Annual",
};

// ─── Tier detection ───────────────────────────────────────────────────────────

/**
 * Derive the current user's tier from localStorage flags.
 * Reads the three canonical flags: unfiltr_is_annual, unfiltr_is_pro,
 * unfiltr_is_premium (plus family-unlock / msg-override admin flags).
 *
 * @returns {"annual"|"pro"|"plus"|"free"}
 */
export function getTier() {
  if (
    localStorage.getItem("unfiltr_family_unlock") === "true" ||
    localStorage.getItem("unfiltr_msg_limit_override") === "true"
  ) return "annual";
  if (localStorage.getItem("unfiltr_is_annual")  === "true") return "annual";
  if (localStorage.getItem("unfiltr_is_pro")     === "true") return "pro";
  if (localStorage.getItem("unfiltr_is_premium") === "true") return "plus";
  return "free";
}

/**
 * Returns the user-facing plan label for the current tier.
 * e.g. "Premium (Monthly)", "Pro", "Annual", "Free"
 */
export function getPlanLabel() {
  return PLAN_LABELS[getTier()];
}

// ─── Entitlement refresh from DB profile ─────────────────────────────────────

/**
 * Write all three canonical premium flags to localStorage from a DB
 * UserProfile object.  Call this after sign-in, restore-purchase, and
 * any profile fetch so every page sees a consistent state.
 *
 * @param {object} profile – UserProfile record from the database
 */
export function refreshEntitlements(profile) {
  if (!profile) return;
  const isAnnual  = !!(profile.annual_plan);
  const isPro     = !!(profile.pro_plan);
  const isPremium = !!(profile.is_premium || profile.premium || isPro || isAnnual);

  localStorage.setItem("unfiltr_is_premium", String(isPremium));
  localStorage.setItem("unfiltr_is_pro",     String(isPro));
  localStorage.setItem("unfiltr_is_annual",  String(isAnnual));

  // Dispatch a single event so all mounted components can react
  window.dispatchEvent(new Event("unfiltr_auth_updated"));
}

/** Remove all three canonical premium flags from localStorage. */
export function clearEntitlements() {
  localStorage.removeItem("unfiltr_is_premium");
  localStorage.removeItem("unfiltr_is_pro");
  localStorage.removeItem("unfiltr_is_annual");
  localStorage.removeItem("unfiltr_plan");
  localStorage.removeItem("unfiltr_family_unlock");
  localStorage.removeItem("unfiltr_msg_limit_override");
  localStorage.removeItem("unfiltr_bonus_messages");
}

// ─── Full identity + app reset ────────────────────────────────────────────────

/**
 * All localStorage keys that carry identity or cached state.
 * Cleared by performFullReset().
 */
const IDENTITY_KEYS = [
  // Auth / identity
  "unfiltr_apple_user_id",
  "unfiltr_device_id",
  "userProfileId",
  "unfiltr_user_id",
  "unfiltr_auth_token",
  "unfiltr_apple_email",
  "unfiltr_user_email",
  "unfiltr_display_name",
  // Onboarding flags
  "unfiltr_consent_accepted",
  "unfiltr_onboarding_complete",
  // Premium flags
  "unfiltr_is_premium",
  "unfiltr_is_pro",
  "unfiltr_is_annual",
  "unfiltr_plan",
  "unfiltr_family_unlock",
  "unfiltr_msg_limit_override",
  "unfiltr_bonus_messages",
  // Companion / env caches
  "unfiltr_companion",
  "unfiltr_companion_id",
  "companionId",
  "unfiltr_companion_name",
  "unfiltr_companion_nickname",
  "unfiltr_env",
  "unfiltr_selected_companion_id",
  "unfiltr_quiz_companion_id",
  "unfiltr_companion_created",
  // Chat + session
  "unfiltr_chat_history",
  "unfiltr_private_session",
  "unfiltr_current_chat_db_id",
  // Misc feature caches
  "unfiltr_vibe",
  "unfiltr_relationship_mode",
  "unfiltr_voice_gender",
  "unfiltr_voice_personality",
  "unfiltr_personality_vibe",
  "unfiltr_personality_empathy",
  "unfiltr_personality_humor",
  "unfiltr_personality_curiosity",
  "unfiltr_personality_style",
  "unfiltr_streak",
  "unfiltr_admin_unlocked",
];

/**
 * Perform a complete "factory reset" of all local app state.
 *
 * - Removes every identity, premium, and cached key.
 * - Clears sessionStorage entirely.
 * - Clears in-memory globals used by ChatPage.
 * - Sets `unfiltr_fresh_start=true` so useProfileRecovery does NOT run until
 *   the user explicitly signs in again.
 * - Sends a CLEAR_SESSION message to the native iOS wrapper so it can purge
 *   any AsyncStorage / Keychain data it persisted.
 *
 * @param {function} [navigate] – react-router navigate fn; if provided,
 *                                navigates to "/" after clearing.
 */
export function performFullReset(navigate) {
  // 1. Remove all known identity / feature keys
  IDENTITY_KEYS.forEach(k => localStorage.removeItem(k));

  // 2. Remove any remaining unfiltr_ keys not in the explicit list
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("unfiltr_")) localStorage.removeItem(k);
  });

  // 3. Clear sessionStorage
  try { sessionStorage.clear(); } catch (_) {}

  // 4. Clear in-memory globals used by ChatPage
  if (typeof window !== "undefined") {
    window.__currentChatDbId      = null;
    window.__unfiltr_longest_streak = null;
  }

  // 5. Set fresh-start guard AFTER clearing so useProfileRecovery skips auto-restore
  localStorage.setItem("unfiltr_fresh_start", "true");

  // 6. Notify native iOS wrapper to clear its persisted session
  try {
    const msg = JSON.stringify({ type: "CLEAR_SESSION" });
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(msg);
    } else if (window.webkit?.messageHandlers?.ReactNativeWebView) {
      window.webkit.messageHandlers.ReactNativeWebView.postMessage(msg);
    }
  } catch (_) {}

  // 7. Navigate to root
  if (navigate) {
    navigate("/", { replace: true });
  }
}
