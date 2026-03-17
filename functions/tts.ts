import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

// OpenAI TTS voices: alloy | echo | fable | onyx | nova | shimmer
const VOICE_BY_GENDER = {
  male:    ["onyx", "echo", "alloy"],
  female:  ["nova", "shimmer"],
  neutral: ["fable"],
};

// Voice personality → speed + voice selection tweaks
const PERSONALITY_CONFIG = {
  cheerful:     { speed: 1.15, voicePreference: { female: "shimmer", male: "alloy",  neutral: "fable" } },
  calm:         { speed: 0.95, voicePreference: { female: "nova",    male: "onyx",   neutral: "fable" } },
  energetic:    { speed: 1.25, voicePreference: { female: "shimmer", male: "echo",   neutral: "alloy" } },
  professional: { speed: 1.0,  voicePreference: { female: "nova",    male: "onyx",   neutral: "fable" } },
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

    // Use personality-specific voice if available, otherwise fall back to gender default
    const voice = config.voicePreference?.[gender] || (VOICE_BY_GENDER[gender] || VOICE_BY_GENDER.female)[0];

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