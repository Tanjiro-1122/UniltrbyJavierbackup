import crypto from "crypto";
import { b44Fetch, B44_ENTITIES } from "./_b44.js";
import { fetchRCSubscriber, mapSubscriberToFlags } from "./_rcMapping.js";

/**
 * ADMIN_PASS — the credential the AdminDashboard client sends for every admin
 * action.  Set the ADMIN_PASS environment variable in Vercel to a strong,
 * unique value.  The hardcoded fallback is intentionally short and well-known
 * so it never accidentally works in production once the env var is set.
 *
 * NOTE: because the admin dashboard is a client-side React app, this value is
 * visible to anyone who inspects the JS bundle.  It provides UI gating
 * (convenience) only — not true server-side secrecy.  For a higher security
 * posture, set a long random string in the ADMIN_PASS Vercel env var that is
 * NOT committed to the repository.
 */
const ADMIN_PASS   = process.env.ADMIN_PASS   || "javier1122admin";

/**
 * SUPPORT_PASS — credential for the Support Staff role.
 * Support staff can view user data and trigger safe memory rebuilds.
 * They cannot perform destructive actions (delete, revoke, bulk changes).
 * Set the SUPPORT_PASS environment variable in Vercel.
 * If not set, the support staff login is effectively disabled.
 */
const SUPPORT_PASS = process.env.SUPPORT_PASS;

const APP_ID = "69b332a392004d139d4ba495";
const BASE44_API = "https://app.base44.com/api";
const MS_PER_HOUR = 3600000;
const MS_PER_DAY  = 86400000;

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
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Returns the role of the caller based on the provided token.
 * "admin"   — full access
 * "support" — read-only user search + safe memory rebuild; no destructive actions
 * null      — unauthorized
 */
function getRole(token) {
  if (safeCompare(token, ADMIN_PASS))                      return "admin";
  if (SUPPORT_PASS && safeCompare(token, SUPPORT_PASS))    return "support";
  return null;
}

/** Actions that support staff are NOT allowed to perform. */
const SUPPORT_BLOCKED_ACTIONS = new Set([
  "deleteUser",
  "revokeAccess",
  "grantAccess",
  "bulkAction",
  "subscriptionOverride",
  "subscriptionClearOverride",
  "syncRevenueCat",
  "auditLog",
]);

/**
 * Rebuild a memory_summary from existing structured profile fields.
 * Mirrors the logic in summarizeSession.js buildRichSummary but works
 * entirely from already-stored data — no AI call or transcript access needed.
 */
function buildRichSummaryFromStored(facts = {}, sessions = [], emotionalTimeline = []) {
  const parts = [];

  // Core identity
  if (facts.name)                parts.push(`User's name is ${facts.name}.`);
  if (facts.age)                 parts.push(`They are ${facts.age} years old.`);
  if (facts.location)            parts.push(`Located in ${facts.location}.`);
  if (facts.occupation)          parts.push(`Works as ${facts.occupation}.`);
  if (facts.relationship_status) parts.push(`Relationship: ${facts.relationship_status}.`);

  // Important people
  if (facts.important_people?.length) {
    parts.push(`Important people: ${facts.important_people.map(p => `${p.name} (${p.role})`).join(", ")}.`);
  }

  // Emotional patterns
  if (facts.recurring_struggles?.length) {
    parts.push(`Recurring struggles: ${facts.recurring_struggles.join(", ")}.`);
  }
  if (facts.core_values?.length) parts.push(`Core values: ${facts.core_values.join(", ")}.`);
  if (facts.goals?.length)       parts.push(`Goals: ${facts.goals.join(", ")}.`);

  // Personality
  if (facts.humor_style)          parts.push(`Humor style: ${facts.humor_style}.`);
  if (facts.communication_style)  parts.push(`Communication style: ${facts.communication_style}.`);
  if (facts.hobbies?.length)      parts.push(`Hobbies/interests: ${facts.hobbies.join(", ")}.`);

  // Session history
  if (sessions.length > 0) {
    const recent = sessions.slice(0, 5);
    parts.push(`Recent sessions: ${recent.map(s => `[${s.date}] ${s.summary}`).join(" | ")}.`);
  }

  // Emotional timeline patterns
  if (emotionalTimeline?.length >= 2) {
    const recent7 = emotionalTimeline.slice(0, 7);
    const emotionCounts = {};
    recent7.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1; });
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => e);
    if (topEmotions.length > 0) parts.push(`Recent emotional patterns: ${topEmotions.join(", ")}.`);
  }

  return parts.join(" ");
}

/**
 * Count the number of populated fields in a user_facts object.
 * A field is "populated" if it is a non-empty string, a non-empty array,
 * or a non-empty object. Null/undefined/"" are treated as unpopulated.
 */
function countPopulatedFacts(userFacts) {
  return Object.entries(userFacts || {}).filter(([, v]) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v))      return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  }).length;
}

