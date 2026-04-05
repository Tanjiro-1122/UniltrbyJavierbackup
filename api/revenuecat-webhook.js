// api/revenuecat-webhook.js
// Receives RevenueCat subscription events and syncs premium status in Base44

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth header
  const authHeader = req.headers["authorization"];
  const expectedAuth = process.env.REVENUECAT_WEBHOOK_AUTH_HEADER;
  if (!authHeader || authHeader !== expectedAuth) {
    console.error("[RC Webhook] Unauthorized — bad auth header");
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

  // Events that grant premium
  const PREMIUM_EVENTS = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
    "SUBSCRIBER_ALIAS",
  ];

  // Events that revoke premium
  const REVOKE_EVENTS = [
    "CANCELLATION",
    "EXPIRATION",
    "BILLING_ISSUE",
  ];

  const BASE44_API_KEY = process.env.BASE44_API_KEY;
  const BASE44_APP_ID = "69b332a392004d139d4ba495";
  const B44_BASE = `https://api.base44.com/api/apps/${BASE44_APP_ID}/entities`;

  if (!BASE44_API_KEY) {
    console.error("[RC Webhook] Missing BASE44_API_KEY");
    return res.status(500).json({ error: "Server config error" });
  }

  // ── Find user profile by apple_user_id first, then user_id, then aliases ──
  // RevenueCat sends the Apple User ID as app_user_id after Purchases.logIn()
  const userIds = [appUserId, ...aliases].filter(Boolean);
  let profile = null;
  let profileId = null;

  for (const uid of userIds) {
    // Try apple_user_id field first (this is where we store the Apple User ID)
    try {
      const r1 = await fetch(
        `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(uid)}&limit=1`,
        { headers: { "Authorization": `Bearer ${BASE44_API_KEY}`, "Content-Type": "application/json" } }
      );
      const p1 = await r1.json();
      if (Array.isArray(p1) && p1.length > 0) {
        profile = p1[0];
        profileId = profile.id;
        console.log(`[RC Webhook] Found profile ${profileId} via apple_user_id for ${uid}`);
        break;
      }
    } catch (e) {
      console.warn(`[RC Webhook] apple_user_id lookup failed for ${uid}:`, e.message);
    }

    // Fallback: try user_id field
    try {
      const r2 = await fetch(
        `${B44_BASE}/UserProfile?user_id=${encodeURIComponent(uid)}&limit=1`,
        { headers: { "Authorization": `Bearer ${BASE44_API_KEY}`, "Content-Type": "application/json" } }
      );
      const p2 = await r2.json();
      if (Array.isArray(p2) && p2.length > 0) {
        profile = p2[0];
        profileId = profile.id;
        console.log(`[RC Webhook] Found profile ${profileId} via user_id for ${uid}`);
        break;
      }
    } catch (e) {
      console.warn(`[RC Webhook] user_id lookup failed for ${uid}:`, e.message);
    }
  }

  if (!profileId) {
    console.warn(`[RC Webhook] No profile found for user ${appUserId} or aliases [${aliases.join(", ")}] — ignoring event`);
    return res.status(200).json({ status: "user_not_found" });
  }

  let updateData = null;

  if (PREMIUM_EVENTS.includes(eventType)) {
    const isAnnual = event?.event?.product_id?.includes("annual");
    const isPro    = !isAnnual && event?.event?.product_id?.includes("pro");
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

  // Update the UserProfile in Base44
  try {
    const updateRes = await fetch(
      `${B44_BASE}/UserProfile/${profileId}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${BASE44_API_KEY}`,
          "Content-Type": "application/json",
        },
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
