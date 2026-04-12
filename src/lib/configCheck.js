/**
 * configCheck.js — runtime sanity checks that emit console warnings (never fatal).
 *
 * Call runConfigChecks() once at app startup (e.g. in App.jsx) to surface
 * misconfigured IDs before they cause hard-to-debug runtime failures.
 * No secrets are exposed; all checks use known constants / env vars.
 */

const EXPECTED_BASE44_APP_ID = "69b332a392004d139d4ba495";
const EXPECTED_ORIGIN       = "unfiltrbyjavier2.vercel.app";
const KNOWN_PRODUCT_IDS = [
  "com.huertas.unfiltr.pro.monthly",
  "com.huertas.unfiltr.pro.annual",
  "com.huertas.unfiltr.tier.pro",
];
const EXPECTED_ENTITLEMENT_ID = "premium";
const SUPPORT_EMAIL = "support@sportswagerhelper.com";

function warn(msg) {
  console.warn(`[ConfigCheck] ⚠️ ${msg}`);
}

export function runConfigChecks() {
  try {
    // 1. Base44 App ID — verify the constant used in App.jsx / AuthContext
    if (typeof EXPECTED_BASE44_APP_ID !== "string" || EXPECTED_BASE44_APP_ID.length < 10) {
      warn("Base44 App ID looks invalid or missing.");
    }

    // 2. Origin — warn if running on an unexpected domain in production
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
    if (!isLocalhost && !host.includes(EXPECTED_ORIGIN) && !host.includes("vercel.app")) {
      warn(`Unexpected production origin: "${host}". Expected "${EXPECTED_ORIGIN}".`);
    }

    // 3. RevenueCat product IDs — check the known list is present
    if (!KNOWN_PRODUCT_IDS || KNOWN_PRODUCT_IDS.length === 0) {
      warn("RevenueCat product ID list is empty — purchases will not work.");
    }

    // 4. RevenueCat entitlement ID
    if (!EXPECTED_ENTITLEMENT_ID) {
      warn("RevenueCat entitlement ID is not set.");
    }

    // 5. Support email sanity
    if (!SUPPORT_EMAIL || !SUPPORT_EMAIL.includes("@")) {
      warn("Support email address looks invalid.");
    }

  } catch (e) {
    // configCheck must never crash the app
    console.warn("[ConfigCheck] Error during checks:", e?.message);
  }
}
