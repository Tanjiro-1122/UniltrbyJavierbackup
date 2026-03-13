import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    const { messages, systemPrompt } = await req.json();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 200,
      temperature: 0.85,
    }, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const reply = completion.choices[0].message.content;
    return Response.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});