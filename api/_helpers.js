/**
 * api/_helpers.js
 *
 * Shared performance, stability, and observability helpers for Vercel
 * serverless API functions.
 *
 * Exports:
 *  createRequestContext(req)          — requestId + userId for tracing/logging
 *  safeLogError(err, ctx)             — log errors without leaking secrets
 *  checkRateLimit(userId)             — in-memory per-user rate limit (best-effort)
 *  withAbortController(ms?)           — AbortController + auto-cancel helper
 *  getCachedProfile(id)               — read from short-lived UserProfile cache
 *  setCachedProfile(id, data)         — write to UserProfile cache
 *  invalidateCachedProfile(id)        — evict a profile from cache after a write
 *  getProfileTier(profileId)          — fetch verified subscription tier from DB
 *  mergeFacts(existing, extracted)    — merge extracted user facts with dedup
 *
 * Constants (overrideable via env vars):
 *  MAX_INPUT_CHARS    — AI_MAX_INPUT_CHARS    (default 8000)
 *  MAX_OUTPUT_TOKENS  — AI_MAX_OUTPUT_TOKENS  (default 800)
 *  AI_TIMEOUT_MS      — AI_REQUEST_TIMEOUT_MS (default 25000 ms)
 *  AI_MAX_RPM         — AI_MAX_RPM            (default 10 req/min)
 *
 * Daily message limits by tier (server-enforced):
 *  DAILY_MSG_LIMITS   — { free:10, plus:100, pro:200, annual:99999, ultimate_friend:99999 }
 */

import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Guardrail constants (overrideable via Vercel environment variables)
// ─────────────────────────────────────────────────────────────────────────────

function _safeInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Maximum total characters across all messages sent in a single chat request. */
export const MAX_INPUT_CHARS = _safeInt(process.env.AI_MAX_INPUT_CHARS, 8000);

/** Hard cap on OpenAI completion tokens. Applied on top of per-tier defaults. */
export const MAX_OUTPUT_TOKENS = _safeInt(process.env.AI_MAX_OUTPUT_TOKENS, 800);

/** Milliseconds before an upstream OpenAI request is aborted. */
// Fix B – Infinite Stream Timeout: default raised from 25s → 55s so GPT-4o
// has room to generate long responses without hitting our own abort before
// Vercel's 60s wall. The 5-second gap lets us return a graceful error message
// rather than letting Vercel kill the connection with a raw 504.
export const AI_TIMEOUT_MS = _safeInt(process.env.AI_REQUEST_TIMEOUT_MS, 55000);

/** Max AI/chat requests allowed per user per minute (best-effort, per-instance). */
export const AI_MAX_RPM = _safeInt(process.env.AI_MAX_RPM, 10);

// ─────────────────────────────────────────────────────────────────────────────
// Request context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a lightweight tracing context for a serverless request.
 *
 * @param {object} req  — Vercel/Node IncomingMessage with `body` already parsed
 * @returns {{ requestId: string, userId: string, clientIp: string }}
 */
export function createRequestContext(req) {
  const requestId =
    (req.headers && req.headers["x-request-id"]) ||
    (typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(8).toString("hex"));

  const body = req.body || {};
  const userId =
    body.profileId ||
    body.appleUserId ||
    (req.headers && req.headers["x-user-id"]) ||
    "anonymous";

  // Extract client IP — used as rate-limit key when userId is anonymous.
  const clientIp =
    (req.headers && (
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"]
    )) ||
    req.socket?.remoteAddress ||
    "unknown";

  return { requestId, userId, clientIp };
}

// ─────────────────────────────────────────────────────────────────────────────
// Secret-safe error logging
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Patterns that identify sensitive values that must never appear in logs.
 * Listed most-specific first so earlier replacements don't leave partial tokens.
 */
const REDACT_PATTERNS = [
  /sk-[A-Za-z0-9\-_]{20,}/g,    // OpenAI API keys
  /bearer [A-Za-z0-9\-_.+/]{10,}/gi, // Authorization Bearer values (case-insensitive)
  /eyJ[A-Za-z0-9\-_.+/]{10,}/g,  // JWTs / base64url tokens
];

function _redact(text) {
  let s = String(text ?? "");
  for (const re of REDACT_PATTERNS) {
    s = s.replace(re, "[REDACTED]");
  }
  return s;
}

/**
 * Log an error to stderr without leaking secret values.
 *
 * @param {Error|unknown} err
 * @param {{ tag?: string, requestId?: string, userId?: string }} ctx
 */
