// src/api/db.js
// Supabase entity helpers for Unfiltr — replaces base44.entities.*
// Same .list(), .filter(), .create(), .update(), .delete() API shape.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function sbFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": options.prefer || "return=representation",
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${options.method || "GET"} ${path} failed: ${err}`);
  }
  if (res.status === 204) return [];
  return res.json();
}

function buildQuery(params = {}) {
  const parts = [];
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) continue;
    if (typeof val === "object" && val.__op) {
      parts.push(`${key}=${val.__op}.${val.value}`);
    } else {
      parts.push(`${key}=eq.${val}`);
    }
  }
  return parts.length ? "?" + parts.join("&") : "";
}

function makeEntity(table) {
  return {
    async list(sort = "-created_at", limit = 100) {
      const order = sort.startsWith("-") ? `${sort.slice(1)}.desc` : `${sort}.asc`;
      return sbFetch(`${table}?order=${order}&limit=${limit}`);
    },
    async filter(params = {}, sort = "-created_at", limit = 100) {
      const order = sort.startsWith("-") ? `${sort.slice(1)}.desc` : `${sort}.asc`;
      const q = buildQuery(params);
      return sbFetch(`${table}${q}&order=${order}&limit=${limit}`);
    },
    async get(id) {
      const rows = await sbFetch(`${table}?id=eq.${id}&limit=1`);
      return rows[0] || null;
    },
    async create(data) {
      const rows = await sbFetch(table, {
        method: "POST",
        body: JSON.stringify(data),
        prefer: "return=representation",
      });
      return Array.isArray(rows) ? rows[0] : rows;
    },
    async update(id, data) {
      const rows = await sbFetch(`${table}?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        prefer: "return=representation",
      });
      return Array.isArray(rows) ? rows[0] : rows;
    },
    async delete(id) {
      await sbFetch(`${table}?id=eq.${id}`, { method: "DELETE" });
      return { success: true };
    },
  };
}

// Entity map — matches every entity used in Unfiltr
export const UserProfile     = makeEntity("user_profiles");
export const ChatHistory     = makeEntity("chat_history");
export const JournalEntry    = makeEntity("journal_entries");
export const MoodEntry       = makeEntity("mood_entries");
export const Streak          = makeEntity("streaks");
export const TimeCapsule     = makeEntity("time_capsules");
export const Feedback        = makeEntity("feedback");
export const Companion       = makeEntity("companion_memory");
export const Notification    = makeEntity("notifications");
