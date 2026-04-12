// Central app configuration constants.
// Override APP_URL by setting VITE_APP_URL in your .env / Vercel environment.
export const APP_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL) ||
  "unfiltrbyjavier2.vercel.app";
