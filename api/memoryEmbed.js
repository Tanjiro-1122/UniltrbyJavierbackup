// api/memoryEmbed.js
// Vector memory system using OpenAI text-embedding-3-small
// Stores key memories as embeddings, retrieves only relevant ones at chat time
//
// TIER LIMITS:
// Free:   no vector memory (basic facts only)
// Premium: store 40 vectors, retrieve top 3
// Pro:    store 100 vectors, retrieve top 6
// Annual: store 200 vectors, retrieve top 8

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const APP_ID = "69b332a392004d139d4ba495";
const B44_TOKEN = process.env.BASE44_SERVICE_TOKEN;
const B44_BASE = `https://api.base44.com/api/apps/${APP_ID}/entities`;

async function b44Get(entity, id) {
  const res = await fetch(`${B44_BASE}/${entity}/${id}`, {
    headers: { "Authorization": `Bearer ${B44_TOKEN}`, "X-App-Id": APP_ID },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Patch(entity, id, data) {
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

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function embed(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 2000),
  });
  return res.data[0].embedding;
}

// ── Named export: called from summarizeSession after saving facts ─────────────
export async function storeMemoryVectors(profileId, facts, sessionNote, isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return { ok: true, skipped: "free_tier" };

  const maxVectors = isAnnual ? 200 : isPro ? 100 : 40;
  const date = new Date().toISOString().slice(0, 10);

  const chunks = [];
  if (sessionNote) chunks.push({ text: sessionNote, type: "session" });
  if (facts?.recurring_struggles?.length)
    chunks.push({ text: `Struggles: ${facts.recurring_struggles.join(", ")}`, type: "struggle" });
  if (facts?.goals?.length)
    chunks.push({ text: `Goals: ${facts.goals.join(", ")}`, type: "goal" });
  if (facts?.important_people?.length) {
    const people = facts.important_people.map(p => `${p.name} (${p.role}${p.note ? ": " + p.note : ""})`).join(", ");
    chunks.push({ text: `Important people: ${people}`, type: "people" });
  }
  if (facts?.name || facts?.occupation || facts?.location) {
    const id = [
      facts.name && `Name: ${facts.name}`,
      facts.age && `Age: ${facts.age}`,
      facts.occupation && `Job: ${facts.occupation}`,
      facts.location && `Location: ${facts.location}`,
    ].filter(Boolean).join(". ");
    chunks.push({ text: id, type: "identity" });
  }
  if (facts?.core_values?.length)
    chunks.push({ text: `Values: ${facts.core_values.join(", ")}`, type: "values" });

  if (!chunks.length) return { ok: true, skipped: "nothing_to_store" };

  const vectors = await Promise.all(
    chunks.map(async (c) => ({ text: c.text, type: c.type, date, vector: await embed(c.text) }))
  );

  const profile = await b44Get("UserProfile", profileId);
  const existing = profile?.memory_vectors || [];
  const updated = [...vectors, ...existing].slice(0, maxVectors);

  await b44Patch("UserProfile", profileId, { memory_vectors: updated });
  return { ok: true, stored: vectors.length };
}

// ── Named export: called from chat.js to fetch relevant memories ──────────────
export async function retrieveRelevantMemories(profileId, query, isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return [];

  const topK = isAnnual ? 8 : isPro ? 6 : 3;

  const profile = await b44Get("UserProfile", profileId);
  const vectors = profile?.memory_vectors || [];
  if (!vectors.length) return [];

  const queryVec = await embed(query);

  return vectors
    .filter(v => v.vector?.length)
    .map(v => ({ text: v.text, type: v.type, date: v.date, score: cosineSimilarity(queryVec, v.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ── HTTP handler (for direct API calls if needed) ─────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, profileId, facts, sessionNote, query, isPremium, isPro, isAnnual } = req.body || {};

  try {
    if (action === "store") {
      const r = await storeMemoryVectors(profileId, facts, sessionNote, isPremium, isPro, isAnnual);
      return res.status(200).json(r);
    }
    if (action === "retrieve") {
      const memories = await retrieveRelevantMemories(profileId, query, isPremium, isPro, isAnnual);
      return res.status(200).json({ memories });
    }
    return res.status(400).json({ error: "action must be store or retrieve" });
  } catch (err) {
    console.error("[memoryEmbed]", err);
    return res.status(500).json({ error: err.message });
  }
}
