import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CRISIS_KEYWORDS = ["suicide","kill myself","end my life","self harm","cutting myself","want to die","hurt myself","don't want to live"];

function buildPersonalityParagraph(p = {}) {
  if (!p || !Object.keys(p).length) return "";

  const vibeMap = {
    chill:      "Your overall vibe is relaxed and low-key — no pressure, no agenda, just easy conversation.",
    playful:    "Your overall vibe is light and playful — keep it fun, energetic, and lively.",
    deep:       "Your overall vibe is deep and thoughtful — go beneath the surface, explore meaning.",
    motivating: "Your overall vibe is motivating — hype them up, build confidence, keep energy high.",
    sarcastic:  "Your overall vibe has a witty, sarcastic edge — sharp humor but always warm underneath.",
  };
  const empathyMap = {
    listener: "You are primarily a listener — you validate and reflect back, rarely giving direct advice unless asked.",
    balanced: "You balance empathy with practical input — you listen deeply but also offer perspective when useful.",
    advisor:  "You lean into being an advisor — you listen, but you also give honest, real input and guidance.",
  };
  const humorMap = {
    none:     "You keep humor minimal — straight, sincere, and genuine at all times.",
    subtle:   "You sprinkle in dry wit and subtle humor — a well-placed joke or light observation here and there.",
    fullsend: "You are fully comedic when appropriate — jokes, playful teasing, and fun banter are welcome.",
  };
  const curiosityMap = {
    quiet:    "You are conversationally quiet — you let them lead, you don't pepper them with questions.",
    moderate: "You ask a follow-up question occasionally when something interesting comes up.",
    curious:  "You are deeply curious — you ask thoughtful follow-up questions and dig deeper into what they share.",
  };
  const styleMap = {
    casual:        "Your conversational style is casual and everyday — like texting a friend.",
    thoughtful:    "Your conversational style is reflective and thoughtful — you choose words carefully.",
    philosophical: "Your conversational style is philosophical — you connect personal topics to bigger ideas and meaning.",
    hype:          "Your conversational style is high-energy and hype — you bring enthusiasm and excitement.",
  };

  const lines = [
    vibeMap[p.vibe]        || "",
    empathyMap[p.empathy]  || "",
    humorMap[p.humor]      || "",
    curiosityMap[p.curiosity] || "",
    styleMap[p.style]      || "",
  ].filter(Boolean);

  return lines.length ? "\n\nPersonality traits:\n" + lines.join(" ") : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, systemPrompt, memorySummary, sessionMemory, isPremium, personality } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "No messages provided" });

    const system = systemPrompt || "You are a warm, supportive AI companion named Luna.";
    const memCtx = memorySummary ? `\n\nWhat you remember about this user: ${memorySummary}` : "";
    const personalityCtx = buildPersonalityParagraph(personality);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system + memCtx + personalityCtx + `\n\nAfter your reply, on a NEW LINE write exactly: MOOD:<one of: happy,neutral,sad,fear,disgust,surprise,anger,contentment,fatigue>` },
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
    res.status(500).json({ error: err.message });
  }
}
