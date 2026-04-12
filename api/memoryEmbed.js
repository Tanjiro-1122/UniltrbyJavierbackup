// api/memoryEmbed.js
// Vector memory system using OpenAI text-embedding-3-small
// v2: adds memory decay + freshness weighting
//
// TIER LIMITS:
// Free:   no vector memory (basic facts only)
// Premium: store 40 vectors, retrieve top 3
// Pro:    store 100 vectors, retrieve top 6
// Annual: store 200 vectors, retrieve top 8

import OpenAI from "openai";
import { B44_APP_ID, B44_ENTITIES, b44Token } from "./_b44.js";
import { createRequestContext, safeLogError, checkRateLimit } from "./_helpers.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function b44Get(entity, id) {
  const res = await fetch(`${B44_ENTITIES}/${entity}/${id}`, {
    headers: { "Authorization": `Bearer ${b44Token()}`, "X-App-Id": B44_APP_ID },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Patch(entity, id, data) {
  const res = await fetch(`${B44_ENTITIES}/${entity}/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${b44Token()}`,
      "X-App-Id": B44_APP_ID,
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
  // Guard against zero-length vectors to prevent NaN corrupting scores
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function embed(text) {
  const MAX_CHARS = 2000;
  if (text.length > MAX_CHARS) {
    console.warn(`[memoryEmbed] embed() truncating text from ${text.length} to ${MAX_CHARS} chars`);
  }
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, MAX_CHARS),
  });
  return res.data[0].embedding;
}

// ── #2: MEMORY DECAY + FRESHNESS WEIGHTING ───────────────────────────────────
// Older memories get a lower relevance score multiplier.
// Half-life: 30 days — a memory 30 days old is worth 50% of a fresh one.
// This prevents stale facts from dominating over recent ones.
// "Identity" type memories (name, age, job) decay very slowly — these rarely change.
// "Session" and "struggle" memories decay faster — emotional states are temporary.
function freshnessMultiplier(dateStr, type = "session") {
  if (!dateStr) return 0.5;
  const ageDays = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);

  // Identity facts (name, job, location) — half-life 180 days (very stable)
  if (type === "identity") {
    return Math.pow(0.5, ageDays / 180);
  }
  // Values and goals — half-life 60 days
  if (type === "values" || type === "goal") {
    return Math.pow(0.5, ageDays / 60);
  }
  // Struggles and sessions — half-life 21 days (emotions change)
  return Math.pow(0.5, ageDays / 21);
}

// ── Store memory vectors ──────────────────────────────────────────────────────
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

  // Use allSettled so a single failed embedding doesn't abort the whole batch —
  // successful vectors are still stored; individual failures are logged and skipped.
  const results = await Promise.allSettled(
    chunks.map(async (c) => ({
      text: c.text,
      type: c.type,
      date,
      vector: await embed(c.text),
    }))
  );

  const vectors = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      vectors.push(result.value);
    } else {
      console.warn("[memoryEmbed] embed failed for chunk (skipping):", result.reason?.message);
    }
  }

  if (vectors.length === 0) return { ok: true, skipped: "all_embeds_failed" };

  const profile = await b44Get("UserProfile", profileId);
  const existing = profile?.memory_vectors || [];
  const updated = [...vectors, ...existing].slice(0, maxVectors);

  await b44Patch("UserProfile", profileId, { memory_vectors: updated });
  return { ok: true, stored: vectors.length };
}

// ── Retrieve relevant memories with freshness weighting ──────────────────────
export async function retrieveRelevantMemories(profileId, query, isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return [];

  const topK = isAnnual ? 8 : isPro ? 6 : 3;

  const profile = await b44Get("UserProfile", profileId);
  const vectors = profile?.memory_vectors || [];
  if (!vectors.length) return [];

  const queryVec = await embed(query);

  return vectors
    .filter(v => v.vector?.length)
    .map(v => {
      const semantic = cosineSimilarity(queryVec, v.vector);
      // #2: multiply semantic score by freshness — stale memories rank lower
      const freshness = freshnessMultiplier(v.date, v.type);
      const score = semantic * freshness;
      return { text: v.text, type: v.type, date: v.date, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ── HTTP handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ctx = createRequestContext(req);
  res.setHeader("X-Request-Id", ctx.requestId);

  const rl = checkRateLimit(ctx.userId, ctx.clientIp);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.retryAfterSeconds}s and try again.`,
    });
  }

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
    safeLogError(err, { tag: "memoryEmbed" });
    return res.status(500).json({ error: "Memory operation failed. Please try again." });
  }
}
