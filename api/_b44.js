// api/_b44.js — Supabase compatibility adapter
// Historical server routes still import Base44-shaped helpers. This adapter keeps
// those routes working while routing entity reads/writes to Supabase only.

const RAW_SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_URL = RAW_SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const ENTITY_TABLES = {
  UserProfile: "user_profiles",
  ChatHistory: "chat_history",
  JournalEntry: "journal_entries",
  MoodEntry: "mood_entries",
  ErrorLog: "unfiltr_error_logs",
  PurchaseAudit: "swh_purchase_audit",
  Streak: "streaks",
  TimeCapsule: "time_capsules",
  Feedback: "feedback",
  Companion: "companion_memory",
  Notification: "notifications",
  AdminAuditLog: "admin_audit_logs",
};

function requireSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase server environment variables are not configured");
}

export const B44_ENTITIES = "supabase://entities";
export const b44Token = () => SUPABASE_KEY || null;
export const b44Headers = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

function parseEntityUrl(input) {
  const raw = String(input || "");
  const path = raw.replace(/^supabase:\/\/entities\/?/, "").replace(/^\/+/, "");
  const [entityAndId, queryString = ""] = path.split("?");
  const parts = entityAndId.split("/").filter(Boolean);
  const entity = parts[0];
  const id = parts[1] || null;
  const table = ENTITY_TABLES[entity] || entity;
  const query = new URLSearchParams(queryString);
  return { entity, table, id, query };
}

function buildSupabaseUrl(input) {
  requireSupabase();
  const { table, id, query } = parseEntityUrl(input);
  const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`);
  if (id) url.searchParams.set("id", `eq.${id}`);
  for (const [key, value] of query.entries()) {
    if (key === "limit") url.searchParams.set("limit", value);
    else if (key === "skip") url.searchParams.set("offset", value);
    else if (key === "sort") {
      const desc = value.startsWith("-");
      const field = desc ? value.slice(1) : value;
      const mapped = field === "created_date" ? "created_at" : field;
      url.searchParams.set("order", `${mapped}.${desc ? "desc" : "asc"}`);
    } else {
      url.searchParams.set(key, `eq.${value}`);
    }
  }
  if (!url.searchParams.has("select")) url.searchParams.set("select", "*");
  return url;
}

export async function b44Fetch(input, options = {}) {
  const method = options.method || "GET";
  const url = buildSupabaseUrl(input);
  const res = await fetch(url.toString(), {
    method: method === "PUT" ? "PATCH" : method,
    headers: { ...b44Headers(), ...(options.headers || {}) },
    body: options.body,
  });

  if (method === "DELETE") return res;

  // Preserve the old helper shape: GET by id returns one object, list returns array.
  if (res.ok && method === "GET") {
    const { id } = parseEntityUrl(input);
    const rows = await res.json().catch(() => []);
    return new Response(JSON.stringify(id ? (Array.isArray(rows) ? rows[0] || null : rows) : rows), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return res;
}
