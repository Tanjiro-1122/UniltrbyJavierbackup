/**
 * Apple IAP handler — validates receipts via RevenueCat REST API
 * then marks user as premium in Supabase.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RC_SECRET_KEY  = process.env.REVENUECAT_SECRET_KEY; // sk_vbJBTyJIbFmJCgZJhqdKybEVekzxl
const RC_API_BASE    = "https://api.revenuecat.com/v1";
const ENTITLEMENT_ID = "unfiltr by javier Pro";

const PRODUCT_MAP = {
  "com.huertas.unfiltr.premium.monthly": "monthly",
  "com.huertas.unfiltr.premium.annual":  "annual",
};

/**
 * POST the receipt to RevenueCat and get entitlement status back.
 * appUserId = Supabase user ID (used as RevenueCat App User ID)
 */
async function postReceiptToRevenueCat(receiptData, appUserId, productId) {
  const res = await fetch(`${RC_API_BASE}/receipts`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${RC_SECRET_KEY}`,
      "X-Platform":    "ios",
    },
    body: JSON.stringify({
      app_user_id:       appUserId,
      fetch_token:       receiptData,   // base64 receipt from StoreKit
      product_id:        productId,
      price:             productId?.includes("annual") ? 59.99 : 9.99,
      currency:          "USD",
      payment_mode:      "IMMEDIATE_AND_AUTO_RENEWING",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RevenueCat receipt POST failed: ${res.status} — ${err}`);
  }
  return res.json();
}

/**
 * Get subscriber info from RevenueCat to check entitlement status.
 */
async function getSubscriberInfo(appUserId) {
  const res = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: {
      "Authorization": `Bearer ${RC_SECRET_KEY}`,
      "X-Platform":    "ios",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RevenueCat subscriber GET failed: ${res.status} — ${err}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { receipt, productId, profileId, userId } = req.body;
    const appUserId = profileId || userId || null;

    if (!receipt) return res.status(400).json({ error: "No receipt provided" });
    if (!appUserId) return res.status(400).json({ error: "No user ID provided" });

    // 1. Post receipt to RevenueCat
    await postReceiptToRevenueCat(receipt, appUserId, productId);

    // 2. Fetch subscriber to confirm entitlement is active
    const subscriberData = await getSubscriberInfo(appUserId);
    const entitlements   = subscriberData?.subscriber?.entitlements || {};
    const premiumEnt     = entitlements[ENTITLEMENT_ID];
    const isActive       = premiumEnt && new Date(premiumEnt.expires_date) > new Date();

    if (!isActive) {
      return res.status(400).json({ error: "Entitlement not active after receipt validation" });
    }

    // 3. Get plan type
    const activeProductId = premiumEnt.product_identifier || productId;
    const plan            = PRODUCT_MAP[activeProductId] || "monthly";
    const expiresDate     = premiumEnt.expires_date;

    // 4. Update Supabase — mark user as premium
    const { error: dbError } = await supabase
      .from("user_profile")
      .update({
        is_premium:   true,
        annual_plan:  plan === "annual",
        updated_date: new Date().toISOString(),
      })
      .eq("id", appUserId);

    if (dbError) console.error("[IAP] Supabase update error:", dbError);

    return res.status(200).json({
      data: {
        success:     true,
        plan,
        expiresDate,
        productId:   activeProductId,
      },
    });

  } catch (err) {
    console.error("[IAP] handleAppleIAP error:", err);
    return res.status(500).json({ error: err.message });
  }
}
