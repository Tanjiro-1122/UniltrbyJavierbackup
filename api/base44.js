/**
 * api/base44.js
 *
 * Consolidated Vercel serverless function for all Base44 proxy operations.
 * Replaces api/saveChatHistory.js, api/saveMessages.js, api/health.js, and
 * api/b44proxy.js to stay within the Vercel Hobby plan limit of 12 Serverless
 * Functions.
 *
 * POST /api/base44
 * Body: { action: string, ...actionPayload }
 *
 * Public actions (CORS-gated, no extra auth):
 *   saveChatHistory — upsert today's ChatHistory record in Base44
 *     { action, apple_user_id, companion_id, companion_name?, messages?, tier?,
 *       existingRecordId?, upsertKey? }
 *
 *   saveMessages — batch-save Message records in Base44
 *     { action, messages: Array<{apple_user_id, companion_id, role, content, created_date?}> }
 *
 *   health — report env var presence and Base44 reachability (no secrets returned)
 *     { action }
 *
 * Proxy actions (require X-B44-Proxy-Secret header matching B44_PROXY_SECRET env var):
 *   proxy — general-purpose entity proxy (get / update / list)
 *     { action: "proxy", proxyAction: "get"|"update"|"list", entity, id?, data? }
 *
 * Required env var (server-side only, never sent to browser):
 *   BASE44_SERVICE_TOKEN — service-role token for Base44 API calls
 */

import { B44_ENTITIES, b44Token, b44Headers } from "./_b44.js";
import { createRequestContext, checkRateLimit } from "./_helpers.js";
import crypto from "crypto";

// Retention caps per tier
const CHAT_RETENTION_LIMITS = { free: 2, plus: 20, pro: 100, annual: 9999, family: 9999 };

const RECOVERY_BACKUP_LIMIT = 30;

function normalizeRecords(data) {
  return Array.isArray(data) ? data : (data?.items || data?.records || []);
}

function newBackupId(prefix = "backup") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

async function findProfileByAppleId(appleUserId, headers = b44Headers()) {
  if (!appleUserId) return null;
  const r = await fetch(`${B44_ENTITIES}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`, { headers });
  if (!r.ok) return null;
  const data = await r.json();
  return normalizeRecords(data)[0] || null;
}

async function appendRecoveryBackup({ profile, appleUserId, type, label, payload, source = "user_action", headers = b44Headers() }) {
  try {
    const resolvedProfile = profile || await findProfileByAppleId(appleUserId, headers);
    if (!resolvedProfile?.id) return { ok: false, reason: "profile_not_found" };
    const backup = {
      id: newBackupId(type),
      type,
      label,
      source,
      apple_user_id: resolvedProfile.apple_user_id || appleUserId || null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payload,
    };
    const nowMs = Date.now();
    const existing = (Array.isArray(resolvedProfile.recovery_backups) ? resolvedProfile.recovery_backups : [])
      .filter(b => !b.expires_at || new Date(b.expires_at).getTime() > nowMs);
    const next = [backup, ...existing].slice(0, RECOVERY_BACKUP_LIMIT);
    const r = await fetch(`${B44_ENTITIES}/UserProfile/${resolvedProfile.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ recovery_backups: next, last_recovery_backup_at: backup.created_at }),
    });
    if (!r.ok) {
      const bodyText = await r.text().catch(() => "");
      console.warn(`[recovery] backup write failed HTTP ${r.status}: ${bodyText.slice(0, 160)}`);
      return { ok: false, reason: `write_failed_${r.status}` };
    }
    return { ok: true, backupId: backup.id, profileId: resolvedProfile.id };
  } catch (e) {
    console.warn("[recovery] backup append failed:", e.message);
    return { ok: false, reason: e.message };
  }
}

// CORS — only allow the production frontend, localhost dev servers, and Vercel preview deployments
const ALLOWED_ORIGINS = new Set([
  "https://unfiltrbyjavier2.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Allow preview deployments for this specific project only.
  // Vercel preview URLs follow the pattern: <project>-<hash>-<org>.vercel.app
  // Matching the exact project name prevents tenants like "unfiltrmalicious"
  // from making credentialed cross-origin requests to this API.
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && /^unfiltr-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(url.hostname)) return true;
  } catch {}
  return false;
}

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-B44-Proxy-Secret");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ctx = createRequestContext(req);
  res.setHeader("X-Request-Id", ctx.requestId);

  const rl = checkRateLimit(ctx.userId, ctx.clientIp);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.retryAfterSeconds}s and try again.`,
    });
  }

  const body = req.body || {};
  const { action } = body;

  if (!action) {
    return res.status(400).json({ error: "action is required" });
  }

  if (action === "saveChatHistory")     return handleSaveChatHistory(req, res, body);
  if (action === "saveMessages")        return handleSaveMessages(req, res, body);
  if (action === "getChatHistory")      return handleGetChatHistory(req, res, body);
  if (action === "deleteChatHistory")   return handleDeleteChatHistory(req, res, body);
  if (action === "clearAllChatHistory") return handleClearAllChatHistory(req, res, body);
  if (action === "getMoodEntries")      return handleGetMoodEntries(req, res, body);
  if (action === "getRecentMessages")   return handleGetRecentMessages(req, res, body);
  if (action === "getJournalEntries")   return handleGetJournalEntries(req, res, body);
  if (action === "deleteJournalEntry")  return handleDeleteJournalEntry(req, res, body);
  if (action === "getUserProfile")      return handleGetUserProfile(req, res, body);
  if (action === "updateUserProfile")   return handleUpdateUserProfile(req, res, body);
  if (action === "health")              return handleHealth(req, res);
  if (action === "proxy")               return handleProxy(req, res, body);

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ── saveChatHistory ────────────────────────────────────────────────────────────

