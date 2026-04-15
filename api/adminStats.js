import crypto from "crypto";
import { b44Fetch, B44_ENTITIES } from "./_b44.js";
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
  };
}


async function fetchEntity(entity, params = {}) {
  const url = new URL(`${B44_ENTITIES}/${entity}`);
  url.searchParams.set("limit", params.limit || 500);
  if (params.skip) url.searchParams.set("skip", params.skip);
  const data = await b44Fetch(url.toString());
  return Array.isArray(data) ? data : (data.records || data.data || []);
}

async function updateEntity(entity, id, data) {
  return b44Fetch(`${B44_ENTITIES}/${entity}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteEntity(entity, id) {
  await b44Fetch(`${B44_ENTITIES}/${entity}/${id}`, { method: "DELETE" });
  return true;
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
        memory_updated_at: null,
      };
      await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`, {
        method: "PUT",
        body: JSON.stringify(clearData),
      });
      try {
        await b44Fetch(`${B44_ENTITIES}/AdminAuditLog`, {
          method: "POST",
          body: JSON.stringify({
            entity_type: "UserProfile",
            entity_id:   userId,
            action:      "clear_memory",
            changes:     JSON.stringify(clearData),
            reason:      reason.trim(),
            timestamp:   new Date().toISOString(),
          }),
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
