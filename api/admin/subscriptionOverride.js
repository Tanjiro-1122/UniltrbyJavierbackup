import { B44_ENTITIES, b44Fetch } from "../_b44.js";

const ADMIN_TOKEN = "unfiltr_admin_javier1122_secret";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken, userId, subscription, reason } = req.body || {};
  if (adminToken !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  if (!userId) return res.status(400).json({ error: "userId required" });
  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ error: "Reason required (minimum 3 characters)" });
  }

  try {
    const updateData = {
      is_premium: !!(subscription?.is_premium),
      pro_plan: !!(subscription?.pro_plan),
      annual_plan: !!(subscription?.annual_plan),
      trial_active: !!(subscription?.trial_active),
    };
    if (subscription?.subscription_expires) {
      updateData.subscription_expires = subscription.subscription_expires;
    }

    await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    // Write audit log entry (non-fatal — log failure won't block the override)
    try {
      await b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
        method: "POST",
        body: JSON.stringify({
          entity_type: "UserProfile",
          entity_id: userId,
          action: "subscription_override",
          changes: JSON.stringify(updateData),
          reason: reason.trim(),
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (logErr) {
      console.warn("[admin/subscriptionOverride] Audit log write failed (non-fatal):", logErr.message);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[admin/subscriptionOverride] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