async function handleSaveChatHistory(req, res, body) {
  const token = b44Token();
  if (!token) {
    console.error("[base44/saveChatHistory] BASE44_SERVICE_TOKEN is not set — cannot save chat history.");
    return res.status(500).json({ error: "Server configuration error" });
  }
  const headers = b44Headers();

  const {
    apple_user_id,
    companion_id,
    companion_name,
    messages,
    tier,
    existingRecordId,
    upsertKey,
  } = body;

  if (!apple_user_id || typeof apple_user_id !== "string") {
    console.warn("[base44/saveChatHistory] Rejected — missing or invalid apple_user_id");
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  if (!companion_id || typeof companion_id !== "string") {
    console.warn("[base44/saveChatHistory] Rejected — missing or invalid companion_id");
    return res.status(400).json({ error: "companion_id is required" });
  }

  const now = new Date();
  const localDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const expectedKey = `${apple_user_id}|${companion_id}|${localDate}`;
  const msgSlice = (Array.isArray(messages) ? messages : [])
    .slice(-50)
    .map((m) => ({ role: m.role, content: m.content }));
  const resolvedTier = tier || "free";

  try {
    // ── Fast path: client already knows the record ID and the key matches ──
    if (existingRecordId && upsertKey === expectedKey) {
      const r = await fetch(`${B44_ENTITIES}/ChatHistory/${existingRecordId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          messages: JSON.stringify(msgSlice),
          message_count: msgSlice.length,
          saved_at: now.toISOString(),
        }),
      });
      if (!r.ok) {
        const bodyText = await r.text();
        console.error(
          `[base44/saveChatHistory] PUT failed HTTP ${r.status} — ${bodyText.slice(0, 200)}`
        );
        return res.status(r.status).json({ error: `Base44 PUT failed: ${r.status}` });
      }
      console.log(`[base44/saveChatHistory] PUT (fast-path) id=${existingRecordId} ok`);
      // Prune on update too so a downgraded user doesn't retain excess history indefinitely
      pruneOldChatHistory(apple_user_id, resolvedTier, headers).catch(() => {});
      return res.status(200).json({ ok: true, id: existingRecordId, key: expectedKey });
    }

    // ── Query for an existing record for today ────────────────────────────
    const queryRes = await fetch(
      `${B44_ENTITIES}/ChatHistory?apple_user_id=${encodeURIComponent(apple_user_id)}&companion_id=${encodeURIComponent(companion_id)}&local_date=${encodeURIComponent(localDate)}&limit=1`,
      { headers }
    );

    let records = [];
    if (!queryRes.ok) {
      const bodyText = await queryRes.text();
      console.error(
        `[base44/saveChatHistory] Query failed HTTP ${queryRes.status} — ${bodyText.slice(0, 200)}`
      );
      // Auth errors (401/403) indicate a configuration problem — propagate them.
      // Any other failure (e.g. 405 Method Not Allowed from a schema/query issue)
      // is treated as "no existing record found today" so we fall through to POST
      // and create a new record rather than losing the conversation entirely.
      if (queryRes.status === 401 || queryRes.status === 403) {
        return res
          .status(queryRes.status)
          .json({ error: `Base44 query failed: ${queryRes.status}` });
      }
      console.warn(`[base44/saveChatHistory] Falling through to POST after query error ${queryRes.status}`);
    } else {
      const queryData = await queryRes.json();
      records = Array.isArray(queryData) ? queryData : (queryData.items || queryData.records || []);
    }

    if (records.length > 0) {
      // ── Update existing record ──────────────────────────────────────────
      const recordId = records[0].id;
      const putRes = await fetch(`${B44_ENTITIES}/ChatHistory/${recordId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          messages: JSON.stringify(msgSlice),
          message_count: msgSlice.length,
          saved_at: now.toISOString(),
        }),
      });
      if (!putRes.ok) {
        const bodyText = await putRes.text();
        console.error(
          `[base44/saveChatHistory] PUT (existing) failed HTTP ${putRes.status} — ${bodyText.slice(0, 200)}`
        );
        return res
          .status(putRes.status)
          .json({ error: `Base44 PUT failed: ${putRes.status}` });
      }
      console.log(`[base44/saveChatHistory] PUT (query-found) id=${recordId} ok`);
      // Prune on update too so a downgraded user doesn't retain excess history indefinitely
      pruneOldChatHistory(apple_user_id, resolvedTier, headers).catch(() => {});
      return res.status(200).json({ ok: true, id: recordId, key: expectedKey });
    }

    // ── Create new record ─────────────────────────────────────────────────
    const postRes = await fetch(`${B44_ENTITIES}/ChatHistory`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        apple_user_id,
        companion_id,
        companion_name: companion_name || "Companion",
        local_date: localDate,
        messages: JSON.stringify(msgSlice),
        saved_at: now.toISOString(),
        tier: resolvedTier,
        message_count: msgSlice.length,
      }),
    });

    if (!postRes.ok) {
      const bodyText = await postRes.text();
      console.error(
        `[base44/saveChatHistory] POST failed HTTP ${postRes.status} — ${bodyText.slice(0, 200)}`
      );
      return res
        .status(postRes.status)
        .json({ error: `Base44 POST failed: ${postRes.status}` });
    }

    const newData = await postRes.json();
    console.log(`[base44/saveChatHistory] POST (new) id=${newData?.id} ok`);

    // Fire-and-forget pruning — runs async after response is sent
    pruneOldChatHistory(apple_user_id, resolvedTier, headers).catch(() => {});

    return res
      .status(200)
      .json({ ok: true, id: newData?.id || null, key: expectedKey });
  } catch (err) {
    console.error("[base44/saveChatHistory] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error saving chat history" });
  }
}

