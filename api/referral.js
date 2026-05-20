/**
 * api/referral.js
 * Handles referral code generation — previously a Base44 cloud function.
 */
import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, profileId } = req.body || {};

  if (action === "generateReferralCode") {
    if (!profileId) return res.status(400).json({ error: "profileId required" });
    // Generate a deterministic referral code from profileId
    const code = crypto.createHash("sha256").update(profileId).digest("hex").slice(0, 8).toUpperCase();
    return res.json({ data: { code, profileId } });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}
