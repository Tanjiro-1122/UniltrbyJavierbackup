import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

// OpenAI TTS voices: alloy | echo | fable | onyx | nova | shimmer
// Fallback mapping by gender
const VOICE_BY_GENDER = {
  male:    ["onyx", "echo", "alloy"],
  female:  ["nova", "shimmer"],
  neutral: ["fable"],
};

Deno.serve(async (req) => {
  try {
    const { text, companionId, voiceGender } = await req.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    // Select voice based on gender preference (voiceGender from Companion entity)
    const gender = voiceGender || "female";
    const voiceList = VOICE_BY_GENDER[gender] || VOICE_BY_GENDER.female;
    const voice = voiceList[0];

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text.slice(0, 400),
      speed: 1.1,  // Slightly faster for snappier feel
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