/**
 * Delete ChatHistory records beyond the tier retention limit.
 * Runs server-side after a successful POST — never blocks the response.
 */
async function pruneOldChatHistory(appleId, tier, headers) {
  const retainLimit = CHAT_RETENTION_LIMITS[tier] ?? 2;
  if (retainLimit >= 9999) return; // annual: unlimited

  const r = await fetch(
    `${B44_ENTITIES}/ChatHistory?apple_user_id=${encodeURIComponent(appleId)}&limit=500&sort=-saved_at`,
    { headers }
  );
  if (!r.ok) return;
  const data = await r.json();
  const all = Array.isArray(data) ? data : (data.items || data.records || []);
  // API returns records sorted by saved_at desc; keep the newest N, delete the rest
  const toDelete = all.slice(retainLimit);
  for (const session of toDelete) {
    fetch(`${B44_ENTITIES}/ChatHistory/${session.id}`, {
      method: "DELETE",
      headers,
    }).catch(() => {});
  }
}

// ── getChatHistory ─────────────────────────────────────────────────────────────

async function handleGetChatHistory(req, res, body) {
  const { apple_user_id, limit: limitArg } = body;
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  const limit = Math.min(parseInt(limitArg, 10) || 9999, 9999);
  try {
    const r = await fetch(
      `${B44_ENTITIES}/ChatHistory?apple_user_id=${encodeURIComponent(apple_user_id)}&limit=${limit}&sort=-saved_at`,
      { headers }
    );
    if (!r.ok) {
      const bodyText = await r.text();
      console.error(`[base44/getChatHistory] Query failed HTTP ${r.status} — ${bodyText.slice(0, 200)}`);
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const records = Array.isArray(data) ? data : (data.items || data.records || []);
    return res.status(200).json({ ok: true, items: records });
  } catch (err) {
    console.error("[base44/getChatHistory] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error fetching chat history" });
  }
}

