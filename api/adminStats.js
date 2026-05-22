import crypto from "crypto";
import { fetchRCSubscriber, mapSubscriberToFlags } from "./_rcMapping.js";

/**
 * ADMIN_PASS — the credential the AdminDashboard client sends for every admin
 * action.  Set the ADMIN_PASS environment variable in Vercel to a strong,
 * unique value.  If the env var is not set the admin API refuses all requests
 * rather than falling back to an insecure hardcoded credential.
 */
const ADMIN_PASS = process.env.ADMIN_PASS || "";

const MS_PER_HOUR = 3600000;
const MS_PER_DAY  = 86400000;

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const ADMIN_TABLES = {
  UserProfile: "user_profiles",
  ChatHistory: "chat_history",
  JournalEntry: "journal_entries",
  MoodEntry: "mood_entries",
  Streak: "streaks",
  TimeCapsule: "time_capsules",
  Feedback: "feedback",
  Companion: "companion_memory",
  Notification: "notifications",
  AdminAuditLog: "admin_audit_logs",
};

function resolveAdminTable(entity) {
  return ADMIN_TABLES[entity] || entity;
}

function ensureAdminDataSource() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Admin data source is not configured. Missing Supabase server environment variables.");
  }
}

function adminDataHeaders() {
  ensureAdminDataSource();
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function buildRestUrl(entity, params = {}) {
  ensureAdminDataSource();
  const table = resolveAdminTable(entity);
  const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`);
  if (params.id) url.searchParams.set("id", `eq.${params.id}`);
  if (params.order) url.searchParams.set("order", params.order);
  url.searchParams.set("limit", String(Math.min(Number(params.limit || 500), 1000)));
  return url;
}

async function adminRest(entity, params = {}, options = {}) {
  const { method = "GET", body } = options;
  const url = buildRestUrl(entity, params);
  const res = await fetch(url.toString(), {
    method,
    headers: adminDataHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const table = resolveAdminTable(entity);
    throw new Error(`Supabase ${method} ${table} failed (${res.status}): ${detail || res.statusText}`);
  }
  if (res.status === 204) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

function safeAdminError(err, fallback = "Admin data failed to load") {
  const message = err?.message || String(err || fallback);
  console.error(`[adminStats] ${fallback}:`, message);
  if (/Invalid URL|Failed to parse URL|expected pattern|null\/|undefined\//i.test(message)) {
    return "Admin data source is misconfigured. Please check the server data connection.";
  }
  return message;
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "https://unfiltrbyjavier2.vercel.app",
  // Allow localhost during development (only when running via `vercel dev`).
  "http://localhost:5173",
  "http://localhost:3000",
]);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/** Constant-time string comparison to prevent timing-based token enumeration. */
function safeCompare(a, b) {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
      // Run a dummy comparison to prevent early-exit timing oracle on length.
      crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** Map a raw UserProfile record to the shape used by AdminDashboard. */
function mapUser(p) {
  return {
    id: p.id,
    display_name: p.display_name || "Anonymous",
    email: p.email || null,
    apple_user_id: p.apple_user_id || null,
    created_date: p.created_date || p.created_at || null,
    last_seen: p.last_seen || null,
    last_active: p.last_active || p.updated_at || null,
    onboarding_complete: !!(p.onboarding_complete),
    push_enabled: !!(p.push_enabled),
    push_token_present: !!(p.push_token || p.expo_push_token),
    tokens_used_today: p.tokens_used_today || 0,
    tokens_used_total: p.tokens_used_total || p.total_tokens_used || 0,
    message_count: p.message_count || 0,
    is_premium: !!(p.is_premium),
    pro_plan: !!(p.pro_plan),
    annual_plan: !!(p.annual_plan),
    ultimate_friend: !!(p.ultimate_friend),
    family_unlimited: !!(p.family_unlimited || p.family_plan),
    family_plan: !!(p.family_plan || p.family_unlimited),
    trial_active: !!(p.trial_active),
    subscription_expires: p.subscription_expires || null,
    account_paused: !!(p.account_paused),
    account_delete_requested: !!(p.account_delete_requested),
    memory_summary: p.memory_summary || null,
    memory_updated_at: p.memory_updated_at || null,
    user_facts: p.user_facts || null,
    session_memory: p.session_memory || [],
    emotional_timeline: p.emotional_timeline || [],
    structured_memory: p.structured_memory || [],
    relationship_milestones: p.relationship_milestones || [],
    recovery_backups: p.recovery_backups || [],
  };
}


async function fetchEntity(entity, params = {}) {
  return adminRest(entity, params);
}

async function fetchEntityById(entity, id) {
  const rows = await adminRest(entity, { id, limit: 1 });
  return rows[0] || null;
}

async function updateEntity(entity, id, data) {
  const rows = await adminRest(entity, { id }, { method: "PATCH", body: data });
  return rows[0] || null;
}

async function deleteEntity(entity, id) {
  await adminRest(entity, { id }, { method: "DELETE" });
  return true;
}

async function createEntity(entity, data) {
  const rows = await adminRest(entity, {}, { method: "POST", body: data });
  return rows[0] || null;
}

async function upsertEntities(entity, records, onConflict = "id") {
  if (!Array.isArray(records) || records.length === 0) return [];
  ensureAdminDataSource();
  const table = resolveAdminTable(entity);
  const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`);
  url.searchParams.set("on_conflict", onConflict);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      ...adminDataHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Supabase UPSERT ${table} failed (${res.status}): ${detail || res.statusText}`);
  }
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function insertEntities(entity, records) {
  if (!Array.isArray(records) || records.length === 0) return [];
  ensureAdminDataSource();
  const table = resolveAdminTable(entity);
  const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: adminDataHeaders(),
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Supabase INSERT ${table} failed (${res.status}): ${detail || res.statusText}`);
  }
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

