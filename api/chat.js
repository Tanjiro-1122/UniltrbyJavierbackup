import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CRISIS_KEYWORDS = ["suicide","kill myself","end my life","self harm","cutting myself","want to die","hurt myself","don't want to live"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, systemPrompt, memorySummary, sessionMemory, isPremium } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "No messages provided" });

    const system = systemPrompt || "You are a warm, supportive AI companion named Luna.";
    const memCtx = memorySummary ? `\n\nWhat you remember about this user: ${memorySummary}` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system + memCtx + `\n\nAfter your reply, on a NEW LINE write exactly: MOOD:<one of: happy,neutral,sad,fear,disgust,surprise,anger,contentment,fatigue>` },
        ...(messages || []),
      ],
      max_tokens: 600,
      temperature: 0.85,
    });

    const raw = response.choices[0]?.message?.content || "Hey, I am here for you 💜";

    // Extract mood tag from end of response
    const moodMatch = raw.match(/MOOD:(happy|neutral|sad|fear|disgust|surprise|anger|contentment|fatigue)/i);
    const mood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
    const reply = raw.replace(/\nMOOD:[^\n]*/i, "").trim();

    // Crisis detection
    const lower = reply.toLowerCase() + " " + (messages[messages.length-1]?.content || "").toLowerCase();
    const crisis = CRISIS_KEYWORDS.some(kw => lower.includes(kw));

    res.status(200).json({ reply, mood, crisis });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
}
