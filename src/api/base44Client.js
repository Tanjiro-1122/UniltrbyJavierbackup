import { createClient } from "@base44/sdk";

// Base44 SDK client for entities + auth
// Uses VITE_BASE44_APP_ID / VITE_BASE44_API_KEY injected at build time;
// falls back to the hardcoded values so local dev without env vars still works.
const _sdk = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID || "69b332a392004d139d4ba495",
  headers: {
    "api_key": import.meta.env.VITE_BASE44_API_KEY || "1156284fb9144ad9ab95afc962e848d8",
  },
});

// Custom functions layer — routes to our Vercel /api/* serverless functions
// instead of Base44 cloud functions (which we don't use)
const API_BASE = "";  // same-origin on Vercel

const functions = {
  async invoke(name, body = {}) {
    try {
      const res = await fetch(`${API_BASE}/api/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: json.error || "API error" };
      // Normalize: if the function returns { reply, mood } directly (not wrapped in data)
      // pass it through as data so callers can use res.data.reply etc.
      if (json.data !== undefined) return { data: json.data, error: null };
      return { data: json, error: null };
    } catch (err) {
      console.error(`[functions] ${name} failed:`, err);
      return { data: null, error: err.message };
    }
  },
};

export const base44 = {
  entities:     _sdk.entities,
  auth:         _sdk.auth,
  integrations: _sdk.integrations,
  functions,    // ← our Vercel /api/* functions
};

export const entities = base44.entities;
export default base44;
