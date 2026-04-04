// api/memoryEmbed.js
// Stores and retrieves memory using OpenAI embeddings + vector similarity
// Called by: summarizeSession.js (to store), chat.js (to retrieve relevant memories)
//
// HOW IT WORKS:
// 1. After each session, key facts + emotional moments are converted to embeddings
// 2. Embeddings are stored in UserProfile.memory_vectors (array of {text, vector, date, type})
// 3. At chat time, the user's current message is embedded and compared to stored vectors
// 4. Only the TOP 5 most relevant memories are injected — not everything
// 5. Free users: no vector memory. Premium: top 3. Pro/Annual: top 8.

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const APP_ID = process.env.VITE_BASE44_APP_ID || "69b332a392004d139d4ba495";
const B44_TOKEN = process.env.BASE44_SERVICE_TOKEN;
const B44_BASE = `https://base44.app/api/apps/${APP_ID}/entities`;

async function b44Get(entity, id) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    headers: { "Authorization": `Bearer ${B44_TOKEN}`, "X-App-Id": APP_ID },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Update(entity, id, data) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${B44_TOKEN}`,
      "X-App-Id": APP_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Embed a single string
async function embed(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small", // cheapest + fast: $0.02 per 1M tokens
    input: text.slice(0, 2000),      // cap at 2000 chars
  });
  return res.data[0].embedding;
}

// ── STORE: Called after each session to save memorable moments as vectors ────
// POST /api/memoryEmbed { action: "store", profileId, facts, sessionNote, isPremium, isPro, isAnnual }
async function storeMemories(profileId, facts, sessionNote, isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return { ok: true, skipped: "free_tier" };

  const maxVectors = isAnnual ? 200 : isPro ? 100 : 40;

  // Build memorable text chunks from this session
  const chunks = [];

  if (sessionNote) chunks.push({ text: sessionNote, type: "session" });

  if (facts?.recurring_struggles?.length) {
    chunks.push({ text: `They struggle with: ${facts.recurring_struggles.join(", ")}`, type: "struggle" });
  }
  if (facts?.goals?.length) {
    chunks.push({ text: `Their goals: ${facts.goals.join(", ")}`, type: "goal" });
  }
  if (facts?.important_people?.length) {
    const people = facts.important_people.map(p => `${p.name} (${p.role}${p.note ? ": " + p.note : ""})`).join(", ");
    chunks.push({ text: `Important people in their life: ${people}`, type: "people" });
  }
  if (facts?.name || facts?.age || facts?.occupation) {
    const identity = [
      facts.name && `Name: ${facts.name}`,
      facts.age && `Age: ${facts.age}`,
      facts.occupation && `Works as: ${facts.occupation}`,
      facts.location && `Lives in: ${facts.location}`,
    ].filter(Boolean).join(". ");
    chunks.push({ text: identity, type: "identity" });
  }
  if (facts?.core_values?.length) {
    chunks.push({ text: `They deeply care about: ${facts.core_values.join(", ")}`, type: "values" });
  }

  if (!chunks.length) return { ok: true, skipped: "nothing_to_store" };

  // Embed all chunks in parallel
  const date = new Date().toISOString().slice(0, 10);
  const vectors = await Promise.all(
    chunks.map(async (chunk) => ({
      text: chunk.text,
      type: chunk.type,
      date,
      vector: await embed(chunk.text),
    }))
  );

  // Merge with existing vectors, keep most recent up to maxVectors
  const profile = await b44Get("UserProfile", profileId);
  const existing = profile?.memory_vectors || [];
  const updated = [...vectors, ...existing].slice(0, maxVectors);

  await b44Update("UserProfile", profileId, { memory_vectors: updated });

  return { ok: true, stored: vectors.length };
}

// ── RETRIEVE: Called at chat time to find relevant memories ──────────────────
// POST /api/memoryEmbed { action: "retrieve", profileId, query, isPremium, isPro, isAnnual }
async function retrieveMemories(profileId, query, isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return { memories: [] };

  const topK = isAnnual ? 8 : isPro ? 6 : 3;

  const profile = await b44Get("UserProfile", profileId);
  const vectors = profile?.memory_vectors || [];
  if (!vectors.length) return { memories: [] };

  // Embed the current user query
  const queryVec = await embed(query);

  // Score all stored vectors by similarity
  const scored = vectors
    .filter(v => v.vector?.length)
    .map(v => ({
      text: v.text,
      type: v.type,
      date: v.date,
      score: cosineSimilarity(queryVec, v.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return { memories: scored };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, profileId, facts, sessionNote, query, isPremium, isPro, isAnnual } = req.body || {};

  try {
    if (action === "store") {
      const result = await storeMemories(profileId, facts, sessionNote, isPremium, isPro, isAnnual);
      return res.status(200).json(result);
    }

    if (action === "retrieve") {
      const result = await retrieveMemories(profileId, query, isPremium, isPro, isAnnual);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "action must be 'store' or 'retrieve'" });
  } catch (err) {
    console.error("[memoryEmbed]", err);
    return res.status(500).json({ error: err.message });
  }
}
