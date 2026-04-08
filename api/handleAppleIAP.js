const B44_APP  = "69b22f8b58e45d23cafd78d2";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

async function b44FindAndUpdate(appleUserId, data) {
  const searchRes = await fetch(
    `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
    { headers: { "Authorization": `Bearer ${B44_API_KEY}` } }
  );
  if (!searchRes.ok) return false;
  const records = await searchRes.json();
  const record = Array.isArray(records) ? records[0] : records?.data?.[0];
  if (!record?.id) { console.error("[handleAppleIAP] No UserProfile found for:", appleUserId); return false; }
  const updateRes = await fetch(`${B44_BASE}/UserProfile/${record.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${B44_API_KEY}` },
    body: JSON.stringify(data),
  });
  console.log("[handleAppleIAP] b44Update status:", updateRes.status, "record:", record.id);
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

async function postReceiptToRevenueCat(receiptData, appUserId, productId) {
  const priceMap = {
    "com.huertas.unfiltr.pro.monthly": 9.99,
    "com.huertas.unfiltr.tier.pro":    14.99,
    "com.huertas.unfiltr.pro.annual":  59.99,
  };
  const res = await fetch(`${RC_API_BASE}/receipts`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${RC_SECRET_KEY}`,
      "X-Platform":    "ios",
    },
    body: JSON.stringify({
      app_user_id:  appUserId,
      fetch_token:  receiptData,
      product_id:   productId,
      price:        priceMap[productId] ?? 9.99,
      currency:     "USD",
    }),
  });
  if (!res.ok) throw new Error(`RevenueCat receipt POST failed: ${res.status}`);
  return res.json();
}

async function getSubscriberInfo(appUserId) {
  const res = await fetch(`${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { "Authorization": `Bearer ${RC_SECRET_KEY}`, "X-Platform": "ios" },
  });
  if (!res.ok) throw new Error(`RevenueCat subscriber GET failed: ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { receipt, productId, profileId, userId } = req.body;
    const appleUserId = profileId || userId;
    if (!receipt)      return res.status(400).json({ error: "No receipt provided" });
    if (!appleUserId)  return res.status(400).json({ error: "No user ID provided" });

    console.log("[handleAppleIAP] called for:", appleUserId, "product:", productId);

    await postReceiptToRevenueCat(receipt, appleUserId, productId);

    const subscriberData = await getSubscriberInfo(appleUserId);
    const entitlements   = subscriberData?.subscriber?.entitlements || {};
    const premiumEnt     = entitlements[ENTITLEMENT_ID];
    const isActive       = premiumEnt && new Date(premiumEnt.expires_date) > new Date();

    if (!isActive) return res.status(400).json({ error: "Entitlement not active after receipt validation" });

    const activeProductId = premiumEnt.product_identifier || productId;
    const plan            = PRODUCT_MAP[activeProductId] || "monthly";
    const expiresDate     = premiumEnt.expires_date;

    await b44FindAndUpdate(appleUserId, {
      is_premium:   true,
      pro_plan:     plan === "pro",
      annual_plan:  plan === "annual",
      updated_date: new Date().toISOString(),
    });

    return res.status(200).json({ data: { success: true, plan, expiresDate, productId: activeProductId } });
  } catch (err) {
    console.error("[handleAppleIAP] error:", err);
    return res.status(500).json({ error: err.message });
  }
}