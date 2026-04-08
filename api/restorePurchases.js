const B44_APP     = "69b332a392004d139d4ba495";
const B44_BASE    = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

async function b44FindAndUpdate(appleUserId, data) {
  const searchRes = await fetch(
    `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
    { headers: { "Authorization": `Bearer ${B44_API_KEY}` } }
  );
  if (!searchRes.ok) return false;
  const records = await searchRes.json();
  const record = Array.isArray(records) ? records[0] : records?.data?.[0];
  if (!record?.id) { console.error("[restorePurchases] No UserProfile found for:", appleUserId); return false; }
  const updateRes = await fetch(`${B44_BASE}/UserProfile/${record.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${B44_API_KEY}` },
    body: JSON.stringify(data),
  });
  console.log("[restorePurchases] b44Update status:", updateRes.status, "record:", record.id);
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
    const { profileId, userId } = req.body;
    const appleUserId = profileId || userId;
    if (!appleUserId) return res.status(400).json({ error: "No user ID" });

    console.log("[restorePurchases] called for:", appleUserId);

    const rcRes = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appleUserId)}`, {
      headers: { "Authorization": `Bearer ${RC_SECRET_KEY}` },
    });

    if (!rcRes.ok) return res.status(200).json({ data: { success: false, isPremium: false, message: "No purchases found" } });

    const subscriberData  = await rcRes.json();
    const premiumEnt      = subscriberData?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    const isActive        = premiumEnt && new Date(premiumEnt.expires_date) > new Date();
    const activeProductId = premiumEnt?.product_identifier || "";
    const plan            = PRODUCT_MAP[activeProductId] || (activeProductId.includes("annual") ? "annual" : "monthly");

    console.log("[restorePurchases] RC isPremium:", isActive, "plan:", plan);

    if (isActive) {
      await b44FindAndUpdate(appleUserId, {
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
  } catch (err) {
    console.error("[restorePurchases] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
