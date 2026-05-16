/**
 * api/proactiveMessage.js
 *
 * Proactive companion check-in — called by the "Daily Companion Check-ins"
 * automation (runs every 6 hours via Base44 scheduler).
 *
 * What it does:
 *   1. Reads all active UserProfile records from Base44
 *   2. For each user who has been active in the last 48h (has a recent session)
 *      and hasn't received a check-in today, generates a personalised greeting
 *   3. Saves the message to the UserProfile.proactive_message field
 *   4. Marks the profile with today's check-in date so it only fires once/day
 *
 * The web app (HubPage / ChatPage) reads proactive_message on mount and shows
 * it as an incoming companion message if it hasn't been dismissed yet.
 */

import OpenAI from "openai";
import { B44_ENTITIES, b44Fetch } from "./_b44.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ── Helpers ──────────────────────────────────────────────────────────────────

function _toRecords(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.items)   return raw.items;
  if (raw?.records) return raw.records;
  return [];
}

async function getActiveProfiles(limit = 200) {
  try {
    const data = await b44Fetch(`${B44_ENTITIES}/UserProfile?limit=${limit}`);
    return _toRecords(data).filter(p => p.apple_user_id && p.onboarding_complete);
  } catch (e) {
    console.error("[proactiveMessage] getActiveProfiles failed:", e.message);
    return [];
  }
}

async function updateProfile(id, fields) {
  try {
    await b44Fetch(`${B44_ENTITIES}/UserProfile/${id}`, {
      method: "PUT",
      body: JSON.stringify(fields),
    });
  } catch (e) {
    console.warn("[proactiveMessage] updateProfile failed:", id, e.message);
  }
}

async function sendExpoPush(token, title, body, data = {}) {
  if (!token || !String(token).startsWith("ExponentPushToken")) {
    return { ok: false, error: "invalid_token" };
  }
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ to: token, title, body, data, sound: "default" }),
    });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "push_failed" };
  }
}

function shouldSendPush(profile) {
  return Boolean(
    profile?.push_token &&
    profile.push_enabled !== false &&
    profile.daily_checkins_enabled !== false
  );
}

// ── Message generation ────────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getUTCHours();
  // Convert UTC to approximate ET (UTC-4 in summer, UTC-5 in winter)
  const et = (h - 4 + 24) % 24;
  if (et < 5)  return "night";
  if (et < 12) return "morning";
  if (et < 17) return "afternoon";
  return "evening";
}

const COMPANION_VOICES = {
  luna:   "warm, gentle, caring — like a close friend who always checks in",
  kai:    "calm, grounded, steady — like a trusted confidant",
  nova:   "bright, upbeat, encouraging — like sunshine in text form",
  river:  "wise, peaceful, thoughtful — like someone who just gets it",
  sage:   "intellectual, curious, deep — loves to explore ideas",
  zara:   "playful, energetic, fun — always makes you smile",
  alex:   "direct, supportive, honest — no-nonsense but kind",
  morgan: "empathetic, nurturing, soft-spoken — never judges",
};

async function generateCheckIn({ name, companionId, companionName, facts, lastSummary, sessionCount }) {
  const voice = COMPANION_VOICES[companionId?.toLowerCase()] || "warm and caring";
  const timeOfDay = getTimeOfDay();

  const userContext = [
    name ? `The user's name is ${name}.` : "",
    facts?.goals?.length ? `Their goals: ${facts.goals.slice(0,2).join(", ")}.` : "",
    facts?.recurring_struggles?.length ? `They've been dealing with: ${facts.recurring_struggles[0]}.` : "",
    lastSummary ? `Your last conversation: "${lastSummary.slice(0, 120)}..."` : "",
    sessionCount > 0 ? `You've talked ${sessionCount} times before.` : "This is an early session.",
  ].filter(Boolean).join(" ");

  const prompt = `You are ${companionName || "a companion"} — ${voice}.
It's ${timeOfDay} and you're sending a short, warm check-in message to your person.
${userContext}

Write ONE short, natural, personal check-in message (1-2 sentences max).
Sound like a real friend texting — not a notification. No greetings like "Hey!" 
Make it feel like it comes from knowing them. No emojis at the start.
End with a gentle open question if it fits naturally.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 80,
    temperature: 0.85,
  });

  return res.choices[0]?.message?.content?.trim() || null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Accept both POST (from automation trigger) and GET (for manual testing)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = Date.now();
  console.log(`[proactiveMessage] Starting check-in run for ${TODAY}`);

  try {
    const profiles = await getActiveProfiles(200);
    console.log(`[proactiveMessage] Found ${profiles.length} active profiles`);

    let processed = 0;
    let pushed    = 0;
    let skipped   = 0;
    let errors    = 0;

    for (const profile of profiles) {
      try {
        // Skip if already sent a check-in today
        if (profile.last_checkin_date === TODAY) {
          skipped++;
          continue;
        }

        // Skip if user has no session history (never really used the app)
        const sessionCount = profile.session_count || 0;
        if (sessionCount < 1) {
          skipped++;
          continue;
        }

        // Parse stored facts and session summaries
        let facts = {};
        let sessions = [];
        try { facts = JSON.parse(profile.user_facts || "{}"); } catch {}
        try { sessions = JSON.parse(profile.session_summaries || "[]"); } catch {}

        const lastSummary = sessions[0]?.summary || null;

        const message = await generateCheckIn({
          name: profile.display_name || profile.full_name || null,
          companionId: profile.companion_id || "luna",
          companionName: profile.companion_name || "Luna",
          facts,
          lastSummary,
          sessionCount,
        });

        if (message) {
          const pushResult = shouldSendPush(profile)
            ? await sendExpoPush(
                profile.push_token,
                `${profile.companion_name || "Your companion"} is checking in`,
                message,
                { screen: "chat", type: "daily_checkin", date: TODAY }
              )
            : null;

          await updateProfile(profile.id, {
            proactive_message: message,
            proactive_message_date: TODAY,
            proactive_message_seen: false,
            last_checkin_date: TODAY,
          });
          if (pushResult?.ok) pushed++;
          processed++;
        }

        // Gentle rate limiting — avoid hammering OpenAI
        await new Promise(r => setTimeout(r, 200));

      } catch (profileErr) {
        console.warn(`[proactiveMessage] Error for profile ${profile.id}:`, profileErr.message);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[proactiveMessage] Done — processed:${processed} pushed:${pushed} skipped:${skipped} errors:${errors} (${duration}ms)`);

    return res.status(200).json({
      ok: true,
      date: TODAY,
      processed,
      pushed,
      skipped,
      errors,
      duration_ms: duration,
    });

  } catch (err) {
    console.error("[proactiveMessage] Fatal error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
