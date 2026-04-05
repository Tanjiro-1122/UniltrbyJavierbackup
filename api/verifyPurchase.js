// ✅ Hardcoded production app ID — VITE_ vars are NOT available in Vercel serverless functions
const B44_APP  = "69b332a392004d139d4ba495";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

// Find the UserProfile record by apple_user_id, then update it
async function b44FindAndUpdate(appleUserId, data) {
  // Step 1: search for the profile by apple_user_id
  const searchRes = await fetch(
    `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
    { headers: { "ApiKey": B44_API_KEY } }
  );
  if (!searchRes.ok) {
    console.error("[verifyPurchase] b44 search failed:", searchRes.status);
    return false;
  }
  const records = await searchRes.json();
  const record = Array.isArray(records) ? records[0] : records?.data?.[0];

  if (!record?.id) {
    console.error("[verifyPurchase] No UserProfile found for apple_user_id:", appleUserId);
    return false;
  }

  // Step 2: update using the real record ID
  const updateRes = await fetch(`${B44_BASE}/UserProfile/${record.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "ApiKey": B44_API_KEY },
    body: JSON.stringify(data),
  });
  console.log("[verifyPurchase] b44Update status:", updateRes.status, "for record:", record.id);
  return updateRes.ok;
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
    const { profileId, userId, platform, receiptData, productId } = req.body;
    const appleUserId = profileId || userId;
    if (!appleUserId) return res.status(400).json({ error: "No user ID" });

    console.log("[verifyPurchase] called for:", appleUserId, "product:", productId);

    if (receiptData && productId) {
      await fetch(`${RC_API_BASE}/receipts`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${RC_SECRET_KEY}`,
          "X-Platform":    platform === "android" ? "android" : "ios",
        },
        body: JSON.stringify({ app_user_id: appleUserId, fetch_token: receiptData, product_id: productId }),
      });
    }

    const rcRes = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appleUserId)}`, {
      headers: { "Authorization": `Bearer ${RC_SECRET_KEY}`, "X-Platform": "ios" },
    });

    if (!rcRes.ok) {
      console.error("[verifyPurchase] RC subscriber fetch failed:", rcRes.status);
      return res.status(200).json({ data: { success: false, isPremium: false } });
    }

    const subscriberData = await rcRes.json();
    const premiumEnt     = subscriberData?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    const isActive       = premiumEnt && new Date(premiumEnt.expires_date) > new Date();
    const activeProductId = premiumEnt?.product_identifier || productId || "";
    const plan            = PRODUCT_MAP[activeProductId] || (activeProductId.includes("annual") ? "annual" : "monthly");

    console.log("[verifyPurchase] RC isPremium:", isActive, "plan:", plan);

    if (isActive) {
      await b44FindAndUpdate(appleUserId, {
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