/** Map a raw UserProfile record to the shape used by AdminDashboard. */
function mapUser(p) {
  const userFacts      = p.user_facts      || {};
  const sessionMemory  = p.session_memory  || [];
  const memoryVectors  = p.memory_vectors  || [];

  return {
    id: p.id,
    display_name: p.display_name || "Anonymous",
    email: p.email || null,
    apple_user_id: p.apple_user_id || null,
    created_date: p.created_date || null,
    last_seen: p.last_seen || null,
    last_active: p.last_active || null,
    onboarding_complete: !!(p.onboarding_complete),
    push_enabled: !!(p.push_enabled),
    push_token_present: !!(p.push_token || p.expo_push_token),
    tokens_used_today: p.tokens_used_today || 0,
    tokens_used_total: p.tokens_used_total || p.total_tokens_used || 0,
    message_count: p.message_count || 0,
    is_premium: !!(p.is_premium),
    pro_plan: !!(p.pro_plan),
    annual_plan: !!(p.annual_plan),
    trial_active: !!(p.trial_active),
    subscription_expires: p.subscription_expires || null,
    account_paused: !!(p.account_paused),
    account_delete_requested: !!(p.account_delete_requested),
    memory_summary: p.memory_summary || null,
    memory_updated_at: p.memory_updated_at || null,
    // Memory health indicators
    memory_facts_count:         countPopulatedFacts(userFacts),
    memory_session_notes_count: sessionMemory.length,
    memory_vectors_count:       memoryVectors.length,
  };
}

/** Returns the Base44 service token, supporting both env var names. */
function getServiceToken() {
  const token = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY;
  if (!token) throw new Error("BASE44_SERVICE_TOKEN or BASE44_API_KEY env var not set");
  return token;
}

async function fetchEntity(entity, params = {}) {
  const url = new URL(`${BASE44_API}/apps/${APP_ID}/entities/${entity}`);
  url.searchParams.set("limit", params.limit || 500);
  if (params.skip) url.searchParams.set("skip", params.skip);
  const serviceToken = getServiceToken();
  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
      "X-App-Id": APP_ID,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Base44 ${entity} fetch failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.records || data.data || []);
}

async function updateEntity(entity, id, data) {
  const serviceToken = getServiceToken();
  const res = await fetch(`${BASE44_API}/apps/${APP_ID}/entities/${entity}/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
      "X-App-Id": APP_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Base44 ${entity} update failed: ${res.status} ${err.slice(0, 200)}`);
  }
  return res.json();
}

