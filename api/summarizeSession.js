import OpenAI from "openai";
import { storeMemoryVectors } from "./memoryEmbed.js";

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Production Unfiltr app ID — hardcoded as fallback in case env var is missing
const B44_APP  = process.env.VITE_BASE44_APP_ID || "69b332a392004d139d4ba495";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

async function b44Get(entity, id) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    headers: { "Content-Type": "application/json", "ApiKey": B44_API_KEY },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Update(entity, id, data) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "ApiKey": B44_API_KEY },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// ── Merge extracted facts into existing user_facts object ────────────────────
// New facts always WIN over old ones (more recent info is more accurate).
// But we keep old facts that weren't mentioned in this session.
function mergeFacts(existing = {}, extracted = {}) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(extracted)) {
    if (value && value !== "unknown" && value !== "not mentioned") {
      // For arrays (like important_people, topics), merge and deduplicate
      if (Array.isArray(value) && Array.isArray(merged[key])) {
        const combined = [...merged[key], ...value];
        merged[key] = [...new Map(combined.map(x => [JSON.stringify(x), x])).values()].slice(0, 20);
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}

// ── Build a rich human-readable memory summary from structured facts ─────────
function buildRichSummary(facts = {}, sessions = []) {
  const parts = [];

  // Core identity
  if (facts.name) parts.push(`User's name is ${facts.name}.`);
  if (facts.age) parts.push(`They are ${facts.age} years old.`);
  if (facts.location) parts.push(`Located in ${facts.location}.`);
  if (facts.occupation) parts.push(`Works as ${facts.occupation}.`);
  if (facts.relationship_status) parts.push(`Relationship: ${facts.relationship_status}.`);

  // People that matter
  if (facts.important_people?.length) {
    parts.push(`Important people: ${facts.important_people.map(p => `${p.name} (${p.role})`).join(", ")}.`);
  }

  // Emotional patterns
  if (facts.recurring_struggles?.length) {
    parts.push(`Recurring struggles: ${facts.recurring_struggles.join(", ")}.`);
  }
  if (facts.core_values?.length) {
    parts.push(`Core values/things they care about: ${facts.core_values.join(", ")}.`);
  }
  if (facts.goals?.length) {
    parts.push(`Goals: ${facts.goals.join(", ")}.`);
  }

  // Personality/preferences
  if (facts.humor_style) parts.push(`Humor style: ${facts.humor_style}.`);
  if (facts.communication_style) parts.push(`Communication style: ${facts.communication_style}.`);
  if (facts.hobbies?.length) {
    parts.push(`Hobbies/interests: ${facts.hobbies.join(", ")}.`);
  }

  // Recent session history (last 5 sessions, most recent first)
  if (sessions.length) {
    const recent = sessions.slice(0, 5);
    parts.push(`Recent sessions: ${recent.map(s => `[${s.date}] ${s.summary}`).join(" | ")}`);
  }

  return parts.join(" ");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, profileId, companionName, isPremium, isPro, isAnnual } = req.body;
    if (!messages?.length || !profileId) return res.status(400).json({ error: "Missing required fields" });

    // Only run if the conversation has at least 3 user messages
    // (prevents wasting tokens on tiny 1-2 message sessions)
    const userMsgCount = messages.filter(m => m.role === "user").length;
    if (userMsgCount < 3) return res.status(200).json({ ok: true, skipped: true, reason: "too_short" });

    const transcript = messages
      .filter(m => m.role !== "system")
      .map(m => `${m.role === "user" ? "User" : companionName || "Companion"}: ${m.content}`)
      .join("\n");

    const summaryModel = (isPremium || isPro || isAnnual) ? "gpt-4o-mini" : "gpt-3.5-turbo";

    // ── Step 1: Extract STRUCTURED facts from this conversation ─────────────
    const extractionPrompt = `You are analyzing a conversation to extract memorable facts about the USER (not the AI companion).

Return ONLY valid JSON. Extract what you can — use null for things not mentioned.

JSON format:
{
  "name": "first name if mentioned, else null",
  "age": "age or age range if mentioned, else null",
  "location": "city/country if mentioned, else null",
  "occupation": "job/role if mentioned, else null",
  "relationship_status": "single/dating/married/etc if mentioned, else null",
  "important_people": [{"name": "person name", "role": "mom/partner/friend/etc", "note": "any relevant detail"}],
  "recurring_struggles": ["specific emotional struggles or life challenges mentioned"],
  "core_values": ["things they clearly care deeply about"],
  "goals": ["goals, dreams, ambitions mentioned"],
  "hobbies": ["hobbies, interests, activities mentioned"],
  "humor_style": "how they joke or laugh, if evident, else null",
  "communication_style": "brief description of how they communicate, else null",
  "session_summary": "1-2 sentence emotional summary of THIS session specifically"
}

Only include array items that were actually mentioned. Use [] for empty arrays.`;

    const [extractRes, summaryRes] = await Promise.all([
      openai.chat.completions.create({
        model: summaryModel,
        messages: [
          { role: "system", content: extractionPrompt },
          { role: "user", content: transcript },
        ],
        max_tokens: 500,
        temperature: 0.3, // Low temp for structured extraction
        response_format: { type: "json_object" },
      }),
      // ── Step 2: Write a warm, human-readable session note ───────────────
      openai.chat.completions.create({
        model: summaryModel,
        messages: [
          { role: "system", content: "In 1-2 sentences, summarize the emotional tone and key topics of this conversation. Write as a warm, private note that captures what was meaningful. Start with the emotional vibe, then the main topic. Example: 'User was feeling overwhelmed and anxious about a job interview coming up. They talked through their fears and ended the chat feeling slightly more grounded.'" },
          { role: "user", content: transcript },
        ],
        max_tokens: 150,
        temperature: 0.5,
      }),
    ]);

    // Parse extracted facts
    let extracted = {};
    try {
      extracted = JSON.parse(extractRes.choices[0]?.message?.content || "{}");
    } catch { extracted = {}; }

    const sessionNote = summaryRes.choices[0]?.message?.content?.trim() || "";
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // ── Memory depth by tier ─────────────────────────────────────────────────
    // Free:   3 sessions (enough to feel magical, creates desire to upgrade)
    // Plus:   15 sessions
    // Pro:    30 sessions
    // Annual: 60 sessions (feels truly unlimited)
    const memoryDepth = isAnnual ? 60 : isPro ? 30 : isPremium ? 15 : 3;

    // Fetch existing profile
    const profile = await b44Get("UserProfile", profileId);
    const existingFacts    = profile?.user_facts || {};
    const existingSessions = profile?.session_memory || [];

    // Merge facts (new data wins for scalar fields, arrays get merged+deduped)
    const updatedFacts = mergeFacts(existingFacts, extracted);

    // Prepend new session note, trim to tier depth
    const newSession = { date, summary: sessionNote };
    const updatedSessions = [newSession, ...existingSessions].slice(0, memoryDepth);

    // Build the rich summary string that goes into the AI system prompt
    const richSummary = buildRichSummary(updatedFacts, updatedSessions);

    // Save everything back
    await b44Update("UserProfile", profileId, {
      user_facts:      updatedFacts,
      session_memory:  updatedSessions,
      memory_summary:  richSummary,
      updated_date:    new Date().toISOString(),
    });

    // ── Store memories as embeddings for vector search (premium+) ──────────
    storeMemoryVectors(profileId, updatedFacts, sessionNote, isPremium, isPro, isAnnual)
      .catch(e => console.warn("[embed store]", e.message));

    res.status(200).json({
      ok:      true,
      summary: sessionNote,
      facts:   updatedFacts,
    });
  } catch (err) {
    console.error("SummarizeSession error:", err);
    res.status(500).json({ error: err.message });
  }
}
