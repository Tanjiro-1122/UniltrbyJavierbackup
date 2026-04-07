/**
 * api/revenuecat-webhook.js
 *
 * Receives RevenueCat subscription events.
 * Finds the user by apple_user_id and updates their premium status.
 *
 * RevenueCat sends the Apple User ID as `app_user_id` after Purchases.logIn(appleUserId).
 */

const B44_APP = "69b332a392004d139d4ba495";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;

// Events that grant premium
const GRANT_EVENTS = ["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION", "SUBSCRIBER_ALIAS"];
// Events that revoke premium
const REVOKE_EVENTS = ["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"];

const PRODUCT_MAP = {
  "com.huertas.unfiltr.pro.monthly": "monthly",
  "com.huertas.unfiltr.tier.pro":    "pro",
  "com.huertas.unfiltr.pro.annual":  "annual",
};

async function findProfile(appleUserId) {
  const apiKey = process.env.BASE44_SERVICE_TOKEN;
  const res = await fetch(
    `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
    { headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" } }
  );
  const data = await res.json();
  const records = Array.isArray(data) ? data : (data?.records || data?.data || []);
  return records[0] || null;
}

async function updateProfile(profileId, updates) {
  const apiKey = process.env.BASE44_SERVICE_TOKEN;
  const res = await fetch(`${B44_BASE}/UserProfile/${profileId}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth check
  const authHeader = req.headers["authorization"] || "";
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH_HEADER || "";
  // Strip "Bearer " prefix from both sides for flexible matching
  const incomingToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const expectedToken = expected.replace(/^Bearer\s+/i, "").trim();

  if (!incomingToken || incomingToken !== expectedToken) {
    console.error("[RC Webhook] Unauthorized");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const event = req.body?.event || req.body;
  const eventType = event?.type;
  const appUserId = event?.app_user_id;
  const aliases   = event?.aliases || [];
  const productId = event?.product_id || "";
  const expiresDate = event?.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  console.log(`[RC Webhook] ${eventType} | user: ${appUserId}`);

  if (!appUserId) return res.status(400).json({ error: "Missing app_user_id" });

  // Find the user — try appUserId first, then aliases
  const candidateIds = [appUserId, ...aliases].filter(Boolean);
  let profile = null;
  for (const uid of candidateIds) {
    profile = await findProfile(uid);
    if (profile) {
      console.log(`[RC Webhook] Found profile ${profile.id} via ${uid}`);
      break;
    }
  }

  if (!profile) {
    console.warn(`[RC Webhook] No profile found for ${appUserId} — event dropped`);
    // Return 200 so RevenueCat doesn't retry forever
    return res.status(200).json({ received: true, matched: false });
  }

  // Determine what plan
  const plan = PRODUCT_MAP[productId] ||
    (productId.includes("annual") ? "annual" : productId.includes("pro") ? "pro" : "monthly");

  let updates = {};

  if (GRANT_EVENTS.includes(eventType)) {
    updates = {
      is_premium:  true,
      annual_plan: plan === "annual",
      pro_plan:    plan === "pro",
      premium:     true,
      ...(expiresDate ? { subscription_expires: expiresDate } : {}),
    };
    console.log(`[RC Webhook] ✅ Granting premium (${plan}) to profile ${profile.id}`);

  } else if (REVOKE_EVENTS.includes(eventType)) {
    updates = {
      is_premium:  false,
      annual_plan: false,
      pro_plan:    false,
      premium:     false,
    };
    console.log(`[RC Webhook] ❌ Revoking premium from profile ${profile.id}`);

  } else {
    // Unhandled event type — ack and move on
    return res.status(200).json({ received: true, action: "ignored", eventType });
  }

  const ok = await updateProfile(profile.id, updates);
  console.log(`[RC Webhook] Profile update: ${ok ? "success" : "failed"}`);

  return res.status(200).json({ received: true, matched: true, updated: ok, plan });
}
