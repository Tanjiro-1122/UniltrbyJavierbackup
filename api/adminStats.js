const ADMIN_TOKEN = "unfiltr_admin_javier1122_secret";
const APP_ID = "69b332a392004d139d4ba495";
const BASE44_API = "https://base44.app/api";

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken } = req.body || {};
  if (adminToken !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [allProfiles, allMessages, allFeedback] = await Promise.all([
      fetchEntity("UserProfile"),
      fetchEntity("Message"),
      fetchEntity("Feedback").catch(() => []),
    ]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString();

    return res.status(200).json({
      totalUsers:          allProfiles.length,
      premiumUsers:        allProfiles.filter(p => p.is_premium || p.annual_plan || p.pro_plan).length,
      trialUsers:          allProfiles.filter(p => p.trial_active).length,
      todayMessages:       allMessages.filter(m => (m.created_date || m.session_date || "").startsWith(todayKey)).length,
      totalMessages:       allMessages.length,
      totalJournalEntries: allMessages.filter(m => m.mood_mode === "journal").length,
      crisisFlags:         allMessages.filter(m => m.is_crisis_flagged).length,
      newThisWeek:         allProfiles.filter(p => (p.created_date || "") >= weekAgo).length,
      activeThisWeek:      allProfiles.filter(p => (p.last_active || "") >= weekAgo).length,
      companions:          0,
      feedbackCount:       allFeedback.length,
      openFeedback:        allFeedback.filter(f => f.status !== "resolved").length,
      pausedAccounts:      allProfiles.filter(p => p.account_paused).length,
      deleteRequested:     allProfiles.filter(p => p.account_delete_requested).length,
      recentUsers: [...allProfiles]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .slice(0, 20)
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          user_id: p.user_id || p.id?.slice(0, 12),
          created_date: p.created_date,
          last_active: p.last_active,
          is_premium: !!(p.is_premium || p.annual_plan || p.pro_plan),
          trial_active: p.trial_active,
          message_count: p.message_count || 0,
        })),
      premiumList: [...allProfiles]
        .filter(p => p.is_premium || p.annual_plan || p.pro_plan)
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          user_id: p.user_id || p.id?.slice(0, 12),
          created_date: p.created_date,
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
