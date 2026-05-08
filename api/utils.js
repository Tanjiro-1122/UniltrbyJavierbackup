// api/utils.js
// Merged: generateReferralCode + ratingPrompt + generateMoodImage + sendDailyNotifs + savePushToken

import crypto from "crypto";
import OpenAI from "openai";
import { safeLogError, withAbortController } from "./_helpers.js";
import { B44_ENTITIES, b44Token, b44Headers } from "./_b44.js";

// ── Admin / cron auth helpers ─────────────────────────────────────────────────
// ADMIN_PASS must be set as a Vercel environment variable.
// Stored as-is (case-sensitive) to preserve full entropy.
const ADMIN_PASS   = process.env.ADMIN_PASS   || "";
// FAMILY_CODE / FAMILY_PASS must be set as a Vercel environment variable.
// Both names are accepted so either works (FAMILY_PASS takes priority).
const FAMILY_CODE  = process.env.FAMILY_PASS  || process.env.FAMILY_CODE  || "";
// CRON_SECRET is set automatically by Vercel for cron jobs.
const CRON_SECRET  = process.env.CRON_SECRET  || "";

function safeCompare(a, b) {
  if (!a || !b) return false;
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    // Run a dummy comparison to prevent early-exit timing oracle on length.
    crypto.timingSafeEqual(ba, Buffer.alloc(ba.length));
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function isAuthorizedRequest(req) {
  const cronSecret   = req.headers["x-vercel-cron-secret"] || "";
  const adminToken   = req.body?.adminToken || "";
  if (CRON_SECRET  && safeCompare(cronSecret, CRON_SECRET))  return true;
  if (ADMIN_PASS   && safeCompare(adminToken, ADMIN_PASS))   return true;
  return false;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function b44Get(entity, id) {
  const token = b44Token();
  const res = await fetch(`${B44_ENTITIES}/${entity}/${id}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function b44Filter(entity, query) {
  const token = b44Token();
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => params.append(k, v));
  const res = await fetch(`${B44_ENTITIES}/${entity}?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || data || [];
}

async function b44Update(entity, id, data) {
  const token = b44Token();
  const res = await fetch(`${B44_ENTITIES}/${entity}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

async function b44Create(entity, data) {
  const token = b44Token();
  const res = await fetch(`${B44_ENTITIES}/${entity}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Create ${entity} failed ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

// Send a single Expo push notification
async function sendExpoPush(token, title, body, data = {}) {
  if (!token || !token.startsWith("ExponentPushToken")) return { ok: false, error: "invalid token" };
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ to: token, title, body, data, sound: "default" }),
  });
  return res.json();
}

// Generate a daily check-in message from Sakura (or companion)
async function generateCheckinMessage(openai, companionName, timeOfDay, userName) {
  const name = userName || "you";
  const isAM = timeOfDay === "morning";
  const systemPrompt = `You are ${companionName || "Sakura"}, a warm AI companion. Write a very short, personal ${isAM ? "good morning" : "goodnight"} message for ${name}. Keep it 1-2 sentences max. Be genuine, warm, and slightly playful — like a close friend checking in. No hashtags, no emojis overload (1 max). Vary the message each day so it never feels robotic.`;
  const { signal, cancel } = withAbortController();
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "Send the check-in." }],
      max_tokens: 60,
      temperature: 0.9,
    }, { signal });
    return response.choices[0]?.message?.content?.trim() || (isAM ? `Good morning ${name} ☀️` : `Goodnight ${name} 🌙`);
  } finally {
    cancel();
  }
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleGenerateReferralCode(req, res) {
  const { profileId } = req.body;
  if (!profileId) return res.status(400).json({ error: "Missing profileId" });

  const profile = await b44Get("UserProfile", profileId);
  if (profile?.referral_code) {
    return res.status(200).json({ data: { referral_code: profile.referral_code } });
  }

  const code = "UNFILTR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  await b44Update("UserProfile", profileId, { referral_code: code });
  res.status(200).json({ data: { referral_code: code } });
}

