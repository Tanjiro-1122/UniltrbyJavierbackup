import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Hardcoded prod app ID — VITE_ vars are unavailable in Vercel serverless functions
const B44_APP     = "69b332a392004d139d4ba495";
const B44_BASE    = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const B44_API_KEY = process.env.BASE44_API_KEY || "";

async function b44Get(entity, id) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${B44_API_KEY}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Update(entity, id, data) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${B44_API_KEY}`,
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// ── Extract structured facts from conversation transcript ─────────────────────
// Merges NEW facts into EXISTING facts — never overwrites known data with blanks
function mergeFacts(existing = {}, extracted = {}) {
  const merged = { ...existing };

  // Scalar fields: only update if extracted has a real value and existing doesn't
  const scalars = ["name", "age", "location", "occupation", "relationship_status", "communication_style"];
  for (const key of scalars) {
    if (extracted[key] && !merged[key]) {
      merged[key] = extracted[key];
    }
    // Allow updates if new value seems more complete
    if (extracted[key] && merged[key] && extracted[key].length > merged[key].length) {
      merged[key] = extracted[key];
    }
  }

  // Array fields: merge unique values
  const arrays = ["recurring_struggles", "goals", "core_values", "hobbies"];
  for (const key of arrays) {
    if (extracted[key]?.length) {
      const existing_arr = merged[key] || [];
      const combined = [...new Set([...existing_arr, ...extracted[key]])];
      merged[key] = combined.slice(0, 10); // cap at 10 per category
    }
  }

  // important_people: merge by name (avoid duplicates)
  if (extracted.important_people?.length) {
    const existingPeople = merged.important_people || [];
    const existingNames = new Set(existingPeople.map(p => p.name?.toLowerCase()));
    const newPeople = extracted.important_people.filter(p => p.name && !existingNames.has(p.name.toLowerCase()));
    merged.important_people = [...existingPeople, ...newPeople].slice(0, 15);
  }

  return merged;
}

async function extractFacts(transcript, existingFacts = {}) {
  const existingSummary = Object.keys(existingFacts).length
    ? `\n\nExisting known facts (do NOT repeat these unless updating):\n${JSON.stringify(existingFacts, null, 2)}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a careful listener extracting factual information about a person from their conversation.
Extract ONLY facts that were clearly stated or strongly implied. Never invent or guess.
Return a JSON object with ONLY the fields that have new information. Omit fields where nothing was learned.

Fields to look for:
- name: their first name
- age: their age (number or string like "mid-30s")
- location: city, state, or country they live in
- occupation: their job or what they do
- relationship_status: single, dating, married, divorced, etc.
- communication_style: how they communicate (e.g. "opens up slowly", "very direct", "uses humor")
- recurring_struggles: array of things they repeatedly deal with (anxiety, loneliness, work stress, etc.)
- goals: array of their stated goals or dreams
- core_values: array of things they deeply care about (family, freedom, creativity, etc.)
- hobbies: array of hobbies or interests mentioned
- important_people: array of {name, role, note} objects for people they mention (mom, best friend Jake, partner Maria, etc.)

Return ONLY valid JSON. No explanation.${existingSummary}`,
      },
      {
        role: "user",
        content: `Extract facts from this conversation:\n\n${transcript}`,
      },
    ],
    max_tokens: 600,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, profileId, companionName, isPremium, isPro, isAnnual } = req.body;
    if (!messages?.length || !profileId) return res.status(400).json({ error: "Missing required fields" });

    const transcript = messages
      .filter(m => m.role !== "system")
      .map(m => `${m.role === "user" ? "User" : companionName || "Companion"}: ${m.content}`)
      .join("\n");

    // Use cheaper model for free users, better model for paid tiers
    const summaryModel = (isPremium || isPro || isAnnual) ? "gpt-4o-mini" : "gpt-3.5-turbo";

    // ── Run session summary + fact extraction in parallel ─────────────────────
    const [summaryResponse, profile] = await Promise.all([
      openai.chat.completions.create({
        model: summaryModel,
        messages: [
          {
            role: "system",
            content: "Summarize this conversation in 2-3 sentences. Focus on emotional themes, key topics, and anything important to remember about the user. Be warm and concise.",
          },
          { role: "user", content: transcript },
        ],
        max_tokens: 200,
      }),
      b44Get("UserProfile", profileId),
    ]);

    const summary = summaryResponse.choices[0]?.message?.content || "";
    const date    = new Date().toLocaleDateString();

    // Memory depth by tier
    const memoryDepth = isAnnual ? 30 : isPro ? 20 : 10;

    const existing      = profile?.session_memory || [];
    const newMemory     = [{ date, summary }, ...existing].slice(0, memoryDepth);
    const fullSummary   = newMemory.map(m => `[${m.date}] ${m.summary}`).join(" | ");

    // ── Extract structured facts (premium+ only — costs an extra GPT call) ────
    let updatedFacts = profile?.user_facts || {};
    if (isPremium || isPro || isAnnual) {
      try {
        const extracted = await extractFacts(transcript, updatedFacts);
        if (Object.keys(extracted).length > 0) {
          updatedFacts = mergeFacts(updatedFacts, extracted);
        }
      } catch (factErr) {
        console.warn("[summarizeSession] fact extraction failed:", factErr.message);
        // Non-fatal — continue without updating facts
      }
    }

    // ── Save everything in one write ──────────────────────────────────────────
    await b44Update("UserProfile", profileId, {
      session_memory: newMemory,
      memory_summary: fullSummary,
      user_facts:     updatedFacts,
      updated_date:   new Date().toISOString(),
    });

    // ── Store vector embeddings for premium users (fire-and-forget) ───────────
    if (isPremium || isPro || isAnnual) {
      try {
        const { storeMemoryVectors } = await import("./memoryEmbed.js");
        storeMemoryVectors(profileId, updatedFacts, summary, isPremium, isPro, isAnnual).catch(() => {});
      } catch (e) {
        console.warn("[summarizeSession] vector store failed:", e.message);
      }
    }

    res.status(200).json({ ok: true, summary, factsUpdated: Object.keys(updatedFacts).length > 0 });
  } catch (err) {
    console.error("SummarizeSession error:", err);
    res.status(500).json({ error: err.message });
  }
}
