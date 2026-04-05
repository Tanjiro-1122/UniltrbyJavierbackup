// api/revenuecat-webhook.js — v2
// Receives RevenueCat subscription events and syncs premium status in Base44

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth header — strip Bearer prefix for comparison so env var can be raw token
  const rawAuth = req.headers["authorization"] || "";
  const token = rawAuth.startsWith("Bearer ") ? rawAuth.slice(7) : rawAuth;
  const expectedAuth = (process.env.REVENUECAT_WEBHOOK_AUTH_HEADER || "").replace(/^Bearer_/, "").replace(/^Bearer /, "");
  console.log("[RC Webhook] Token received (first 8):", token.slice(0,8));
  console.log("[RC Webhook] Token expected (first 8):", expectedAuth.slice(0,8));
  if (!token || token !== expectedAuth) {
    console.error("[RC Webhook] Unauthorized — token mismatch");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const event = req.body;
  const eventType = event?.event?.type;
  const appUserId = event?.event?.app_user_id;
  const aliases = event?.event?.aliases || [];

  console.log(`[RC Webhook] Event: ${eventType} | User: ${appUserId}`);

  if (!appUserId) {
    return res.status(400).json({ error: "Missing app_user_id" });
  }

  const PREMIUM_EVENTS = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
    "SUBSCRIBER_ALIAS",
  ];

  const REVOKE_EVENTS = [
    "CANCELLATION",
    "EXPIRATION",
    "BILLING_ISSUE",
  ];

  // ✅ Fixed: was hardcoded to wrong app ID (69b22f8b = Superagent app, NOT production)
  // Production user data lives in 69b332a392004d139d4ba495
  const BASE44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY;
  const BASE44_APP_ID = "69b332a392004d139d4ba495";

  if (!BASE44_API_KEY) {
    console.error("[RC Webhook] Missing BASE44_SERVICE_TOKEN / BASE44_API_KEY");
    return res.status(500).json({ error: "Server config error" });
  }

  // Try appUserId and all aliases to find the profile
  const userIds = [appUserId, ...aliases].filter(Boolean);
  let profile = null;
  let profileId = null;

  for (const uid of userIds) {
    try {
      const filterRes = await fetch(
        `https://api.base44.com/api/apps/${BASE44_APP_ID}/entities/UserProfile?user_id=${encodeURIComponent(uid)}`,
        {
          headers: {
            "ApiKey": BASE44_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      const profiles = await filterRes.json();
      if (Array.isArray(profiles) && profiles.length > 0) {
        profile = profiles[0];
        profileId = profile.id;
        console.log(`[RC Webhook] Found profile ${profileId} for user ${uid}`);
        break;
      }
    } catch (e) {
      console.error(`[RC Webhook] Error looking up user ${uid}:`, e.message);
    }
  }

  if (!profileId) {
    // Also try looking up by apple_user_id field
    try {
      const filterRes = await fetch(
        `https://api.base44.com/api/apps/${BASE44_APP_ID}/entities/UserProfile?apple_user_id=${encodeURIComponent(appUserId)}`,
        { headers: { "ApiKey": BASE44_API_KEY, "Content-Type": "application/json" } }
      );
      const profiles = await filterRes.json();
      if (Array.isArray(profiles) && profiles.length > 0) {
        profile = profiles[0];
        profileId = profile.id;
        console.log(`[RC Webhook] Found profile by apple_user_id: ${profileId}`);
      }
    } catch (e) {}
  }

  if (!profileId) {
    console.warn(`[RC Webhook] No profile found for user ${appUserId} — ignoring event`);
    return res.status(200).json({ status: "user_not_found" });
  }

  let updateData = null;

  if (PREMIUM_EVENTS.includes(eventType)) {
    const productId = event?.event?.product_id || "";
    const isAnnual = productId.includes("annual");
    const isPro    = !isAnnual && productId.includes("tier.pro");
    updateData = {
      is_premium:   true,
      trial_active: false,
      annual_plan:  isAnnual ? true : (profile.annual_plan || false),
      pro_plan:     isPro    ? true : (profile.pro_plan    || false),
    };
    console.log(`[RC Webhook] Granting premium to ${profileId} (annual: ${isAnnual}, pro: ${isPro})`);
  } else if (REVOKE_EVENTS.includes(eventType)) {
    updateData = {
      is_premium:   false,
      trial_active: false,
      annual_plan:  false,
      pro_plan:     false,
    };
    console.log(`[RC Webhook] Revoking premium from ${profileId}`);
  } else {
    console.log(`[RC Webhook] Unhandled event type: ${eventType} — no action taken`);
    return res.status(200).json({ status: "ignored", eventType });
  }

  try {
    const updateRes = await fetch(
      `https://api.base44.com/api/apps/${BASE44_APP_ID}/entities/UserProfile/${profileId}`,
      {
        method: "PUT",
        headers: { "ApiKey": BASE44_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      }
    );
    if (!updateRes.ok) {
      const err = await updateRes.text();
      console.error(`[RC Webhook] Failed to update profile: ${err}`);
      return res.status(500).json({ error: "Failed to update profile" });
    }
    console.log(`[RC Webhook] ✅ Profile ${profileId} updated:`, JSON.stringify(updateData));
    return res.status(200).json({ status: "ok", profileId, eventType, updateData });
  } catch (e) {
    console.error("[RC Webhook] Update error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