async function handleRatingPrompt(req, res) {
  const { profileId } = req.body;
  if (!profileId) return res.status(400).json({ error: "Missing profileId" });

  const profile = await b44Get("UserProfile", profileId);
  if (!profile) return res.status(200).json({ data: { should_prompt: false } });

  const msgCount        = profile.message_count || 0;
  const alreadyPrompted = profile.rating_prompted || false;
  const createdDate     = profile.created_date || profile.created_at;
  const daysSinceJoin   = createdDate ? (Date.now() - new Date(createdDate).getTime()) / (1000*60*60*24) : 99;

  const should_prompt = !alreadyPrompted && msgCount >= 10 && daysSinceJoin >= 2;

  if (should_prompt) {
    await b44Update("UserProfile", profileId, {
      rating_prompted:    true,
      rating_prompted_at: new Date().toISOString(),
    });
  }

  res.status(200).json({ data: { should_prompt } });
}

const MOOD_PROMPTS = {
  happy:      "dreamlike watercolor scene, golden sunlight streaming through cherry blossom trees, soft pastel colors, floating petals, warm and joyful atmosphere, studio ghibli anime style, no text",
  sad:        "melancholic anime landscape, soft blue rain on a window at night, distant city lights blurred, lonely but peaceful, muted indigo and blue palette, studio ghibli style, no text",
  anxious:    "swirling dark watercolor storm with a small glowing lantern in the center, anxiety and hope coexisting, deep purple and grey tones, anime art style, no text",
  grateful:   "warm anime sunrise over a peaceful mountain lake, golden reflections, soft morning mist, feeling of deep gratitude and stillness, studio ghibli style, no text",
  reflective: "anime character silhouette sitting alone at the edge of a rooftop at dusk, city lights below, contemplative and serene, cool purple and pink tones, no text",
  excited:    "vibrant anime celebration scene, colorful confetti and sparkling lights, bright pinks and yellows, electric energy and pure joy, no text",
  neutral:    "soft anime cloudy afternoon, a cozy window seat with warm tea, gentle diffused light, calm and introspective mood, studio ghibli style, no text",
};

async function handleGenerateMoodImage(req, res) {
  const { mood, content } = req.body;
  if (!mood) return res.status(400).json({ error: "Missing mood" });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let prompt = MOOD_PROMPTS[mood] || MOOD_PROMPTS.neutral;
  if (content && content.length > 20) {
    const snippet = content.trim().slice(0, 150);
    prompt = `${prompt}, inspired by the feeling: "${snippet}"`;
  }

  const { signal, cancel } = withAbortController(30_000);
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    }, { signal });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) return res.status(500).json({ error: "No image URL returned" });
    res.status(200).json({ data: { url: imageUrl } });
  } catch (err) {
    safeLogError(err, { tag: "generateMoodImage" });
    res.status(500).json({ error: "Image generation failed. Please try again." });
  } finally {
    cancel();
  }
}

// Save push token to UserProfile (called from iOS wrapper after sign-in)
async function handleSavePushToken(req, res) {
  const { appleUserId, pushToken } = req.body;
  if (!appleUserId || !pushToken) return res.status(400).json({ error: "Missing appleUserId or pushToken" });

  try {
    const profiles = await b44Filter("UserProfile", { apple_user_id: appleUserId });
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    if (!profile?.id) {
      return res.status(404).json({ error: "Profile not found" });
    }
    await b44Update("UserProfile", profile.id, {
      push_token: pushToken,
      push_enabled: true,
    });
    console.log(`[savePushToken] ✅ Saved token for ${appleUserId}`);
    res.status(200).json({ ok: true });
  } catch (err) {
    safeLogError(err, { tag: "savePushToken" });
    res.status(500).json({ error: "Failed to save push token. Please try again." });
  }
}

