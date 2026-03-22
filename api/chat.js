import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, systemPrompt, companionId, vibe, memorySummary } = req.body;

    const system = systemPrompt || "You are a warm, supportive AI companion.";
    const memoryContext = memorySummary ? `\n\nMemory of this user: ${memorySummary}` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system + memoryContext },
        ...(messages || []),
      ],
      max_tokens: 500,
      temperature: 0.85,
    });

    const reply = response.choices[0]?.message?.content || "Hey, I'm here for you 💜";
    res.status(200).json({ data: { message: reply } });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
}
