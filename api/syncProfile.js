// api/syncProfile.js  
// Single source of truth for all UserProfile DB operations
// Called from HomeScreen (sign-in) and onboarding steps

const B44_APP = "69b332a392004d139d4ba495";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP}/entities`;
const getKey = () => process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

// Decode Apple's identityToken JWT to reliably extract email on every login
function decodeAppleJwt(token) {
  try {
    if (!token) return {};
    const parts = token.split('.');
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch { return {}; }
}



const b44Headers = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getKey()}`,
});

async function findByAppleId(appleUserId) {
  const res = await fetch(
    `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
    { headers: b44Headers() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function findByEmail(email) {
  const res = await fetch(
    `${B44_BASE}/UserProfile?email=${encodeURIComponent(email)}&limit=1`,
    { headers: b44Headers() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function updateProfile(id, data) {
  const res = await fetch(`${B44_BASE}/UserProfile/${id}`, {
    method: "PUT",
    headers: b44Headers(),
    body: JSON.stringify(data),
  });
  return res.ok ? await res.json() : null;
}

async function createProfile(data) {
  const res = await fetch(`${B44_BASE}/UserProfile`, {
    method: "POST",
    headers: b44Headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create failed: ${res.status} ${err}`);
  }
  return await res.json();
}

async function getCompanion(companionId) {
  if (!companionId || companionId === "pending") return null;
  try {
    const res = await fetch(`${B44_BASE}/Companion/${companionId}`, { headers: b44Headers() });
    if (!res.ok) return null;
    const comp = await res.json();
    return {
      avatar_id:           comp.avatar_id          || null,
      name:                comp.name               || null,
      nickname:            comp.nickname           || comp.name || null,
      voice_gender:        comp.voice_gender       || null,
      voice_personality:   comp.voice_personality  || null,
      personality_vibe:    comp.personality_vibe   || null,
      personality_style:   comp.personality_style  || null,
      personality_humor:   comp.personality_humor  || null,
      personality_empathy: comp.personality_empathy|| null,
    };
  } catch { return null; }
}

function buildProfileResponse(profile, companionData) {
  return {
    profileId:           profile.id,
    is_premium:          profile.is_premium || profile.premium || false,
    annual_plan:         profile.annual_plan || false,
    pro_plan:            profile.pro_plan    || false,
    display_name:        profile.display_name || null,
    onboarding_complete: profile.onboarding_complete || false,
    companion_id:        profile.companion_id || null,
    preferred_mood:      profile.preferred_mood || null,
    apple_user_id:       profile.apple_user_id || null,
    email:               profile.email || null,
    message_count:       profile.message_count || 0,
    companion:           companionData,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    action = "sync",         // "sync" | "update" | "create"
    appleUserId,
    email: clientEmail,
    fullName,
    isPremium,
    plan,
    profileId,               // for direct update by ID
    updateData,              // fields to update (for action="update")
    displayName,             // for onboarding name step
    identityToken,           // Apple JWT — always contains email, even on repeat logins
  } = req.body || {};

  // Extract email from Apple's identity token JWT — reliable on EVERY login
  // Apple only sends email in the client payload on first login, but it's
  // always present in the signed JWT token they issue every time.
  const jwtPayload = decodeAppleJwt(identityToken);
  const email = jwtPayload.email || clientEmail || "";

  console.log(`[syncProfile] action=${action} appleUserId=${appleUserId?.slice(0,12)} profileId=${profileId}`);

  try {
    // ── ACTION: update — update a specific profile by ID ──────────────────────
    if (action === "update") {
      if (!profileId) return res.status(400).json({ error: "profileId required for update" });
      const updated = await updateProfile(profileId, updateData || {});
      return res.status(200).json({ ok: true, data: updated });
    }

    // ── ACTION: delete — permanently remove profile from DB ───────────────────
    if (action === "delete") {
      if (!profileId && !appleUserId) return res.status(400).json({ error: "profileId or appleUserId required" });
      let deleteId = profileId;
      // If only appleUserId provided, look up the profile first
      if (!deleteId && appleUserId) {
        const found = await searchProfiles("apple_user_id", appleUserId);
        if (found.length > 0) deleteId = found[0].id;
      }
      if (deleteId) {
        const delRes = await fetch(`${BASE44_API}/apps/${APP_ID}/entities/UserProfile/${deleteId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${serviceToken}`,
            "X-App-Id": APP_ID,
          },
        });
        console.log(`[syncProfile] Deleted profile ${deleteId}: ${delRes.status}`);
      }
      return res.status(200).json({ ok: true, deleted: deleteId || null });
    }

    // ── ACTION: sync — find or create profile for Apple Sign-In ───────────────
    if (!appleUserId) return res.status(400).json({ error: "appleUserId required" });

    // 1. Search by apple_user_id
    let profile = await findByAppleId(appleUserId);

    // 2. Fallback: search by email
    if (!profile && email) {
      profile = await findByEmail(email);
      console.log(`[syncProfile] Found by email: ${profile?.id}`);
    }

    const now = new Date().toISOString();

    if (profile) {
      // ── RETURNING USER: update apple_user_id + last_seen ──────────────────
      const patch = {
        apple_user_id: appleUserId,
        last_seen: now,
        last_active: now,
      };
      if (isPremium) {
        patch.is_premium = true;
        if (plan === "annual") patch.annual_plan = true;
        if (plan === "pro")    patch.pro_plan    = true;
      }
      if (email && !profile.email)        patch.email        = email;
      if (fullName && !profile.display_name) patch.display_name = fullName;

      await updateProfile(profile.id, patch);
      Object.assign(profile, patch); // reflect updates locally

      const companion = await getCompanion(profile.companion_id);
      console.log(`[syncProfile] Returning user ${profile.id} updated`);
      return res.status(200).json({
        isNewUser: false,
        data: buildProfileResponse(profile, companion),
      });

    } else {
      // ── NEW USER: dedup guard — wait 300ms and re-check before creating ──
      // This prevents race conditions where two simultaneous calls both see no profile
      await new Promise(r => setTimeout(r, 300));
      const recheck = await findByAppleId(appleUserId);
      if (recheck) {
        // Another call already created it — treat as returning user
        const companion = await getCompanion(recheck.companion_id);
        console.log(`[syncProfile] Dedup: profile created by concurrent call ${recheck.id}`);
        return res.status(200).json({
          isNewUser: false,
          data: buildProfileResponse(recheck, companion),
        });
      }
      // ── NEW USER: create minimal profile ─────────────────────────────────
      const newProfile = await createProfile({
        apple_user_id: appleUserId,
        email:              email    || "",
        display_name:       fullName || "",
        is_premium:         isPremium || false,
        onboarding_complete: false,
        companion_id:       "pending",
        background_id:      "pending",
        message_count:      0,
        created_at:         now,
        last_seen:          now,
        last_active:        now,
      });

      console.log(`[syncProfile] New user created: ${newProfile.id}`);
      return res.status(200).json({
        isNewUser: true,
        data: buildProfileResponse(newProfile, null),
      });
    }

  } catch (err) {
    console.error("[syncProfile] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