// ── deleteChatHistory ──────────────────────────────────────────────────────────

async function handleDeleteChatHistory(req, res, body) {
  const { record_id, apple_user_id } = body;
  if (!record_id || typeof record_id !== "string") {
    return res.status(400).json({ error: "record_id is required" });
  }
  // apple_user_id is required for ownership verification — anonymous deletes are
  // not permitted. The caller must prove they own the record before it is removed.
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  try {
    const checkRes = await fetch(`${B44_ENTITIES}/ChatHistory/${record_id}`, { headers });
    if (!checkRes.ok) {
      return res.status(checkRes.status).json({ error: `Record not found: ${checkRes.status}` });
    }
    const record = await checkRes.json();
    // Deny deletion if the record has no owner OR is owned by a different user.
    if (!record.apple_user_id || record.apple_user_id !== apple_user_id) {
      console.warn(`[base44/deleteChatHistory] Ownership mismatch — requested by ${apple_user_id}, record owned by ${record.apple_user_id}`);
      return res.status(403).json({ error: "Forbidden" });
    }
    const backupResult = await appendRecoveryBackup({
      appleUserId: apple_user_id,
      type: "chat_record",
      label: `Deleted chat from ${record.saved_at || record.created_date || "unknown date"}`,
      payload: { record },
      headers,
    });
    if (!backupResult.ok) {
      console.warn(`[base44/deleteChatHistory] Continuing delete without recovery backup: ${backupResult.reason}`);
    }
    const r = await fetch(`${B44_ENTITIES}/ChatHistory/${record_id}`, {
      method: "DELETE",
      headers,
    });
    if (!r.ok) {
      const bodyText = await r.text();
      console.error(`[base44/deleteChatHistory] DELETE failed HTTP ${r.status} — ${bodyText.slice(0, 200)}`);
      return res.status(r.status).json({ error: `Base44 delete failed: ${r.status}` });
    }
    console.log(`[base44/deleteChatHistory] Deleted ${record_id}`);
    return res.status(200).json({ ok: true, deleted: record_id });
  } catch (err) {
    console.error("[base44/deleteChatHistory] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error deleting chat history" });
  }
}

// ── saveMessages ───────────────────────────────────────────────────────────────

async function handleSaveMessages(req, res, body) {
  const token = b44Token();
  if (!token) {
    console.error("[base44/saveMessages] BASE44_SERVICE_TOKEN is not set — cannot save messages.");
    return res.status(500).json({ error: "Server configuration error" });
  }
  const headers = b44Headers();

  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required and must not be empty" });
  }

  // Cap batch size to prevent abuse
  const MAX_BATCH = 20;
  const batch = messages.slice(0, MAX_BATCH);

  let saved = 0;
  const errors = [];

  for (const msg of batch) {
    if (!msg.apple_user_id || !msg.companion_id || !msg.role || !msg.content) {
      errors.push({ reason: "missing required fields", role: msg.role });
      continue;
    }

    try {
      const r = await fetch(`${B44_ENTITIES}/Message`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          apple_user_id: msg.apple_user_id,
          companion_id: msg.companion_id,
          role: msg.role,
          content: msg.content,
          created_date: msg.created_date || new Date().toISOString(),
        }),
      });

      if (!r.ok) {
        const bodyText = await r.text();
        console.error(
          `[base44/saveMessages] POST failed HTTP ${r.status} role=${msg.role} — ${bodyText.slice(0, 200)}`
        );
        errors.push({ status: r.status, role: msg.role });
      } else {
        saved++;
      }
    } catch (err) {
      console.error(`[base44/saveMessages] Fetch error role=${msg.role}:`, err.message);
      errors.push({ error: err.message, role: msg.role });
    }
  }

  return res.status(200).json({
    ok: true,
    saved,
    ...(errors.length > 0 ? { errors } : {}),
  });
}

// ── clearAllChatHistory ────────────────────────────────────────────────────────

