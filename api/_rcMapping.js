/**
 * api/_rcMapping.js
 *
 * Shared RevenueCat subscription mapping helpers.
 * Import this module from any serverless function that needs to translate
 * RevenueCat subscriber/entitlement data into local UserProfile flags.
 *
 * Required environment variables:
 *   REVENUECAT_SECRET_KEY — RevenueCat server-side secret key
 *
 * Optional environment variables:
 *   REVENUECAT_ENTITLEMENT_ID — RevenueCat entitlement identifier
 *                               (default: "unfiltr by javier Pro")
 */

export const ENTITLEMENT_ID =
  process.env.REVENUECAT_ENTITLEMENT_ID || "unfiltr by javier Pro";
export const RC_API_BASE    = "https://api.revenuecat.com/v1";

/**
 * Maps known product IDs to a short plan name used in UserProfile.
 * Any unrecognised product ID falls back based on substring matching,
 * then defaults to "monthly".
 */
export const PRODUCT_MAP = {
  // iOS product IDs
  "com.huertas.unfiltr.pro.monthly":              "monthly",
  "com.huertas.unfiltr.tier.pro":                 "pro",
  "com.huertas.unfiltr.pro.annual":               "annual",
  // Android product IDs (Google Play subscription base plans)
  "unfiltr_plus_monthly:monthly-999":             "monthly",
  "unfiltr_plus_monthly":                         "monthly",
  "unfiltr_pro_monthly:monthly-1499":             "pro",
  "unfiltr_pro_monthly":                          "pro",
  "unfiltr_ultimate_friend_annual:annual-99":     "ultimate_friend",
  "unfiltr_ultimate_friend_annual":               "ultimate_friend",
  // iOS Ultimate Friend  
  "com.huertas.unfiltr.pro.annual":               "ultimate_friend",
};

/**
 * Derive the plan string from a RevenueCat product ID.
 * @param {string} productId
 * @returns {"monthly"|"pro"|"annual"}
 */
export function planFromProductId(productId = "") {
  return (
    PRODUCT_MAP[productId] ||
    (productId.includes("ultimate_friend") ? "ultimate_friend" :
     productId.includes("annual")          ? "ultimate_friend"  :
     productId.includes("tier.pro")        ? "pro"     :
     productId.includes("pro_monthly")     ? "pro"     :
     productId.includes("pro")             ? "pro"     : "monthly")
  );
}

/**
 * Map a single RevenueCat entitlement object to UserProfile flag fields.
 * Returns the full set of subscription-related flags regardless of active state.
 *
 * @param {object|null|undefined} entitlement  - RC entitlement object (or null/undefined).
 * @param {string} [fallbackProductId]         - Product ID to use when entitlement lacks one.
 * @returns {{ is_premium: boolean, premium: boolean, pro_plan: boolean, annual_plan: boolean,
 *             trial_active: boolean, subscription_expires: string|null }}
 */
export function mapEntitlementToFlags(entitlement, fallbackProductId = "") {
  if (!entitlement) {
    return {
      is_premium:           false,
      premium:              false,
      pro_plan:             false,
      annual_plan:          false,
      ultimate_friend:      false,
      trial_active:         false,
      subscription_expires: null,
    };
  }

  const expiresDate = entitlement.expires_date || null;
  // An entitlement with no expires_date is treated as lifetime/active.
  const isActive = !expiresDate || new Date(expiresDate) > new Date();

  if (!isActive) {
    return {
      is_premium:           false,
      premium:              false,
      pro_plan:             false,
      annual_plan:          false,
      ultimate_friend:      false,
      trial_active:         false,
      subscription_expires: expiresDate,
    };
  }

  const activeProductId = entitlement.product_identifier || fallbackProductId;
  const plan            = planFromProductId(activeProductId);
  const isTrial         = entitlement.period_type === "TRIAL";

  return {
    is_premium:           true,
    premium:              true,
    pro_plan:             plan === "pro",
    annual_plan:          plan === "annual" || plan === "ultimate_friend",
    ultimate_friend:      plan === "ultimate_friend",
    trial_active:         isTrial,
    subscription_expires: expiresDate,
  };
}

/**
 * Extract subscription flags from a full RevenueCat subscriber API response.
 *
 * @param {object} subscriberData - Parsed JSON from GET /v1/subscribers/:id
 * @returns {{ flags: object, plan: string, expiresDate: string|null, isActive: boolean }}
 */
export function mapSubscriberToFlags(subscriberData) {
  const entitlement = subscriberData?.subscriber?.entitlements?.[ENTITLEMENT_ID];
  const productId   = entitlement?.product_identifier || "";
  const expiresDate = entitlement?.expires_date || null;
  const isActive    = !!(entitlement && (!expiresDate || new Date(expiresDate) > new Date()));
  const plan        = planFromProductId(productId);
  const flags       = mapEntitlementToFlags(isActive ? entitlement : null, productId);

  return { flags, plan, expiresDate, isActive };
}

/**
 * Thrown when a RevenueCat subscriber is not found (404).
 * Callers can catch this specifically to distinguish "user has no subscription"
 * from a general network/server error.
 */
export class RCSubscriberNotFoundError extends Error {
  constructor(appUserId) {
    super(`RevenueCat subscriber not found: ${appUserId}`);
    this.name = "RCSubscriberNotFoundError";
    this.statusCode = 404;
  }
}

/**
 * Fetch a RevenueCat subscriber record by app_user_id.
 * Throws RCSubscriberNotFoundError on 404 (user has no subscription).
 * Throws a descriptive Error on any other failure (network / server error).
 * Never logs the secret key value.
 *
 * @param {string} appUserId - RevenueCat / Apple user ID.
 * @returns {Promise<object>} Parsed subscriber JSON.
 */
export async function fetchRCSubscriber(appUserId) {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) throw new Error("REVENUECAT_SECRET_KEY env var not set");

  const res = await fetch(
    `${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );

  if (res.status === 404) {
    throw new RCSubscriberNotFoundError(appUserId);
  }

  if (!res.ok) {
    let preview = "";
    try { preview = (await res.text()).slice(0, 200); } catch {}
    throw new Error(`RevenueCat subscriber fetch failed: ${res.status} — ${preview}`);
  }

  let body;
  try { body = await res.json(); } catch {
    throw new Error("RevenueCat returned non-JSON response for subscriber fetch");
  }
  return body;
}

/**
 * Post a receipt to RevenueCat to register/validate a purchase.
 * Throws on failure.
 *
 * @param {string} receiptData - Base64-encoded receipt (fetch_token).
 * @param {string} appUserId   - RevenueCat / Apple user ID.
 * @param {string} productId   - Product ID being purchased.
 * @param {"ios"|"android"} [platform="ios"]
 * @returns {Promise<object>} Parsed response JSON.
 */
export async function postReceiptToRC(receiptData, appUserId, productId, platform = "ios") {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) throw new Error("REVENUECAT_SECRET_KEY env var not set");

  const res = await fetch(`${RC_API_BASE}/receipts`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${key}`,
      "X-Platform":    platform === "android" ? "android" : "ios",
    },
    body: JSON.stringify({
      app_user_id: appUserId,
      fetch_token: receiptData,
      product_id:  productId,
    }),
  });

  if (!res.ok) {
    let preview = "";
    try { preview = (await res.text()).slice(0, 200); } catch {}
    throw new Error(`RevenueCat receipt POST failed: ${res.status} — ${preview}`);
  }

  let body;
  try { body = await res.json(); } catch {
    throw new Error("RevenueCat returned non-JSON response for receipt POST");
  }
  return body;
}

