// api/utils.js
// Merged: generateReferralCode + ratingPrompt (to stay under Vercel 12-function limit)

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

async function handleGenerateReferralCode(req, res) {
  const { profileId } = req.body;
  if (!profileId) return res.status(400).json({ error: "Missing profileId" });

  const profile = await b44Get("UserProfile", profileId);
  if (profile?.referral_code) {
    return res.status(200).json({ data: { referral_code: profile.referral_code } });
  }

  const code = "UNFILTR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  await b44Update("UserProfile", profileId, { referral_code: code });
  res.status(200).json({ data: { referral_code: code } });
}

async function handleRatingPrompt(req, res) {
  const { profileId } = req.body;
  if (!profileId) return res.status(400).json({ error: "Missing profileId" });

  const profile = await b44Get("UserProfile", profileId);
  if (!profile) return res.status(200).json({ data: { should_prompt: false } });

  const msgCount        = profile.message_count || 0;
  const alreadyPrompted = profile.rating_prompted || false;
  const createdDate     = profile.created_date || profile.created_at;
  const daysSinceJoin   = createdDate ? (Date.now() - new Date(createdDate).getTime()) / (1000*60*60*24) : 99;

  const should_prompt = !alreadyPrompted && msgCount >= 10 && daysSinceJoin >= 2;

  if (should_prompt) {
    await b44Update("UserProfile", profileId, {
      rating_prompted:    true,
      rating_prompted_at: new Date().toISOString(),
    });
  }

  res.status(200).json({ data: { should_prompt } });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body;

  try {
    if (action === "generateReferralCode") return await handleGenerateReferralCode(req, res);
    if (action === "ratingPrompt")         return await handleRatingPrompt(req, res);
    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("[utils] Error:", err);
    res.status(500).json({ error: err.message });
  }
}
