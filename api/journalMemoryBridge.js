// api/journalMemoryBridge.js
// Extracts memorable facts from journal entries and merges them into UserProfile memory.
// Called automatically after a journal entry is saved (fire-and-forget from JournalEntry.jsx).
// This means memory grows even when the user isn't chatting.

import OpenAI from "openai";
import { B44_ENTITIES, b44Headers } from "./_b44.js";
import { createRequestContext, safeLogError, checkRateLimit } from "./_helpers.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const headers = b44Headers;

async function b44Get(entity, id) {
  const res = await fetch(`${B44_ENTITIES}/${entity}/${id}`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

async function b44Update(entity, id, data) {
  const res = await fetch(`${B44_ENTITIES}/${entity}/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.ok;
}

function mergeFacts(existing = {}, extracted = {}) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(extracted)) {
    if (!value || value === "unknown" || value === "not mentioned") continue;
    if (Array.isArray(value) && Array.isArray(merged[key])) {
      const combined = [...merged[key], ...value];
      merged[key] = [...new Map(combined.map(x => [JSON.stringify(x), x])).values()].slice(0, 20);
    } else if (Array.isArray(value) && value.length > 0) {
      merged[key] = value;
    } else if (!Array.isArray(value) && value) {
      merged[key] = value;
    }
  }
  return merged;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ctx = createRequestContext(req);
  res.setHeader("X-Request-Id", ctx.requestId);

  const rl = checkRateLimit(ctx.userId);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.retryAfterSeconds}s and try again.`,
    });
  }

  try {
    const { profileId, journalContent, journalTitle, isPremium, isPro, isAnnual } = req.body;

    // Only run for premium users — free users don't get memory from journals
    if (!isPremium && !isPro && !isAnnual) {
      return res.status(200).json({ ok: true, skipped: "free_tier" });
    }
    if (!profileId || !journalContent?.trim()) {
      return res.status(200).json({ ok: true, skipped: "missing_data" });
    }

    // Don't waste tokens on very short entries
    if (journalContent.trim().split(/\s+/).length < 20) {
      return res.status(200).json({ ok: true, skipped: "too_short" });
    }

    const fullText = journalTitle ? `${journalTitle}\n\n${journalContent}` : journalContent;

    // Extract facts from journal entry
    const extractionRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are reading a private journal entry. Extract facts about the WRITER that would help an AI companion know them better.
Only extract things clearly stated or strongly implied — don't invent or assume.
Return ONLY valid JSON:
{
  "name": "first name if mentioned, else null",
  "age": "age if mentioned, else null",
  "location": "city/country if mentioned, else null",
  "occupation": "job/role if mentioned, else null",
  "relationship_status": "single/dating/married/etc if mentioned, else null",
  "important_people": [{"name": "name", "role": "relationship", "note": "detail"}],
  "recurring_struggles": ["emotional struggles or life challenges"],
  "core_values": ["things clearly important to them"],
  "goals": ["goals, dreams, ambitions"],
  "hobbies": ["interests mentioned"],
  "journal_emotion": "single dominant emotion: anxious/sad/happy/angry/lonely/overwhelmed/hopeful/grateful/neutral/excited/confused/relieved",
  "journal_topic": "main topic: work/relationship/family/self-worth/health/finances/personal-growth/creative/general"
}
Use [] for empty arrays. Use null if not mentioned.`,
        },
        { role: "user", content: fullText.slice(0, 3000) },
      ],
      max_tokens: 500,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    let extracted = {};
    try { extracted = JSON.parse(extractionRes.choices[0]?.message?.content || "{}"); } catch {}

    if (!Object.values(extracted).some(v => v && (Array.isArray(v) ? v.length > 0 : true))) {
      return res.status(200).json({ ok: true, skipped: "nothing_extracted" });
    }

    // Fetch existing profile and merge
    const profile = await b44Get("UserProfile", profileId);
    if (!profile) return res.status(200).json({ ok: true, skipped: "profile_not_found" });

    const updatedFacts = mergeFacts(profile.user_facts || {}, extracted);

    // Also log a journal emotional timeline entry
    const existingTimeline = profile.emotional_timeline || [];
    const journalEntry = {
      date: new Date().toISOString().slice(0, 10),
      emotion: extracted.journal_emotion || "neutral",
      intensity: 3,
      topic: extracted.journal_topic || "general",
      note: `[Journal] ${(journalTitle || "").slice(0, 60)}`,
      source: "journal",
    };
    const updatedTimeline = [journalEntry, ...existingTimeline].slice(0, 90);

    await b44Update("UserProfile", profileId, {
      user_facts: updatedFacts,
      emotional_timeline: updatedTimeline,
      updated_date: new Date().toISOString(),
    });

    // Also store as vector memory if premium
    try {
      const { storeMemoryVectors } = await import("./memoryEmbed.js");
      await storeMemoryVectors(profileId, updatedFacts, `Journal: ${(journalTitle || "entry").slice(0, 60)}`, isPremium, isPro, isAnnual);
    } catch(e) {
      console.warn("[journalBridge] vector store failed:", e.message);
    }

    return res.status(200).json({ ok: true, merged: true });
  } catch (err) {
    safeLogError(err, { tag: "journalMemoryBridge" });
    return res.status(500).json({ error: "Journal memory processing failed. Please try again." });
  }
}
