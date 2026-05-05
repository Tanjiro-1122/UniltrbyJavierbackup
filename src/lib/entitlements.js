/**
 * entitlements.js
 * Single source of truth for tier/plan detection and identity reset.
 *
 * Tier hierarchy (highest → lowest):
 *   family  – Family Unlimited (device-only, 1-yr)  → unlimited everything
 *   annual  – Annual plan ($59.99/yr)  → unlimited history, unlimited messages
 *   pro     – Pro plan   ($14.99/mo)  → 100 history, 200 msg/day
 *   plus    – Monthly    ($9.99/mo)   → 20 history, 100 msg/day
 *   free    – No plan                 → 2 history, 10 msg/day
 */

// ─── Plan constants ───────────────────────────────────────────────────────────

export const HISTORY_LIMITS = { free: 2, plus: 20, pro: 100, annual: 9999, ultimate_friend: 9999, family: 9999 };

export const DAILY_MSG_LIMITS = { free: 10, plus: 100, pro: 200, annual: Number.MAX_SAFE_INTEGER, ultimate_friend: Number.MAX_SAFE_INTEGER, family: Number.MAX_SAFE_INTEGER };

/** Daily photo limit per tier when sending images in chat */
export const PHOTO_DAILY_LIMITS = { free: 2, plus: 5, pro: 10, annual: 99999, ultimate_friend: 99999, family: 99999 };

/** Monthly journal entry limit per tier */
export const JOURNAL_MONTHLY_LIMITS = { free: 5, plus: 30, pro: 100, annual: 99999, ultimate_friend: 99999, family: 99999 };

/** Human-readable label shown in UI (e.g. badge in Settings header) */
export const PLAN_LABELS = {
  free:            "Free",
  plus:            "Premium (Monthly)",
  pro:             "Pro",
  annual:          "Annual",
  ultimate_friend: "Ultimate Friend ⭐",
  family:          "Family Unlimited",
};

