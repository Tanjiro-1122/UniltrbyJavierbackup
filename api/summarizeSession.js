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
    const response = await openai.chat.completions.create({
      model: summaryModel,
      messages: [
        {
          role: "system",
          content: "Summarize this conversation in 2-3 sentences. Focus on emotional themes, key topics, and anything important to remember about the user. Be warm and concise.",
        },
        { role: "user", content: transcript },
      ],
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content || "";
    const date    = new Date().toLocaleDateString();

    // Memory depth by tier:
    // Free/Plus ($9.99) → 10 sessions
    // Pro ($14.99)      → 20 sessions
    // Annual ($59.99)   → 30 sessions (unlimited feel)
    const memoryDepth = isAnnual ? 30 : isPro ? 20 : 10;

    // Fetch existing profile from Base44
    const profile  = await b44Get("UserProfile", profileId);
    const existing = profile?.session_memory || [];
    const newMemory = [{ date, summary }, ...existing].slice(0, memoryDepth);
    const fullSummary = newMemory.map(m => `[${m.date}] ${m.summary}`).join(" | ");

    await b44Update("UserProfile", profileId, {
      session_memory: newMemory,
      memory_summary: fullSummary,
      updated_date:   new Date().toISOString(),
    });

    res.status(200).json({ ok: true, summary });
  } catch (err) {
    console.error("SummarizeSession error:", err);
    res.status(500).json({ error: err.message });
  }
}
