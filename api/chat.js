import OpenAI from "openai";
import { retrieveRelevantMemories } from "./memoryEmbed.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CRISIS_KEYWORDS = ["suicide","kill myself","end my life","self harm","cutting myself","want to die","hurt myself","don't want to live"];

// ── Tier-based model selection ──────────────────────────────────────────────
function getModel(isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return "gpt-3.5-turbo";
  return "gpt-4o-mini";
}

function getMaxTokens(isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return 250;
  if (isPro || isAnnual)                return 800;
  return 600;
}

function getContextWindow(isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return 4;
  if (isPro || isAnnual)                return 20;
  return 10;
}

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
    vibeMap[p.vibe], empathyMap[p.empathy], humorMap[p.humor],
    curiosityMap[p.curiosity], styleMap[p.style],
  ].filter(Boolean);

  return lines.length ? "\n\nPersonality traits:\n" + lines.join(" ") : "";
}

// ── Build a rich, structured memory block for the system prompt ─────────────
// This is the MOST IMPORTANT function for memory quality.
// It converts our stored facts + sessions into natural language the AI understands perfectly.
function buildMemoryBlock(memorySummary, userFacts, sessionMemory, isPremium, isPro, isAnnual) {
  const parts = [];

  // ── Structured facts (highest priority — AI should absolutely use these) ──
  if (userFacts && Object.keys(userFacts).length > 0) {
    const f = userFacts;
    const factLines = [];

    if (f.name) factLines.push(`Their name is ${f.name}.`);
    if (f.age) factLines.push(`They are ${f.age} years old.`);
    if (f.location) factLines.push(`They're based in ${f.location}.`);
    if (f.occupation) factLines.push(`They work as ${f.occupation}.`);
    if (f.relationship_status) factLines.push(`Relationship status: ${f.relationship_status}.`);

    if (f.important_people?.length) {
      const people = f.important_people
        .map(p => `${p.name} (${p.role}${p.note ? `, ${p.note}` : ""})`)
        .join(", ");
      factLines.push(`Important people in their life: ${people}.`);
    }

    if (f.recurring_struggles?.length) {
      factLines.push(`They regularly deal with: ${f.recurring_struggles.join(", ")}.`);
    }

    if (f.goals?.length) {
      factLines.push(`Their goals/dreams: ${f.goals.join(", ")}.`);
    }

    if (f.core_values?.length) {
      factLines.push(`They deeply care about: ${f.core_values.join(", ")}.`);
    }

    if (f.hobbies?.length) {
      factLines.push(`Hobbies/interests: ${f.hobbies.join(", ")}.`);
    }

    if (f.communication_style) {
      factLines.push(`How they communicate: ${f.communication_style}.`);
    }

    if (factLines.length) {
      parts.push("=== What you know about this person ===\n" + factLines.join("\n"));
    }
  }

  // ── Recent session history (emotional arc) ────────────────────────────────
  const sessionsToShow = isPro || isAnnual ? 5 : isPremium ? 3 : 1;
  if (sessionMemory?.length) {
    const recent = sessionMemory.slice(0, sessionsToShow);
    const sessionLines = recent.map(s => `• [${s.date}] ${s.summary}`).join("\n");
    parts.push("=== Recent conversations ===\n" + sessionLines);
  }

  // ── Fallback: raw summary if no structured data yet ───────────────────────
  if (parts.length === 0 && memorySummary) {
    parts.push("What you remember about this user:\n" + memorySummary);
  }

  if (!parts.length) return "";

  return "\n\n" + parts.join("\n\n") + "\n\nIMPORTANT: Use this context naturally. If you know their name, use it occasionally. Reference their struggles or goals when relevant. Never say 'As I remember from our last conversation' — just naturally USE the knowledge.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      messages,
      systemPrompt,
      memorySummary,
      sessionMemory,
      userFacts,
      profileId,        // needed for vector memory retrieval
      isPremium  = false,
      isPro      = false,
      isAnnual   = false,
      personality,
    } = req.body;

    if (!messages?.length) return res.status(400).json({ error: "No messages provided" });

    const model      = getModel(isPremium, isPro, isAnnual);
    const maxTokens  = getMaxTokens(isPremium, isPro, isAnnual);
    const ctxWindow  = getContextWindow(isPremium, isPro, isAnnual);

    const system         = systemPrompt || "You are a warm, supportive AI companion named Luna.";
    const personalityCtx = buildPersonalityParagraph(personality);

    // ── Vector memory: fetch relevant memories based on current user message ─
    let vectorMemoryBlock = "";
    if (profileId && (isPremium || isPro || isAnnual)) {
      try {
        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
        const relevant = await retrieveRelevantMemories(profileId, lastUserMsg, isPremium, isPro, isAnnual);
        if (relevant.length) {
          const lines = relevant.map(m => `[${m.type || "memory"}] ${m.text}`).join("\n");
          vectorMemoryBlock = "\n\n=== Memories relevant to this moment ===\n" + lines;
        }
      } catch(e) {
        console.warn("[vector memory]", e.message);
      }
    }

    // ── Rich structured memory block ──────────────────────────────────────────
    const memoryBlock = buildMemoryBlock(
      memorySummary, userFacts, sessionMemory, isPremium, isPro, isAnnual
    );

    // Trim message history to tier context window
    const trimmedMessages = messages.slice(-ctxWindow);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: system + personalityCtx + memoryBlock + vectorMemoryBlock +
            `\n\nAfter your reply, on a NEW LINE write exactly: MOOD:<one of: happy,neutral,sad,fear,disgust,surprise,anger,contentment,fatigue>`,
        },
        ...trimmedMessages,
      ],
      max_tokens: maxTokens,
      temperature: 0.85,
    });

    const raw = response.choices[0]?.message?.content || "Hey, I am here for you 💜";

    const moodMatch = raw.match(/MOOD:(happy|neutral|sad|fear|disgust|surprise|anger|contentment|fatigue)/i);
    const mood  = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
    const reply = raw.replace(/\nMOOD:[^\n]*/i, "").trim();

    const lower  = reply.toLowerCase() + " " + (messages[messages.length - 1]?.content || "").toLowerCase();
    // Keyword check (fast, synchronous) — catches explicit phrases
    const keywordCrisis = CRISIS_KEYWORDS.some(kw => lower.includes(kw));
    // Moderation API check (async, catches subtler language)
    let moderationCrisis = false;
    try {
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      if (lastUserMsg.length > 5) {
        const modRes = await openai.moderations.create({ input: lastUserMsg });
        const flagged = modRes.results?.[0];
        moderationCrisis = flagged?.flagged &&
          (flagged.categories?.["self-harm"] || flagged.categories?.["self-harm/intent"] ||
           flagged.categories?.["violence"] || flagged.categories?.["self-harm/instructions"]);
      }
    } catch(e) { /* non-fatal */ }
    const crisis = keywordCrisis || moderationCrisis;

    res.status(200).json({ reply, mood, crisis, _tier: model });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