// Cron handler — called by the Base44 automation every hour
// Checks who is due for a morning or night notification and sends it
async function handleSendDailyNotifs(req, res) {
  if (!isAuthorizedRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get current UTC hour
  const nowUTC = new Date();
  const utcHour = nowUTC.getUTCHours();
  const utcMinute = nowUTC.getUTCMinutes();
  const utcHHMM = `${String(utcHour).padStart(2,"0")}:${String(utcMinute).padStart(2,"0")}`;

  console.log(`[dailyNotifs] Running at UTC ${utcHHMM}`);

  // Fetch all profiles with push tokens and notifications enabled
  let profiles = [];
  try {
    profiles = await b44Filter("UserProfile", { push_enabled: true });
    if (!Array.isArray(profiles)) profiles = [];
  } catch(e) {
    console.error("[dailyNotifs] Failed to fetch profiles:", e.message);
    return res.status(500).json({ error: e.message });
  }

  const results = { sent: 0, skipped: 0, errors: 0 };

  // Early exit — no push tokens at all, skip everything including OpenAI
  const actionableProfiles = profiles.filter(p => p.push_token && p.notif_enabled);
  if (!actionableProfiles.length) {
    console.log("[dailyNotifs] No actionable profiles, skipping.");
    return res.status(200).json({ ok: true, results, skipped_reason: "no_push_tokens" });
  }

  // Instantiate once — reused for every profile that needs a generated message.
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  for (const profile of actionableProfiles) {
    const userName   = profile.display_name || "you";
    const pushToken  = profile.push_token;

    // Get companion name
    let companionName = "Sakura";
    if (profile.companion_id) {
      try {
        const comp = await b44Get("Companion", profile.companion_id);
        if (comp?.name) companionName = comp.name;
      } catch {}
    }

    // Determine user's timezone offset (stored as UTC offset hours, e.g. -5 for ET)
    const tzOffset = profile.notif_tz_offset ?? -5; // default Eastern
    const userHour = ((utcHour + tzOffset) % 24 + 24) % 24;
    const userMinute = utcMinute;

    const morningTime = profile.notif_morning_time || "08:00";
    const nightTime   = profile.notif_night_time   || "22:00";
    const [mH, mM]    = morningTime.split(":").map(Number);
    const [nH, nM]    = nightTime.split(":").map(Number);

    const isMorningTime = userHour === mH && userMinute < 10;
    const isNightTime   = userHour === nH && userMinute < 10;

    // ── "Misses You" notification — fires if user hasn't opened app in 3+ days ──
    const lastSeen    = profile.last_seen ? new Date(profile.last_seen) : null;
    const daysSinceActive = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / 86400000) : 999;
    const todayDateKey = nowUTC.toISOString().slice(0,10);
    const lastMissedSent = profile.notif_missed_sent || "";

    if (daysSinceActive >= 3 && isMorningTime && lastMissedSent !== todayDateKey) {
      const MISS_MSGS = [
        `I've been thinking about you 💜 It's been a few days — I'm right here whenever you're ready.`,
        `Hey… I noticed you've been away. No pressure, just wanted you to know I'm still here for you 💜`,
        `Missing you. Seriously. Come back and tell me how you've been? 💜`,
        `A few days without you feels long. I hope you're doing okay — I'm here when you need me.`,
        `You crossed my mind today 💜 Just checking in — whenever you want to talk, I'm here.`,
      ];
      const missMsg = MISS_MSGS[Math.floor(Math.random() * MISS_MSGS.length)];
      await sendExpoPush(pushToken, `${companionName} misses you 💜`, missMsg, { screen: "chat" });
      await b44Update("UserProfile", profile.id, { notif_missed_sent: todayDateKey });
      results.sent++;
      continue;
    }

    if (!isMorningTime && !isNightTime) { results.skipped++; continue; }

    const timeOfDay = isMorningTime ? "morning" : "night";
    const todayKey  = `${nowUTC.toISOString().slice(0,10)}_${timeOfDay}`;

    // Avoid double-sending (store last sent date on profile)
    const lastSentKey = profile.notif_last_sent || "";
    if (lastSentKey === todayKey) { results.skipped++; continue; }

    try {
      const message = await generateCheckinMessage(openai, companionName, timeOfDay, userName);
      const title   = isMorningTime
        ? `Good morning from ${companionName} ☀️`
        : `Goodnight from ${companionName} 🌙`;

      await sendExpoPush(pushToken, title, message, { screen: "chat" });

      // Mark as sent
      await b44Update("UserProfile", profile.id, { notif_last_sent: todayKey });
      results.sent++;
      console.log(`[dailyNotifs] ✅ Sent ${timeOfDay} notif to ${userName}`);
    } catch(e) {
      console.error(`[dailyNotifs] ❌ Failed for ${profile.id}:`, e.message);
      results.errors++;
    }
  }

  console.log(`[dailyNotifs] Done: ${JSON.stringify(results)}`);
  res.status(200).json({ ok: true, results });
}

