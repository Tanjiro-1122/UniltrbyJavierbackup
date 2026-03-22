/**
 * Handles Apple StoreKit IAP receipt validation.
 * Validates with Apple servers, then marks user as premium in Supabase.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const SANDBOX_URL    = "https://sandbox.itunes.apple.com/verifyReceipt";

const PRODUCT_MAP = {
  "com.huertas.unfiltr.premium.monthly": "monthly",
  "com.huertas.unfiltr.premium.annual":  "annual",
};

async function validateWithApple(receiptData, url) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptData,
      password: process.env.APPLE_SHARED_SECRET,
      "exclude-old-transactions": true,
    }),
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { receipt, productId, profileId: bodyProfileId } = req.body;
    const profileId = bodyProfileId || req.body.userId || null;

    if (!receipt) {
      return res.status(400).json({ error: "No receipt provided" });
    }

    // Try production first, fall back to sandbox (required per Apple rules)
    let appleResponse = await validateWithApple(receipt, PRODUCTION_URL);
    if (appleResponse.status === 21007) {
      // 21007 = sandbox receipt sent to production → retry with sandbox
      appleResponse = await validateWithApple(receipt, SANDBOX_URL);
    }

    if (appleResponse.status !== 0) {
      console.error("[IAP] Apple validation failed, status:", appleResponse.status);
      return res.status(400).json({ error: "Receipt validation failed", appleStatus: appleResponse.status });
    }

    // Get the latest receipt info
    const latestReceipts = appleResponse.latest_receipt_info || appleResponse.receipt?.in_app || [];
    const sorted = [...latestReceipts].sort((a, b) =>
      parseInt(b.purchase_date_ms || 0) - parseInt(a.purchase_date_ms || 0)
    );
    const latest = sorted[0];
    const validatedProductId = latest?.product_id || productId;
    const plan = PRODUCT_MAP[validatedProductId] || "monthly";
    const expiresMs = latest?.expires_date_ms ? parseInt(latest.expires_date_ms) : null;
    const isActive = !expiresMs || expiresMs > Date.now();

    if (!isActive) {
      return res.status(400).json({ error: "Subscription expired" });
    }

    // Update Supabase if we have a profileId
    if (profileId) {
      await supabase
        .from("user_profile")
        .update({
          is_premium: true,
          annual_plan: plan === "annual",
          updated_date: new Date().toISOString(),
        })
        .eq("id", profileId);
    }

    return res.status(200).json({
      data: {
        success: true,
        plan,
        expiresDate: expiresMs ? new Date(expiresMs).toISOString() : null,
        productId: validatedProductId,
      },
    });

  } catch (err) {
    console.error("[IAP] handleAppleIAP error:", err);
    return res.status(500).json({ error: err.message });
  }
}
