/**
 * api/base44.js
 *
 * Consolidated Vercel serverless function — now backed by Supabase.
 * Same POST /api/base44 interface so all frontend calls work unchanged.
 *
 * POST /api/base44
 * Body: { action: string, ...actionPayload }
 *
 * Actions:
 *   saveChatHistory   — upsert today's ChatHistory record in Supabase
 *   saveMessages      — batch-save messages
 *   health            — env var presence check
 *   proxy             — general-purpose entity proxy (get / update / list)
 *   getJournalEntries — list journal entries for a user
 *   saveJournalEntry  — create/update a journal entry
 *   getMoodEntries    — list mood entries for a user
 *   saveMoodEntry     — create a mood entry
 *   getTimeCapsules   — list time capsules for a user
 *   saveTimeCapsule   — create/update a time capsule
 *   saveFeedback      — save user feedback
 *   getStreak         — get streak for a user
 *   updateStreak      — update streak for a user
 *   getUserProfile    — get or create user profile
 *   updateUserProfile — update user profile fields
 */

import { createRequestContext, checkRateLimit } from "./_helpers.js";
import { sbFilterQuery, sbCreate, sbUpdate, sbGet } from "./_supabase.js";
import crypto from "crypto";

const CHAT_RETENTION_LIMITS = { free: 2, plus: 20, pro: 100, annual: 9999, family: 9999 };

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Apple-User-ID");
  return res;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }

  const { action, apple_user_id, ...payload } = body || {};
  if (!action) return res.status(400).json({ error: "Missing action" });

  try {
    // ── health ──────────────────────────────────────────────────────────────
    if (action === "health") {
      return res.json({
        ok: true,
        supabase: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        timestamp: new Date().toISOString(),
      });
    }

    // ── getUserProfile ───────────────────────────────────────────────────────
    if (action === "getUserProfile") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const rows = await sbFilterQuery("user_profiles", { apple_user_id }, "created_at.asc", 1);
      if (rows.length) return res.json({ data: rows[0] });
      // Auto-create profile
      const profile = await sbCreate("user_profiles", {
        apple_user_id,
        email: payload.email || null,
        display_name: payload.display_name || null,
        tier: "free",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return res.json({ data: profile });
    }

    // ── updateUserProfile ────────────────────────────────────────────────────
    if (action === "updateUserProfile") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const rows = await sbFilterQuery("user_profiles", { apple_user_id }, "created_at.asc", 1);
      if (!rows.length) return res.status(404).json({ error: "Profile not found" });
      const updated = await sbUpdate("user_profiles", rows[0].id, {
        ...payload.data,
        updated_at: new Date().toISOString(),
      });
      return res.json({ data: updated });
    }

    // ── saveChatHistory ──────────────────────────────────────────────────────
    if (action === "saveChatHistory") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const { companion_id, messages, tier, existingRecordId } = payload;
      const limit = CHAT_RETENTION_LIMITS[tier] || 2;

      if (existingRecordId) {
        const updated = await sbUpdate("chat_history", existingRecordId, {
          messages: messages || [],
          message_count: (messages || []).length,
          saved_at: new Date().toISOString(),
        });
        return res.json({ data: updated, action: "updated" });
      }

      // Check existing count and enforce limit.
      // IMPORTANT: legacy Base44 imports are preservation records and must never
      // count against tier retention or be deleted by routine chat saves.
      const existingAll = await sbFilterQuery("chat_history", { apple_user_id }, "saved_at.desc", 500);
      const isLegacyImportRow = (row = {}) => {
        if (row.tier === "legacy_import") return true;
        const msgs = Array.isArray(row.messages) ? row.messages : [];
        return msgs.some((m) => m && typeof m === "object" && (m.legacy_base44_id || m.source === "base44_legacy_import_2026_05_25"));
      };
      const existing = existingAll.filter((row) => !isLegacyImportRow(row));
      if (existing.length >= limit) {
        // Delete oldest non-legacy rows only; imported user history is immutable.
        const toDelete = existing.slice(limit - 1);
        for (const old of toDelete) {
          await fetch(`${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/rest/v1/chat_history?id=eq.${old.id}`, {
            method: "DELETE",
            headers: {
              "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY}`,
            },
          });
        }
      }

      const created = await sbCreate("chat_history", {
        apple_user_id,
        messages: messages || [],
        message_count: (messages || []).length,
        tier: tier || "free",
        saved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      return res.json({ data: created, action: "created" });
    }

    // ── getChatHistory ───────────────────────────────────────────────────────
    // ── getRecentMessages ─────────────────────────────────────────────────────
    if (action === "getRecentMessages") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const { limit = 20 } = payload;

      // chat_history has no companion_id column — filter only by apple_user_id
      // Get the most recent NON-legacy rows first, then fall back to legacy if needed
      const allRows = await sbFilterQuery("chat_history", { apple_user_id }, "saved_at.desc", 20);
      if (!allRows.length) return res.json({ items: [] });

      // Separate live rows from legacy imports (tier="legacy_import")
      const liveRows   = allRows.filter(r => r.tier !== "legacy_import");
      const sourceRows = liveRows.length >= 1 ? liveRows : allRows;

      const allMessages = [];
      for (const row of sourceRows) {
        const msgs = Array.isArray(row.messages) ? row.messages : [];
        for (const m of msgs) {
          if (m && m.role && m.content) allMessages.push(m);
        }
        if (allMessages.length >= limit) break;
      }

      // Return in chronological order (oldest → newest), capped at limit
      const slice = allMessages.slice(-limit);
      return res.json({ items: slice, count: slice.length });
    }

    if (action === "getChatHistory") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const { limit = 20 } = payload;
      const rows = await sbFilterQuery("chat_history", { apple_user_id }, "saved_at.desc", limit);
      return res.json({ data: rows });
    }

    // ── getJournalEntries ────────────────────────────────────────────────────
    if (action === "getJournalEntries") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const rows = await sbFilterQuery("journal_entries", { apple_user_id }, "created_at.desc", 200);
      return res.json({ data: rows });
    }

    // ── saveJournalEntry ─────────────────────────────────────────────────────
    if (action === "saveJournalEntry") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const { id, title, content: entryContent, mood, tier } = payload;
      if (id) {
        const updated = await sbUpdate("journal_entries", id, { title, content: entryContent, mood, tier });
        return res.json({ data: updated });
      }
      const created = await sbCreate("journal_entries", {
        apple_user_id, title, content: entryContent, mood, tier,
        created_at: new Date().toISOString(),
      });
      return res.json({ data: created });
    }

    // ── getMoodEntries ───────────────────────────────────────────────────────
    if (action === "getMoodEntries") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const rows = await sbFilterQuery("mood_entries", { apple_user_id }, "created_at.desc", 365);
      return res.json({ data: rows });
    }

    // ── saveMoodEntry ────────────────────────────────────────────────────────
    if (action === "saveMoodEntry") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const { mood, mood_label, date } = payload;
      const created = await sbCreate("mood_entries", {
        apple_user_id, mood, mood_label, date,
        created_at: new Date().toISOString(),
      });
      return res.json({ data: created });
    }

    // ── getTimeCapsules ──────────────────────────────────────────────────────
    if (action === "getTimeCapsules") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const rows = await sbFilterQuery("time_capsules", { apple_user_id }, "created_at.desc", 100);
      return res.json({ data: rows });
    }

    // ── saveTimeCapsule ──────────────────────────────────────────────────────
    if (action === "saveTimeCapsule") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const { id, message, open_date, opened } = payload;
      if (id) {
        const updated = await sbUpdate("time_capsules", id, { message, open_date, opened });
        return res.json({ data: updated });
      }
      const created = await sbCreate("time_capsules", {
        apple_user_id, message, open_date, opened: false,
        created_at: new Date().toISOString(),
      });
      return res.json({ data: created });
    }

    // ── getStreak ────────────────────────────────────────────────────────────
    if (action === "getStreak") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const rows = await sbFilterQuery("streaks", { apple_user_id }, "created_at.asc", 1);
      return res.json({ data: rows[0] || { apple_user_id, count: 0, longest: 0 } });
    }

    // ── updateStreak ─────────────────────────────────────────────────────────
    if (action === "updateStreak") {
      if (!apple_user_id) return res.status(400).json({ error: "apple_user_id required" });
      const rows = await sbFilterQuery("streaks", { apple_user_id }, "created_at.asc", 1);
      if (rows.length) {
        const updated = await sbUpdate("streaks", rows[0].id, {
          ...payload,
          updated_at: new Date().toISOString(),
        });
        return res.json({ data: updated });
      }
      const created = await sbCreate("streaks", {
        apple_user_id, count: payload.count || 0, longest: payload.longest || 0,
        last_active: payload.last_active || null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      return res.json({ data: created });
    }

    // ── saveFeedback ─────────────────────────────────────────────────────────
    if (action === "saveFeedback") {
      const { email, message: fbMessage, type } = payload;
      const created = await sbCreate("feedback", {
        apple_user_id: apple_user_id || null,
        email: email || null,
        message: fbMessage,
        type: type || "general",
        created_at: new Date().toISOString(),
      });
      return res.json({ data: created });
    }

    // ── proxy (legacy general-purpose) ───────────────────────────────────────
    if (action === "proxy") {
      const { proxyAction, entity, id, data: proxyData, filters } = payload;
      const tableMap = {
        UserProfile: "user_profiles", ChatHistory: "chat_history",
        JournalEntry: "journal_entries", MoodEntry: "mood_entries",
        Streak: "streaks", TimeCapsule: "time_capsules",
        Feedback: "feedback", Companion: "companion_memory",
      };
      const table = tableMap[entity] || entity?.toLowerCase();
      if (!table) return res.status(400).json({ error: `Unknown entity: ${entity}` });

      if (proxyAction === "get" && id) {
        const rows = await sbGet(`${table}?id=eq.${id}&limit=1`);
        return res.json({ data: rows[0] || null });
      }
      if (proxyAction === "list" || proxyAction === "filter") {
        const rows = await sbFilterQuery(table, filters || {}, "created_at.desc", 200);
        return res.json({ data: rows });
      }
      if (proxyAction === "update" && id) {
        const updated = await sbUpdate(table, id, proxyData);
        return res.json({ data: updated });
      }
      if (proxyAction === "create") {
        const created = await sbCreate(table, proxyData);
        return res.json({ data: created });
      }
      return res.status(400).json({ error: `Unknown proxyAction: ${proxyAction}` });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error("[api/base44]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
