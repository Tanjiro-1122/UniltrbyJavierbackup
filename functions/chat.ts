import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, systemPrompt, stream } = await req.json();

    if (stream) {
      const encoder = new TextEncoder();
      const readable = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 200,
        temperature: 0.9,
        stream: true,
      });

      const body = new ReadableStream({
        async start(controller) {
          for await (const chunk of readable) {
            const content = chunk.choices[0].delta.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        },
      });

      return new Response(body, {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 200,
        temperature: 0.9,
      });

      const reply = completion.choices[0].message.content;
      return Response.json({ reply });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});