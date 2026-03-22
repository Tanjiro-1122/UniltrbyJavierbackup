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
      .select("referral_code")
      .eq("id", profileId)
      .single();

    if (profile?.referral_code) {
      return res.status(200).json({ data: { referral_code: profile.referral_code } });
    }

    // Generate a new code
    const code = "UNFILTR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    await supabase
      .from("user_profile")
      .update({ referral_code: code, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    res.status(200).json({ data: { referral_code: code } });
  } catch (err) {
    console.error("ReferralCode error:", err);
    res.status(500).json({ error: err.message });
  }
}
