/**
 * api/saveChatHistory.js
 *
 * Vercel serverless function that upserts a daily ChatHistory record in Base44.
 * Moving this write out of the browser/WKWebView avoids CORS issues and keeps
 * the Base44 service token off the client bundle.
 *
 * POST /api/saveChatHistory
 * Body: {
 *   apple_user_id:    string  (required)
 *   companion_id:     string  (required)
 *   companion_name:   string  (optional, defaults to "Companion")
 *   messages:         Array<{role, content}>  (last ≤50 messages)
 *   tier:             "free"|"plus"|"pro"|"annual"  (optional, defaults to "free")
 *   existingRecordId: string|null  (client cache — skip the query if already known)
 *   upsertKey:        string|null  (format: "{apple_user_id}|{companion_id}|{YYYYMMDD}")
 * }
 *
 * Response: { ok: true, id: string, key: string }
 *
 * Required env var (server-side only, never sent to browser):
 *   BASE44_SERVICE_TOKEN — service-role token for Base44 API calls
 *
 * Falls back to the published app-level token if the env var is not yet set
 * (same token already present in the legacy client code).
 */

import { B44_ENTITIES, b44Token } from "./_b44.js";

// Retention caps mirroring the client-side constants
const CHAT_RETENTION_LIMITS = { free: 2, plus: 20, pro: 100, annual: 9999 };

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Resolve the Base44 token.  Prefer the env var; fall back to the legacy
  // app-level token so deployments without the env var don't break immediately.
  const envToken = b44Token();
  if (!envToken) {
    console.warn(
      "[saveChatHistory] BASE44_SERVICE_TOKEN is not set — " +
        "using built-in fallback token. Set the env var in Vercel for best security."
    );
  }
  // NOTE: the fallback token below is the same one that was already visible in
  // the client bundle; moving it server-side reduces its exposure.
  const token = envToken || "1156284fb9144ad9ab95afc962e848d8";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const body = req.body || {};
  const {
    apple_user_id,
    companion_id,
    companion_name,
    messages,
    tier,
    existingRecordId,
    upsertKey,
  } = body;

  // Validate required fields
  if (!apple_user_id || typeof apple_user_id !== "string") {
    console.warn("[saveChatHistory] Rejected — missing or invalid apple_user_id");
    return res.status(400).json({ error: "apple_user_id is required" });
  }
  if (!companion_id || typeof companion_id !== "string") {
    console.warn("[saveChatHistory] Rejected — missing or invalid companion_id");
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
          `[saveChatHistory] PUT failed HTTP ${r.status} — ${bodyText.slice(0, 200)}`
        );
        return res.status(r.status).json({ error: `Base44 PUT failed: ${r.status}` });
      }
      console.log(`[saveChatHistory] PUT (fast-path) id=${existingRecordId} ok`);
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
        `[saveChatHistory] Query failed HTTP ${queryRes.status} — ${bodyText.slice(0, 200)}`
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
          `[saveChatHistory] PUT (existing) failed HTTP ${putRes.status} — ${bodyText.slice(0, 200)}`
        );
        return res
          .status(putRes.status)
          .json({ error: `Base44 PUT failed: ${putRes.status}` });
      }
      console.log(`[saveChatHistory] PUT (query-found) id=${recordId} ok`);
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
        `[saveChatHistory] POST failed HTTP ${postRes.status} — ${bodyText.slice(0, 200)}`
      );
      return res
        .status(postRes.status)
        .json({ error: `Base44 POST failed: ${postRes.status}` });
    }

    const newData = await postRes.json();
    console.log(`[saveChatHistory] POST (new) id=${newData?.id} ok`);

    // Fire-and-forget pruning — runs async after response is sent
    pruneOldChatHistory(apple_user_id, resolvedTier, headers).catch(() => {});

    return res
      .status(200)
      .json({ ok: true, id: newData?.id || null, key: expectedKey });
  } catch (err) {
    console.error("[saveChatHistory] Unexpected error:", err.message);
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
