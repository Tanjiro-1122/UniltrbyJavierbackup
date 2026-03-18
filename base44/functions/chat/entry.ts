import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    const cloned = req.clone();
    const { messages, systemPrompt, isPremium, sessionMemory } = await cloned.json();

    // Build memory block (premium only)
    let memoryBlock = "";
    if (isPremium && sessionMemory && sessionMemory.length > 0) {
      const recent = sessionMemory.slice(-5);
      memoryBlock = `\n\n=== YOUR MEMORY OF THIS USER ===\nYou remember these things about them from past conversations. Reference them naturally — don't dump them all at once, just let them inform how you talk to this person:\n${recent.map(s => `• [${s.date}] ${s.summary}`).join("\n")}\n=== END MEMORY ===\n`;
    }

    const moodInstruction = `

CRITICAL INSTRUCTION - MOOD TAG:
You MUST end EVERY single response with a mood tag on its own line.
Format: [MOOD:value]
Allowed values: happy, neutral, sad, fear, disgust, surprise, anger, contentment, fatigue
Example: If the user is scared, end with [MOOD:fear]
Example: If the user is happy, end with [MOOD:happy]
NEVER skip this tag. It must always be the very last line.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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

    // Try multiple patterns to catch mood tag reliably
    const moodMatch = raw.match(/\[MOOD:\s*(\w+)\s*\]/i) 
      || raw.match(/MOOD:\s*(\w+)/i)
      || raw.match(/\(MOOD:\s*(\w+)\)/i);
    const validMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue"];
    const detectedMood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
    const mood = validMoods.includes(detectedMood) ? detectedMood : "neutral";
    const reply = raw.replace(/\[MOOD:\s*\w+\s*\]/gi, "").replace(/\(MOOD:\s*\w+\)/gi, "").trim();

    return Response.json({ reply, mood });
  } catch (error) {
    console.error('Chat function error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});