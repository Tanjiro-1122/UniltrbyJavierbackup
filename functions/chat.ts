import OpenAI from 'npm:openai';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    const cloned = req.clone();
    const base44 = createClientFromRequest(req);
    const { messages, systemPrompt, isPremium, sessionMemory } = await cloned.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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

    return Response.json({ reply, mood });
  } catch (error) {
    console.error('Chat error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});