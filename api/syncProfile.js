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

const RECOVERY_BACKUP_LIMIT = 30;
function isPaidRecoveryEligible(profile = {}) {
  return !!(profile.is_premium || profile.premium || profile.pro_plan || profile.annual_plan || profile.ultimate_friend || profile.family_unlimited || profile.family_plan);
}
function recoveryBackupId(prefix = "backup") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}
function isMemoryClearUpdate(updateData = {}) {
  const hasMemoryKeys = ["memory_summary", "user_facts", "session_memory", "emotional_timeline", "memory_vectors"].some(k => Object.prototype.hasOwnProperty.call(updateData, k));
  if (!hasMemoryKeys) return false;
  const summaryCleared = updateData.memory_summary === "" || updateData.memory_summary === null;
  const factsCleared = updateData.user_facts && typeof updateData.user_facts === "object" && Object.keys(updateData.user_facts).length === 0;
  const sessionsCleared = Array.isArray(updateData.session_memory) && updateData.session_memory.length === 0;
  const timelineCleared = Array.isArray(updateData.emotional_timeline) && updateData.emotional_timeline.length === 0;
  return summaryCleared || factsCleared || sessionsCleared || timelineCleared;
}
async function appendMemoryRecoveryBackup(profile, reason = "memory_clear") {
  if (!profile?.id) return false;
  if (!isPaidRecoveryEligible(profile)) return false;
  const backup = {
    id: recoveryBackupId("memory_clear"),
    type: "memory_profile",
    label: "AI memory before user cleared it",
    source: reason,
    apple_user_id: profile.apple_user_id || null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    payload: {
      profile: {
        id: profile.id,
        apple_user_id: profile.apple_user_id || null,
        display_name: profile.display_name || null,
        memory_summary: profile.memory_summary || "",
        user_facts: profile.user_facts || {},
        session_memory: profile.session_memory || [],
        emotional_timeline: profile.emotional_timeline || [],
        memory_vectors: profile.memory_vectors || [],
        memory_updated_at: profile.memory_updated_at || profile.updated_date || profile.updated_at || null,
      },
    },
  };
  const nowMs = Date.now();
  const existing = (Array.isArray(profile.recovery_backups) ? profile.recovery_backups : [])
    .filter(b => !b.expires_at || new Date(b.expires_at).getTime() > nowMs);
  const next = [backup, ...existing].slice(0, RECOVERY_BACKUP_LIMIT);
  try {
    const r = await fetch(`${B44_BASE}/UserProfile/${profile.id}`, {
      method: "PUT",
      headers: b44Headers(),
      body: JSON.stringify({ recovery_backups: next, last_recovery_backup_at: backup.created_at }),
    });
    if (!r.ok) console.warn(`[syncProfile] memory recovery backup failed HTTP ${r.status}`);
    return r.ok;
  } catch (e) {
    console.warn("[syncProfile] memory recovery backup failed:", e.message);
    return false;
  }
}

