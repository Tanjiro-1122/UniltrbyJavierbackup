import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICE_MAP = {
  female: { chill: "nova", hype: "shimmer", deep: "alloy", vent: "nova", journal: "nova" },
  male:   { chill: "echo", hype: "onyx",    deep: "fable", vent: "echo", journal: "fable" },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text, voiceGender = "female", voicePersonality = "chill" } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const gender = voiceGender?.toLowerCase() === "male" ? "male" : "female";
    const voice = VOICE_MAP[gender][voicePersonality] || VOICE_MAP[gender].chill;

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text.slice(0, 4096),
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString("base64");

    res.status(200).json({ data: { audio: base64, voice } });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: err.message });
  }
}
