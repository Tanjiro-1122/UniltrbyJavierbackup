import OpenAI from "openai";
import {
  createRequestContext,
  safeLogError,
  checkRateLimit,
  withAbortController,
  MAX_INPUT_CHARS,
  MAX_OUTPUT_TOKENS,
} from "./_helpers.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CRISIS_KEYWORDS = ["suicide","kill myself","end my life","self harm","cutting myself","want to die","hurt myself","don't want to live"];

// ── Tier-based model selection ──────────────────────────────────────────────
// FREE:   gpt-3.5-turbo  — fast, cheap, good enough
// PLUS:   gpt-4o-mini    — noticeably better, default paid experience
// PRO:    gpt-4o-mini    — same model but higher limits + more context
// ANNUAL: gpt-4o-mini    — same model, full context, no restrictions
function getModel(isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return "gpt-3.5-turbo";
  return "gpt-4o-mini";
}

// Max tokens by tier
function getMaxTokens(isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return 250;  // Free — short, snappy replies
  if (isPro || isAnnual)                return 800;   // Pro/Annual — fuller replies
  return 600;                                          // Plus — standard
}

// Context window (how many past messages to include)
function getContextWindow(isPremium, isPro, isAnnual) {
  if (!isPremium && !isPro && !isAnnual) return 4;   // Free — last 4 messages only
  if (isPro || isAnnual)                return 20;   // Pro/Annual — rich context
  return 10;                                          // Plus — standard
}

// ── Cost estimate (USD) ─────────────────────────────────────────────────────
// gpt-3.5-turbo:  $0.50 / 1M input,  $1.50 / 1M output
// gpt-4o-mini:    $0.15 / 1M input,  $0.60 / 1M output
function estimateCost(model, promptTokens, completionTokens) {
  if (model === "gpt-3.5-turbo") {
    return (promptTokens * 0.0000005) + (completionTokens * 0.0000015);
  }
  // gpt-4o-mini
  return (promptTokens * 0.00000015) + (completionTokens * 0.0000006);
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
    vibeMap[p.vibe]           || "",
    empathyMap[p.empathy]     || "",
    humorMap[p.humor]         || "",
    curiosityMap[p.curiosity] || "",
    styleMap[p.style]         || "",
  ].filter(Boolean);

  return lines.length ? "\n\nPersonality traits:\n" + lines.join(" ") : "";
}


// ── #3: MEMORY CONFIRMATION LOOP ─────────────────────────────────────────────
// Occasionally prompt the AI to gently verify a stored fact.
// Runs roughly every 7 sessions — keeps memories accurate without feeling robotic.
// Only surfaces for premium+ users who have actual stored facts.
function buildMemoryConfirmationNudge(facts = {}, sessions = [], isPremium) {
  if (!isPremium) return "";
  if (!sessions || sessions.length < 3) return "";

  // Only trigger every ~7 sessions (using session count as proxy)
  if (sessions.length % 7 !== 0) return "";

  // Pick a fact to verify — prefer emotional/situational ones over identity
  const candidates = [];
  if (facts.recurring_struggles?.length) {
    candidates.push(`they've been struggling with "${facts.recurring_struggles[0]}"`);
  }
  if (facts.goals?.length) {
    candidates.push(`their goal is "${facts.goals[0]}"`);
  }
  if (facts.important_people?.length) {
    const p = facts.important_people[0];
    candidates.push(`${p.name} is their ${p.role}`);
  }
  if (facts.occupation) {
    candidates.push(`they work as ${facts.occupation}`);
  }

  if (!candidates.length) return "";

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return `\n\nMemory check-in (do this naturally if the moment is right — don't force it): You remember that ${pick}. If the conversation flows there organically, gently check if that's still the case. Example: "Last time you mentioned X — how's that going?" Only do this ONCE and only if it fits naturally.`;
}