async function deleteEntity(entity, id) {
  const serviceToken = getServiceToken();
  const res = await fetch(`${BASE44_API}/apps/${APP_ID}/entities/${entity}/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
      "X-App-Id": APP_ID,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Base44 ${entity} delete failed: ${res.status} ${err.slice(0, 200)}`);
  }
  return true;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken, action, userId, type, query, subscription, reason } = req.body || {};
  const role = getRole(adminToken);
  if (!role) return res.status(401).json({ error: "Unauthorized" });

  // Block support staff from destructive / sensitive actions
  if (role === "support" && action && SUPPORT_BLOCKED_ACTIONS.has(action)) {
    return res.status(403).json({ error: "Support staff are not authorized for this action" });
  }

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

  // ── userSearch ────────────────────────────────────────────────────────────
  if (action === "userSearch") {
    try {
      if (userId) {
        const profile = await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`);
        return res.status(200).json({ users: [mapUser(profile)] });
      }
      const raw = await b44Fetch(`${B44_ENTITIES}/UserProfile?limit=1000`);
      const profiles = Array.isArray(raw) ? raw : (raw.records || raw.data || []);
      if (!query || query.trim() === "") {
        const sorted = [...profiles]
          .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
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
      await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      // Write audit log entry (non-fatal — log failure won't block the override)
      try {
        await b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
          method: "POST",
          body: JSON.stringify({
            entity_type: "UserProfile",
            entity_id: userId,
            action: "subscription_override",
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          }),
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
      await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      const label = durationHours ? `${durationHours}h` : `${durationDays || 7}d`;
      try {
        await b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
          method: "POST",
          body: JSON.stringify({
            entity_type: "UserProfile",
            entity_id: userId,
            action: `quick_grant_pro_${label}`,
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          }),
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
      await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      try {
        await b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
          method: "POST",
          body: JSON.stringify({
            entity_type: "UserProfile",
            entity_id: userId,
            action: "clear_override",
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          }),
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

      await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ ...flags, updated_date: new Date().toISOString() }),
      });

      // Write audit log entry (non-fatal)
      try {
        await b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
          method: "POST",
          body: JSON.stringify({
            entity_type: "UserProfile",
            entity_id:   userId,
            action:      "sync_revenuecat",
            changes:     JSON.stringify({ ...flags, plan, expiresDate }),
            reason:      reason.trim(),
            timestamp:   new Date().toISOString(),
          }),
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
      userIds.map(id => b44Fetch(`${B44_ENTITIES}/UserProfile/${id}`, { method: "PUT", body: JSON.stringify(updateData) }))
    );
    const failed = results.filter(r => r.status === "rejected").length;
    try {
      await Promise.all(userIds.map(id =>
        b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
          method: "POST",
          body: JSON.stringify({
            entity_type: "UserProfile",
            entity_id: id,
            action: `bulk_${bulkType}`,
            changes: JSON.stringify(updateData),
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
          }),
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
      const raw = await b44Fetch(`${B44_ENTITIES}/AdminAuditLog?limit=100`).catch((e) => {
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

  // ── rebuildMemory ─────────────────────────────────────────────────────────
  // Rebuilds memory_summary from existing structured profile fields only.
  // Does NOT access raw chat transcripts — safe for admin and support staff.
  if (action === "rebuildMemory") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    try {
      const profile = await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`);
      if (!profile || !profile.id) return res.status(404).json({ error: "User not found" });

      const facts    = profile.user_facts      || {};
      const sessions = profile.session_memory  || [];
      const timeline = profile.emotional_timeline || [];

      const newSummary = buildRichSummaryFromStored(facts, sessions, timeline);
      const now = new Date().toISOString();

      await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ memory_summary: newSummary, memory_updated_at: now }),
      });

      // Write audit log (non-fatal)
      try {
        await b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
          method: "POST",
          body: JSON.stringify({
            entity_type: "UserProfile",
            entity_id:   userId,
            action:      "rebuild_memory",
            changes:     JSON.stringify({
              summary_length: newSummary.length,
              facts_count:    countPopulatedFacts(facts),
              sessions_count: sessions.length,
            }),
            reason:      "Structured memory rebuild (no transcript access)",
            timestamp:   now,
          }),
        });
      } catch (logErr) {
        console.warn("[adminStats/rebuildMemory] Audit log write failed (non-fatal):", logErr.message);
      }

      return res.status(200).json({
        ok: true,
        summary_length:  newSummary.length,
        facts_count:     countPopulatedFacts(facts),
        sessions_count:  sessions.length,
      });
    } catch (err) {
      console.error("[adminStats/rebuildMemory] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── STATS FETCH ──────────────────────────────────────────────────────────
  try {
    const [allProfiles, allFeedback] = await Promise.all([
      fetchEntity("UserProfile"),
      fetchEntity("Feedback").catch(() => []),
    ]);

    const totalMessages = allProfiles.reduce((sum, p) => sum + (p.message_count || 0), 0);

    const now = new Date();
    const weekAgo = new Date(now - 7 * MS_PER_DAY).toISOString();
    const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const onlineNow = allProfiles.filter(p => p.last_seen && p.last_seen >= fiveMinAgo).length;
    const appleUsers = allProfiles.filter(p => p.apple_user_id && p.apple_user_id.trim() !== "").length;

    return res.status(200).json({
      totalUsers:          allProfiles.length,
      premiumUsers:        allProfiles.filter(p => p.is_premium || p.annual_plan || p.pro_plan).length,
      trialUsers:          allProfiles.filter(p => p.trial_active).length,
      onlineNow,
      appleUsers,
      todayMessages:       0,
      totalMessages,
      totalJournalEntries: 0,
      crisisFlags:         0,
      newThisWeek:         allProfiles.filter(p => (p.created_date || "") >= weekAgo).length,
      activeThisWeek:      allProfiles.filter(p => (p.last_seen || p.last_active || "") >= weekAgo).length,
      companions:          0,
      feedbackCount:       allFeedback.length,
      openFeedback:        allFeedback.filter(f => f.status !== "resolved").length,
      pausedAccounts:      allProfiles.filter(p => p.account_paused).length,
      deleteRequested:     allProfiles.filter(p => p.account_delete_requested).length,
      recentUsers: [...allProfiles]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .slice(0, 50)
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          email: p.email || null,
          user_id: p.user_id || p.id?.slice(0, 12),
          apple_user_id: p.apple_user_id || null,
          created_date: p.created_date,
          last_seen: p.last_seen || null,
          is_premium: !!(p.is_premium || p.annual_plan || p.pro_plan),
          annual_plan: !!(p.annual_plan),
          pro_plan: !!(p.pro_plan),
          trial_active: !!(p.trial_active),
          message_count: p.message_count || 0,
          onboarding_complete: !!(p.onboarding_complete),
          account_delete_requested: !!(p.account_delete_requested),
        })),
      premiumList: [...allProfiles]
        .filter(p => p.is_premium || p.annual_plan || p.pro_plan)
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          is_premium: true,
          annual_plan: p.annual_plan,
          pro_plan: p.pro_plan,
        })),
      allFeedback: [...allFeedback]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
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
    console.error("[adminStats] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