/** Returns true if the device has an active (non-expired) Family Unlimited unlock. */
export function isFamilyUnlimited() {
  if (localStorage.getItem("unfiltr_family_unlimited") !== "true") return false;
  const expiresAt = localStorage.getItem("unfiltr_family_unlimited_expires_at");
  // Require an explicit expiry date — missing expiry means the flag was set
  // incorrectly or was accidentally cleared; treat as inactive for safety.
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

// ─── Tier detection ───────────────────────────────────────────────────────────

/**
 * Derive the current user's tier from localStorage flags.
 * Reads the three canonical flags: unfiltr_is_annual, unfiltr_is_pro,
 * unfiltr_is_premium (plus family-unlock / msg-override admin flags).
 *
 * @returns {"family"|"annual"|"pro"|"plus"|"free"}
 */
export function getTier() {
  if (isFamilyUnlimited()) return "family";
  if (localStorage.getItem("unfiltr_ultimate_friend") === "true") return "ultimate_friend";
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
  const isAnnual        = !!(profile.annual_plan);
  const isPro           = !!(profile.pro_plan);
  const isUltimateFriend = !!(profile.ultimate_friend);
  const isPremium       = !!(profile.is_premium || profile.premium || isPro || isAnnual || isUltimateFriend);

  localStorage.setItem("unfiltr_is_premium",       String(isPremium));
  localStorage.setItem("unfiltr_is_pro",           String(isPro));
  localStorage.setItem("unfiltr_is_annual",        String(isAnnual));
  localStorage.setItem("unfiltr_ultimate_friend",  String(isUltimateFriend));

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
  localStorage.removeItem("unfiltr_family_unlimited");
  localStorage.removeItem("unfiltr_unlimited");
  localStorage.removeItem("unfiltr_family_unlimited_expires_at");
}

// ─── Full identity + app reset ────────────────────────────────────────────────

/**
 * All localStorage keys that carry identity or cached state.
 * Cleared by performFullReset().
 */
// Keys that should NEVER be cleared on sign-out — they allow instant
// chat restore and profile rehydration when the user signs back in.
const PRESERVE_ON_SIGNOUT = new Set([
  "unfiltr_apple_user_id",
  "unfiltr_device_id",
  "userProfileId",
  "unfiltr_display_name",
  "unfiltr_companion",
  "unfiltr_companion_id",
  "unfiltr_companion_name",
  "unfiltr_companion_nickname",
]);

const IDENTITY_KEYS = [
  // Auth / identity (apple_user_id intentionally excluded — preserved across sign-out)
  "unfiltr_user_id",
  "unfiltr_google_user_id",  // Android Google Sign-In — cleared on logout to prevent stale auth
  "unfiltr_auth_token",
  "unfiltr_apple_email",
  "unfiltr_user_email",
  // Age gate / onboarding flags (maximum reset — wipe everything)
  "unfiltr_age_verified",
  "unfiltr_consent_accepted",
  "unfiltr_onboarding_complete",
  // Premium flags
  "unfiltr_is_premium",
  "unfiltr_is_pro",
  "unfiltr_is_annual",
  "unfiltr_ultimate_friend",
  "unfiltr_plan",
  "unfiltr_family_unlock",
  "unfiltr_msg_limit_override",
  "unfiltr_bonus_messages",
  "unfiltr_family_unlimited",
  "unfiltr_unlimited",
  "unfiltr_family_unlimited_expires_at",
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
 * - Sets `unfiltr_fresh_start=true` and `unfiltr_signed_out=true` so
 *   useProfileRecovery does NOT run until the user explicitly signs in again.
 * - Sends a CLEAR_DATA message to the native iOS wrapper so it can purge
 *   any AsyncStorage / Keychain data it persisted (fire-and-forget).
 *   For the async variant that awaits CLEAR_DATA_COMPLETE, use clearDataAndReset().
 *
 * @param {function} [navigate] - react-router navigate fn; if provided,
 *                                navigates to "/" after clearing.
 */
export function performFullReset(navigate) {
  // 1. Remove all known identity / feature keys
  IDENTITY_KEYS.forEach(k => localStorage.removeItem(k));

  // 2. Remove any remaining unfiltr_ keys not in the explicit list (skip preserved identity keys)
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("unfiltr_") && !PRESERVE_ON_SIGNOUT.has(k)) localStorage.removeItem(k);
  });

  // 3. Clear sessionStorage
  try { sessionStorage.clear(); } catch (_) {}

  // 4. Clear in-memory globals used by ChatPage
  if (typeof window !== "undefined") {
    window.__currentChatDbId      = null;
    window.__chatDayUpsertKey     = null;
    window.__unfiltr_longest_streak = null;
  }

  // 5. Set guards AFTER clearing so useProfileRecovery skips auto-restore
  localStorage.setItem("unfiltr_fresh_start", "true");
  localStorage.setItem("unfiltr_signed_out",  "true");

  // 6. Notify native iOS wrapper to clear its persisted session (fire-and-forget)
  try {
    const msg = JSON.stringify({ type: "CLEAR_DATA" });
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

/**
 * Async bridge-aware reset.
 *
 * 1. Performs a synchronous full local clear (identical to performFullReset).
 * 2. When running inside the iOS wrapper, sends CLEAR_DATA and waits up to
 *    5 s for CLEAR_DATA_COMPLETE before reloading via window.location.replace.
 * 3. For plain web usage, immediately navigates with react-router.
 *
 * @param {function} [navigate] - react-router navigate fn (used on web only).
 */
export async function clearDataAndReset(navigate) {
  // ── Synchronous local clear ───────────────────────────────────────────────
  IDENTITY_KEYS.forEach(k => localStorage.removeItem(k));
  // Apply the same PRESERVE_ON_SIGNOUT guard as performFullReset so that keys
  // like unfiltr_apple_user_id and userProfileId are retained across sign-out.
  // Without this guard the user loses their profile anchor and chat history
  // cannot be restored after they sign back in.
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("unfiltr_") && !PRESERVE_ON_SIGNOUT.has(k)) localStorage.removeItem(k);
  });
  try { sessionStorage.clear(); } catch (_) {}
  if (typeof window !== "undefined") {
    window.__currentChatDbId        = null;
    window.__chatDayUpsertKey       = null;
    window.__unfiltr_longest_streak = null;
  }
  localStorage.setItem("unfiltr_fresh_start", "true");
  localStorage.setItem("unfiltr_signed_out",  "true");

  // ── Bridge path: send CLEAR_DATA, await CLEAR_DATA_COMPLETE (5 s cap) ────
  const rnBridge = typeof window !== "undefined" &&
    !!(window.ReactNativeWebView || window.webkit?.messageHandlers?.ReactNativeWebView);

  if (rnBridge) {
    await new Promise(resolve => {
      let timer;
      const handler = (e) => {
        try {
          const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (d?.type === "CLEAR_DATA_COMPLETE") {
            clearTimeout(timer);
            window.removeEventListener("message", handler);
            resolve();
          }
        } catch (_) {}
      };
      timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve();
      }, 5000);
      window.addEventListener("message", handler);
      try {
        const msg = JSON.stringify({ type: "CLEAR_DATA" });
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(msg);
        } else {
          window.webkit.messageHandlers.ReactNativeWebView.postMessage(msg);
        }
      } catch (_) {
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        resolve();
      }
    });
    // Force a hard reload so the WebView re-initialises from "/" cleanly.
    window.location.replace("/");
    return;
  }

  // ── Web fallback ──────────────────────────────────────────────────────────
  if (navigate) navigate("/", { replace: true });
}


