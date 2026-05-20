/**
 * api/rating-prompt.js
 * Determines if the app should show a rating prompt to the user.
 * Previously a Base44 cloud function.
 */
import { sbFilterQuery } from "./_supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { profileId, apple_user_id } = req.body || {};
  const uid = apple_user_id || profileId;
  if (!uid) return res.status(400).json({ error: "profileId required" });

  try {
    // Show rating prompt if user has 10+ chat sessions
    const chats = await sbFilterQuery("chat_history", { apple_user_id: uid }, "saved_at.desc", 15);
    const should_prompt = chats.length >= 10;
    return res.json({ data: { should_prompt } });
  } catch {
    // Fail silently — rating prompt is non-critical
    return res.json({ data: { should_prompt: false } });
  }
}
