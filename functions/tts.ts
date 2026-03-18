import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

// OpenAI TTS voices: alloy | echo | fable | onyx | nova | shimmer
const VOICE_BY_GENDER = {
  male:    ["onyx", "echo", "alloy"],
  female:  ["nova", "shimmer"],
  neutral: ["fable"],
};

// Voice personality → speed + voice variant adjustments
const PERSONALITY_CONFIG = {
  cheerful:     { speed: 1.15, voiceIndex: 0 },
  calm:         { speed: 0.95, voiceIndex: 0 },
  energetic:    { speed: 1.25, voiceIndex: 1 },
  professional: { speed: 1.0,  voiceIndex: 0 },
};

Deno.serve(async (req) => {
  try {
    const { text, companionId, voiceGender, voicePersonality } = await req.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    const gender = voiceGender || "female";
    const personality = voicePersonality || "cheerful";
    const config = PERSONALITY_CONFIG[personality] || PERSONALITY_CONFIG.cheerful;

    const voiceList = VOICE_BY_GENDER[gender] || VOICE_BY_GENDER.female;
    const voice = voiceList[Math.min(config.voiceIndex, voiceList.length - 1)];

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text.slice(0, 400),
      speed: config.speed,
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