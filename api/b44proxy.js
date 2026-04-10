/**
 * api/b44proxy.js — Vercel serverless function that proxies Base44 entity calls.
 *
 * Security controls:
 *  - CORS restricted to the production frontend origin (+ localhost for dev).
 *  - Every non-OPTIONS request must carry the X-B44-Proxy-Secret header whose
 *    value matches the B44_PROXY_SECRET environment variable.
 *  - Only explicit actions (get / update / list) are accepted via the body-style
 *    interface; open-ended query-path forwarding is intentionally removed.
 *  - Only the entities listed in ALLOWED_ENTITIES may be accessed.
 *  - DELETE and other destructive HTTP verbs are blocked.
 *
 * Required environment variable:
 *   B44_PROXY_SECRET — shared secret sent by the frontend as X-B44-Proxy-Secret
 */

import { B44_ENTITIES, b44Headers } from "./_b44.js";

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-B44-Proxy-Secret");
}

// ── Entity allowlist ──────────────────────────────────────────────────────────
const ALLOWED_ENTITIES = new Set([
  "UserProfile",
  "Message",
  "JournalEntry",
  "MoodEntry",
  "ErrorLog",
]);

// ── Shared-secret validation (constant-time) ──────────────────────────────────
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) {
    // Still iterate to avoid length-based timing leak
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  // Only POST is accepted for data operations.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Shared-secret auth ────────────────────────────────────────────────────
  const proxySecret = process.env.B44_PROXY_SECRET || "";
  const incoming    = (req.headers["x-b44-proxy-secret"] || "").trim();
  if (!proxySecret || !timingSafeEqual(incoming, proxySecret)) {
    console.warn("[b44proxy] Unauthorized request — bad or missing X-B44-Proxy-Secret");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  }

  const { entity, action, id, data } = body || {};

  // ── Entity allowlist check ────────────────────────────────────────────────
  if (!entity || !ALLOWED_ENTITIES.has(entity)) {
    console.warn(`[b44proxy] Blocked request for disallowed entity: ${entity}`);
    return res.status(400).json({ error: "Entity not allowed" });
  }

  const headers = b44Headers();

  try {
    // ── get ───────────────────────────────────────────────────────────────────
    if (action === "get") {
      if (!id) return res.status(400).json({ error: "id required for get" });
      const r = await fetch(`${B44_ENTITIES}/${entity}/${id}`, { headers });
      const d = await r.json().catch(() => ({}));
      console.log(`[b44proxy] get ${entity}/${id} → ${r.status}`);
      return res.status(r.status).json(d);
    }

    // ── update ────────────────────────────────────────────────────────────────
    if (action === "update") {
      if (!id) return res.status(400).json({ error: "id required for update" });
      const r = await fetch(`${B44_ENTITIES}/${entity}/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data || {}),
      });
      const d = await r.json().catch(() => ({}));
      console.log(`[b44proxy] update ${entity}/${id} → ${r.status}`);
      return res.status(r.status).json(d);
    }

    // ── list ──────────────────────────────────────────────────────────────────
    if (action === "list") {
      const params = new URLSearchParams(data || {});
      const r = await fetch(`${B44_ENTITIES}/${entity}?${params.toString()}`, { headers });
      const d = await r.json().catch(() => ({}));
      console.log(`[b44proxy] list ${entity} → ${r.status}`);
      return res.status(r.status).json(d);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error("[b44proxy] upstream error:", err.message);
    return res.status(500).json({ error: "Proxy error" });
  }
}