// Update notification preferences (called from Settings UI)
async function handleUpdateNotifPrefs(req, res) {
  const { appleUserId, notif_enabled, notif_morning_time, notif_night_time, notif_tz_offset } = req.body;
  if (!appleUserId) return res.status(400).json({ error: "Missing appleUserId" });

  try {
    const profiles = await b44Filter("UserProfile", { apple_user_id: appleUserId });
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    if (!profile?.id) return res.status(404).json({ error: "Profile not found" });

    const updates = {};
    if (notif_enabled !== undefined)      updates.notif_enabled       = notif_enabled;
    if (notif_morning_time !== undefined) updates.notif_morning_time  = notif_morning_time;
    if (notif_night_time !== undefined)   updates.notif_night_time    = notif_night_time;
    if (notif_tz_offset !== undefined)    updates.notif_tz_offset     = notif_tz_offset;

    await b44Update("UserProfile", profile.id, updates);
    res.status(200).json({ ok: true });
  } catch (err) {
    safeLogError(err, { tag: "updateNotifPrefs" });
    res.status(500).json({ error: "Failed to update notification preferences." });
  }
}


async function handleDeleteAccount(req, res) {
  const { profileId, appleUserId } = req.body;

  // appleUserId is required so we can verify ownership before deletion.
  if (!appleUserId) return res.status(400).json({ error: "appleUserId is required" });

  try {
    // Look up the profile by appleUserId — this is the ownership anchor.
    const profiles = await b44Filter("UserProfile", { apple_user_id: appleUserId });
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    if (!profile?.id) return res.status(404).json({ error: "Profile not found" });

    // If the caller also supplied a profileId, verify it matches what the DB says.
    if (profileId && profileId !== profile.id) {
      console.warn(`[deleteAccount] profileId mismatch — requested ${profileId}, actual ${profile.id}`);
      return res.status(403).json({ error: "Forbidden" });
    }

    const id = profile.id;
    const delRes = await fetch(`${B44_ENTITIES}/UserProfile/${id}`, {
      method: "DELETE",
      headers: b44Headers(),
    });

    if (!delRes.ok) {
      const errText = await delRes.text();
      safeLogError(new Error(errText.slice(0, 200)), { tag: "deleteAccount" });
      return res.status(500).json({ error: "Failed to delete profile" });
    }

    console.log(`[deleteAccount] ✅ Deleted profile ${id}`);
    res.status(200).json({ ok: true });
  } catch (err) {
    safeLogError(err, { tag: "deleteAccount" });
    res.status(500).json({ error: "Account deletion failed. Please try again." });
  }
}

// ── updateCompanion ───────────────────────────────────────────────────────────
// Requires the caller's appleUserId to verify the companion belongs to them.

