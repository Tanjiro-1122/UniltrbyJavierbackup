// api/adminStats.js — Vercel serverless function
// Uses Base44 SDK with service role to read all app data (no user auth needed)

import { createClient } from "@base44/sdk";

const ADMIN_TOKEN = "unfiltr_admin_javier1122_secret";
const APP_ID      = "69b22f8b58e45d23cafd78d2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken } = req.body || {};
  if (adminToken !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sdk = createClient({ appId: APP_ID });

    const [allProfiles, allMessages, allFeedback, allCompanions] = await Promise.all([
      sdk.asServiceRole.entities.UserProfile.list(),
      sdk.asServiceRole.entities.Message.list(),
      sdk.asServiceRole.entities.Feedback.list().catch(() => []),
      sdk.asServiceRole.entities.Companion.list().catch(() => []),
    ]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString();

    const stats = {
      totalUsers:           allProfiles.length,
      premiumUsers:         allProfiles.filter(p => p.is_premium).length,
      trialUsers:           allProfiles.filter(p => p.trial_active).length,
      todayMessages:        allMessages.filter(m => (m.created_date || m.session_date || "").startsWith(todayKey)).length,
      totalMessages:        allMessages.length,
      totalJournalEntries:  allMessages.filter(m => m.mood_mode === "journal").length,
      crisisFlags:          allMessages.filter(m => m.is_crisis_flagged).length,
      newThisWeek:          allProfiles.filter(p => (p.created_date || "") >= weekAgo).length,
      activeThisWeek:       allProfiles.filter(p => (p.last_active || "") >= weekAgo).length,
      companions:           allCompanions.length,
      feedbackCount:        allFeedback.length,
      openFeedback:         allFeedback.filter(f => f.status !== "resolved").length,
      pausedAccounts:       allProfiles.filter(p => p.account_paused).length,
      deleteRequested:      allProfiles.filter(p => p.account_delete_requested).length,
      recentUsers: [...allProfiles]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .slice(0, 20)
        .map(p => ({
          id: p.id,
          display_name:   p.display_name || "Anonymous",
          user_id:        p.user_id || "",
          created_date:   p.created_date,
          last_active:    p.last_active,
          is_premium:     p.is_premium,
          trial_active:   p.trial_active,
          message_count:  p.message_count || 0,
        })),
      premiumList: [...allProfiles]
        .filter(p => p.is_premium)
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .map(p => ({
          id: p.id,
          display_name: p.display_name || "Anonymous",
          user_id:      p.user_id || "",
          created_date: p.created_date,
          is_premium:   p.is_premium,
          trial_active: p.trial_active,
          annual_plan:  p.annual_plan,
        })),
      allFeedback: [...allFeedback]
        .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
        .map(f => ({
          id:           f.id,
          category:     f.category || "general",
          message:      f.message || "",
          rating:       f.rating,
          status:       f.status || "open",
          display_name: f.display_name || "Anonymous",
          created_date: f.created_date,
        })),
    };

    return res.status(200).json(stats);
  } catch (err) {
    console.error("[adminStats]", err);
    return res.status(500).json({ error: err.message });
  }
}
