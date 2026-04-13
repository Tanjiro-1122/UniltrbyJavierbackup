// api/syncProfile.js  
// Single source of truth for all UserProfile DB operations
// Called from HomeScreen (sign-in) and onboarding steps

import { B44_ENTITIES, b44Token, b44Headers } from "./_b44.js";
import { createRequestContext, checkRateLimit } from "./_helpers.js";

// Alias so the rest of the file is unchanged
const B44_BASE = B44_ENTITIES;
const getKey = b44Token;

// Decode Apple's identityToken JWT payload (base64 only — no signature verification).
// SECURITY NOTE: The decoded payload is NOT cryptographically verified here.
// Consequently it must NEVER be used to look up or link user accounts — an attacker
// could craft a token with a victim's email to hijack their profile.
// Use the payload only to backfill non-sensitive fields (e.g. email) on a profile
// that has ALREADY been located by the trusted apple_user_id from the Apple SDK.
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



// Parse a Base44 list response — handles both plain array and wrapped formats:
// { items: [...] }, { records: [...] }, or just [...]
function _toRecords(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items))   return data.items;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

async function findByAppleId(appleUserId) {
  try {
    const res = await fetch(
      `${B44_BASE}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
      { headers: b44Headers() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const records = _toRecords(data);
    return records.length > 0 ? records[0] : null;
  } catch (e) {
    console.warn(`[syncProfile] findByAppleId failed: ${e.message}`);
    return null;
  }
}

async function findByEmail(email) {
  try {
    const res = await fetch(
      `${B44_BASE}/UserProfile?email=${encodeURIComponent(email)}&limit=1`,
      { headers: b44Headers() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const records = _toRecords(data);
    return records.length > 0 ? records[0] : null;
  } catch (e) {
    console.warn(`[syncProfile] findByEmail failed: ${e.message}`);
    return null;
  }
}

async function findByDisplayName(name) {
  if (!name || name.trim().length < 2) return null;
  try {
    const res = await fetch(
      `${B44_BASE}/UserProfile?display_name=${encodeURIComponent(name.trim())}&limit=5`,
      { headers: b44Headers() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const records = _toRecords(data);
    if (records.length === 0) return null;
    // Prefer profiles with no apple_user_id (migrating old users)
    const noApple = records.find(p => !p.apple_user_id);
    return noApple || null;
  } catch { return null; }
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
      personality_curiosity: comp.personality_curiosity || null,
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

  const ctx = createRequestContext(req);
  res.setHeader("X-Request-Id", ctx.requestId);

  const rl = checkRateLimit(ctx.userId, ctx.clientIp);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.retryAfterSeconds}s and try again.`,
    });
  }

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
    pushToken,               // Expo push token from native bridge
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
      // Verify the caller owns this profile by checking appleUserId matches the stored record.
      // Without this, any client that knows a profileId can overwrite arbitrary fields.
      if (appleUserId) {
        let profile;
        try {
          const res2 = await fetch(`${B44_BASE}/UserProfile/${profileId}`, { headers: b44Headers() });
          profile = res2.ok ? await res2.json() : null;
        } catch { profile = null; }
        if (!profile) return res.status(404).json({ error: "Profile not found" });
        if (profile.apple_user_id && profile.apple_user_id !== appleUserId) {
          console.warn(`[syncProfile] update rejected: appleUserId mismatch for profile ${profileId}`);
          return res.status(403).json({ error: "Forbidden" });
        }
      }
      const updated = await updateProfile(profileId, updateData || {});
      return res.status(200).json({ ok: true, data: updated });
    }

    // ── ACTION: delete — permanently remove profile from DB ───────────────────
    if (action === "delete") {
      if (!profileId && !appleUserId) return res.status(400).json({ error: "profileId or appleUserId required" });
      // Require appleUserId for all delete requests so ownership can always be verified.
      // A caller that only knows the profileId (a DB record ID) cannot prove they own it.
      if (!appleUserId) {
        console.warn(`[syncProfile] delete rejected: appleUserId required for ownership verification`);
        return res.status(403).json({ error: "appleUserId required to verify ownership before deletion" });
      }
      let deleteId = profileId;
      // If only appleUserId provided, look up the profile first
      if (!deleteId && appleUserId) {
        const found = await findByAppleId(appleUserId);
        if (found) deleteId = found.id;
      }
      if (deleteId) {
        // Ownership check — verify the caller owns this profile before deleting.
        let targetProfile;
        try {
          const r = await fetch(`${B44_BASE}/UserProfile/${deleteId}`, { headers: b44Headers() });
          targetProfile = r.ok ? await r.json() : null;
        } catch { targetProfile = null; }
        if (!targetProfile) return res.status(404).json({ error: "Profile not found" });
        // Reject deletion when:
        // 1. The target profile has no apple_user_id set (can't verify ownership of anonymous profiles)
        // 2. The target profile's apple_user_id doesn't match the caller
        if (!targetProfile.apple_user_id || targetProfile.apple_user_id !== appleUserId) {
          console.warn(`[syncProfile] delete rejected: appleUserId mismatch for profile ${deleteId}`);
          return res.status(403).json({ error: "Forbidden" });
        }
        const delRes = await fetch(`${B44_BASE}/UserProfile/${deleteId}`, {
          method: "DELETE",
          headers: b44Headers(),
        });
        console.log(`[syncProfile] Deleted profile ${deleteId}: ${delRes.status}`);
      }
      return res.status(200).json({ ok: true, deleted: deleteId || null });
    }

    // ── ACTION: sync — find or create profile for Apple Sign-In ───────────────
    if (!appleUserId) return res.status(400).json({ error: "appleUserId required" });

    // 1. Search by apple_user_id
    let profile = await findByAppleId(appleUserId);

    // NOTE: email-based fallback lookup has been intentionally removed.
    // Using an unverified JWT email to locate accounts would allow an attacker
    // to forge a token with a victim's email and take over their profile.
    // findByEmail() must not be used as a profile-lookup step here.

    // 2. Last resort: find by display_name for users migrating from old app (no apple_user_id stored)
    if (!profile && fullName && fullName.trim().length > 1) {
      profile = await findByDisplayName(fullName);
      if (profile) console.log(`[syncProfile] Found by display_name: ${profile?.id}`);
    }

    const now = new Date().toISOString();

    if (profile) {
      // ── If account was requested for deletion, wipe it and treat as new user ──
      if (profile.account_delete_requested) {
        console.log(`[syncProfile] Profile ${profile.id} was marked for deletion — wiping and treating as new`);
        try {
          const res = await fetch(`${B44_BASE}/UserProfile/${profile.id}`, {
            method: "DELETE",
            headers: b44Headers(),
          });
          console.log(`[syncProfile] Deleted stale profile: ${res.status}`);
        } catch (e) {
          console.warn(`[syncProfile] Could not delete stale profile: ${e.message}`);
        }
        profile = null; // fall through to new user creation below
      }
    }

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
      if (pushToken && pushToken.startsWith("ExponentPushToken")) {
        patch.push_token   = pushToken;
        patch.push_enabled = true;
      }
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
      push_token:         (pushToken && pushToken.startsWith("ExponentPushToken")) ? pushToken : null,
      push_enabled:       !!(pushToken && pushToken.startsWith("ExponentPushToken")),
        display_name:       fullName && fullName.trim() ? fullName.trim() : "",
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
