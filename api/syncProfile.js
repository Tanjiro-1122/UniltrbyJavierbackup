// api/syncProfile.js
// Single source of truth for all UserProfile DB operations.
// 100% Supabase — no Base44 references.

import { createRequestContext, checkRateLimit } from "./_helpers.js";

// ── Supabase config ───────────────────────────────────────────────────────────
const SB_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

const SB_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

// The live table name in the Unfiltr Supabase project.
// We try both spellings so the code works even if the table was created with either name.
const PROFILE_TABLES = ["user_profiles", "user_profile"];

// ── Low-level Supabase fetch ──────────────────────────────────────────────────
async function sbFetch(table, qs = "", options = {}) {
  if (!SB_URL || !SB_KEY) throw new Error("Supabase env not configured");
  const url = `${SB_URL}/rest/v1/${encodeURIComponent(table)}${qs}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

// ── Profile lookups ───────────────────────────────────────────────────────────
async function findByAppleId(appleUserId) {
  for (const table of PROFILE_TABLES) {
    const r = await sbFetch(table, `?apple_user_id=eq.${encodeURIComponent(appleUserId)}&limit=1`);
    if (r.ok && Array.isArray(r.data) && r.data[0]) return { table, profile: r.data[0] };
    if (!r.ok && r.status !== 404 && r.status !== 400)
      console.warn(`[syncProfile] findByAppleId ${table}: ${r.status}`);
  }
  return null;
}

async function findById(id) {
  for (const table of PROFILE_TABLES) {
    const r = await sbFetch(table, `?id=eq.${encodeURIComponent(id)}&limit=1`);
    if (r.ok && Array.isArray(r.data) && r.data[0]) return { table, profile: r.data[0] };
  }
  return null;
}

// ── Profile writes ────────────────────────────────────────────────────────────
async function updateProfile(id, table, data) {
  const r = await sbFetch(table, `?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { ...data, updated_at: new Date().toISOString() },
    prefer: "return=representation",
  });
  if (r.ok) return Array.isArray(r.data) ? r.data[0] : r.data;
  console.warn(`[syncProfile] updateProfile ${table} ${id}: ${r.status}`);
  return null;
}

async function createProfile(table, data) {
  const now = new Date().toISOString();
  const r = await sbFetch(table, "", {
    method: "POST",
    body: { ...data, created_at: now, updated_at: now },
    prefer: "return=representation",
  });
  if (r.ok) return Array.isArray(r.data) ? r.data[0] : r.data;
  // Duplicate race — look up the existing row
  if (String(r.data || "").includes("23505") || String(r.data || "").includes("duplicate")) {
    const existing = await findByAppleId(data.apple_user_id);
    if (existing?.profile) return existing.profile;
  }
  throw new Error(`createProfile ${table}: ${r.status} ${JSON.stringify(r.data)?.slice(0, 300)}`);
}