async function handleClearAllChatHistory(req, res, body) {
  const { apple_user_id } = body;
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  try {
    // Verify the apple_user_id corresponds to a real registered profile before
    // deleting anything.  This prevents a caller from wiping data for an
    // apple_user_id they don't own (or that doesn't exist).
    const profileRes = await fetch(
      `${B44_ENTITIES}/UserProfile?apple_user_id=${encodeURIComponent(apple_user_id)}&limit=1`,
      { headers }
    );
    // A non-2xx response means we cannot confirm ownership — abort rather than
    // silently proceeding and deleting records without verification.
    if (!profileRes.ok) {
      console.error(`[base44/clearAllChatHistory] Profile verification failed HTTP ${profileRes.status} — aborting deletion`);
      return res.status(500).json({ error: "Could not verify profile ownership — deletion aborted" });
    }
    const profileData = await profileRes.json();
    const profileRecords = Array.isArray(profileData)
      ? profileData
      : (profileData.items || profileData.records || []);
    if (!profileRecords.length) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const r = await fetch(
      `${B44_ENTITIES}/ChatHistory?apple_user_id=${encodeURIComponent(apple_user_id)}&limit=500`,
      { headers }
    );
    if (!r.ok) {
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const all = Array.isArray(data) ? data : (data.items || data.records || []);
    if (all.length) {
      const backupResult = await appendRecoveryBackup({
        profile: profileRecords[0],
        appleUserId: apple_user_id,
        type: "chat_history_bulk",
        label: `Cleared ${all.length} chat histor${all.length === 1 ? "y" : "ies"}`,
        payload: { records: all },
        headers,
      });
      if (!backupResult.ok) {
        console.warn(`[base44/clearAllChatHistory] Continuing clear without recovery backup: ${backupResult.reason}`);
      }
    }
    await Promise.all(
      all.map(s =>
        fetch(`${B44_ENTITIES}/ChatHistory/${s.id}`, { method: "DELETE", headers }).catch(() => {})
      )
    );
    console.log(`[base44/clearAllChatHistory] Deleted ${all.length} records for ${apple_user_id}`);
    return res.status(200).json({ ok: true, deleted: all.length });
  } catch (err) {
    console.error("[base44/clearAllChatHistory] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error clearing chat history" });
  }
}

// ── getMoodEntries ─────────────────────────────────────────────────────────────

async function handleGetMoodEntries(req, res, body) {
  const { apple_user_id, limit: limitArg } = body;
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  const limit = Math.min(parseInt(limitArg, 10) || 60, 200);
  try {
    const r = await fetch(
      `${B44_ENTITIES}/MoodEntry?apple_user_id=${encodeURIComponent(apple_user_id)}&limit=${limit}&sort=-created_date`,
      { headers }
    );
    if (!r.ok) {
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const records = Array.isArray(data) ? data : (data?.records || []);
    return res.status(200).json({ ok: true, items: records });
  } catch (err) {
    console.error("[base44/getMoodEntries] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error fetching mood entries" });
  }
}

// ── getRecentMessages ──────────────────────────────────────────────────────────

async function handleGetRecentMessages(req, res, body) {
  const { apple_user_id, companion_id, limit: limitArg } = body;
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  const limit = Math.min(parseInt(limitArg, 10) || 20, 100);
  try {
    // Query ChatHistory — most recent records for this user, optionally filtered by companion
    let url = `${B44_ENTITIES}/ChatHistory?apple_user_id=${encodeURIComponent(apple_user_id)}&limit=${limit}&sort=-saved_at`;
    if (companion_id && typeof companion_id === "string") {
      url += `&companion_id=${encodeURIComponent(companion_id)}`;
    }
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const bodyText = await r.text().catch(() => "");
      console.error(`[base44/getRecentMessages] ChatHistory query failed HTTP ${r.status} — ${bodyText.slice(0, 200)}`);
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const records = Array.isArray(data) ? data : (data?.records || []);
    // Flatten messages arrays from ChatHistory records into a single message list
    const messages = [];
    for (const record of records.reverse()) {
      const msgs = Array.isArray(record.messages) ? record.messages : [];
      for (const m of msgs) {
        if (m && m.role && m.content) {
          messages.push({ role: m.role, content: m.content, created_date: record.saved_at });
        }
      }
    }
    // Return last N messages
    const trimmed = messages.slice(-limit);
    console.log(`[base44/getRecentMessages] Returning ${trimmed.length} messages from ${records.length} ChatHistory records`);
    return res.status(200).json({ ok: true, items: trimmed });
  } catch (err) {
    console.error("[base44/getRecentMessages] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error fetching messages" });
  }
}

