/**
 * api/_b44.js
 *
 * Shared Base44 configuration for Vercel serverless functions.
 * Import this module instead of hard-coding the app ID or base URL.
 *
 * Required environment variable:
 *   BASE44_SERVICE_TOKEN — service-role token used by all serverless functions
 *                          that talk directly to Base44.
 *
 * Optional environment variables (override defaults, checked in priority order):
 *   B44_APP_ID           — Base44 application ID
 *   VITE_BASE44_APP_ID   — same as above (set by Vercel template, accessible to
 *                          Node.js functions as process.env.VITE_BASE44_APP_ID)
 *   BASE44_BASE_URL      — Base44 API root URL
 *   B44_BASE_URL         — alias for BASE44_BASE_URL (legacy, lower precedence)
 *   VITE_BASE44_APP_BASE_URL — same as above (set by Vercel template)
 */

export const B44_APP_ID =
  process.env.B44_APP_ID ||
  process.env.VITE_BASE44_APP_ID ||
  "69b22f8b58e45d23cafd78d2";

// Strip any trailing slash so path concatenation never creates double-slashes
const _rawBaseUrl =
  process.env.BASE44_BASE_URL ||
  process.env.B44_BASE_URL    ||
  process.env.VITE_BASE44_APP_BASE_URL ||
  "https://app.base44.com";

/** Resolved Base44 API root URL. */
export const B44_BASE_URL = _rawBaseUrl.replace(/\/+$/, "");

/** Full entities endpoint: https://app.base44.com/api/apps/<id>/entities */
export const B44_ENTITIES = `${B44_BASE_URL}/api/apps/${B44_APP_ID}/entities`;

/** Returns the service-role Authorization header value. */
export const b44Token = () =>
  process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

/** Common request headers for Base44 API calls. */
export const b44Headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${b44Token()}`,
});

/**
 * Hardened fetch wrapper for Base44 API calls.
 *
 * - Throws a descriptive Error on non-2xx responses (logs status + truncated body).
 * - Throws if the response Content-Type is not JSON (avoids parsing HTML error pages).
 * - Never prints the raw token value in logs.
 *
 * @param {string} url     - Full URL to fetch.
 * @param {object} options - Standard fetch options (method, headers, body, …).
 * @returns {Promise<any>} - Parsed JSON response body.
 */
export async function b44Fetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...b44Headers(), ...(options.headers || {}) },
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    const bodyText = await res.text();
    const preview = bodyText.slice(0, 200).replace(/\n/g, " ");
    console.error(
      `[b44] HTTP ${res.status} from Base44 — url=${url} — preview: ${preview}`
    );
    const err = new Error(`Base44 responded with ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const bodyText = await res.text();
    const preview = bodyText.slice(0, 200).replace(/\n/g, " ");
    console.error(
      `[b44] Non-JSON response from Base44 — url=${url} — content-type=${contentType} — preview: ${preview}`
    );
    const err = new Error(`Base44 returned non-JSON content-type: ${contentType}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}
