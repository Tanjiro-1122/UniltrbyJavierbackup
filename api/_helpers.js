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
 *
 * Constants (overrideable via env vars):
 *  MAX_INPUT_CHARS    — AI_MAX_INPUT_CHARS    (default 8000)
 *  MAX_OUTPUT_TOKENS  — AI_MAX_OUTPUT_TOKENS  (default 800)
 *  AI_TIMEOUT_MS      — AI_REQUEST_TIMEOUT_MS (default 25000 ms)
 *  AI_MAX_RPM         — AI_MAX_RPM            (default 10 req/min)
 */

import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Guardrail constants (overrideable via Vercel environment variables)
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum total characters across all messages sent in a single chat request. */
export const MAX_INPUT_CHARS = parseInt(process.env.AI_MAX_INPUT_CHARS || "8000", 10);

/** Hard cap on OpenAI completion tokens. Applied on top of per-tier defaults. */
export const MAX_OUTPUT_TOKENS = parseInt(process.env.AI_MAX_OUTPUT_TOKENS || "800", 10);

/** Milliseconds before an upstream OpenAI request is aborted. */
export const AI_TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "25000", 10);

/** Max AI/chat requests allowed per user per minute (best-effort, per-instance). */
export const AI_MAX_RPM = parseInt(process.env.AI_MAX_RPM || "10", 10);

// ─────────────────────────────────────────────────────────────────────────────
// Request context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a lightweight tracing context for a serverless request.
 *
 * @param {object} req  — Vercel/Node IncomingMessage with `body` already parsed
 * @returns {{ requestId: string, userId: string }}
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

  return { requestId, userId };
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
 * @param {string} userId
 * @returns {{ allowed: true } | { allowed: false, retryAfterSeconds: number }}
 */
export function checkRateLimit(userId) {
  if (!userId || userId === "anonymous") return { allowed: true };

  const now   = Date.now();
  const entry = _rateLimitStore.get(userId);

  if (!entry || now - entry.windowStart > _RATE_WINDOW_MS) {
    _rateLimitStore.set(userId, { count: 1, windowStart: now });
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
