import OpenAI from "openai";
import {
  safeLogError,
  withAbortController,
  getCachedProfile,
  setCachedProfile,
  invalidateCachedProfile,
} from "./_helpers.js";

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const B44_APP     = "69b332a392004d139d4ba495";
const B44_BASE    = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

async function b44Get(entity, id) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    headers: { "Authorization": `Bearer ${B44_API_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Update(entity, id, data) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${B44_API_KEY}` },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// ── Merge extracted facts — new data wins, arrays merge+dedup ────────────────
function mergeFacts(existing = {}, extracted = {}) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(extracted)) {
    if (value && value !== "unknown" && value !== "not mentioned") {
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

// ── #1: EMOTIONAL TIMELINE ───────────────────────────────────────────────────
// Each session now logs a timestamped emotional entry.
// Tracks emotion label, intensity (1–5), and the dominant topic.
// This lets the companion say things like "you've been anxious about work for 3 weeks"
function buildEmotionalTimeline(existing = [], newEntry) {
  const entry = {
    date: new Date().toISOString().slice(0, 10),
    emotion: newEntry.emotion || "neutral",
    intensity: newEntry.intensity || 3,
    topic: newEntry.topic || "general",
    note: newEntry.note || "",
  };
  // Keep last 90 entries (3 months of daily use)
  return [entry, ...existing].slice(0, 90);
}

// ── #4: CROSS-SESSION NARRATIVE ─────────────────────────────────────────────
// Stitch the last N session summaries into a running story paragraph.
// This gives the AI a sense of arc — what's been happening over time.
function buildCrossSessionNarrative(sessions = []) {
  if (!sessions.length) return "";
  const recent = sessions.slice(0, 8); // last 8 sessions
  return recent
    .map(s => `[${s.date}] ${s.summary}`)
    .join(" → ");
}

// ── Build full memory summary injected into AI system prompt ─────────────────
function buildRichSummary(facts = {}, sessions = [], emotionalTimeline = []) {
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
    parts.push(`Core values: ${facts.core_values.join(", ")}.`);
  }
  if (facts.goals?.length) {
    parts.push(`Goals: ${facts.goals.join(", ")}.`);
  }

  // Personality
  if (facts.humor_style) parts.push(`Humor style: ${facts.humor_style}.`);
  if (facts.communication_style) parts.push(`Communication style: ${facts.communication_style}.`);
  if (facts.hobbies?.length) {
    parts.push(`Hobbies/interests: ${facts.hobbies.join(", ")}.`);
  }

  // #1 EMOTIONAL TIMELINE — surface recent emotional patterns
  if (emotionalTimeline?.length >= 2) {
    const recent7 = emotionalTimeline.slice(0, 7);
    const emotionCounts = {};
    recent7.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1; });
    const dominant = Object.entries(emotionCounts).sort((a,b) => b[1]-a[1])[0];
    if (dominant) {
      parts.push(`Emotional pattern (last ${recent7.length} sessions): most frequently felt "${dominant[0]}" — last tracked topic: "${recent7[0].topic}".`);
    }
    // Flag if same struggle for 3+ sessions
    const recentEmotions = recent7.map(e => e.emotion);
    const streak = recentEmotions.filter(e => e === recentEmotions[0]).length;
    if (streak >= 3) {
      parts.push(`⚠ They have felt "${recentEmotions[0]}" for ${streak} sessions in a row — acknowledge this pattern gently if relevant.`);
    }
  }

  // #4 CROSS-SESSION NARRATIVE — running story of the relationship
  if (sessions.length >= 2) {
    const narrative = buildCrossSessionNarrative(sessions);
    parts.push(`Session arc: ${narrative}`);
  } else if (sessions.length === 1) {
    parts.push(`Last session: ${sessions[0].summary}`);
  }

  return parts.join(" ");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, profileId, companionName, isPremium, isPro, isAnnual } = req.body;
    if (!messages?.length || !profileId) return res.status(400).json({ error: "Missing required fields" });

    const userMsgCount = messages.filter(m => m.role === "user").length;
    if (userMsgCount < 3) return res.status(200).json({ ok: true, skipped: true, reason: "too_short" });

    const transcript = messages
      .filter(m => m.role !== "system")
      .map(m => `${m.role === "user" ? "User" : companionName || "Companion"}: ${m.content}`)
      .join("\n");

    const summaryModel = (isPremium || isPro || isAnnual) ? "gpt-4o-mini" : "gpt-3.5-turbo";

    // ── Step 1: Extract structured facts + emotion data in one call ──────────
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
  "session_summary": "1-2 sentence emotional summary of THIS session specifically",
  "emotion": "the single dominant emotion felt by the user this session: anxious, sad, happy, angry, lonely, overwhelmed, hopeful, grateful, neutral, excited, confused, relieved",
  "emotion_intensity": "1 to 5 — how strongly they felt it (1=mild, 5=very intense)",
  "emotion_topic": "the main topic driving that emotion — e.g. work, relationship, family, self-worth, health, finances, general"
}

