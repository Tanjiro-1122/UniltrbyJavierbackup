/**
 * api/revenuecat-webhook.js
 *
 * Receives RevenueCat subscription events.
 * Finds the user by apple_user_id and updates their premium status.
 *
 * RevenueCat sends the Apple User ID as `app_user_id` after Purchases.logIn(appleUserId).
 *
 * Required environment variables:
 *   BASE44_SERVICE_TOKEN           — Base44 service-role token
 *   REVENUECAT_WEBHOOK_AUTH_HEADER — expected Authorization header value from RevenueCat
 */

import { B44_ENTITIES, b44Fetch } from "./_b44.js";
import { planFromProductId } from "./_rcMapping.js";

// Events that grant premium
const GRANT_EVENTS  = ["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION", "SUBSCRIBER_ALIAS"];
// Events that revoke premium
const REVOKE_EVENTS = ["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"];

/**
 * Find a UserProfile by apple_user_id.
 * Email-based fallback has been intentionally removed: a permissive email
 * regex match would allow a crafted app_user_id to overwrite any user whose
 * email happens to match — a privilege-escalation vector.
 */
async function findProfile(appleUserId) {
  // Primary lookup: apple_user_id field
  try {
    const data = await b44Fetch(
      `${B44_ENTITIES}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`
    );
    const records = Array.isArray(data) ? data : (data?.records || data?.data || []);
    if (records[0]) return records[0];
  } catch (err) {
    console.error(`[RC Webhook] findProfile (apple_user_id) failed for ${appleUserId}: ${err.message}`);
  }

  return null;
}

async function updateProfile(profileId, updates) {
  try {
    await b44Fetch(`${B44_ENTITIES}/UserProfile/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return true;
  } catch (err) {
    console.error(`[RC Webhook] updateProfile failed for ${profileId}: ${err.message}`);
    return false;
  }
}

/** Constant-time string comparison to prevent timing-based token oracle. */
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth check (constant-time comparison)
  const authHeader = req.headers["authorization"] || "";
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH_HEADER || "";
  // Strip "Bearer " prefix from both sides for flexible matching
  const incomingToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const expectedToken = expected.replace(/^Bearer\s+/i, "").trim();

  if (!incomingToken || !timingSafeEqual(incomingToken, expectedToken)) {
    console.error("[RC Webhook] Unauthorized");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Defensive JSON parsing — Vercel may deliver body as a string depending on config.
  let rawBody = req.body;
  if (typeof rawBody === "string") {
    try { rawBody = JSON.parse(rawBody); } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const event = rawBody?.event || rawBody;
  const eventType = event?.type;
  const appUserId = event?.app_user_id;
  // Use Array.isArray to guard against aliases: null (|| [] only guards undefined/falsy,
  // but null is falsy too — this is just more explicit and future-proof).
  const aliases   = Array.isArray(event?.aliases) ? event.aliases : [];
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
  const plan = planFromProductId(productId);

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
