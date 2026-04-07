// api/syncProfile.js
// Called after Apple Sign-In to ensure apple_user_id is written to the UserProfile
// and to return the real Base44 record ID + companion data for device restore

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
      // Step 3: Update existing profile
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

      console.log("[syncProfile] Updated profile:", profile.id);

      // Step 4: Fetch companion data so the new device can restore the right character
      let companionData = null;
      if (profile.companion_id) {
        try {
          const compRes = await fetch(
            `${B44_BASE}/Companion/${profile.companion_id}`,
            { headers: { "Authorization": `Bearer ${B44_API_KEY}` } }
          );
          if (compRes.ok) {
            const comp = await compRes.json();
            companionData = {
              avatar_id:          comp.avatar_id    || null,  // e.g. "ash", "luna"
              name:               comp.name         || null,
              nickname:           comp.nickname     || comp.name || null,
              voice_gender:       comp.voice_gender || null,
              voice_personality:  comp.voice_personality || null,
              personality_vibe:   comp.personality_vibe  || null,
              personality_style:  comp.personality_style || null,
              personality_humor:  comp.personality_humor || null,
              personality_empathy:comp.personality_empathy || null,
            };
            console.log("[syncProfile] Companion restored:", companionData.name, companionData.avatar_id);
          }
        } catch(e) {
          console.warn("[syncProfile] Companion fetch failed (non-fatal):", e.message);
        }
      }

      return res.status(200).json({
        data: {
          profileId:           profile.id,
          is_premium:          isPremium || profile.is_premium || false,
          annual_plan:         profile.annual_plan || false,
          pro_plan:            profile.pro_plan || false,
          display_name:        profile.display_name || fullName || null,
          onboarding_complete: profile.onboarding_complete || false,
          companion_id:        profile.companion_id || null,
          preferred_mood:      profile.preferred_mood || null,
          companion:           companionData,  // NEW: full companion restore data
        }
      });
    }

    // No profile found — brand new user
    console.log("[syncProfile] No profile found for:", appleUserId);
    return res.status(200).json({ data: null });

  } catch (err) {
    console.error("[syncProfile] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
