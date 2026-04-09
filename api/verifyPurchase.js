// ✅ Hardcoded prod app ID — VITE_ vars are unavailable in serverless
const B44_APP     = "69b332a392004d139d4ba495";
const B44_BASE    = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

async function b44FindAndUpdate(appleUserId, data) {
  const searchRes = await fetch(
    `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
    { headers: { "Authorization": `Bearer ${B44_API_KEY}` } }
  );
  let profiles = [];
  try { profiles = await searchRes.json(); } catch {}

  // Fallback: search by user_id field
  if (!profiles?.length) {
    const r2 = await fetch(
      `${B44_BASE}/UserProfile?user_id=${encodeURIComponent(appleUserId)}`,
      { headers: { "Authorization": `Bearer ${B44_API_KEY}` } }
    );
    try { profiles = await r2.json(); } catch {}
  }

  if (!Array.isArray(profiles) || profiles.length === 0) {
    console.warn("[verifyPurchase] No profile found for", appleUserId);
    return false;
  }

  const profileId = profiles[0].id;
  const res = await fetch(`${B44_BASE}/UserProfile/${profileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${B44_API_KEY}` },
    body: JSON.stringify(data),
  });
  return res.ok;
}

const RC_SECRET_KEY  = process.env.REVENUECAT_SECRET_KEY;
const RC_API_BASE    = "https://api.revenuecat.com/v1";
const ENTITLEMENT_ID = "unfiltr by javier Pro";

const PRODUCT_MAP = {
  "com.huertas.unfiltr.pro.monthly": "monthly",
  "com.huertas.unfiltr.tier.pro":    "pro",
  "com.huertas.unfiltr.pro.annual":  "annual",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { profileId, userId, platform, receiptData, productId, action } = req.body;
    const appUserId = profileId || userId;
    if (!appUserId) return res.status(400).json({ error: "No user ID" });

    // ── RESTORE PURCHASES (merged from restorePurchases.js) ──────────────────
    if (action === "restore") {
      const rcRes = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
        headers: { "Authorization": `Bearer ${RC_SECRET_KEY}` },
      });
      if (!rcRes.ok) return res.status(200).json({ data: { success: false, isPremium: false, message: "No purchases found" } });

      const subscriberData  = await rcRes.json();
      const premiumEnt      = subscriberData?.subscriber?.entitlements?.[ENTITLEMENT_ID];
      const isActive        = premiumEnt && new Date(premiumEnt.expires_date) > new Date();
      const activeProductId = premiumEnt?.product_identifier || "";
      const plan            = PRODUCT_MAP[activeProductId] || (activeProductId.includes("annual") ? "annual" : "monthly");

      if (isActive) {
        await b44FindAndUpdate(appUserId, {
          is_premium:   true,
          pro_plan:     plan === "pro",
          annual_plan:  plan === "annual",
          updated_date: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        data: {
          success:     isActive,
          isPremium:   isActive,
          plan:        isActive ? plan : null,
          message:     isActive ? "Purchases restored!" : "No active purchases found.",
          expiresDate: premiumEnt?.expires_date || null,
        },
      });
    }

    // ── VERIFY PURCHASE (original flow) ──────────────────────────────────────
    if (receiptData && productId) {
      await fetch(`${RC_API_BASE}/receipts`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${RC_SECRET_KEY}`,
          "X-Platform":    platform === "android" ? "android" : "ios",
        },
        body: JSON.stringify({ app_user_id: appUserId, fetch_token: receiptData, product_id: productId }),
      });
    }

    const rcRes = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: { "Authorization": `Bearer ${RC_SECRET_KEY}`, "X-Platform": "ios" },
    });

    if (!rcRes.ok) return res.status(200).json({ data: { success: false, isPremium: false } });

    const subscriberData  = await rcRes.json();
    const premiumEnt      = subscriberData?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    const isActive        = premiumEnt && new Date(premiumEnt.expires_date) > new Date();
    const activeProductId = premiumEnt?.product_identifier || productId || "";
    const plan            = PRODUCT_MAP[activeProductId] || (activeProductId.includes("annual") ? "annual" : "monthly");

    if (isActive) {
      await b44FindAndUpdate(appUserId, {
        is_premium:   true,
        pro_plan:     plan === "pro",
        annual_plan:  plan === "annual",
        updated_date: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      data: { success: true, isPremium: isActive, plan: isActive ? plan : null, expiresDate: premiumEnt?.expires_date || null },
    });

  } catch (err) {
    console.error("[verifyPurchase] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
