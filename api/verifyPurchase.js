/**
 * verifyPurchase — checks RevenueCat for active entitlement.
 * Called on app launch / resume to sync premium status.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RC_SECRET_KEY  = process.env.REVENUECAT_SECRET_KEY;
const RC_API_BASE    = "https://api.revenuecat.com/v1";
const ENTITLEMENT_ID = "unfiltr by javier Pro";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { profileId, userId, platform, receiptData, productId, purchaseToken } = req.body;
    const appUserId = profileId || userId;

    if (!appUserId) return res.status(400).json({ error: "No user ID" });

    // If receipt is provided (fresh purchase), post it first
    if (receiptData && productId) {
      await fetch(`${RC_API_BASE}/receipts`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${RC_SECRET_KEY}`,
          "X-Platform":    platform === "android" ? "android" : "ios",
        },
        body: JSON.stringify({
          app_user_id: appUserId,
          fetch_token: receiptData,
          product_id:  productId,
        }),
      });
    }

    // Always fetch subscriber status from RevenueCat
    const rcRes = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: {
        "Authorization": `Bearer ${RC_SECRET_KEY}`,
        "X-Platform":    "ios",
      },
    });

    if (!rcRes.ok) {
      return res.status(200).json({ data: { success: false, isPremium: false } });
    }

    const subscriberData = await rcRes.json();
    const entitlements   = subscriberData?.subscriber?.entitlements || {};
    const premiumEnt     = entitlements[ENTITLEMENT_ID];
    const isActive       = premiumEnt && new Date(premiumEnt.expires_date) > new Date();
    const plan           = premiumEnt?.product_identifier?.includes("annual") ? "annual" : "monthly";

    // Sync to Supabase
    if (isActive) {
      await supabase
        .from("user_profile")
        .update({ is_premium: true, annual_plan: plan === "annual", updated_date: new Date().toISOString() })
        .eq("id", appUserId);
    }

    return res.status(200).json({
      data: {
        success:     true,
        isPremium:   isActive,
        plan:        isActive ? plan : null,
        expiresDate: premiumEnt?.expires_date || null,
      },
    });

  } catch (err) {
    console.error("[verifyPurchase] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