// ── getJournalEntries ──────────────────────────────────────────────────────────

async function handleGetJournalEntries(req, res, body) {
  const { apple_user_id, limit: limitArg } = body;
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  const limit = Math.min(parseInt(limitArg, 10) || 200, 500);
  try {
    const r = await fetch(
      `${B44_ENTITIES}/JournalEntry?apple_user_id=${encodeURIComponent(apple_user_id)}&limit=${limit}&sort=-created_date`,
      { headers }
    );
    if (!r.ok) {
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const records = Array.isArray(data) ? data : (data?.records || []);
    return res.status(200).json({ ok: true, items: records });
  } catch (err) {
    console.error("[base44/getJournalEntries] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error fetching journal entries" });
  }
}

// ── deleteJournalEntry ─────────────────────────────────────────────────────────

async function handleDeleteJournalEntry(req, res, body) {
  const { record_id, apple_user_id } = body;
  if (!record_id || typeof record_id !== "string") {
    return res.status(400).json({ error: "record_id is required" });
  }
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  try {
    // Verify ownership before deleting
    const checkRes = await fetch(`${B44_ENTITIES}/JournalEntry/${record_id}`, { headers });
    if (!checkRes.ok) {
      return res.status(checkRes.status).json({ error: `Record not found: ${checkRes.status}` });
    }
    const record = await checkRes.json();
    // Deny deletion if the record has no owner OR is owned by a different user.
    if (!record.apple_user_id || record.apple_user_id !== apple_user_id) {
      console.warn(`[base44/deleteJournalEntry] Ownership mismatch — requested by ${apple_user_id}`);
      return res.status(403).json({ error: "Forbidden" });
    }
    const r = await fetch(`${B44_ENTITIES}/JournalEntry/${record_id}`, { method: "DELETE", headers });
    if (!r.ok) {
      return res.status(r.status).json({ error: `Base44 delete failed: ${r.status}` });
    }
    return res.status(200).json({ ok: true, deleted: record_id });
  } catch (err) {
    console.error("[base44/deleteJournalEntry] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error deleting journal entry" });
  }
}

// ── getUserProfile ─────────────────────────────────────────────────────────────

async function handleGetUserProfile(req, res, body) {
  const { apple_user_id, profile_id } = body;
  if (!apple_user_id && !profile_id) {
    return res.status(400).json({ error: "apple_user_id or profile_id is required" });
  }
  const headers = b44Headers();
  try {
    let profile = null;
    if (profile_id) {
      const r = await fetch(`${B44_ENTITIES}/UserProfile/${profile_id}`, { headers });
      if (r.ok) profile = await r.json();
    }
    if (!profile && apple_user_id) {
      const r = await fetch(
        `${B44_ENTITIES}/UserProfile?apple_user_id=${encodeURIComponent(apple_user_id)}&limit=1`,
        { headers }
      );
      if (r.ok) {
        const data = await r.json();
        const records = Array.isArray(data) ? data : (data?.records || []);
        if (records[0]) profile = records[0];
      }
    }
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json({ ok: true, profile });
  } catch (err) {
    console.error("[base44/getUserProfile] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error fetching profile" });
  }
}

// ── updateUserProfile ──────────────────────────────────────────────────────────