async function deleteProfile(id, table) {
  const r = await sbFetch(table, `?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
  return r.ok;
}

// ── Companion fetch (Supabase companions table) ───────────────────────────────
async function getCompanion(companionId) {
  if (!companionId || companionId === "pending") return null;
  try {
    const r = await sbFetch("companions", `?id=eq.${encodeURIComponent(companionId)}&limit=1`);
    if (r.ok && Array.isArray(r.data) && r.data[0]) {
      const c = r.data[0];
      return {
        avatar_id: c.avatar_id || c.id || null,
        name: c.name || null,
        nickname: c.nickname || c.name || null,
        voice_gender: c.voice_gender || null,
        voice_personality: c.voice_personality || null,
        personality_vibe: c.personality_vibe || null,
        personality_style: c.personality_style || null,
        personality_humor: c.personality_humor || null,
        personality_empathy: c.personality_empathy || null,
        personality_curiosity: c.personality_curiosity || null,
      };
    }
  } catch (e) {
    console.warn("[syncProfile] getCompanion:", e.message);
  }
  return null;
}

// ── JWT decode (Apple identity token — NOT verified, used for email only) ─────
function decodeAppleJwt(token) {
  try {
    if (!token) return {};
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch { return {}; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidUserId(v) {
  return typeof v === "string" && v.trim().length >= 6;
}

function isMemoryClearUpdate(d = {}) {
  const keys = ["memory_summary", "user_facts", "session_memory", "emotional_timeline", "memory_vectors"];
  if (!keys.some(k => Object.prototype.hasOwnProperty.call(d, k))) return false;
  return (
    d.memory_summary === "" || d.memory_summary === null ||
    (d.user_facts && typeof d.user_facts === "object" && Object.keys(d.user_facts).length === 0) ||
    (Array.isArray(d.session_memory) && d.session_memory.length === 0)
  );
}

// ── buildProfileResponse — normalises any profile row shape ──────────────────
function buildProfileResponse(profile, companionData) {
  // Premium flags: read from live columns first, fall back to legacy Base44 data
  // preserved in preferences.legacy_base44_profile during the migration.
  const leg = (profile.preferences?.legacy_base44_profile) || {};
  const isPremium  = !!(profile.is_premium  || profile.premium       || profile.is_annual  || profile.is_pro  || profile.is_family  || leg.is_premium  || leg.premium  || leg.annual_plan || leg.pro_plan);
  const isAnnual   = !!(profile.annual_plan || profile.is_annual     || leg.annual_plan);
  const isPro      = !!(profile.pro_plan    || profile.is_pro        || leg.pro_plan);
  const isFamily   = !!(profile.family_unlimited || profile.family_plan || profile.is_family || leg.family_unlimited || leg.family_plan);
  const isUltimate = !!(profile.ultimate_friend  || leg.ultimate_friend);

  return {
    profileId:            profile.id,
    is_premium:           isPremium,
    annual_plan:          isAnnual,
    pro_plan:             isPro,
    ultimate_friend:      isUltimate,
    family_unlimited:     isFamily,
    family_plan:          isFamily,
    display_name:         profile.display_name || null,
    created_date:         profile.created_date || profile.created_at || null,
    created_at:           profile.created_at   || profile.created_date || null,
    companion_nickname:   profile.companion_nickname || companionData?.nickname || null,
    onboarding_complete:  profile.onboarding_complete || profile.onboarding_done || false,
    companion_id:         profile.companion_id || null,
    preferred_mood:       profile.preferred_mood || null,
    apple_user_id:        profile.apple_user_id || null,
    email:                profile.email || null,
    message_count:        profile.message_count || profile.msg_count_today || 0,
    memory_summary:       profile.memory_summary || leg.memory_summary || "",
    user_facts:           profile.user_facts   || leg.user_facts || {},
    session_memory:       profile.session_memory || leg.session_memory || [],
    emotional_timeline:   profile.emotional_timeline   || [],
    structured_memory:    profile.structured_memory    || [],
    relationship_milestones: profile.relationship_milestones || [],
    memory_updated_at:    profile.memory_updated_at || profile.updated_at || null,
    profile_snapshot:     profile.profile_snapshot     || null,
    snapshot_updated_at:  profile.snapshot_updated_at  || null,
    chat_appearance:      profile.chat_appearance       || null,
    daily_usage:          profile.daily_usage           || null,
    companion:            companionData,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
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
    action = "sync",
    appleUserId:   rawAppleUserId,
    apple_user_id, apple_userId,
    googleUserId:  rawGoogleUserId,
    google_user_id, google_userId,
    email: clientEmail,
    fullName,
    isPremium,
    plan,
    platform,
    profileId,
    updateData,
    identityToken,
    pushToken,
  } = req.body || {};

  const appleUserId  = rawAppleUserId  || apple_user_id  || apple_userId  || null;
  const googleUserId = rawGoogleUserId || google_user_id || google_userId || null;
  const canonicalId  = appleUserId || googleUserId || null;

  // Email from Apple JWT (present on every login, unlike the client payload)
  const jwtPayload = decodeAppleJwt(identityToken);
  const email = jwtPayload.email || clientEmail || "";

  console.log(`[syncProfile] action=${action} userId=${canonicalId?.slice(0, 12)} platform=${platform || "ios"}`);

  try {
    // ── ACTION: lookup ────────────────────────────────────────────────────────
    if (action === "lookup") {
      if (!appleUserId) return res.status(400).json({ error: "appleUserId required" });
      const found = await findByAppleId(appleUserId);
      if (!found) return res.status(200).json({ found: false, data: null });
      const companion = await getCompanion(found.profile.companion_id);
      return res.status(200).json({ found: true, data: buildProfileResponse(found.profile, companion) });
    }

    // ── ACTION: get (memory editor) ───────────────────────────────────────────
    if (action === "get") {
      if (!profileId) return res.status(400).json({ error: "profileId required" });
      const found = await findById(profileId);
      if (!found) return res.status(404).json({ error: "Profile not found" });
      const p = found.profile;
      return res.status(200).json({
        user_facts:              p.user_facts              || {},
        memory_summary:          p.memory_summary          || "",
        session_memory:          p.session_memory          || [],
        emotional_timeline:      p.emotional_timeline      || [],
        structured_memory:       p.structured_memory       || [],
        relationship_milestones: p.relationship_milestones || [],
        memory_updated_at:       p.memory_updated_at       || null,
        display_name:            p.display_name            || "",
      });
    }

    // ── ACTION: update ────────────────────────────────────────────────────────
    if (action === "update") {
      if (!profileId) return res.status(400).json({ error: "profileId required" });
      if (!appleUserId) return res.status(400).json({ error: "appleUserId required for ownership check" });

      const found = await findById(profileId);
      if (!found) return res.status(404).json({ error: "Profile not found" });
      if (found.profile.apple_user_id && found.profile.apple_user_id !== appleUserId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await updateProfile(profileId, found.table, updateData || {});
      return res.status(200).json({ ok: true, data: updated });
    }

    // ── ACTION: delete ────────────────────────────────────────────────────────
    if (action === "delete") {
      if (!appleUserId) return res.status(403).json({ error: "appleUserId required" });
      let targetId = profileId;
      if (!targetId) {
        const found = await findByAppleId(appleUserId);
        if (found) targetId = found.profile.id;
      }
      if (targetId) {
        const found = await findById(targetId);
        if (!found) return res.status(404).json({ error: "Profile not found" });
        if (!found.profile.apple_user_id || found.profile.apple_user_id !== appleUserId) {
          return res.status(403).json({ error: "Forbidden" });
        }
        await deleteProfile(targetId, found.table);
        console.log(`[syncProfile] Deleted profile ${targetId}`);
      }
      return res.status(200).json({ ok: true, deleted: targetId || null });
    }

    // ── ACTION: sync (main path — find or create) ─────────────────────────────
    if (!canonicalId) return res.status(400).json({ error: "appleUserId or googleUserId required" });

    let found = await findByAppleId(canonicalId);
    const now = new Date().toISOString();

    if (found?.profile?.account_delete_requested) {
      // Profile was marked for deletion — wipe and treat as new
      await deleteProfile(found.profile.id, found.table);
      console.log(`[syncProfile] Wiped deletion-requested profile ${found.profile.id}`);
      found = null;
    }

    if (found) {
      const profile = found.profile;

      // ── Patch: update last_seen and any new fields ─────────────────────────
      const patch = {
        apple_user_id: canonicalId,
        last_seen:     now,
        last_active:   now,
      };

      // Caller explicitly passing isPremium (e.g. after purchase)
      if (isPremium) {
        patch.is_premium = true;
        if (plan === "annual") patch.annual_plan = true;
        if (plan === "pro")    patch.pro_plan    = true;
      }

      // One-time legacy premium rehydration: if this user had VIP in the old system
      // and it was preserved in preferences.legacy_base44_profile, restore it now.
      const leg = profile.preferences?.legacy_base44_profile || {};
      const liveHasPremium = !!(profile.is_premium || profile.premium || profile.annual_plan || profile.pro_plan || profile.family_unlimited || profile.ultimate_friend);
      const legacyHasPremium = !!(leg.is_premium || leg.premium || leg.annual_plan || leg.pro_plan || leg.family_unlimited || leg.ultimate_friend);
      if (!liveHasPremium && legacyHasPremium) {
        patch.is_premium      = !!(leg.is_premium  || leg.premium || leg.annual_plan || leg.pro_plan);
        patch.annual_plan     = !!(leg.annual_plan);
        patch.pro_plan        = !!(leg.pro_plan);
        patch.family_unlimited = !!(leg.family_unlimited);
        patch.ultimate_friend  = !!(leg.ultimate_friend);
        console.log(`[syncProfile] Rehydrating legacy premium for ${profile.id}`);
      }

      if (email && !profile.email)    patch.email        = email;
      if (fullName && !profile.display_name) patch.display_name = fullName;
      if (pushToken?.startsWith("ExponentPushToken")) {
        patch.push_token   = pushToken;
        patch.push_enabled = true;
      }

      const updated = await updateProfile(profile.id, found.table, patch);
      const merged  = { ...profile, ...patch, ...(updated || {}) };
      const companion = await getCompanion(merged.companion_id);

      console.log(`[syncProfile] Returning user ${profile.id}`);
      return res.status(200).json({
        isNewUser: false,
        ...buildProfileResponse(merged, companion),
        profile: merged,
        source_table: found.table,
      });

    } else {
      // ── New user: dedup guard ──────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 300));
      const recheck = await findByAppleId(canonicalId);
      if (recheck) {
        const companion = await getCompanion(recheck.profile.companion_id);
        return res.status(200).json({
          isNewUser: false,
          ...buildProfileResponse(recheck.profile, companion),
          profile: recheck.profile,
          source_table: recheck.table,
        });
      }

      // ── Create new profile ─────────────────────────────────────────────────
      const table = PROFILE_TABLES[0]; // default to first available
      let newProfile;
      try {
        newProfile = await createProfile(table, {
          apple_user_id:       canonicalId,
          email:               email || "",
          display_name:        fullName?.trim() || "",
          is_premium:          !!isPremium,
          annual_plan:         plan === "annual",
          pro_plan:            plan === "pro",
          onboarding_complete: false,
          companion_id:        "pending",
          message_count:       0,
          push_token:          pushToken?.startsWith("ExponentPushToken") ? pushToken : null,
          push_enabled:        !!(pushToken?.startsWith("ExponentPushToken")),
        });
      } catch (e) {
        // Final fallback: try second table name
        newProfile = await createProfile(PROFILE_TABLES[1] || PROFILE_TABLES[0], {
          apple_user_id: canonicalId,
          email: email || "",
          display_name: fullName?.trim() || "",
          is_premium: !!isPremium,
          onboarding_done: false,
          tier: plan || "free",
          msg_count_today: 0,
          preferences: {},
        });
      }

      const companion = await getCompanion(newProfile?.companion_id);
      console.log(`[syncProfile] New user created ${newProfile?.id}`);
      return res.status(200).json({
        isNewUser: true,
        ...buildProfileResponse(newProfile || {}, companion),
        profile: newProfile,
        source_table: table,
      });
    }

  } catch (err) {
    console.error("[syncProfile] Unhandled error:", err.message, err.stack?.slice(0, 500));
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
