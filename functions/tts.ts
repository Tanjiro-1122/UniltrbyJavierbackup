import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

// OpenAI TTS voices: alloy | echo | fable | onyx | nova | shimmer
// Assigned per companion personality & gender
const VOICE_MAP = {
  luna:   "nova",     // warm, soft female
  kai:    "onyx",     // bold, deep male
  nova:   "shimmer",  // bright, energetic female
  river:  "fable",    // calm, gentle neutral
  ash:    "echo",     // cool, steady male
  sakura: "shimmer",  // light, cheerful female
  ryuu:   "onyx",     // intense, serious male
  sage:   "nova",     // wise, warm neutral
  zara:   "alloy",    // confident, sharp female
  silk:   "nova",     // smooth, sultry female
  mike:   "echo",     // casual, chill male
};

Deno.serve(async (req) => {
  try {
    const { text, companionId } = await req.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    // Normalize companionId to lowercase for lookup
    const id = (companionId || "").toLowerCase();
    const voice = VOICE_MAP[id] || "nova";

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",      // fastest model
      voice,
      input: text.slice(0, 400),  // shorter = faster
      speed: 1.05,         // slightly faster speech, feels snappier
    });

    const buffer = await mp3.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return Response.json({ audio: base64 });
  } catch (error) {
    console.error("TTS error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});