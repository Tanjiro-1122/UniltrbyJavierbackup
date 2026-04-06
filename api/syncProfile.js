// api/syncProfile.js
// Called after Apple Sign-In to ensure apple_user_id is written to the UserProfile
// and to return the real Base44 record ID for localStorage

const B44_APP     = "69b332a392004d139d4ba495";
const B44_BASE    = `https://app.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { appleUserId, email, fullName, isPremium, plan } = req.body;
  if (!appleUserId) return res.status(400).json({ error: "No appleUserId" });

  console.log("[syncProfile] syncing:", appleUserId);

  try {
    // Step 1: Search for existing profile by apple_user_id
    let profile = null;

    const byApple = await fetch(
      `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
      { headers: { "Authorization": `Bearer ${B44_API_KEY}` } }
    );
    const appleRecords = await byApple.json();
    if (Array.isArray(appleRecords) && appleRecords.length > 0) {
      profile = appleRecords[0];
      console.log("[syncProfile] Found by apple_user_id:", profile.id);
    }

    // Step 2: If not found, try by email
    if (!profile && email) {
      const byEmail = await fetch(
        `${B44_BASE}/UserProfile?email=${encodeURIComponent(email)}&limit=1`,
        { headers: { "Authorization": `Bearer ${B44_API_KEY}` } }
      );
      const emailRecords = await byEmail.json();
      if (Array.isArray(emailRecords) && emailRecords.length > 0) {
        profile = emailRecords[0];
        console.log("[syncProfile] Found by email:", profile.id);
      }
    }

    if (profile) {
      // Step 3: Update existing profile — set apple_user_id and premium if needed
      const updateData = { apple_user_id: appleUserId };
      if (isPremium) {
        updateData.is_premium = true;
        if (plan === 'annual') updateData.annual_plan = true;
        if (plan === 'pro')    updateData.pro_plan = true;
      }
      if (email && !profile.email) updateData.email = email;
      if (fullName && !profile.display_name) updateData.display_name = fullName;

      await fetch(`${B44_BASE}/UserProfile/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${B44_API_KEY}` },
        body: JSON.stringify(updateData),
      });

      console.log("[syncProfile] Updated profile:", profile.id, JSON.stringify(updateData));

      return res.status(200).json({
        data: {
          profileId:  profile.id,
          is_premium: isPremium || profile.is_premium || false,
          annual_plan: profile.annual_plan || false,
          pro_plan:    profile.pro_plan || false,
          display_name: profile.display_name || fullName || null,
        }
      });
    }

    // Step 4: No profile found — return null so client handles onboarding
    console.log("[syncProfile] No profile found for:", appleUserId);
    return res.status(200).json({ data: null });

  } catch (err) {
    console.error("[syncProfile] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
