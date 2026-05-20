/**
 * api/_supabase.js
 * Shared Supabase helper for Vercel serverless functions.
 * Server-side only — uses the service role key to bypass RLS.
 */

const SUPABASE_URL  = process.env.SUPABASE_URL  || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export async function sbQuery(table, params = {}, options = {}) {
  const { method = "GET", body, prefer = "return=representation" } = options;
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  
  if (method === "GET" && Object.keys(params).length) {
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
      .join("&");
    url += `?${qs}`;
  }

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": prefer,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${method} ${table}: ${err}`);
  }
  if (res.status === 204) return [];
  return res.json();
}

export async function sbGet(table, params = {}) {
  return sbQuery(table, params);
}

export async function sbCreate(table, data) {
  const rows = await sbQuery(table, {}, { method: "POST", body: data });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function sbUpdate(table, id, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${table}: ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function sbDelete(table, id) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  await fetch(url, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  return { success: true };
}

export async function sbFilterQuery(table, filters = {}, sort = "created_at.desc", limit = 100) {
  const qs = Object.entries(filters)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join("&");
  const url = `${SUPABASE_URL}/rest/v1/${table}?${qs}&order=${sort}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase GET ${table}: ${await res.text()}`);
  return res.json();
}
