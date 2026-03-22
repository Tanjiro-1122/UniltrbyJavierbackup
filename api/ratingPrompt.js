import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: "Missing profileId" });

    const { data: profile } = await supabase
      .from("user_profile")
      .select("message_count, rating_prompted, created_at")
      .eq("id", profileId)
      .single();

    if (!profile) return res.status(200).json({ data: { should_prompt: false } });

    const msgCount = profile.message_count || 0;
    const alreadyPrompted = profile.rating_prompted || false;
    const daysSinceJoin = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);

    const should_prompt = !alreadyPrompted && msgCount >= 10 && daysSinceJoin >= 2;

    if (should_prompt) {
      await supabase
        .from("user_profile")
        .update({ rating_prompted: true, rating_prompted_at: new Date().toISOString() })
        .eq("id", profileId);
    }

    res.status(200).json({ data: { should_prompt } });
  } catch (err) {
    console.error("RatingPrompt error:", err);
    res.status(500).json({ error: err.message });
  }
}
