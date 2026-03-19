import OpenAI from 'npm:openai';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    // Auth is handled by the SDK on the frontend — base44.functions.invoke() 
    // already requires a logged-in user. We skip server-side auth.me() check 
    // because it has been causing false 401s on mobile apps.
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

=== MANDATORY MOOD TAG (DO NOT SKIP) ===
At the END of every response, you MUST include a mood tag reflecting the EMOTIONAL TONE of the conversation.
Format: [MOOD:value]
Allowed values ONLY: happy, neutral, sad, fear, disgust, surprise, anger, contentment, fatigue
- If the conversation is fun/playful/excited → [MOOD:happy]
- If the user is sad/down/upset → [MOOD:sad]
- If the user is anxious/scared → [MOOD:fear]
- If calm/peaceful/relaxed → [MOOD:contentment]
- If the user is tired/exhausted → [MOOD:fatigue]
- If the user is frustrated/mad → [MOOD:anger]
- If something shocking/unexpected → [MOOD:surprise]
- Default to [MOOD:contentment] for normal positive chat, NOT neutral
- Only use [MOOD:neutral] if the conversation is truly flat/emotionless
DO NOT default to neutral. Read the emotional context carefully. This tag MUST be the last line.
=== END MOOD INSTRUCTIONS ===`;

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
    let detectedMood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
    
    // If the AI defaulted to neutral, infer mood from reply content
    if (detectedMood === "neutral" || !validMoods.includes(detectedMood)) {
      const reply_lower = raw.toLowerCase();
      if (/🔥|🎉|!!|let'?s go|hype|amazing|awesome|excited|wooo|yay|hell yeah/i.test(reply_lower)) detectedMood = "happy";
      else if (/😌|chill|relax|peaceful|calm|cozy|nice|glad|good vibes|warm/i.test(reply_lower)) detectedMood = "contentment";
      else if (/😢|sorry to hear|that's tough|hard time|difficult|loss|grief|miss/i.test(reply_lower)) detectedMood = "sad";
      else if (/😰|anxious|worried|nervous|scared|stress|overwhelm/i.test(reply_lower)) detectedMood = "fear";
      else if (/😡|frustrat|angry|mad|annoying|ugh/i.test(reply_lower)) detectedMood = "anger";
      else if (/😮|wow|whoa|no way|really\?|surprised|unexpected/i.test(reply_lower)) detectedMood = "surprise";
      else if (/tired|exhausted|sleepy|drained|burnt out|long day/i.test(reply_lower)) detectedMood = "fatigue";
      else if (/😊|💜|❤️|love|sweet|appreciate|grateful|thankful|happy|glad|great/i.test(reply_lower)) detectedMood = "happy";
      else detectedMood = "contentment"; // Default to contentment instead of neutral
    }
    
    const mood = validMoods.includes(detectedMood) ? detectedMood : "contentment";
    const reply = raw.replace(/\[MOOD:\s*\w+\s*\]/gi, "").replace(/\(MOOD:\s*\w+\)/gi, "").replace(/MOOD:\s*\w+/gi, "").trim();

    console.log("[Chat] raw mood tag:", moodMatch?.[1], "→ final:", mood);

    return Response.json({ reply, mood });
  } catch (error) {
    console.error('Chat function error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});