export function safeLogError(err, ctx = {}) {
  const tag       = ctx.tag       || "api";
  const requestId = ctx.requestId || "-";
  const userId    = ctx.userId    || "-";
  const message   = _redact(err?.message || String(err));
  const stack     = err?.stack
    ? _redact(err.stack.split("\n").slice(0, 3).join(" | "))
    : "";
  console.error(
    `[${tag}] reqId=${requestId} userId=${userId} error=${message}` +
    (stack ? ` stack=${stack}` : "")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI timeout / abort controller
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an AbortController that fires after `ms` milliseconds.
 *
 * Usage:
 *   const { signal, cancel } = withAbortController(25_000);
 *   try {
 *     const res = await openai.chat.completions.create({...}, { signal });
 *   } finally {
 *     cancel(); // always clear the timer
 *   }
 *
 * @param {number} [ms]  Timeout in milliseconds. Defaults to AI_TIMEOUT_MS.
 * @returns {{ signal: AbortSignal, cancel: () => void }}
 */
export function withAbortController(ms) {
  const timeoutMs  = (typeof ms === "number" && ms > 0) ? ms : AI_TIMEOUT_MS;
  const controller = new AbortController();
  const timerId    = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timerId),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory rate limiter (best-effort, per-process)
// ─────────────────────────────────────────────────────────────────────────────

const _rateLimitStore = new Map(); // userId → { count, windowStart }
const _RATE_WINDOW_MS = 60_000;   // 1-minute fixed window

/**
 * Check whether a user is within their allowed request rate.
 *
 * This is a best-effort, in-memory, per-process guard — on Vercel Hobby the
 * same function can run in multiple isolated instances, so this will not catch
 * all excess requests but will stop sustained bursts within a single instance.
 *
 * When userId is anonymous or missing, falls back to per-IP rate limiting so
 * unauthenticated callers cannot bypass the limit by omitting a user ID.
 *
 * @param {string} userId
 * @param {string} [clientIp]  — used as rate-limit key when userId is anonymous
 * @returns {{ allowed: true } | { allowed: false, retryAfterSeconds: number }}
 */
export function checkRateLimit(userId, clientIp) {
  // Determine the key: prefer the stable userId; fall back to IP so anonymous
  // requests are still rate-limited rather than allowed through unconditionally.
  const key = (!userId || userId === "anonymous")
    ? `ip:${clientIp || "unknown"}`
    : userId;

  const now   = Date.now();
  const entry = _rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > _RATE_WINDOW_MS) {
    _rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= AI_MAX_RPM) {
    const retryAfterSeconds = Math.ceil(
      (entry.windowStart + _RATE_WINDOW_MS - now) / 1000
    );
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true };
}

// Periodically sweep stale entries so the Map doesn't grow unbounded.
if (typeof setInterval === "function") {
  const _sweepInterval = setInterval(() => {
    const cutoff = Date.now() - _RATE_WINDOW_MS * 2;
    for (const [key, entry] of _rateLimitStore) {
      if (entry.windowStart < cutoff) _rateLimitStore.delete(key);
    }
  }, 5 * 60_000);
  // Don't keep the Node.js process alive just for this timer.
  if (typeof _sweepInterval.unref === "function") _sweepInterval.unref();
}

// ─────────────────────────────────────────────────────────────────────────────
// Short-lived UserProfile cache (reduces redundant Base44 round-trips)
// ─────────────────────────────────────────────────────────────────────────────

const _profileCache   = new Map(); // profileId → { data, expiresAt }
const _PROFILE_TTL_MS = 30_000;   // 30-second TTL — safe for read-heavy paths

/**
 * Return a cached UserProfile, or null if missing / expired.
 *
 * @param {string} profileId
 * @returns {object|null}
 */
export function getCachedProfile(profileId) {
  if (!profileId) return null;
  const entry = _profileCache.get(profileId);
  if (!entry || Date.now() > entry.expiresAt) {
    _profileCache.delete(profileId);
    return null;
  }
  return entry.data;
}

/**
 * Store a UserProfile in the short-lived cache.
 *
 * @param {string} profileId
 * @param {object} data
 */
export function setCachedProfile(profileId, data) {
  if (!profileId) return;
  _profileCache.set(profileId, { data, expiresAt: Date.now() + _PROFILE_TTL_MS });
}

/**
 * Evict a profile from the cache after a write so stale data isn't served.
 *
 * @param {string} profileId
 */
export function invalidateCachedProfile(profileId) {
  if (profileId) _profileCache.delete(profileId);
}

/**
 * Stable JSON key for deduplication of array items — ensures that two objects
 * with the same properties in different key orders produce the same key.
 * @param {*} x
 * @returns {string}
 */
function _stableKey(x) {
  if (typeof x !== "object" || x === null) return JSON.stringify(x);
  return JSON.stringify(
    Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
  );
}

/**
 * Deep-merge extracted user facts into an existing facts object.
 * - Scalar fields: new value wins over existing when non-empty.
 * - Array fields: entries are merged and deduplicated (stable-key comparison).
 * - Arrays are capped at 20 items to prevent unbounded growth.
 *
 * @param {object} existing   — current facts stored in UserProfile
 * @param {object} extracted  — newly extracted facts from AI
 * @returns {object}           merged facts object
 */
export function mergeFacts(existing = {}, extracted = {}) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(extracted)) {
    if (!value || value === "unknown" || value === "not mentioned") continue;
    if (Array.isArray(value) && Array.isArray(merged[key])) {
      const combined = [...merged[key], ...value];
      merged[key] = [...new Map(combined.map(x => [_stableKey(x), x])).values()].slice(0, 20);
    } else if (Array.isArray(value) && value.length > 0) {
      merged[key] = value;
    } else if (!Array.isArray(value)) {
      merged[key] = value;
    }
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-verified subscription tier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Daily message limits enforced server-side per tier.
 * These must stay in sync with the client-side DAILY_MSG_LIMITS in
 * src/components/useMessageLimit.jsx and src/lib/entitlements.js.
 * UNLIMITED is used for annual subscribers — effectively no enforced cap.
 */
export const UNLIMITED_MESSAGES = Number.MAX_SAFE_INTEGER;

export const DAILY_MSG_LIMITS = {
  free: 10,
  plus: 100,
  pro: 200,
  annual: UNLIMITED_MESSAGES,
  ultimate_friend: UNLIMITED_MESSAGES,
};

/**
 * Fetch the subscription tier for a profile directly from Base44 (DB).
 *
 * Uses the in-memory profile cache so repeated calls within 30 s are free.
 * On any fetch error the function returns free-tier flags so callers degrade
 * gracefully instead of blocking the user — the rate limiter still applies.
 *
 * @param {string} profileId
 * @returns {Promise<{ isPremium: boolean, isPro: boolean, isAnnual: boolean, profile: object|null, fetchFailed: boolean }>}
 */
export async function getProfileTier(profileId) {
  if (!profileId) return { isPremium: false, isPro: false, isAnnual: false, profile: null, fetchFailed: false };

  let profile = getCachedProfile(profileId);
  if (!profile) {
    try {
      // Dynamic import avoids a circular dependency (_b44 ← _helpers).
      const { b44Fetch, B44_ENTITIES } = await import("./_b44.js");
      profile = await b44Fetch(`${B44_ENTITIES}/UserProfile/${profileId}`);
      if (profile) setCachedProfile(profileId, profile);
    } catch (e) {
      console.warn(`[getProfileTier] lookup failed for ${profileId}: ${e.message}`);
      return { isPremium: false, isPro: false, isAnnual: false, profile: null, fetchFailed: true };
    }
  }

  const isUltimateFriend = !!(profile?.ultimate_friend) || !!(profile?.family_plan);
  const isAnnual  = !!(profile?.annual_plan) || isUltimateFriend;
  const isPro     = !!(profile?.pro_plan);
  const isPremium = !!(profile?.is_premium || profile?.premium || isPro || isAnnual || isUltimateFriend);
  return { isPremium, isPro, isAnnual, isUltimateFriend, profile, fetchFailed: false };
}

/**
 * Look up tier by Apple user ID (e.g. "001234.abcdef…") when a profileId is
 * unavailable. Queries the UserProfile entity list filtered by apple_user_id.
 * Returns the same shape as getProfileTier().
 */
export async function getProfileTierByAppleId(appleUserId) {
  if (!appleUserId) return { isPremium: false, isPro: false, isAnnual: false, profile: null, fetchFailed: false };

  try {
    const { b44Fetch, B44_ENTITIES } = await import("./_b44.js");
    const data = await b44Fetch(
      `${B44_ENTITIES}/UserProfile?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`
    );
    const records = Array.isArray(data) ? data : (data?.items || data?.records || []);
    const profile = records.length > 0 ? records[0] : null;
    if (!profile) return { isPremium: false, isPro: false, isAnnual: false, profile: null, fetchFailed: false };
    if (profile.id) setCachedProfile(profile.id, profile);
    const isUltimateFriend = !!(profile.ultimate_friend) || !!(profile.family_plan);
    const isAnnual  = !!(profile.annual_plan) || isUltimateFriend;
    const isPro     = !!(profile.pro_plan);
    const isPremium = !!(profile.is_premium || profile.premium || isPro || isAnnual || isUltimateFriend);
    return { isPremium, isPro, isAnnual, isUltimateFriend, profile, fetchFailed: false };
  } catch (e) {
    console.warn(`[getProfileTierByAppleId] lookup failed for ${appleUserId?.slice(0, 12)}: ${e.message}`);
    return { isPremium: false, isPro: false, isAnnual: false, profile: null, fetchFailed: true };
  }
}


