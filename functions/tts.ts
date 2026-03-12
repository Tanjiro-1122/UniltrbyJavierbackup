import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const VOICE_MAP = {
  luna: "nova",
  kai: "onyx",
  nova: "shimmer",
  ash: "echo",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, companionId } = await req.json();
    const voice = VOICE_MAP[companionId] || "nova";

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text.slice(0, 500),
    });

    const buffer = await mp3.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});