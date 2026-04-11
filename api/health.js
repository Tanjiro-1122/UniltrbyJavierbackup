/**
 * api/health.js
 *
 * Lightweight health-check endpoint for diagnosing production vs. preview
 * deployment configuration issues (especially missing Vercel env vars that
 * cause Base44 saves to fail silently on iPhone).
 *
 * GET /api/health
 *
 * Response (non-secret — safe to expose publicly):
 * {
 *   ok: true,
 *   env: {
 *     openai:             boolean  — OPENAI_API_KEY is set
 *     base44ServiceToken: boolean  — BASE44_SERVICE_TOKEN is set
 *     b44ProxySecret:     boolean  — B44_PROXY_SECRET is set
 *     adminToken:         boolean  — ADMIN_TOKEN is set
 *     revenueCat:         boolean  — REVENUECAT_SECRET_KEY is set
 *   },
 *   base44Reachable: boolean|null  — null when token not set (no check performed)
 *   timestamp: string              — ISO 8601
 * }
 *
 * No secrets are returned — only whether each variable is present.
 */

import { B44_ENTITIES, b44Token } from "./_b44.js";

export default async function handler(req, res) {
  // No caching — always return live status
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
      // 200/401/403/404 all mean Base44 is reachable; only network-level failure means not
      base44Reachable = true;
      console.log(`[health] Base44 connectivity check → HTTP ${r.status}`);
    } catch (err) {
      base44Reachable = false;
      console.warn("[health] Base44 connectivity check failed:", err.message);
    }
  } else {
    console.warn(
      "[health] BASE44_SERVICE_TOKEN not set — skipping Base44 connectivity check. " +
        "Chat history saves will use the built-in fallback token."
    );
  }

  return res.status(200).json({
    ok: true,
    env,
    base44Reachable,
    timestamp: new Date().toISOString(),
  });
}
