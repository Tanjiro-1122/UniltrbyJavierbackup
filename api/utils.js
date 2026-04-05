// api/utils.js
// Merged: generateReferralCode + ratingPrompt + generateMoodImage (to stay under Vercel 12-function limit)

import OpenAI from "openai";

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

const MOOD_PROMPTS = {
  happy:      "dreamlike watercolor scene, golden sunlight streaming through cherry blossom trees, soft pastel colors, floating petals, warm and joyful atmosphere, studio ghibli anime style, no text",
  sad:        "melancholic anime landscape, soft blue rain on a window at night, distant city lights blurred, lonely but peaceful, muted indigo and blue palette, studio ghibli style, no text",
  anxious:    "swirling dark watercolor storm with a small glowing lantern in the center, anxiety and hope coexisting, deep purple and grey tones, anime art style, no text",
  grateful:   "warm anime sunrise over a peaceful mountain lake, golden reflections, soft morning mist, feeling of deep gratitude and stillness, studio ghibli style, no text",
  reflective: "anime character silhouette sitting alone at the edge of a rooftop at dusk, city lights below, contemplative and serene, cool purple and pink tones, no text",
  excited:    "vibrant anime celebration scene, colorful confetti and sparkling lights, bright pinks and yellows, electric energy and pure joy, no text",
  neutral:    "soft anime cloudy afternoon, a cozy window seat with warm tea, gentle diffused light, calm and introspective mood, studio ghibli style, no text",
};

async function handleGenerateMoodImage(req, res) {
  const { mood, content } = req.body;
  if (!mood) return res.status(400).json({ error: "Missing mood" });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Build a richer prompt using the journal content if available
  let prompt = MOOD_PROMPTS[mood] || MOOD_PROMPTS.neutral;
  if (content && content.length > 20) {
    // Use first 150 chars of content to add context flavor
    const snippet = content.trim().slice(0, 150);
    prompt = `${prompt}, inspired by the feeling: "${snippet}"`;
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) return res.status(500).json({ error: "No image URL returned" });

    res.status(200).json({ data: { url: imageUrl } });
  } catch (err) {
    console.error("[generateMoodImage] OpenAI error:", err);
    res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body;

  try {
    if (action === "generateReferralCode") return await handleGenerateReferralCode(req, res);
    if (action === "ratingPrompt")         return await handleRatingPrompt(req, res);
    if (action === "generateMoodImage")    return await handleGenerateMoodImage(req, res);
    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("[utils] Error:", err);
    res.status(500).json({ error: err.message });
  }
}
