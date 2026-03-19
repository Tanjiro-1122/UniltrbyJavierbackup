import OpenAI from 'npm:openai';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    // Clone the request before consuming the body, so SDK and our code can both read it
    const base44 = createClientFromRequest(req.clone());
    
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (authErr) {
      console.error("Auth check failed:", authErr.message);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, systemPrompt, isPremium, sessionMemory, memorySummary, imageBase64 } = await req.json();

    // Build memory block (premium gets session_memory array, free gets condensed summary)
    let memoryBlock = "";
    if (isPremium && sessionMemory && sessionMemory.length > 0) {
      const recent = sessionMemory.slice(-5);
      memoryBlock = `\n\n=== YOUR MEMORY OF THIS USER ===\nYou remember these things about them from past conversations. Reference them naturally — don't dump them all at once, just let them inform how you talk to this person:\n${recent.map(s => `• [${s.date}] ${s.summary}`).join("\n")}\n=== END MEMORY ===\n`;
    } else if (memorySummary) {
      memoryBlock = `\n\n=== YOUR MEMORY OF THIS USER ===\nFrom your last conversation: ${memorySummary}\n=== END MEMORY ===\n`;
    }

    const moodInstruction = `

CRITICAL INSTRUCTION - MOOD TAG:
You MUST end EVERY single response with a mood tag on its own line.
Format: [MOOD:value]
Allowed values: happy, neutral, sad, fear, disgust, surprise, anger, contentment, fatigue
Example: If the user is scared, end with [MOOD:fear]
Example: If the user is happy, end with [MOOD:happy]
NEVER skip this tag. It must always be the very last line.`;

    // Build messages array
    const chatMessages = [
      { role: "system", content: systemPrompt + memoryBlock + moodInstruction },
    ];

    // Add conversation history (all but last message)
    for (let i = 0; i < messages.length - 1; i++) {
      chatMessages.push({ role: messages[i].role, content: messages[i].content });
    }

    // Last message — may include an image
    const lastMsg = messages[messages.length - 1];
    if (imageBase64 && lastMsg) {
      chatMessages.push({
        role: lastMsg.role,
        content: [
          { type: "text", text: lastMsg.content || "What do you think of this?" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
        ],
      });
    } else if (lastMsg) {
      chatMessages.push({ role: lastMsg.role, content: lastMsg.content });
    }

    const model = "gpt-4o-mini";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const completion = await openai.chat.completions.create({
      model,
      messages: chatMessages,
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
    const reply = raw.replace(/\[MOOD:\s*\w+\s*\]/gi, "").replace(/\(MOOD:\s*\w+\)/gi, "").replace(/MOOD:\s*\w+/gi, "").trim();

    console.log("[Chat] user:", user.email, "mood:", detectedMood, "→", mood);

    return Response.json({ reply, mood });
  } catch (error) {
    console.error('Chat function error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});