Only include array items that were actually mentioned. Use [] for empty arrays.`;

    const { signal: aiSignal, cancel: cancelAi } = withAbortController();
    let extractRes, summaryRes;
    try {
      [extractRes, summaryRes] = await Promise.all([
        openai.chat.completions.create({
          model: summaryModel,
          messages: [
            { role: "system", content: extractionPrompt },
            { role: "user", content: transcript },
          ],
          max_tokens: 600,
          temperature: 0.3,
          response_format: { type: "json_object" },
        }, { signal: aiSignal }),
        openai.chat.completions.create({
          model: summaryModel,
          messages: [
            { role: "system", content: "In 1-2 sentences, summarize the emotional tone and key topics of this conversation. Write as a warm, private note. Start with the emotional vibe, then the main topic. Example: 'User was feeling overwhelmed and anxious about a job interview. They talked through their fears and ended feeling slightly more grounded.'" },
            { role: "user", content: transcript },
          ],
          max_tokens: 150,
          temperature: 0.5,
        }, { signal: aiSignal }),
      ]);
    } finally {
      cancelAi();
    }

    let extracted = {};
    try { extracted = JSON.parse(extractRes.choices[0]?.message?.content || "{}"); } catch {}

    const sessionNote = summaryRes.choices[0]?.message?.content?.trim() || "";
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const memoryDepth = isAnnual ? 60 : isPro ? 30 : isPremium ? 15 : 3;

    // Fetch existing profile — use short-lived cache to avoid duplicate B44 round-trips
    let profile = getCachedProfile(profileId);
    if (!profile) {
      profile = await b44Get("UserProfile", profileId);
      if (profile) setCachedProfile(profileId, profile);
    }
    const existingFacts     = profile?.user_facts || {};
    const existingSessions  = profile?.session_memory || [];
    const existingTimeline  = profile?.emotional_timeline || [];

    // Merge facts
    const updatedFacts = mergeFacts(existingFacts, extracted);

    // #1 — Build emotional timeline entry from extracted data
    const updatedTimeline = buildEmotionalTimeline(existingTimeline, {
      emotion:   extracted.emotion || "neutral",
      intensity: extracted.emotion_intensity || 3,
      topic:     extracted.emotion_topic || "general",
      note:      sessionNote,
    });

    // #4 — Session history for cross-session narrative
    const newSession = { date, summary: sessionNote };
    const updatedSessions = [newSession, ...existingSessions].slice(0, memoryDepth);

    // Build rich summary (now includes emotional timeline + narrative)
    const richSummary = buildRichSummary(updatedFacts, updatedSessions, updatedTimeline);

    // Save everything
    await b44Update("UserProfile", profileId, {
      user_facts:         updatedFacts,
      session_memory:     updatedSessions,
      emotional_timeline: updatedTimeline,
      memory_summary:     richSummary,
      updated_date:       new Date().toISOString(),
    });
    // Evict stale cached profile after write
    invalidateCachedProfile(profileId);

    // Vector memory store (premium+, fire-and-forget)
    try {
      const { storeMemoryVectors } = await import("./memoryEmbed.js");
      storeMemoryVectors(profileId, updatedFacts, sessionNote, isPremium, isPro, isAnnual)
        .then(r  => console.log("[summarize] vectors stored:", r))
        .catch(e => console.warn("[summarize] vector store failed:", e.message));
    } catch(e) {
      console.warn("[summarize] memoryEmbed import failed:", e.message);
    }

    res.status(200).json({
      ok:      true,
      summary: sessionNote,
      facts:   updatedFacts,
      emotion: extracted.emotion,
      emotion_topic: extracted.emotion_topic,
    });
  } catch (err) {
    safeLogError(err, { tag: "summarizeSession" });
    res.status(500).json({ error: "Session summarization failed. Please try again." });
  }
}