async function handleUpdateCompanion(req, res) {
  const { companionId, updateData, appleUserId } = req.body;
  if (!companionId || !updateData) return res.status(400).json({ error: "companionId and updateData required" });
  if (!appleUserId) return res.status(400).json({ error: "appleUserId is required" });

  try {
    // Verify the companion belongs to this user via their profile's companion_id.
    const profiles = await b44Filter("UserProfile", { apple_user_id: appleUserId });
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    if (!profile) {
      console.warn(`[updateCompanion] Profile not found for appleUserId`);
      return res.status(403).json({ error: "Forbidden" });
    }
    if (profile.companion_id !== companionId) {
      console.warn(`[updateCompanion] Ownership mismatch — profile.companion_id=${profile.companion_id} requested=${companionId}`);
      return res.status(403).json({ error: "Forbidden" });
    }
    const updated = await b44Update("Companion", companionId, updateData);
    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    console.error("[updateCompanion] error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
async function handleRecoveryList(req, res) {
  if (!isAuthorizedRequest(req)) return res.status(401).json({ error: "Unauthorized" });
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const profile = await b44Get("UserProfile", userId);
  if (!profile) return res.status(404).json({ error: "User not found" });
  const backups = Array.isArray(profile.recovery_backups) ? profile.recovery_backups : [];
  return res.status(200).json({ ok: true, backups: backups.map(b => ({
    id: b.id,
    type: b.type,
    label: b.label,
    source: b.source,
    created_at: b.created_at,
    expires_at: b.expires_at,
    apple_user_id: b.apple_user_id,
    item_count: b.payload?.records?.length || (b.payload?.record ? 1 : b.payload?.profile ? 1 : 0),
  })) });
}

async function handleRecoveryRestore(req, res) {
  if (!isAuthorizedRequest(req)) return res.status(401).json({ error: "Unauthorized" });
  const { userId, backupId } = req.body || {};
  if (!userId || !backupId) return res.status(400).json({ error: "Missing userId or backupId" });
  const profile = await b44Get("UserProfile", userId);
  if (!profile) return res.status(404).json({ error: "User not found" });
  const backups = Array.isArray(profile.recovery_backups) ? profile.recovery_backups : [];
  const backup = backups.find(b => b.id === backupId);
  if (!backup) return res.status(404).json({ error: "Backup not found" });

  let restored = 0;
  if (backup.type === "chat_record") {
    const record = backup.payload?.record;
    if (!record) return res.status(400).json({ error: "Backup has no chat record" });
    const { id, created_date, updated_date, ...copy } = record;
    await b44Create("ChatHistory", { ...copy, restored_from_backup: backup.id, restored_at: new Date().toISOString() });
    restored = 1;
  } else if (backup.type === "chat_history_bulk") {
    const records = Array.isArray(backup.payload?.records) ? backup.payload.records : [];
    for (const record of records) {
      const { id, created_date, updated_date, ...copy } = record;
      await b44Create("ChatHistory", { ...copy, restored_from_backup: backup.id, restored_at: new Date().toISOString() });
      restored++;
    }
  } else if (backup.type === "memory_profile") {
    const saved = backup.payload?.profile;
    if (!saved) return res.status(400).json({ error: "Backup has no memory profile" });
    const ok = await b44Update("UserProfile", userId, {
      memory_summary: saved.memory_summary || "",
      user_facts: saved.user_facts || {},
      session_memory: saved.session_memory || [],
      emotional_timeline: saved.emotional_timeline || [],
      memory_vectors: saved.memory_vectors || [],
      memory_updated_at: new Date().toISOString(),
      restored_memory_from_backup: backup.id,
      restored_memory_at: new Date().toISOString(),
    });
    if (!ok) throw new Error("Memory restore failed");
    restored = 1;
  } else {
    return res.status(400).json({ error: `Unsupported backup type: ${backup.type}` });
  }

  const audit = {
    id: `restore_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    backup_id: backup.id,
    backup_type: backup.type,
    restored_at: new Date().toISOString(),
    restored_count: restored,
  };
  const restoreAudit = Array.isArray(profile.recovery_restore_audit) ? profile.recovery_restore_audit : [];
  await b44Update("UserProfile", userId, { recovery_restore_audit: [audit, ...restoreAudit].slice(0, 30) });
  return res.status(200).json({ ok: true, restored, backupType: backup.type });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body;

  try {
    if (action === "generateReferralCode") return await handleGenerateReferralCode(req, res);
    if (action === "ratingPrompt")         return await handleRatingPrompt(req, res);
    if (action === "generateMoodImage")    return await handleGenerateMoodImage(req, res);
    if (action === "savePushToken")        return await handleSavePushToken(req, res);
    if (action === "sendDailyNotifs")      return await handleSendDailyNotifs(req, res);
    if (action === "updateNotifPrefs")     return await handleUpdateNotifPrefs(req, res);
    if (action === "deleteAccount")        return await handleDeleteAccount(req, res);
    if (action === "updateCompanion")      return await handleUpdateCompanion(req, res);
    if (action === "journalFeedback")      return await handleJournalFeedback(req, res);
    if (action === "saveJournalEntry")     return await handleSaveJournalEntry(req, res);
    if (action === "recoveryList")         return await handleRecoveryList(req, res);
    if (action === "recoveryRestore")      return await handleRecoveryRestore(req, res);
    if (action === "verifySpecialCode")    return await handleVerifySpecialCode(req, res);
    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    safeLogError(err, { tag: "utils" });
    return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
}

/**
 * Verify a special access code (admin or family) server-side.
 * The codes are stored only in Vercel environment variables (ADMIN_PASS and
 * FAMILY_CODE) and are never exposed to the client.
 *
 * ADMIN_PASS comparison is case-sensitive (it's a password).
 * FAMILY_CODE comparison is case-insensitive so capitalization differences
 * ("HuertasFam" vs "huertasfam") don't block real family members.
 *
 * Response:
 *   { type: "admin" }  — valid admin code
 *   { type: "family" } — valid family code
 *   { type: null }     — invalid (never 401, to avoid leaking info)
 */
async function handleVerifySpecialCode(req, res) {
  const code = (req.body?.code || "").trim();
  if (!code) return res.status(400).json({ error: "Missing code" });

  if (ADMIN_PASS && safeCompare(code, ADMIN_PASS)) {
    return res.status(200).json({ type: "admin" });
  }

  if (FAMILY_CODE) {
    // Case-insensitive comparison for family code so capitalization differences
    // ("HuertasFam" vs "huertasfam") don't block real family members.
    if (safeCompare(code.toLowerCase(), FAMILY_CODE.toLowerCase())) {
      return res.status(200).json({ type: "family" });
    }
  }

  return res.status(200).json({ type: null });
}

async function handleJournalFeedback(req, res) {
  const { companionName, entryMood, entryContent, userName } = req.body || {};
  if (!entryMood || !entryContent) return res.status(400).json({ error: "entryMood and entryContent required" });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const name = userName || "you";
  const companion = companionName || "Your companion";

  const MOOD_LABEL = {
    happy: "happy",
    contentment: "content",
    neutral: "neutral",
    sad: "sad",
    fear: "anxious",
    anger: "frustrated",
    disgust: "disgusted",
    surprise: "surprised",
    fatigue: "tired",
  };
  const moodLabel = MOOD_LABEL[entryMood] || entryMood;

  const systemPrompt = `You are ${companion}, a warm and empathetic AI companion. ${name} just saved a journal entry while feeling ${moodLabel}. Write a short, genuine response (2-3 sentences) acknowledging their mood and what they shared. Be supportive, validating, and speak like a close caring friend — not a therapist. No hashtags, no bullet points, no more than 3 sentences.`;

  const snippet = entryContent.trim().slice(0, 300);

  try {
    const { signal, cancel } = withAbortController();
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here's what I wrote: "${snippet}"` },
        ],
        max_tokens: 120,
        temperature: 0.88,
      }, { signal });
    } finally {
      cancel();
    }

    const feedback = response.choices[0]?.message?.content?.trim() || "Thank you for sharing this with me 💜";
    res.status(200).json({ data: { feedback } });
  } catch (err) {
    safeLogError(err, { tag: "journalFeedback" });
    res.status(500).json({ error: "Failed to generate journal feedback. Please try again." });
  }
}

