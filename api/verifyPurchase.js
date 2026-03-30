const B44_APP  = process.env.VITE_BASE44_APP_ID;
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;

const B44_API_KEY = process.env.BASE44_API_KEY || "";

async function b44Update(entity, id, data) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "ApiKey": B44_API_KEY },
    body: JSON.stringify(data),
  });
  return res.ok;
}

const RC_SECRET_KEY  = process.env.REVENUECAT_SECRET_KEY;
const RC_API_BASE    = "https://api.revenuecat.com/v1";
const ENTITLEMENT_ID = "unfiltr by javier Pro";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { profileId, userId, platform, receiptData, productId } = req.body;
    const appUserId = profileId || userId;
    if (!appUserId) return res.status(400).json({ error: "No user ID" });

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

    const subscriberData = await rcRes.json();
    const premiumEnt     = subscriberData?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    const isActive       = premiumEnt && new Date(premiumEnt.expires_date) > new Date();
    const plan           = premiumEnt?.product_identifier?.includes("annual") ? "annual" : "monthly";

    if (isActive) {
      await b44Update("UserProfile", appUserId, {
        is_premium:   true,
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
