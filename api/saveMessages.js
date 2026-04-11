/**
 * api/saveMessages.js
 *
 * Vercel serverless function that saves a batch of Message records to Base44.
 * Moving this write out of the browser/WKWebView avoids CORS issues and keeps
 * the Base44 service token off the client bundle.
 *
 * POST /api/saveMessages
 * Body: {
 *   messages: Array<{
 *     apple_user_id: string  (required)
 *     companion_id:  string  (required)
 *     role:          "user"|"assistant"  (required)
 *     content:       string  (required)
 *     created_date:  string  (optional ISO timestamp, defaults to now)
 *   }>
 * }
 *
 * Response: { ok: true, saved: number, errors?: Array }
 *
 * Required env var (server-side only):
 *   BASE44_SERVICE_TOKEN — service-role token for Base44 API calls
 *
 * Falls back to the published app-level token if the env var is not yet set.
 */

import { B44_ENTITIES, b44Token } from "./_b44.js";

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

  // Resolve token with graceful fallback
  const envToken = b44Token();
  if (!envToken) {
    console.warn(
      "[saveMessages] BASE44_SERVICE_TOKEN is not set — " +
        "using built-in fallback token. Set the env var in Vercel for best security."
    );
  }
  const token = envToken || "1156284fb9144ad9ab95afc962e848d8";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const body = req.body || {};
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
    if (
      !msg.apple_user_id ||
      !msg.companion_id ||
      !msg.role ||
      !msg.content
    ) {
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
          `[saveMessages] POST failed HTTP ${r.status} role=${msg.role} — ${bodyText.slice(0, 200)}`
        );
        errors.push({ status: r.status, role: msg.role });
      } else {
        saved++;
      }
    } catch (err) {
      console.error(`[saveMessages] Fetch error role=${msg.role}:`, err.message);
      errors.push({ error: err.message, role: msg.role });
    }
  }

  return res.status(200).json({
    ok: true,
    saved,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