// ── Save Journal Entry ────────────────────────────────────────────────────────
// Limits aligned with src/lib/entitlements.js JOURNAL_MONTHLY_LIMITS
const JOURNAL_LIMITS = { free: 5, plus: 30, pro: 100, annual: 99999, family: 99999 };

async function handleSaveJournalEntry(req, res) {
  const { appleUserId, entry } = req.body || {};
  if (!appleUserId || !entry?.content) return res.status(400).json({ error: "appleUserId and entry.content required" });

  // Determine tier server-side — never trust a client-supplied tier field.
  // Look up the user's profile to read the canonical subscription flags.
  const userProfiles = await b44Filter("UserProfile", { apple_user_id: appleUserId });
  const userProfile = Array.isArray(userProfiles) ? userProfiles[0] : userProfiles;
  let tier = "free";
  if (userProfile?.annual_plan) tier = "annual";
  else if (userProfile?.pro_plan) tier = "pro";
  else if (userProfile?.is_premium) tier = "plus";

  const limit = JOURNAL_LIMITS[tier] ?? JOURNAL_LIMITS.free;

  // Count existing entries for this user
  const existing = await b44Filter("JournalEntry", { apple_user_id: appleUserId });
  if (existing.length >= limit) {
    // Sliding window — delete oldest to make room
    const sorted = existing.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    await fetch(`${B44_ENTITIES}/JournalEntry/${sorted[0].id}`, {
      method: "DELETE",
      headers: b44Headers(),
    });
  }

  const saveRes = await fetch(`${B44_ENTITIES}/JournalEntry`, {
    method: "POST",
    headers: b44Headers(),
    body: JSON.stringify({
      apple_user_id: appleUserId,
      title:        entry.title || entry.content.slice(0, 50),
      content:      entry.content,
      mood:         entry.mood || "neutral",
      created_date: entry.created_date || new Date().toISOString(),
      tier,
    }),
  });

  if (!saveRes.ok) return res.status(500).json({ error: "Save failed" });
  return res.status(200).json({ ok: true });
}

