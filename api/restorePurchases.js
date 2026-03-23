/**
 * restorePurchases — checks RevenueCat for any active entitlement
 * and syncs premium status back to Supabase.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RC_SECRET_KEY  = process.env.REVENUECAT_SECRET_KEY;
const RC_API_BASE    = "https://api.revenuecat.com/v1";
const ENTITLEMENT_ID = "premium";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { profileId, userId } = req.body;
    const appUserId = profileId || userId;

    if (!appUserId) return res.status(400).json({ error: "No user ID" });

    const rcRes = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: { "Authorization": `Bearer ${RC_SECRET_KEY}` },
    });

    if (!rcRes.ok) {
      return res.status(200).json({ data: { success: false, isPremium: false, message: "No purchases found" } });
    }

    const subscriberData = await rcRes.json();
    const entitlements   = subscriberData?.subscriber?.entitlements || {};
    const premiumEnt     = entitlements[ENTITLEMENT_ID];
    const isActive       = premiumEnt && new Date(premiumEnt.expires_date) > new Date();
    const plan           = premiumEnt?.product_identifier?.includes("annual") ? "annual" : "monthly";

    if (isActive) {
      await supabase
        .from("user_profile")
        .update({ is_premium: true, annual_plan: plan === "annual", updated_date: new Date().toISOString() })
        .eq("id", appUserId);

      localStorage?.setItem?.("unfiltr_is_premium", "true");
    }

    return res.status(200).json({
      data: {
        success:   isActive,
        isPremium: isActive,
        plan:      isActive ? plan : null,
        message:   isActive ? "Purchases restored successfully!" : "No active purchases found.",
      },
    });

  } catch (err) {
    console.error("[restorePurchases] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
