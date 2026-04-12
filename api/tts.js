import OpenAI from "openai";
import { createRequestContext, safeLogError, withAbortController, checkRateLimit } from "./_helpers.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICE_MAP = {
  female: { chill: "nova", hype: "shimmer", deep: "alloy", vent: "nova", journal: "nova" },
  male:   { chill: "echo", hype: "onyx",    deep: "fable", vent: "echo", journal: "fable" },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ctx = createRequestContext(req);
  res.setHeader("X-Request-Id", ctx.requestId);

  // ── Rate limit ───────────────────────────────────────────────────────────
  const rl = checkRateLimit(ctx.userId, ctx.clientIp);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.retryAfterSeconds}s and try again.`,
    });
  }

  try {
    const { text, voiceGender = "female", voicePersonality = "chill" } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const gender = voiceGender?.toLowerCase() === "male" ? "male" : "female";
    const voice = VOICE_MAP[gender][voicePersonality];
    if (!voice) {
      console.warn(`[tts] Unknown voicePersonality "${voicePersonality}" — falling back to "chill"`);
    }
    const resolvedVoice = voice || VOICE_MAP[gender].chill;

    const { signal, cancel } = withAbortController();
    let mp3;
    try {
      mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: resolvedVoice,
        input: text.slice(0, 4096),
      }, { signal });
    } finally {
      cancel();
    }

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString("base64");

    res.status(200).json({ data: { audio: base64, voice: resolvedVoice } });
  } catch (err) {
    safeLogError(err, { ...ctx, tag: "tts" });
    if (err.name === "AbortError" || err.message?.includes("aborted") || err.message?.includes("timed out")) {
      return res.status(504).json({ error: "TTS request timed out. Please try again." });
    }
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
