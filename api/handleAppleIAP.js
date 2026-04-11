/**
 * api/handleAppleIAP.js
 *
 * Handles Apple In-App Purchase receipt submission and verification.
 *
 * Required environment variables:
 *   REVENUECAT_SECRET_KEY — RevenueCat server-side secret key
 *   BASE44_SERVICE_TOKEN  — Base44 service-role token
 */

import { B44_ENTITIES, b44Fetch } from "./_b44.js";
import { ENTITLEMENT_ID, mapSubscriberToFlags, fetchRCSubscriber, postReceiptToRC } from "./_rcMapping.js";

async function b44FindAndUpdate(appleUserId, data) {
  // Primary lookup: apple_user_id
  let records = [];
  try {
    const r = await b44Fetch(
      `${B44_ENTITIES}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`
    );
    records = Array.isArray(r) ? r : (r?.data || []);
  } catch {}

  if (!records.length) {
    console.error("[handleAppleIAP] No UserProfile found for:", appleUserId);
    return false;
  }

  const profileId = records[0].id;
  try {
    await b44Fetch(`${B44_ENTITIES}/UserProfile/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    console.log("[handleAppleIAP] b44Update success for record:", profileId);
    return true;
  } catch (err) {
    console.error("[handleAppleIAP] b44Update failed for:", profileId, err.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.REVENUECAT_SECRET_KEY) {
    console.error("[handleAppleIAP] REVENUECAT_SECRET_KEY env var not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const { receipt, productId, profileId, userId } = req.body || {};
    const appleUserId = profileId || userId;
    if (!receipt)     return res.status(400).json({ error: "No receipt provided" });
    if (!appleUserId) return res.status(400).json({ error: "No user ID provided" });

    console.log("[handleAppleIAP] called for:", appleUserId, "product:", productId);

    await postReceiptToRC(receipt, appleUserId, productId, "ios");

    const subscriberData = await fetchRCSubscriber(appleUserId);
    const { flags, plan, expiresDate, isActive } = mapSubscriberToFlags(subscriberData);

    if (!isActive) {
      return res.status(400).json({ error: "Entitlement not active after receipt validation" });
    }

    await b44FindAndUpdate(appleUserId, {
      ...flags,
      updated_date: new Date().toISOString(),
    });

    return res.status(200).json({
      data: { success: true, plan, expiresDate, productId: subscriberData?.subscriber?.entitlements?.[ENTITLEMENT_ID]?.product_identifier || productId },
    });
  } catch (err) {
    console.error("[handleAppleIAP] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
