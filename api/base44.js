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

// Retention caps per tier
const CHAT_RETENTION_LIMITS = { free: 2, plus: 20, pro: 100, annual: 9999, family: 9999 };

// CORS — only allow the production frontend and localhost dev servers
const ALLOWED_ORIGINS = new Set([
  "https://unfiltrbyjavier2.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
]);

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin)) {
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
    return res.status(500).json({ error: "Server configuration error: BASE44_SERVICE_TOKEN not set" });
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
    const queryRes = await fetch(`${B44_ENTITIES}/ChatHistory/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filters: [
          { field: "apple_user_id", operator: "eq", value: apple_user_id },
          { field: "companion_id", operator: "eq", value: companion_id },
          { field: "local_date", operator: "eq", value: localDate },
        ],
        limit: 1,
      }),
    });

    if (!queryRes.ok) {
      const bodyText = await queryRes.text();
      console.error(
        `[base44/saveChatHistory] Query failed HTTP ${queryRes.status} — ${bodyText.slice(0, 200)}`
      );
      return res
        .status(queryRes.status)
        .json({ error: `Base44 query failed: ${queryRes.status}` });
    }

    const queryData = await queryRes.json();
    const records = Array.isArray(queryData) ? queryData : queryData.items || [];

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

  const r = await fetch(`${B44_ENTITIES}/ChatHistory/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ field: "apple_user_id", operator: "eq", value: appleId }],
      sort: [{ field: "saved_at", direction: "desc" }],
      limit: 500,
    }),
  });
  if (!r.ok) return;
  const data = await r.json();
  const all = Array.isArray(data) ? data : data.items || [];
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
  const token = b44Token();
  const headers = b44Headers();
  const limit = Math.min(parseInt(limitArg, 10) || 9999, 9999);
  try {
    const r = await fetch(`${B44_ENTITIES}/ChatHistory/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filters: [{ field: "apple_user_id", operator: "eq", value: apple_user_id }],
        sort: [{ field: "saved_at", direction: "desc" }],
        limit,
      }),
    });
    if (!r.ok) {
      const bodyText = await r.text();
      console.error(`[base44/getChatHistory] Query failed HTTP ${r.status} — ${bodyText.slice(0, 200)}`);
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const records = Array.isArray(data) ? data : (data.items || []);
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
  if (!apple_user_id || typeof apple_user_id !== "string") {
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  const token = b44Token();
  const headers = b44Headers();
  try {
    // Verify the record belongs to the requesting user before deleting
    const checkRes = await fetch(`${B44_ENTITIES}/ChatHistory/${record_id}`, { headers });
    if (!checkRes.ok) {
      return res.status(checkRes.status).json({ error: `Record not found: ${checkRes.status}` });
    }
    const record = await checkRes.json();
    if (record.apple_user_id !== apple_user_id) {
      console.warn(`[base44/deleteChatHistory] Ownership mismatch — requested by ${apple_user_id}, record owned by ${record.apple_user_id}`);
      return res.status(403).json({ error: "Forbidden" });
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
    return res.status(500).json({ error: "Server configuration error: BASE44_SERVICE_TOKEN not set" });
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
  const token = b44Token();
  const headers = b44Headers();
  try {
    const r = await fetch(`${B44_ENTITIES}/ChatHistory/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filters: [{ field: "apple_user_id", operator: "eq", value: apple_user_id }],
        limit: 500,
      }),
    });
    if (!r.ok) {
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const all = Array.isArray(data) ? data : (data.items || []);
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
  const token = b44Token();
  const headers = { Authorization: `Bearer ${token}` };
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
  if (!companion_id || typeof companion_id !== "string") {
    return res.status(400).json({ error: "companion_id is required" });
  }
  const token = b44Token();
  const headers = { Authorization: `Bearer ${token}` };
  const limit = Math.min(parseInt(limitArg, 10) || 20, 100);
  try {
    const r = await fetch(
      `${B44_ENTITIES}/Message?apple_user_id=${encodeURIComponent(apple_user_id)}&companion_id=${encodeURIComponent(companion_id)}&limit=${limit}&sort=-created_date`,
      { headers }
    );
    if (!r.ok) {
      return res.status(r.status).json({ error: `Base44 query failed: ${r.status}` });
    }
    const data = await r.json();
    const records = Array.isArray(data) ? data : (data?.records || []);
    return res.status(200).json({ ok: true, items: records });
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
  const token = b44Token();
  const headers = { Authorization: `Bearer ${token}` };
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
  const token = b44Token();
  const headers = b44Headers();
  try {
    // Verify ownership before deleting
    const checkRes = await fetch(`${B44_ENTITIES}/JournalEntry/${record_id}`, { headers });
    if (!checkRes.ok) {
      return res.status(checkRes.status).json({ error: `Record not found: ${checkRes.status}` });
    }
    const record = await checkRes.json();
    if (record.apple_user_id !== apple_user_id) {
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
  const token = b44Token();
  const headers = { Authorization: `Bearer ${token}` };
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
  const token = b44Token();
  const headers = b44Headers();
  try {
    // Verify ownership when apple_user_id is provided
    if (apple_user_id) {
      const checkRes = await fetch(`${B44_ENTITIES}/UserProfile/${profile_id}`, { headers });
      if (checkRes.ok) {
        const record = await checkRes.json();
        if (record.apple_user_id && record.apple_user_id !== apple_user_id) {
          console.warn(`[base44/updateUserProfile] Ownership mismatch for profile ${profile_id}`);
          return res.status(403).json({ error: "Forbidden" });
        }
      }
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
    adminToken:         !!process.env.ADMIN_TOKEN,
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
  if (a.length !== b.length) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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
