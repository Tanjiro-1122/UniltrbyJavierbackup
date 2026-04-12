import OpenAI from 'npm:openai';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { messages, profileId, companionName, isPremium, tier } = await req.json();

    if (!messages || !profileId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Skip summarization for very short conversations
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length < 3) {
      return Response.json({ ok: true, skipped: true });
    }

    // Summarize the session
    const transcript = messages.map(m => `${m.role === "user" ? "User" : companionName}: ${m.content}`).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are summarizing a conversation between a user and their AI companion named ${companionName}. 
Extract key facts about the user: their mood, what they talked about, personal details they shared, problems they mentioned. 
Write a concise 1–2 sentence summary in third person about the user (e.g. "The user was feeling anxious about a job interview and mentioned they have a dog named Max.").
Be specific and personal — this will be used as memory for the companion in future conversations.`
        },
        { role: "user", content: transcript }
      ],
      max_tokens: 120,
      temperature: 0.5,
    });

    const summary = completion.choices[0].message.content.trim();
    const date = new Date().toISOString().split("T")[0];

    // Load current profile
    const profile = await base44.asServiceRole.entities.UserProfile.get(profileId);

    // Tier-aware memory depth: free=0 (summary only), plus=10, pro=30, annual/family=60
    const resolvedTier = tier || (isPremium ? "plus" : "free");
    const SESSION_DEPTH = { free: 0, plus: 10, pro: 30, annual: 60, family: 60 };
    const depth = SESSION_DEPTH[resolvedTier] ?? 0;

    if (depth > 0) {
      const existing = profile?.session_memory || [];
      const updated = [...existing, { date, summary }].slice(-depth);
      await base44.asServiceRole.entities.UserProfile.update(profileId, {
        session_memory: updated,
        memory_summary: summary,
      });
    } else {
      // Free: only store latest condensed summary (lightweight memory)
      await base44.asServiceRole.entities.UserProfile.update(profileId, {
        memory_summary: summary,
      });
    }

    return Response.json({ ok: true, summary });
  } catch (error) {
    console.error("summarizeSession error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});