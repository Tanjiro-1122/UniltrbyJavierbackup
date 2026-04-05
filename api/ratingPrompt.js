// api/ratingPrompt.js
// Determines if we should prompt the user to rate the app
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
  } catch (err) {
    console.error("RatingPrompt error:", err);
    res.status(500).json({ error: err.message });
  }
}
