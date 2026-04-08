const ADMIN_TOKEN = "unfiltr_admin_javier1122_secret";
const APP_ID = "69b332a392004d139d4ba495";
const BASE44_API = "https://app.base44.com/api";

async function fetchEntity(entity, params = {}) {
  const url = new URL(`${BASE44_API}/apps/${APP_ID}/entities/${entity}`);
  url.searchParams.set("limit", params.limit || 500);
  if (params.skip) url.searchParams.set("skip", params.skip);
  const serviceToken = process.env.BASE44_SERVICE_TOKEN;
  if (!serviceToken) throw new Error("BASE44_SERVICE_TOKEN env var not set");
  const res = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
      "X-App-Id": APP_ID,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Base44 ${entity} fetch failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.records || data.data || []);
}

async function updateEntity(entity, id, data) {
  const serviceToken = process.env.BASE44_SERVICE_TOKEN;
  if (!serviceToken) throw new Error("BASE44_SERVICE_TOKEN env var not set");
  const res = await fetch(`${BASE44_API}/apps/${APP_ID}/entities/${entity}/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
      "X-App-Id": APP_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Base44 ${entity} update failed: ${res.status} ${err.slice(0, 200)}`);
  }
  return res.json();
}

async function deleteEntity(entity, id) {
  const serviceToken = process.env.BASE44_SERVICE_TOKEN;
  if (!serviceToken) throw new Error("BASE44_SERVICE_TOKEN env var not set");
  const res = await fetch(`${BASE44_API}/apps/${APP_ID}/entities/${entity}/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
      "X-App-Id": APP_ID,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Base44 ${entity} delete failed: ${res.status} ${err.slice(0, 200)}`);
  }
  return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken, action, userId, type } = req.body || {};
  if (adminToken !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  // ── ACTION HANDLERS ──────────────────────────────────────────────────────
  if (action === "grantAccess") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    const updateData = { is_premium: true };
    if (type === "trial") {
      updateData.trial_active = true;
      updateData.trial_start_date = new Date().toISOString();
      updateData.annual_plan = false;
      updateData.pro_plan = false;
    } else if (type === "family") {
      updateData.annual_plan = true;
      updateData.trial_active = false;
      updateData.pro_plan = false;
    }
    await updateEntity("UserProfile", userId, updateData);
    return res.status(200).json({ ok: true });
  }

  if (action === "revokeAccess") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    await updateEntity("UserProfile", userId, {
      is_premium: false,
      trial_active: false,
      annual_plan: false,
      pro_plan: false,
    });
    return res.status(200).json({ ok: true });
  }

  if (action === "deleteUser") {
    if (!userId) return res.status(400).json({ error: "userId required" });
    await deleteEntity("UserProfile", userId);
    return res.status(200).json({ ok: true });
  }

  // ── STATS FETCH ──────────────────────────────────────────────────────────
  try {
    const [allProfiles, allFeedback] = await Promise.all([
      fetchEntity("UserProfile"),
      fetchEntity("Feedback").catch(() => []),
    ]);

    const totalMessages = allProfiles.reduce((sum, p) => sum + (p.message_count || 0), 0);

    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000).toISOString();
    const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const onlineNow = allProfiles.filter(p => p.last_seen && p.last_seen >= fiveMinAgo).length;
    const appleUsers = allProfiles.filter(p => p.apple_user_id && p.apple_user_id.trim() !== "").length;

    return res.status(200).json({
      totalUsers:          allProfiles.length,
      premiumUsers:        allProfiles.filter(p => p.is_premium || p.annual_plan || p.pro_plan).length,
      trialUsers:          allProfiles.filter(p => p.trial_active).length,
      onlineNow,
      appleUsers,
      todayMessages:       0,
      totalMessages,
      totalJournalEntries: 0,
      crisisFlags:         0,
      newThisWeek:         allProfiles.filter(p => (p.created_date || "") >= weekAgo).length,
      activeThisWeek:      allProfiles.filter(p => (p.last_seen || p.last_active || "") >= weekAgo).length,
      companions:          0,
      feedbackCount:       allFeedback.length,
      openFeedback:        allFeedback.filter(f => f.status !== "resolved").length,
      pausedAccounts:      allProfiles.filter(p => p.account_paused).length,
      deleteRequested:     allProfiles.filter(p => p.account_delete_requested).length,
      recentUsers: [...allProfiles]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .slice(0, 50)
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          email: p.email || null,
          user_id: p.user_id || p.id?.slice(0, 12),
          apple_user_id: p.apple_user_id || null,
          created_date: p.created_date,
          last_seen: p.last_seen || null,
          is_premium: !!(p.is_premium || p.annual_plan || p.pro_plan),
          annual_plan: !!(p.annual_plan),
          pro_plan: !!(p.pro_plan),
          trial_active: !!(p.trial_active),
          message_count: p.message_count || 0,
          onboarding_complete: !!(p.onboarding_complete),
          account_delete_requested: !!(p.account_delete_requested),
        })),
      premiumList: [...allProfiles]
        .filter(p => p.is_premium || p.annual_plan || p.pro_plan)
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          is_premium: true,
          annual_plan: p.annual_plan,
          pro_plan: p.pro_plan,
        })),
      allFeedback: [...allFeedback]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .map(f => ({
          id: f.id,
          category: f.category || "general",
          message: f.message || "",
          rating: f.rating,
          status: f.status || "open",
          display_name: f.display_name || "Anonymous",
          created_date: f.created_date,
        })),
    });
  } catch (err) {
    console.error("[adminStats] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
