import OpenAI from "openai";
import { createRequestContext, safeLogError, withAbortController, checkRateLimit, getProfileTier, getProfileTierByAppleId } from "./_helpers.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICE_MAP = {
  female: {
    // Vibe-based keys (legacy / ChatPage vibe selector)
    chill: "nova", hype: "shimmer", deep: "alloy", vent: "nova", journal: "nova",
    // Style-based keys (ChatCustomizePanel Voice tab)
    // Using distinct voices per style so each personality sounds different:
    //   shimmer = bright/cheerful, nova = warm/upbeat, alloy = neutral/professional, echo = balanced
    cheerful: "shimmer", calm: "nova", energetic: "nova", professional: "alloy",
  },
  male: {
    chill: "echo", hype: "onyx", deep: "fable", vent: "echo", journal: "fable",
    cheerful: "onyx", calm: "fable", energetic: "echo", professional: "echo",
  },
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
    const { text, voiceGender = "female", voicePersonality = "chill", profileId, appleUserId } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // ── Server-side tier verification ────────────────────────────────────────
    // TTS uses OpenAI's paid API — gate it behind at least plus/premium tier so
    // free users cannot consume TTS quota. profileId is the primary lookup key;
    // appleUserId is accepted as a fallback for users whose profileId was lost
    // (e.g. localStorage partially cleared) but who still have Apple Sign-In.
    // Note: both identifiers are supplied by the client — this matches the existing
    // auth model across all API endpoints (no server-side session tokens). The check
    // prevents accidental free-tier access; it relies on the same trust boundary
    // as the rest of the API layer (e.g., chat.js, memoryEmbed.js).
    let tierResult = await getProfileTier(profileId);

    // If profileId lookup failed or profileId is absent, try appleUserId as fallback
    if ((!tierResult.isPremium && !tierResult.isPro && !tierResult.isAnnual) && appleUserId && appleUserId !== profileId) {
      const fallback = await getProfileTierByAppleId(appleUserId);
      if (fallback.isPremium || fallback.isPro || fallback.isAnnual) {
        tierResult = fallback;
      }
    }

    const { isPremium, isPro, isAnnual, fetchFailed } = tierResult;
    // Block only when the tier is definitively verified as free. If the profile
    // lookup failed (e.g., Base44 temporarily unavailable) and a profileId was
    // provided, give the benefit of the doubt so registered premium users are
    // not silently blocked during outages.
    const isDefinitelyFree = !isPremium && !isPro && !isAnnual && !(fetchFailed && (profileId || appleUserId));
    if (isDefinitelyFree) {
      return res.status(403).json({ error: "Voice playback requires a premium subscription." });
    }

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
