/**
 * api/verifyPurchase.js
 *
 * Handles purchase verification and restore-purchases for the app.
 *
 * Required environment variables:
 *   REVENUECAT_SECRET_KEY  — RevenueCat server-side secret key
 *   BASE44_SERVICE_TOKEN   — Base44 service-role token
 */

import { B44_ENTITIES, b44Fetch, b44Token } from "./_b44.js";
import {
  mapSubscriberToFlags,
  fetchRCSubscriber,
  postReceiptToRC,
} from "./_rcMapping.js";

/**
 * Find a UserProfile by apple_user_id (with fallback to user_id) and update it.
 * Returns true on success, false if no profile was found.
 */
async function b44FindAndUpdate(appleUserId, data) {
  const token = b44Token();

  // Primary lookup: apple_user_id
  let profiles = [];
  try {
    const r1 = await fetch(
      `${B44_ENTITIES}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (r1.ok) profiles = await r1.json();
  } catch {}

  // Fallback: user_id field
  if (!Array.isArray(profiles) || profiles.length === 0) {
    try {
      const r2 = await fetch(
        `${B44_ENTITIES}/UserProfile?user_id=${encodeURIComponent(appleUserId)}&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r2.ok) profiles = await r2.json();
    } catch {}
  }

  if (!Array.isArray(profiles) || profiles.length === 0) {
    console.warn("[verifyPurchase] No profile found for", appleUserId);
    return false;
  }

  const profileId = profiles[0].id;
  try {
    await b44Fetch(`${B44_ENTITIES}/UserProfile/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return true;
  } catch (err) {
    console.error("[verifyPurchase] b44FindAndUpdate PUT failed:", err.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.REVENUECAT_SECRET_KEY) {
    console.error("[verifyPurchase] REVENUECAT_SECRET_KEY env var not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const { profileId, userId, platform, receiptData, productId, action } = req.body || {};
    const appUserId = profileId || userId;
    if (!appUserId) return res.status(400).json({ error: "No user ID" });

    // ── RESTORE PURCHASES ────────────────────────────────────────────────────
    if (action === "restore") {
      let subscriberData;
      try {
        subscriberData = await fetchRCSubscriber(appUserId);
      } catch (err) {
        console.error("[verifyPurchase/restore] RC fetch failed:", err.message);
        return res.status(200).json({ data: { success: false, isPremium: false, message: "No purchases found" } });
      }

      const { flags, plan, expiresDate, isActive } = mapSubscriberToFlags(subscriberData);

      if (isActive) {
        await b44FindAndUpdate(appUserId, {
          ...flags,
          updated_date: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        data: {
          success:     isActive,
          isPremium:   isActive,
          plan:        isActive ? plan : null,
          message:     isActive ? "Purchases restored!" : "No active purchases found.",
          expiresDate: expiresDate,
        },
      });
    }

    // ── VERIFY PURCHASE ──────────────────────────────────────────────────────
    if (receiptData && productId) {
      try {
        await postReceiptToRC(receiptData, appUserId, productId, platform);
      } catch (err) {
        // Non-fatal: log and continue — we still check the subscriber status
        console.warn("[verifyPurchase] receipt POST failed (continuing):", err.message);
      }
    }

    let subscriberData;
    try {
      subscriberData = await fetchRCSubscriber(appUserId);
    } catch (err) {
      console.error("[verifyPurchase] RC subscriber fetch failed:", err.message);
      return res.status(200).json({ data: { success: false, isPremium: false } });
    }

    const { flags, plan, expiresDate, isActive } = mapSubscriberToFlags(subscriberData);

    if (isActive) {
      await b44FindAndUpdate(appUserId, {
        ...flags,
        updated_date: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      data: { success: true, isPremium: isActive, plan: isActive ? plan : null, expiresDate },
    });

  } catch (err) {
    console.error("[verifyPurchase] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