function compactUserProfileForBackfill(profile) {
  return {
    apple_user_id: profile.apple_user_id || null,
    email: profile.email || null,
    display_name: profile.display_name || "Anonymous",
    tier: profile.tier || (profile.is_premium || profile.annual_plan || profile.pro_plan || profile.ultimate_friend ? "premium" : "free"),
    created_at: profile.created_at || profile.created_date || null,
    updated_at: profile.updated_at || profile.updated_date || new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken, action, userId, type, query, subscription, reason } = req.body || {};
  // Reject all requests when ADMIN_PASS is not configured in the environment.
  if (!ADMIN_PASS) return res.status(503).json({ error: "Admin API not configured" });
  if (!safeCompare(adminToken, ADMIN_PASS)) return res.status(401).json({ error: "Unauthorized" });

  // ── ACTION HANDLERS ──────────────────────────────────────────────────────
  if (action === "grantAccess") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    const updateData = { is_premium: true, premium: true };
    if (type === "trial") {
      updateData.trial_active = true;
      updateData.trial_start_date = new Date().toISOString();
      updateData.annual_plan = false;
      updateData.pro_plan = false;
    } else if (type === "family") {
      updateData.annual_plan = true;
      updateData.trial_active = false;
      updateData.pro_plan = false;
    }
    await updateEntity("UserProfile", userId, updateData);
    return res.status(200).json({ ok: true });
  }

  if (action === "revokeAccess") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    await updateEntity("UserProfile", userId, {
      is_premium: false,
      premium: false,
      trial_active: false,
      annual_plan: false,
      pro_plan: false,
    });
    return res.status(200).json({ ok: true });
  }

  if (action === "deleteUser") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    await deleteEntity("UserProfile", userId);
    return res.status(200).json({ ok: true });
  }

  if (action === "backfillUserProfiles") {
    try {
      const profiles = Array.isArray(req.body?.profiles) ? req.body.profiles : [];
      if (!profiles.length) return res.status(400).json({ error: "profiles array required" });
      const compacted = profiles
        .map(compactUserProfileForBackfill)
        .filter(p => p.apple_user_id || p.email || p.display_name);
      const inserted = await insertEntities("UserProfile", compacted);
      return res.status(200).json({ ok: true, received: profiles.length, inserted: inserted.length });
    } catch (err) {
      console.error("[adminStats/backfillUserProfiles] Error:", err);
      return res.status(500).json({ error: safeAdminError(err, "Profile backfill failed") });
    }
  }

  // ── userSearch ────────────────────────────────────────────────────────────
  if (action === "userSearch") {
    try {
      if (userId) {
        const profile = await fetchEntityById("UserProfile", userId);
        return res.status(200).json({ users: [mapUser(profile)] });
      }
      const raw = await fetchEntity("UserProfile", { limit: 1000 });
      const profiles = Array.isArray(raw) ? raw : (raw.records || raw.data || []);
      if (!query || query.trim() === "") {
        const sorted = [...profiles]
          .sort((a, b) => (b.created_date || b.created_at || "").localeCompare(a.created_date || a.created_at || ""))
          .slice(0, 30);
        return res.status(200).json({ users: sorted.map(mapUser) });
      }
      const q = query.trim().toLowerCase();
      const matched = profiles
        .filter(p =>
          (p.display_name || "").toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q) ||
          (p.apple_user_id || "").toLowerCase().includes(q) ||
          (p.id || "").toLowerCase().includes(q)
        )
        .slice(0, 50);
      return res.status(200).json({ users: matched.map(mapUser) });
    } catch (err) {
      console.error("[adminStats/userSearch] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── subscriptionOverride ──────────────────────────────────────────────────
  if (action === "subscriptionOverride") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: "Reason required (minimum 3 characters)" });
    }
    try {
      const updateData = {
        is_premium: !!(subscription?.is_premium),
        premium: !!(subscription?.is_premium),
        pro_plan: !!(subscription?.pro_plan),
        annual_plan: !!(subscription?.annual_plan),
        trial_active: !!(subscription?.trial_active),
      };
      if (subscription?.subscription_expires) {
        updateData.subscription_expires = subscription.subscription_expires;
      }
      await updateEntity("UserProfile", userId, updateData);
      // Write audit log entry (non-fatal — log failure won't block the override)
      try {
        await createEntity("AdminAuditLog", {
            entity_type: "UserProfile",
            entity_id: userId,
            action: "subscription_override",
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          });
      } catch (logErr) {
        console.warn("[adminStats/subscriptionOverride] Audit log write failed (non-fatal):", logErr.message);
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[adminStats/subscriptionOverride] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── subscriptionQuickGrant ────────────────────────────────────────────────
  if (action === "subscriptionQuickGrant") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    const { durationDays, durationHours } = req.body || {};
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: "Reason required (minimum 3 characters)" });
    }
    try {
      const now = new Date();
      let expires;
      if (durationHours) {
        expires = new Date(now.getTime() + Number(durationHours) * MS_PER_HOUR).toISOString();
      } else {
        expires = new Date(now.getTime() + Number(durationDays || 7) * MS_PER_DAY).toISOString();
      }
      const updateData = {
        is_premium: true,
        premium: true,
        pro_plan: true,
        trial_active: false,
        subscription_expires: expires,
        subscription_override: true,
      };
      await updateEntity("UserProfile", userId, updateData);
      const label = durationHours ? `${durationHours}h` : `${durationDays || 7}d`;
      try {
        await createEntity("AdminAuditLog", {
            entity_type: "UserProfile",
            entity_id: userId,
            action: `quick_grant_pro_${label}`,
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          });
      } catch (logErr) {
        console.warn("[adminStats/quickGrant] Audit log write failed (non-fatal):", logErr.message);
      }
      return res.status(200).json({ ok: true, expires });
    } catch (err) {
      console.error("[adminStats/subscriptionQuickGrant] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── subscriptionClearOverride ─────────────────────────────────────────────
  if (action === "subscriptionClearOverride") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: "Reason required (minimum 3 characters)" });
    }
    try {
      const updateData = {
        is_premium: false,
        premium: false,
        pro_plan: false,
        annual_plan: false,
        trial_active: false,
        subscription_override: false,
        subscription_expires: null,
      };
      await updateEntity("UserProfile", userId, updateData);
      try {
        await createEntity("AdminAuditLog", {
            entity_type: "UserProfile",
            entity_id: userId,
            action: "clear_override",
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          });
      } catch (logErr) {
        console.warn("[adminStats/clearOverride] Audit log write failed (non-fatal):", logErr.message);
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[adminStats/subscriptionClearOverride] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── clearMemory ───────────────────────────────────────────────────────────
  // Wipes memory_summary, memory_vectors, and memory_updated_at for a user so
  // the AI companion starts building a fresh memory on the next session.
  // Useful when a user reports stale, wrong, or confused memory.
  if (action === "clearMemory") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: "Reason required (minimum 3 characters)" });
    }
    try {
      const clearData = {
        memory_summary:   null,
        memory_vectors:   [],
        user_facts:       {},
        session_memory:   [],
        emotional_timeline: [],
        structured_memory: [],
        relationship_milestones: [],
        memory_updated_at: null,
      };
      await updateEntity("UserProfile", userId, clearData);
      try {
        await createEntity("AdminAuditLog", {
            entity_type: "UserProfile",
            entity_id:   userId,
            action:      "clear_memory",
            changes:     JSON.stringify(clearData),
            reason:      reason.trim(),
            timestamp:   new Date().toISOString(),
          });
      } catch (logErr) {
        console.warn("[adminStats/clearMemory] Audit log write failed (non-fatal):", logErr.message);
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[adminStats/clearMemory] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── syncRevenueCat ────────────────────────────────────────────────────────
  // Fetches the latest subscriber state from RevenueCat and syncs it to
  // the given Base44 UserProfile record.
  // Body: { userId, rcAppUserId, reason }
  //   userId      — Base44 UserProfile record ID (required)
  //   rcAppUserId — RevenueCat / Apple user ID to query (falls back to userId)
  //   reason      — audit reason string (required, min 3 chars)
  if (action === "syncRevenueCat") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: "Reason required (minimum 3 characters)" });
    }
    const rcAppUserId = req.body?.rcAppUserId || userId;
    try {
      let subscriberData;
      try {
        subscriberData = await fetchRCSubscriber(rcAppUserId);
      } catch (rcErr) {
        console.error("[adminStats/syncRevenueCat] RC fetch failed:", rcErr.message);
        return res.status(502).json({ error: `RevenueCat fetch failed: ${rcErr.message}` });
      }

      const { flags, plan, expiresDate, isActive } = mapSubscriberToFlags(subscriberData);

      await updateEntity("UserProfile", userId, { ...flags, updated_date: new Date().toISOString() });

      // Write audit log entry (non-fatal)
      try {
        await createEntity("AdminAuditLog", {
            entity_type: "UserProfile",
            entity_id:   userId,
            action:      "sync_revenuecat",
            changes:     JSON.stringify({ ...flags, plan, expiresDate }),
            reason:      reason.trim(),
            timestamp:   new Date().toISOString(),
          });
      } catch (logErr) {
        console.warn("[adminStats/syncRevenueCat] Audit log write failed (non-fatal):", logErr.message);
      }

      return res.status(200).json({ ok: true, isActive, plan, expiresDate, flags });
    } catch (err) {
      console.error("[adminStats/syncRevenueCat] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── bulkAction ────────────────────────────────────────────────────────────
  // Body: { userIds: string[], bulkType: "grantPro7d" | "revokePremium", reason }
  if (action === "bulkAction") {
    const { userIds, bulkType } = req.body || {};
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ error: "userIds[] required" });
    if (!bulkType) return res.status(400).json({ error: "bulkType required" });
    if (!reason || reason.trim().length < 3) return res.status(400).json({ error: "Reason required (minimum 3 characters)" });
    let updateData;
    if (bulkType === "grantPro7d") {
      const expires = new Date(Date.now() + 7 * MS_PER_DAY).toISOString();
      updateData = { is_premium: true, premium: true, pro_plan: true, trial_active: false, subscription_expires: expires, subscription_override: true };
    } else if (bulkType === "revokePremium") {
      updateData = { is_premium: false, premium: false, pro_plan: false, annual_plan: false, trial_active: false, subscription_override: false, subscription_expires: null };
    } else {
      return res.status(400).json({ error: "Unknown bulkType" });
    }
    const results = await Promise.allSettled(
      userIds.map(id => updateEntity("UserProfile", id, updateData))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    try {
      await Promise.all(userIds.map(id =>
        createEntity("AdminAuditLog", {
            entity_type: "UserProfile",
            entity_id: id,
            action: `bulk_${bulkType}`,
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          })
      ));
    } catch (logErr) {
      console.warn("[adminStats/bulkAction] Audit log write failed (non-fatal):", logErr.message);
    }
    return res.status(200).json({ ok: true, processed: userIds.length, failed });
  }

  // ── auditLog ──────────────────────────────────────────────────────────────
  if (action === "auditLog") {
    try {
      const raw = await fetchEntity("AdminAuditLog", { limit: 100 }).catch((e) => {
        console.warn("[adminStats/auditLog] AdminAuditLog fetch failed, returning empty list:", e.message);
        return [];
      });
      const entries = Array.isArray(raw) ? raw : (raw.records || raw.data || []);
      const sorted = [...entries].sort((a, b) =>
        (b.timestamp || b.created_date || "").localeCompare(a.timestamp || a.created_date || "")
      );
      return res.status(200).json({ entries: sorted.slice(0, 100) });
    } catch (err) {
      console.error("[adminStats/auditLog] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── STATS FETCH ──────────────────────────────────────────────────────────
  try {
    const [allProfiles, allFeedback, allJournals] = await Promise.all([
      fetchEntity("UserProfile"),
      fetchEntity("Feedback").catch(() => []),
      fetchEntity("JournalEntry", { limit: 500 }).catch(() => []),
    ]);

    const totalMessages = allProfiles.reduce((sum, p) => sum + (p.message_count || 0), 0);

    const now = new Date();
    const weekAgo = new Date(now - 7 * MS_PER_DAY).toISOString();
    const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const onlineNow = allProfiles.filter(p => p.last_seen && p.last_seen >= fiveMinAgo).length;
    const appleUsers = allProfiles.filter(p => p.apple_user_id && p.apple_user_id.trim() !== "").length;

    return res.status(200).json({
      totalUsers:          allProfiles.length,
      premiumUsers:        allProfiles.filter(p => p.is_premium || p.annual_plan || p.pro_plan || p.ultimate_friend).length,
      ultimateFriendUsers: allProfiles.filter(p => p.ultimate_friend).length,
      trialUsers:          allProfiles.filter(p => p.trial_active).length,
      onlineNow,
      appleUsers,
      todayMessages:       0,
      totalMessages,
      totalJournalEntries: allJournals.length,
      crisisFlags:         0,
      newThisWeek:         allProfiles.filter(p => (p.created_date || p.created_at || "") >= weekAgo).length,
      activeThisWeek:      allProfiles.filter(p => (p.last_seen || p.last_active || "") >= weekAgo).length,
      companions:          0,
      feedbackCount:       allFeedback.length,
      openFeedback:        allFeedback.filter(f => f.status !== "resolved").length,
      pausedAccounts:      allProfiles.filter(p => p.account_paused).length,
      deleteRequested:     allProfiles.filter(p => p.account_delete_requested).length,
      recentUsers: [...allProfiles]
        .sort((a, b) => (b.created_date || b.created_at || "").localeCompare(a.created_date || a.created_at || ""))
        .slice(0, 50)
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          email: p.email || null,
          user_id: p.user_id || p.id?.slice(0, 12),
          apple_user_id: p.apple_user_id || null,
          created_date: p.created_date || p.created_at,
          last_seen: p.last_seen || null,
          is_premium: !!(p.is_premium || p.annual_plan || p.pro_plan || p.ultimate_friend),
          annual_plan: !!(p.annual_plan),
          pro_plan: !!(p.pro_plan),
          ultimate_friend: !!(p.ultimate_friend),
          trial_active: !!(p.trial_active),
          message_count: p.message_count || 0,
          onboarding_complete: !!(p.onboarding_complete),
          account_delete_requested: !!(p.account_delete_requested),
        })),
      premiumList: [...allProfiles]
        .filter(p => p.is_premium || p.annual_plan || p.pro_plan || p.ultimate_friend)
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          is_premium: true,
          annual_plan: p.annual_plan,
          pro_plan: p.pro_plan,
          ultimate_friend: p.ultimate_friend,
        })),
      allFeedback: [...allFeedback]
        .sort((a, b) => (b.created_date || b.created_at || "").localeCompare(a.created_date || a.created_at || ""))
        .map(f => ({
          id: f.id,
          category: f.category || "general",
          message: f.message || "",
          rating: f.rating,
          status: f.status || "open",
          display_name: f.display_name || "Anonymous",
          created_date: f.created_date,
        })),
    });
  } catch (err) {
    return res.status(500).json({ error: safeAdminError(err, "Admin overview failed to load") });
  }
}

