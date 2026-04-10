import { B44_ENTITIES, b44Fetch } from "../_b44.js";

const ADMIN_TOKEN = "unfiltr_admin_javier1122_secret";

function mapUser(p) {
  return {
    id: p.id,
    display_name: p.display_name || "Anonymous",
    email: p.email || null,
    apple_user_id: p.apple_user_id || null,
    created_date: p.created_date || null,
    last_seen: p.last_seen || null,
    last_active: p.last_active || null,
    onboarding_complete: !!(p.onboarding_complete),
    push_enabled: !!(p.push_enabled),
    push_token_present: !!(p.push_token || p.expo_push_token),
    tokens_used_today: p.tokens_used_today || 0,
    tokens_used_total: p.tokens_used_total || p.total_tokens_used || 0,
    message_count: p.message_count || 0,
    is_premium: !!(p.is_premium),
    pro_plan: !!(p.pro_plan),
    annual_plan: !!(p.annual_plan),
    trial_active: !!(p.trial_active),
    subscription_expires: p.subscription_expires || null,
    account_paused: !!(p.account_paused),
    account_delete_requested: !!(p.account_delete_requested),
    memory_summary: p.memory_summary || null,
    memory_updated_at: p.memory_updated_at || null,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken, query, userId } = req.body || {};
  if (adminToken !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  try {
    // If a specific userId is provided, fetch that single profile
    if (userId) {
      const profile = await b44Fetch(`${B44_ENTITIES}/UserProfile/${userId}`);
      return res.status(200).json({ users: [mapUser(profile)] });
    }

    // Fetch all profiles and filter
    const raw = await b44Fetch(`${B44_ENTITIES}/UserProfile?limit=1000`);
    const profiles = Array.isArray(raw) ? raw : (raw.records || raw.data || []);

    if (!query || query.trim() === "") {
      // Return 30 most-recently-created users as default list
      const sorted = [...profiles]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .slice(0, 30);
      return res.status(200).json({ users: sorted.map(mapUser) });
    }

    const q = query.trim().toLowerCase();
    const matched = profiles
      .filter(p =>
        (p.display_name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.apple_user_id || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q)
      )
      .slice(0, 50);

    return res.status(200).json({ users: matched.map(mapUser) });
  } catch (err) {
    console.error("[admin/userSearch] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
