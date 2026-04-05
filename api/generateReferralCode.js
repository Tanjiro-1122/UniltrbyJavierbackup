// api/generateReferralCode.js
// Generates or retrieves a referral code for a user profile
// Fixed: use hardcoded production app ID + BASE44_SERVICE_TOKEN (VITE_ vars are not available server-side)

const B44_APP  = "69b332a392004d139d4ba495";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;

async function b44Get(entity, id) {
  const token = process.env.BASE44_SERVICE_TOKEN;
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Update(entity, id, data) {
  const token = process.env.BASE44_SERVICE_TOKEN;
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: "Missing profileId" });

    const profile = await b44Get("UserProfile", profileId);
    if (profile?.referral_code) {
      return res.status(200).json({ data: { referral_code: profile.referral_code } });
    }

    const code = "UNFILTR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    await b44Update("UserProfile", profileId, { referral_code: code });

    res.status(200).json({ data: { referral_code: code } });
  } catch (err) {
    console.error("ReferralCode error:", err);
    res.status(500).json({ error: err.message });
  }
}
