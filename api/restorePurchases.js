const B44_APP  = process.env.VITE_BASE44_APP_ID;
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;

async function b44Update(entity, id, data) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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
    const { profileId, userId } = req.body;
    const appUserId = profileId || userId;
    if (!appUserId) return res.status(400).json({ error: "No user ID" });

    const rcRes = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: { "Authorization": `Bearer ${RC_SECRET_KEY}` },
    });

    if (!rcRes.ok) return res.status(200).json({ data: { success: false, isPremium: false, message: "No purchases found" } });

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
      data: { success: isActive, isPremium: isActive, plan: isActive ? plan : null, message: isActive ? "Purchases restored!" : "No active purchases found." },
    });
  } catch (err) {
    console.error("[restorePurchases] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