// ── #6: PROACTIVE MEMORY SURFACING ───────────────────────────────────────────
// Gives the AI permission to volunteer a memory when the moment fits.
// Only fires every ~5 messages (using message count as throttle) and 
// only when the user has meaningful history. This prevents it from 
// feeling robotic — the AI decides whether the moment is right.
function buildProactiveMemoryInstruction(facts = {}, sessions = [], messageCount = 0) {
  // Only surface proactively every 5+ messages, and only if 3+ sessions
  if (!sessions || sessions.length < 3) return "";
  if (messageCount % 5 !== 0) return "";

  const cues = [];
  if (facts.recurring_struggles?.length) {
    cues.push(`"${facts.recurring_struggles[0]}" (something they've struggled with)`);
  }
  if (facts.goals?.length) {
    cues.push(`"${facts.goals[0]}" (a goal they mentioned)`);
  }
  if (sessions[0]?.summary) {
    cues.push(`the last conversation: "${sessions[0].summary.slice(0, 80)}…"`);
  }

  if (!cues.length) return "";

  const pick = cues[Math.floor(Math.random() * cues.length)];
  return `\n\nProactive memory (optional — only use if it flows naturally into the conversation, not forced): You remember ${pick}. If the current message connects to this in any way, you may bring it up warmly — like a friend who remembered. Example: "Oh speaking of that — last time you mentioned X, how's that been going?" Only do this ONCE per response, and only if it genuinely fits.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ctx = createRequestContext(req);
  res.setHeader("X-Request-Id", ctx.requestId);

  // ── Rate limit ───────────────────────────────────────────────────────────
  const rl = checkRateLimit(ctx.userId);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.retryAfterSeconds}s and try again.`,
    });
  }

  try {
    const {
      messages,
      systemPrompt,
      memorySummary,
      sessionMemory,
      profileId,
      isPremium  = false,
      isPro      = false,
      isAnnual   = false,
      personality,
      userFacts,
      relationshipMode = "friend",} = req.body;

    if (!messages?.length) return res.status(400).json({ error: "No messages provided" });

    // ── Input length guard ───────────────────────────────────────────────
    const totalInputChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalInputChars > MAX_INPUT_CHARS) {
      return res.status(400).json({
        error: "Your message is too long. Please shorten it and try again.",
      });
    }

    const model      = getModel(isPremium, isPro, isAnnual);
    // Respect per-tier defaults but never exceed the hard server-side cap.
    const maxTokens  = Math.min(getMaxTokens(isPremium, isPro, isAnnual), MAX_OUTPUT_TOKENS);
    const ctxWindow  = getContextWindow(isPremium, isPro, isAnnual);

    const system         = systemPrompt || "You are a warm, supportive AI companion named Luna.";
    const memCtx         = memorySummary ? `\n\nWhat you remember about this user: ${memorySummary}` : "";
    const personalityCtx = buildPersonalityParagraph(personality);

    // Relationship mode — shapes tone and dynamic
    const MODE_INSTRUCTION = {
      friend:    "\n\nRelationship dynamic: You are their FRIEND. Be casual, real, and warm — like texting a close friend who actually gets them. Skip the therapist-speak. Match their energy, use humor when it fits, and keep it natural.",
      coach:     "\n\nRelationship dynamic: You are their COACH. Be focused, direct, and motivating. Give clear guidance, set gentle challenges, and celebrate wins. Drive them toward their goals — but with heart, not pressure.",
      companion: "\n\nRelationship dynamic: You are their COMPANION — deeply connected. Lead with emotional presence. Listen closely, validate feelings, and build intimacy. You're not just helpful, you genuinely care about this specific person.",
    };
    const modeCtx = MODE_INSTRUCTION[relationshipMode] || MODE_INSTRUCTION.friend;

    // Session memory context (paid tiers only)
    let sessionCtx = "";
    if ((isPremium || isPro || isAnnual) && sessionMemory?.length) {
      const recent = sessionMemory.slice(0, isPro || isAnnual ? 5 : 3);
      sessionCtx = "\n\nRecent session notes:\n" + recent.map(s => `- ${s}`).join("\n");
    }

    // ── #3: Memory confirmation nudge ───────────────────────────────────
    const memoryConfirmCtx = buildMemoryConfirmationNudge(
      userFacts || {},
      sessionMemory || [],
      isPremium || isPro || isAnnual
    );

    // ── #6: Proactive memory surfacing ──────────────────────────────────
    const proactiveCtx = buildProactiveMemoryInstruction(
      userFacts || {},
      sessionMemory || [],
      messages?.length || 0
    );
    // ── Vector memory retrieval (premium+ only) ─────────────────────────
    let vectorCtx = "";
    if (profileId && (isPremium || isPro || isAnnual) && messages?.length) {
      try {
        const { retrieveRelevantMemories } = await import("./memoryEmbed.js");
        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
        if (lastUserMsg) {
          const mems = await retrieveRelevantMemories(profileId, lastUserMsg, isPremium, isPro, isAnnual);
          if (mems?.length) {
            vectorCtx = "\n\nRelevant memories:\n" + mems.map(m => `- ${m.text}`).join("\n");
            console.log("[chat] injected", mems.length, "vector memories");
          }
        }
      } catch(e) {
        console.warn("[chat] vector retrieval failed (non-fatal):", e.message);
      }
    }

    // Trim message history to tier context window
    const trimmedMessages = messages.slice(-ctxWindow);

    // Detect mood check-in — when user shares how they're feeling at the start of chat
    const lastMsg = messages[messages.length - 1];
    const isMoodCheckIn = lastMsg?.role === "user" && /^I'?m feeling .+ today$/iu.test(lastMsg?.content || "");
    const moodCheckInCtx = isMoodCheckIn
      ? `\n\nIMPORTANT: The user just shared their mood: "${lastMsg.content}". This is a mood check-in. In your FIRST sentence, acknowledge their feeling directly and warmly — show you genuinely heard them. Use their specific emotion word. Then respond in a way that matches and supports their emotional state.`
      : "";

    const { signal, cancel } = withAbortController();
    let response;
    try {
      response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: system + memCtx + modeCtx + personalityCtx + sessionCtx + vectorCtx + memoryConfirmCtx + proactiveCtx + moodCheckInCtx +
              `\n\nAfter your reply, on a NEW LINE write exactly: MOOD:<one of: happy,neutral,sad,fear,disgust,surprise,anger,contentment,fatigue>`,
          },
          ...trimmedMessages,
        ],
        max_tokens: maxTokens,
        temperature: 0.85,
      }, { signal });
    } finally {
      cancel();
    }

    const raw = response.choices[0]?.message?.content || "Hey, I am here for you 💜";

    // Extract mood tag from end of response
    // Try bracket format [MOOD:x] first, then bare MOOD:x
    const moodMatch = raw.match(/\[MOOD:\s*(\w+)\s*\]/i)
                   || raw.match(/MOOD:(happy|neutral|sad|fear|disgust|surprise|anger|contentment|fatigue)/i);
    const validMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue"];
    let detectedMood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
    
    // Fallback: infer mood from reply text if tag missing or invalid
    if (!validMoods.includes(detectedMood)) {
      const r = raw.toLowerCase();
      if (/happy|excited|amazing|awesome|love that|thrilled|yay|wooo/i.test(r))         detectedMood = "happy";
      else if (/calm|peaceful|cozy|relax|serene|warm|gentle|at ease/i.test(r))          detectedMood = "contentment";
      else if (/sorry|tough|hard time|difficult|loss|grief|that sucks/i.test(r))         detectedMood = "sad";
      else if (/anxious|worried|nervous|scared|stress|overwhelm|panic/i.test(r))         detectedMood = "fear";
      else if (/frustrat|angry|mad|furious|rage|infuriat|pissed/i.test(r))              detectedMood = "anger";
      else if (/wow|whoa|no way|shocked|surprised|unbelievable|can't believe/i.test(r)) detectedMood = "surprise";
      else if (/disgust|gross|nasty|vile|repuls|eww|yuck/i.test(r))                     detectedMood = "disgust";
      else if (/tired|exhausted|sleepy|drained|burnt out|long day/i.test(r))             detectedMood = "fatigue";
      else detectedMood = "contentment";
    }
    const mood = validMoods.includes(detectedMood) ? detectedMood : "contentment";
    const reply = raw.replace(/\nMOOD:[^\n]*/i, "").trim();

    // Crisis detection
    const lower  = reply.toLowerCase() + " " + (messages[messages.length - 1]?.content || "").toLowerCase();
    const crisis = CRISIS_KEYWORDS.some(kw => lower.includes(kw));

    // ── Token usage & cost ───────────────────────────────────────────────────
    const usage = response.usage || {};
    const promptTokens     = usage.prompt_tokens     || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens      = usage.total_tokens      || 0;
    const costUsd          = estimateCost(model, promptTokens, completionTokens);

    res.status(200).json({
      reply,
      mood,
      crisis,
      _tier: model,
      // Token data — client should fire-and-forget to /api/trackTokens
      _usage: {
        prompt_tokens:      promptTokens,
        completion_tokens:  completionTokens,
        total_tokens:       totalTokens,
        cost_usd:           costUsd,
        model,
      },
    });

  } catch (err) {
    safeLogError(err, { ...ctx, tag: "chat" });
    if (err.name === "AbortError" || err.message?.includes("aborted") || err.message?.includes("timed out")) {
      return res.status(504).json({ error: "The AI took too long to respond. Please try again." });
    }
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}


