import OpenAI from 'npm:openai';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, systemPrompt, isPremium, sessionMemory, userProfileId, companionId } = await req.json();

    // Build memory block (premium only)
    let memoryBlock = "";
    if (isPremium && sessionMemory && sessionMemory.length > 0) {
      const recent = sessionMemory.slice(-5);
      memoryBlock = `\n\n=== YOUR MEMORY OF THIS USER ===\nYou remember these things about them from past conversations. Reference them naturally — don't dump them all at once, just let them inform how you talk to this person:\n${recent.map(s => `• [${s.date}] ${s.summary}`).join("\n")}\n=== END MEMORY ===\n`;
    }

    const moodInstruction = `

At the very end of EVERY response, on its own line, append exactly one mood tag 
in this format: [MOOD:happy]
Choose the mood that best fits your response from this list ONLY:
happy, neutral, sad, fear, disgust, surprise, anger, contentment, fatigue
Do not explain the mood. Do not skip it. Always include it as the last line.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt + memoryBlock + moodInstruction },
        ...messages,
      ],
      max_tokens: 220,
      temperature: 0.85,
    }, { signal: controller.signal });

    clearTimeout(timeoutId);
    const raw = completion.choices[0].message.content;

    const moodMatch = raw.match(/\[MOOD:(\w+)\]/i);
    const mood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
    const reply = raw.replace(/\[MOOD:\w+\]/i, "").trim();

    // Persist user message and assistant reply to DB
    if (userProfileId && companionId) {
      const lastUserMsg = messages[messages.length - 1];
      try {
        await Promise.all([
          base44.asServiceRole.entities.Message.create({
            user_profile_id: userProfileId,
            companion_id: companionId,
            role: "user",
            content: lastUserMsg?.content || "",
            emotional_tone: "neutral",
          }),
          base44.asServiceRole.entities.Message.create({
            user_profile_id: userProfileId,
            companion_id: companionId,
            role: "assistant",
            content: reply,
            emotional_tone: mood === "happy" ? "happy" : mood === "sad" ? "sad" : mood === "anger" ? "angry" : mood === "fear" ? "anxious" : "neutral",
          }),
        ]);
        // Update message count
        if (userProfileId) {
          try {
            const profile = await base44.asServiceRole.entities.UserProfile.get(userProfileId);
            await base44.asServiceRole.entities.UserProfile.update(userProfileId, {
              message_count: (profile?.message_count || 0) + 1,
            });
          } catch { /* non-blocking */ }
        }
      } catch (e) {
        console.error("Message save error:", e.message);
      }
    }

    return Response.json({ reply, mood });
  } catch (error) {
    console.error('Chat error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});