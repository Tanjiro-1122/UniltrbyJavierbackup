import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const VOICE_MAP = {
  luna:   "nova",
  kai:    "onyx",
  nova:   "shimmer",
  ash:    "echo",
  river:  "alloy",
  sakura: "nova",
  ryuu:   "onyx",
  sage:   "fable",
  zara:   "shimmer",
};

Deno.serve(async (req) => {
  try {
    const { text, companionId } = await req.json();
    const voice = VOICE_MAP[companionId] || "nova";

    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice,
      input: text.slice(0, 500),
    });

    const buffer = await mp3.arrayBuffer();
    // Return base64 encoded audio so it can be decoded on the frontend
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return Response.json({ audio: base64 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});