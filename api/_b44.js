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
 * Optional environment variables (override defaults):
 *   B44_APP_ID   — Base44 application ID  (default: production app ID)
 *   B44_BASE_URL — Base44 API root URL     (default: https://api.base44.com)
 */

export const B44_APP_ID  = process.env.B44_APP_ID  || "69b332a392004d139d4ba495";
export const B44_BASE_URL = process.env.B44_BASE_URL || "https://api.base44.com";

/** Full entities endpoint: https://api.base44.com/api/apps/<id>/entities */
export const B44_ENTITIES = `${B44_BASE_URL}/api/apps/${B44_APP_ID}/entities`;

/** Returns the service-role Authorization header value. */
export const b44Token = () =>
  process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

/** Common request headers for Base44 API calls. */
export const b44Headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${b44Token()}`,
});
