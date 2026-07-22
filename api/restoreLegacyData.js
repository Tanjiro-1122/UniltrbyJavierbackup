// api/restoreLegacyData.js
// Read-only restoration bridge for the native app's original Apple-ID keyed data.

const SB_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

const SB_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

function decodeJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

async function sbGet(table, query) {
  if (!SB_URL || !SB_KEY) throw new Error("Supabase env not configured");
  const response = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      Accept: "application/json",
    },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(`${table} restore failed: ${response.status}`);
  return Array.isArray(data) ? data : [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { appleUserId, identityToken } = req.body || {};
  if (!appleUserId || !identityToken) {
    return res.status(400).json({ error: "appleUserId and identityToken are required" });
  }

  const claims = decodeJwtPayload(identityToken);
  if (!claims?.sub || claims.sub !== appleUserId || claims.iss !== "https://appleid.apple.com") {
    return res.status(403).json({ error: "Apple identity does not match the requested account" });
  }

  try {
    const encodedId = encodeURIComponent(appleUserId);
    const [chatRows, journalRows] = await Promise.all([
      sbGet(
        "chat_history",
        `apple_user_id=eq.${encodedId}&select=id,messages,saved_at,created_at&order=saved_at.desc&limit=20`,
      ),
      sbGet(
        "journal_entries",
        `apple_user_id=eq.${encodedId}&select=id,title,content,mood,created_at&order=created_at.desc&limit=250`,
      ),
    ]);

    const messages = [];
    const seen = new Set();
    for (const row of [...chatRows].reverse()) {
      const rowMessages = Array.isArray(row?.messages) ? row.messages : [];
      for (const message of rowMessages) {
        if (!message || typeof message !== "object") continue;
        const role = message.role === "assistant" || message.role === "user" ? message.role : null;
        const content = typeof message.content === "string" ? message.content : null;
        if (!role || !content) continue;
        const key = message.id || `${role}:${message.createdAt || message.created_at || ""}:${content}`;
        if (seen.has(key)) continue;
        seen.add(key);
        messages.push({
          id: typeof message.id === "string" ? message.id : undefined,
          role,
          content,
          createdAt: message.createdAt || message.created_at || row.saved_at || row.created_at,
        });
      }
    }

    return res.status(200).json({
      chatHistory: messages.slice(-200),
      journalEntries: journalRows.map((entry) => ({
        id: entry.id,
        title: entry.title || null,
        content: entry.content || "",
        mood: entry.mood || null,
        created_at: entry.created_at,
        created_date: entry.created_at,
      })),
    });
  } catch (error) {
    console.error("[restoreLegacyData]", error);
    return res.status(500).json({ error: "Legacy restoration failed" });
  }
}