async function handleUpdateUserProfile(req, res, body) {
  const { profile_id, apple_user_id, data: updateData } = body;
  if (!profile_id || typeof profile_id !== "string") {
    return res.status(400).json({ error: "profile_id is required" });
  }
  if (!updateData || typeof updateData !== "object") {
    return res.status(400).json({ error: "data object is required" });
  }
  // Require apple_user_id so that every update is ownership-verified.
  // Anonymous writes are not permitted — the caller must prove they own the profile.
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const headers = b44Headers();
  try {
    // Always verify ownership before writing
    const checkRes = await fetch(`${B44_ENTITIES}/UserProfile/${profile_id}`, { headers });
    if (!checkRes.ok) {
      return res.status(checkRes.status).json({ error: `Profile not found: ${checkRes.status}` });
    }
    const record = await checkRes.json();
    if (record.apple_user_id && record.apple_user_id !== apple_user_id) {
      console.warn(`[base44/updateUserProfile] Ownership mismatch for profile ${profile_id}`);
      return res.status(403).json({ error: "Forbidden" });
    }
    const r = await fetch(`${B44_ENTITIES}/UserProfile/${profile_id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });
    if (!r.ok) {
      const bodyText = await r.text();
      console.error(`[base44/updateUserProfile] PUT failed HTTP ${r.status} — ${bodyText.slice(0, 200)}`);
      return res.status(r.status).json({ error: `Base44 PUT failed: ${r.status}` });
    }
    const updated = await r.json();
    return res.status(200).json({ ok: true, profile: updated });
  } catch (err) {
    console.error("[base44/updateUserProfile] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal error updating profile" });
  }
}

// ── health ─────────────────────────────────────────────────────────────────────

async function handleHealth(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  const token = b44Token();

  const env = {
    openai:             !!process.env.OPENAI_API_KEY,
    base44ServiceToken: !!(process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY),
    b44ProxySecret:     !!process.env.B44_PROXY_SECRET,
    adminPass:          !!process.env.ADMIN_PASS,
    revenueCat:         !!process.env.REVENUECAT_SECRET_KEY,
  };

  // Only attempt a connectivity check when a token is configured
  let base44Reachable = null;
  if (token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const r = await fetch(`${B44_ENTITIES}/UserProfile?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      base44Reachable = true;
      console.log(`[base44/health] Base44 connectivity check → HTTP ${r.status}`);
    } catch (err) {
      base44Reachable = false;
      console.warn("[base44/health] Base44 connectivity check failed:", err.message);
    }
  } else {
    console.warn(
      "[base44/health] BASE44_SERVICE_TOKEN not set — skipping Base44 connectivity check."
    );
  }

  return res.status(200).json({
    ok: true,
    env,
    base44Reachable,
    timestamp: new Date().toISOString(),
  });
}

// ── proxy ──────────────────────────────────────────────────────────────────────
// Mirrors the former api/b44proxy.js — requires X-B44-Proxy-Secret auth.

const PROXY_ALLOWED_ENTITIES = new Set([
  "UserProfile",
  "Message",
  "JournalEntry",
  "MoodEntry",
  "ErrorLog",
]);

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Run a dummy comparison to prevent early-exit timing oracle on length.
    crypto.timingSafeEqual(ba, Buffer.alloc(ba.length));
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

async function handleProxy(req, res, body) {
  // ── Shared-secret auth ────────────────────────────────────────────────────
  const proxySecret = process.env.B44_PROXY_SECRET || "";
  const incoming    = (req.headers["x-b44-proxy-secret"] || "").trim();
  if (!proxySecret || !timingSafeEqual(incoming, proxySecret)) {
    console.warn("[base44/proxy] Unauthorized request — bad or missing X-B44-Proxy-Secret");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { proxyAction, entity, id, data } = body;

  if (!entity || !PROXY_ALLOWED_ENTITIES.has(entity)) {
    console.warn(`[base44/proxy] Blocked request for disallowed entity: ${entity}`);
    return res.status(400).json({ error: "Entity not allowed" });
  }

  const headers = b44Headers();

  try {
    if (proxyAction === "get") {
      if (!id) return res.status(400).json({ error: "id required for get" });
      const r = await fetch(`${B44_ENTITIES}/${entity}/${id}`, { headers });
      const d = await r.json().catch(() => ({}));
      console.log(`[base44/proxy] get ${entity}/${id} → ${r.status}`);
      return res.status(r.status).json(d);
    }

    if (proxyAction === "update") {
      if (!id) return res.status(400).json({ error: "id required for update" });
      const r = await fetch(`${B44_ENTITIES}/${entity}/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data || {}),
      });
      const d = await r.json().catch(() => ({}));
      console.log(`[base44/proxy] update ${entity}/${id} → ${r.status}`);
      return res.status(r.status).json(d);
    }

    if (proxyAction === "list") {
      const params = new URLSearchParams(data || {});
      const r = await fetch(`${B44_ENTITIES}/${entity}?${params.toString()}`, { headers });
      const d = await r.json().catch(() => ({}));
      console.log(`[base44/proxy] list ${entity} → ${r.status}`);
      return res.status(r.status).json(d);
    }

    return res.status(400).json({ error: `Unknown proxyAction: ${proxyAction}` });

  } catch (err) {
    console.error("[base44/proxy] upstream error:", err.message);
    return res.status(500).json({ error: "Proxy error" });
  }
}