function buildProfileResponse(profile, companionData) {
  return {
    profileId:           profile.id,
    is_premium:          profile.is_premium || profile.premium || false,
    annual_plan:         profile.annual_plan || false,
    pro_plan:            profile.pro_plan    || false,
    ultimate_friend:     profile.ultimate_friend || false,
    display_name:        profile.display_name || null,
    created_date:        profile.created_date || profile.created_at || null,
    created_at:          profile.created_at || profile.created_date || null,
    family_unlimited:    profile.family_unlimited || profile.family_plan || false,
    family_plan:         profile.family_plan || profile.family_unlimited || false,
    companion_nickname:  profile.companion_nickname || (companionData?.nickname) || null,
    onboarding_complete: profile.onboarding_complete || false,
    companion_id:        profile.companion_id || null,
    preferred_mood:      profile.preferred_mood || null,
    apple_user_id:       profile.apple_user_id || null,
    email:               profile.email || null,
    message_count:       profile.message_count || 0,
    memory_summary:      profile.memory_summary || "",
    user_facts:          profile.user_facts || {},
    session_memory:      profile.session_memory || [],
    emotional_timeline:  profile.emotional_timeline || [],
    structured_memory:   profile.structured_memory || [],
    relationship_milestones: profile.relationship_milestones || [],
    memory_updated_at:   profile.memory_updated_at || profile.updated_date || profile.updated_at || null,
    profile_snapshot:    profile.profile_snapshot || null,
    snapshot_updated_at: profile.snapshot_updated_at || null,
    chat_appearance:     profile.chat_appearance || null,
    daily_usage:         profile.daily_usage || null,
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
    googleUserId,            // Android Google Sign-In — used as the canonical user ID
    email: clientEmail,
    fullName,
    isPremium,
    plan,
    platform,                // "ios" | "android" — passed by Android wrapper
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

  // For Android users, googleUserId IS the canonical user ID.
  // We store it in apple_user_id so all existing lookup/auth code works unchanged.
  const canonicalUserId = appleUserId || googleUserId || null;
  // Alias so all downstream code can use appleUserId regardless of platform
  if (!appleUserId && googleUserId) {
    // eslint-disable-next-line no-param-reassign
    Object.assign(req.body, { appleUserId: googleUserId });
  }
  // Re-bind local variable for all downstream logic
  const _appleUserId = canonicalUserId;

  console.log(`[syncProfile] action=${action} userId=${_appleUserId?.slice(0,12)} platform=${platform||"ios"} profileId=${profileId}`);

  try {
    // ── ACTION: lookup — find a profile without creating it ───────────────────
    // Used by client-side recovery hooks to check if a profile exists for a
    // given identifier (appleUserId or deviceId) without risking creation of a
    // ghost profile for anonymous/device-only users.
    if (action === "lookup") {
      if (!appleUserId) return res.status(400).json({ error: "appleUserId required for lookup" });
      const found = await findByAppleId(appleUserId);
      if (!found) return res.status(200).json({ found: false, data: null });
      const companion = await getCompanion(found.companion_id);
      console.log(`[syncProfile] lookup found profile ${found.id} for ${appleUserId?.slice(0,12)}`);
      return res.status(200).json({ found: true, data: buildProfileResponse(found, companion) });
    }

    // ── ACTION: get — fetch a profile by ID (e.g. for MemoryEditor) ──────────
    if (action === "get") {
      if (!profileId) return res.status(400).json({ error: "profileId required for get" });
      try {
        const r = await fetch(`${B44_BASE}/UserProfile/${profileId}`, { headers: b44Headers() });
        if (!r.ok) return res.status(404).json({ error: "Profile not found" });
        const profile = await r.json();
        return res.status(200).json({
          user_facts:     profile.user_facts     || {},
          memory_summary: profile.memory_summary || "",
          session_memory: profile.session_memory || [],
          emotional_timeline: profile.emotional_timeline || [],
          structured_memory: profile.structured_memory || [],
          relationship_milestones: profile.relationship_milestones || [],
          memory_updated_at: profile.memory_updated_at || null,
          display_name:   profile.display_name   || "",
        });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── ACTION: update — update a specific profile by ID ──────────────────────
    if (action === "update") {
      if (!profileId) return res.status(400).json({ error: "profileId required for update" });
      // appleUserId is required to prove ownership — anonymous writes are not permitted.
      // A caller that only knows the profileId cannot prove they own the record.
      if (!appleUserId) {
        console.warn(`[syncProfile] update rejected: appleUserId required for ownership verification`);
        return res.status(400).json({ error: "appleUserId is required to verify ownership for update" });
      }
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
      if (isMemoryClearUpdate(updateData || {})) {
        await appendMemoryRecoveryBackup(profile, "syncProfile_memory_clear");
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

    // ── ACTION: sync — find or create profile (Apple on iOS, Google on Android) ──
    if (!_appleUserId) return res.status(400).json({ error: "appleUserId or googleUserId required" });

    // 1. Search by canonical user ID (stored in apple_user_id field for both platforms)
    let profile = await findByAppleId(_appleUserId);

    // NOTE: email-based fallback lookup has been intentionally removed.
    // Using an unverified JWT email to locate accounts would allow an attacker
    // to forge a token with a victim's email and take over their profile.
    // findByEmail() must not be used as a profile-lookup step here.

    // 2. Last resort: find by display_name for users migrating from old app (no apple_user_id stored)
    // [SECURITY] findByDisplayName fallback removed — prevented account hijack via name match

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
        apple_user_id: _appleUserId,
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
      const recheck = await findByAppleId(_appleUserId);
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
        apple_user_id: _appleUserId,
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

