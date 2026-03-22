import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { platform, receiptData, productId, purchaseToken, profileId } = req.body;

    // For now mark as premium — full receipt validation can be added later
    if (profileId) {
      const isAnnual = productId?.includes("annual") || productId?.includes("yearly");
      await supabase
        .from("user_profile")
        .update({ is_premium: true, annual_plan: isAnnual, updated_date: new Date().toISOString() })
        .eq("id", profileId);
    }

    res.status(200).json({ data: { success: true, plan: productId?.includes("annual") ? "annual" : "monthly" } });
  } catch (err) {
    console.error("VerifyPurchase error:", err);
    res.status(500).json({ error: err.message });
  }
}
