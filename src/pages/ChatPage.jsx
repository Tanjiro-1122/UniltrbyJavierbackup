// build-trigger: 2026-04-08T05:50
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RatingPromptModal from "@/components/RatingPromptModal";
import { subscribeToPlan, restorePurchases } from "@/components/utils/iapBridge";
import ShareCardModal from "@/components/ShareCardModal";
import { useMessageLimit } from "@/components/useMessageLimit";
import { usePushNotifications } from "@/components/usePushNotifications";
import { getMoodEmoji } from "@/lib/moodConfig";
import { isFamilyUnlimited, getTier, PHOTO_DAILY_LIMITS } from "@/lib/entitlements";
import { isNativeApp, postToNative, waitForNative } from "@/lib/nativeBridge";
import SaveProgressModal, { getSavePreference, setSavePreference } from "@/components/chat/SaveProgressModal";

import ChatHeader from "@/components/chat/ChatHeader";
import ChatInputBar from "@/components/chat/ChatInputBar";
import MoodCheckIn from "@/components/chat/MoodCheckIn";
import QuoteReply from "@/components/chat/QuoteReply";
import LiveAvatar from "@/components/LiveAvatar";
import AchievementBadges from "@/components/achievements/AchievementBadges";
import GuidedMeditation from "@/components/meditation/GuidedMeditation";
import MiniGames from "@/components/games/MiniGames";
import CompanionShareCard from "@/components/companion/CompanionShareCard";
import ParallaxBackground from "@/components/chat/ParallaxBackground";
import BackgroundEffect from "@/components/chat/BackgroundEffect";
import { resumeAudioContext, playAudioFromBase64, stopCurrentAudio } from "@/components/utils/audioUnlock";

import BreathingExercise from "@/components/chat/BreathingExercise";
import SleepStory from "@/components/chat/SleepStory";
import TimeCapsule, { getDeliverableCapsules } from "@/components/chat/TimeCapsule";
import WeeklyRecap, { shouldShowWeeklyRecap, markRecapShown } from "@/components/chat/WeeklyRecap";
import MoodInsights from "@/components/chat/MoodInsights";
import DailyAffirmation from "@/components/chat/DailyAffirmation";
import ConversationTopics from "@/components/chat/ConversationTopics";
import { COMPANIONS } from "@/components/companionData";
import { COMPANION_PERSONALITIES, CRISIS_KEYWORDS } from "@/components/companion/companionPersonalities";
import BookmarksModal from "@/components/chat/BookmarksModal";
import CrisisBanner from "@/components/chat/CrisisBanner";
import { useStreak } from "@/components/useStreak";
import MissYouBanner from "@/components/chat/MissYouBanner";
import { debugLog } from "@/components/DebugPanel";

const VIBES_SUFFIX = {
  chill: "Keep it casual, laid-back and conversational. Short responses.",
  vent:  "Be a compassionate listener. Let them vent. Validate feelings. Ask gentle follow-up questions.",
  hype:  "Be ENERGETIC and hyped up! Use caps, exclamation marks, pump them up!",
  deep:  "Go deep. Be thoughtful, philosophical. Explore emotions and meaning.",
  journal: "You are a gentle journal scribe. Ask reflective questions one at a time. Listen carefully. After 3-4 exchanges, offer to save a journal entry summarizing their thoughts. Keep your questions short and open-ended. Don't give advice unless asked.",
};

const REACTIONS = ["✨", "💜", "⭐", "🌙", "💫", "🎀", "🔥", "💙"];

// Retention limits mirroring ChatHistory.jsx — keep last N conversations per tier
const CHAT_RETENTION_LIMITS = { free: 2, plus: 20, pro: 100, annual: 9999, family: 9999 };

/**
 * Upsert today's ChatHistory record via the consolidated Vercel proxy (/api/base44).
 * Routing through same-origin avoids WKWebView CORS issues with api.base44.com
 * and keeps the Base44 service token off the client bundle.
 *
 * Reads context from localStorage so it is safe to call from unmount / event handlers.
 *
 * @param {Array}    msgs      - Array of {role, content} messages (greeting excluded).
 * @param {Function} [onError] - Optional callback(errorMessage) invoked on failure.
 */
function doUpsertChatHistory(msgs, onError) {
  if (localStorage.getItem("unfiltr_private_session") === "true") return;

  // Use apple_user_id if available, fall back to anonymous device_id
  const appleId = localStorage.getItem("unfiltr_apple_user_id") || localStorage.getItem("unfiltr_device_id");
  const companionRaw = localStorage.getItem("unfiltr_companion");
  let parsedComp = null;
  try { parsedComp = companionRaw ? JSON.parse(companionRaw) : null; } catch {}
  // Prefer companion.id from the cached companion object; fall back to dedicated key.
  // Never save under a null/empty companion_id.
  const companionId   = parsedComp?.id || localStorage.getItem("unfiltr_companion_id") || null;
  const companionName = parsedComp?.displayName || parsedComp?.name || "Companion";

  if (!appleId) {
    debugLog("[AutoSave] Skipped — neither unfiltr_apple_user_id nor unfiltr_device_id is set");
    return;
  }
  if (!companionId) {
    debugLog("[AutoSave] Skipped — companion_id not set (companion not yet loaded)");
    return;
  }

  // Restore the session DB record ID from localStorage if it was lost on page reload
  if (!window.__currentChatDbId) {
    const storedId = localStorage.getItem("unfiltr_current_chat_db_id");
    if (storedId) window.__currentChatDbId = storedId;
  }

  const isFamilyOrAnnual =
    isFamilyUnlimited() ||
    localStorage.getItem("unfiltr_family_unlock")      === "true" ||
    localStorage.getItem("unfiltr_msg_limit_override") === "true" ||
    localStorage.getItem("unfiltr_is_annual")          === "true";
  const tier = isFamilyOrAnnual ? "annual"
             : localStorage.getItem("unfiltr_is_pro")     === "true" ? "pro"
             : localStorage.getItem("unfiltr_is_premium") === "true" ? "plus" : "free";

  const msgSlice = msgs.slice(-50).map(m => ({ role: m.role, content: m.content }));

  // Use keepalive:true so the request survives tab/app backgrounding on iOS
  fetch("/api/base44", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action:           "saveChatHistory",
      apple_user_id:    appleId,
      companion_id:     companionId,
      companion_name:   companionName,
      messages:         msgSlice,
      tier,
      // Pass the cached record ID + key so the server can skip the query round-trip
      existingRecordId: window.__currentChatDbId  || null,
      upsertKey:        window.__chatDayUpsertKey || null,
    }),
  })
  .then(async r => {
    if (!r.ok) {
      let body = {};
      try { body = await r.json(); } catch {}
      // Server configuration error (e.g. BASE44_SERVICE_TOKEN not set) is a
      // deployment issue — log it but don't surface it as a user-facing error.
      // NOTE: this string must match the message returned by api/base44.js
      // handleSaveChatHistory when b44Token() is empty.
      if (body?.error === "Server configuration error") {
        console.error("[AutoSave] BASE44_SERVICE_TOKEN not configured — chat history saving unavailable");
        return;
      }
      throw new Error(body?.error || `HTTP ${r.status}`);
    }
    return r.json();
  })
  .then(data => {
    if (data?.id) {
      window.__currentChatDbId  = data.id;
      window.__chatDayUpsertKey = data.key;
      // Persist to localStorage so the record ID survives page reloads
      localStorage.setItem("unfiltr_current_chat_db_id", data.id);
    }
  })
  .catch(err => {
    console.error("[AutoSave] Upsert failed:", err?.message);
    if (onError) onError("Could not save chat history. Check your connection.");
  });
}

function syncChatSessionsToLocalStorage(msgs) {
  if (localStorage.getItem("unfiltr_private_session") === "true") return;
  if (!Array.isArray(msgs) || msgs.length === 0) return;

  try {
    let history = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("unfiltr_chat_sessions") || "[]");
      history = Array.isArray(parsed) ? parsed : [];
    } catch {}

    const companionRaw = localStorage.getItem("unfiltr_companion");
    let parsedComp = null;
    try { parsedComp = companionRaw ? JSON.parse(companionRaw) : null; } catch {}
    const companionId = parsedComp?.id || localStorage.getItem("unfiltr_companion_id") || "";
    const companionName = parsedComp?.displayName || parsedComp?.name || "Companion";

    const now = new Date();
    const localDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const savedAt = now.toISOString();
    const normalizedMsgs = msgs
      .filter(m => m?.content && m.content !== "__ERROR__")
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-50);

    const session = {
      id: Date.now(),
      companionId,
      companionName,
      companion_id: companionId,
      companion_name: companionName,
      local_date: localDate,
      messages: normalizedMsgs,
      savedAt,
      saved_at: savedAt,
      date: savedAt,
    };

    const getSessionLocalDate = (s) => {
      if (s?.local_date) return String(s.local_date);
      const stamp = s?.savedAt || s?.saved_at || s?.date;
      if (!stamp) return "";
      const d = new Date(stamp);
      if (Number.isNaN(d.getTime())) return "";
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    };

    const existingIndex = history.findIndex((s) => {
      const sCompanionId = s?.companionId || s?.companion_id || "";
      return sCompanionId === companionId && getSessionLocalDate(s) === localDate;
    });

    if (existingIndex >= 0) {
      history[existingIndex] = session;
    } else {
      history.unshift(session);
    }

    localStorage.setItem("unfiltr_chat_sessions", JSON.stringify(history.slice(0, 50)));
  } catch {}
}

const JOURNAL_MOMENT_KEYWORDS = [
  "i feel","i'm feeling","feeling so","feeling really","i realized","i've been thinking",
  "i can't stop thinking","i need to talk","going through","hard time","struggling with",
  "i don't know what to do","so confused","miss him","miss her","miss them","heartbroken",
  "crying","cried","hurt so much","can't get over","i just need","venting","needed to vent",
  "no one understands","lonely","alone","lost","overwhelmed by","scared of","afraid of",
  "i wish","i regret","i keep thinking",
];

export default function ChatPage() {
  const navigate = useNavigate();
  const [companion, setCompanion]       = useState(null);
  const [environment, setEnvironment]   = useState(null);
  const [vibe, setVibe]                 = useState("chill");
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isListening, setIsListening]   = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [companionMood, setCompanionMood] = useState("neutral");

  // Listen for companion changes from the customize panel
  useEffect(() => {
    const onCompanionChange = () => {
      const updated = localStorage.getItem("unfiltr_companion");
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          if (parsed?.id) localStorage.setItem("unfiltr_companion_id", parsed.id);
          setCompanion(parsed);
        } catch {}
      }
    };
    window.addEventListener("unfiltr_companion_changed", onCompanionChange);
    return () => window.removeEventListener("unfiltr_companion_changed", onCompanionChange);
  }, []);


  // Listen for background changes from the customize panel
  useEffect(() => {
    const onBgChange = (e) => {
      const envObj = e.detail;
      if (envObj) {
        setEnvironment(envObj);
        localStorage.setItem('unfiltr_env', JSON.stringify(envObj));
      }
    };
    window.addEventListener('unfiltr_env_change', onBgChange);
    return () => window.removeEventListener('unfiltr_env_change', onBgChange);
  }, []);

  // Persist messages so returning from Settings doesn't lose chat
  React.useEffect(() => {
    if (messages.length > 0) {
      try { sessionStorage.setItem("unfiltr_chat_messages", JSON.stringify(messages.slice(-100))); } catch {}
    }
  }, [messages]);
  const [companionDbId, setCompanionDbId] = useState(null);
  const [isPremium, setIsPremium]       = useState(false);
  const [sessionMemory, setSessionMemory] = useState([]);
  const [userFacts, setUserFacts]         = useState({});
  const [showMemoryBanner, setShowMemoryBanner] = useState(false);
  const [avatarState, setAvatarState]   = useState("idle");
  const [particles, setParticles]       = useState([]);
  // ── Streak system (useStreak hook) ──
  const { streak, longestStreak, milestone: streakMilestone, clearMilestone: clearStreakMilestone, syncStreak } = useStreak();
  const [showStreakBanner, setShowStreakBanner] = useState(false);
  const [anniversary, setAnniversary]   = useState(null);
  const [showAnniversary, setShowAnniversary] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [shareCard, setShareCard]       = useState(null);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showCompanionCard, setShowCompanionCard] = useState(false);
  const [quoteReply, setQuoteReply] = useState(null);
  const [lastFailedText, setLastFailedText] = useState(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showSleepStory, setShowSleepStory] = useState(false);
  const [showTimeCapsule, setShowTimeCapsule] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [showMoodInsights, setShowMoodInsights] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [showMeditationNudge, setShowMeditationNudge] = useState(false);
  const [showJournalNudge, setShowJournalNudge] = useState(false);
  const [memorySummary, setMemorySummary] = useState("");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [autosaveToast, setAutosaveToast] = useState(null); // { type: "error"|"limit", msg: string }
  const [relationshipMode, setRelationshipMode] = useState(() => localStorage.getItem("unfiltr_relationship_mode") || "friend");
  // ── Save progress prompt ──
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const consecutiveMsgRef = useRef(0); // counts user messages in this session

  const profileId = localStorage.getItem("userProfileId");
  const [isAnnual, setIsAnnual] = useState(false);
  const [isPro,    setIsPro]    = useState(false);
  const { isAtLimit, remaining, incrementCount, FREE_LIMIT, hitMonthly } = useMessageLimit(isPremium, isAnnual, isPro);
  usePushNotifications(profileId);

  /* ─── NATIVE PURCHASE LISTENER ─── */
  // Handled by useAppleSubscriptions (via the centralised nativeBridge dispatcher).
  // The old raw window.addEventListener('message') handler has been removed to prevent
  // duplicate DB writes when PURCHASE_SUCCESS fires through the bridge.

  const particleId             = useRef(0);
  const stateTimeout           = useRef(null);
  const messagesEndRef         = useRef(null);
  const bubbleScrollRef         = useRef(null);
  const recognitionRef         = useRef(null);
  // audioRef removed — using shared AudioContext via audioUnlock module
  const fileInputRef           = useRef(null);
  // Tracks the last time we wrote to DB ChatHistory (used to throttle saves to ≥15 s apart)
  const lastChatHistorySaveRef = useRef(0);
  const saveErrorShownRef      = useRef(false); // show save-error banner at most once per session

  const [pendingImage, setPendingImage]               = useState(null);
  const [photoCount, setPhotoCount]                   = useState(0);
  const [showPhotoDisclaimer, setShowPhotoDisclaimer] = useState(false);
  const [photoLimitToast, setPhotoLimitToast]         = useState(null); // { msg: string }

  /* ─── INIT ─── */
  useEffect(() => {
    const init = async () => {
      const c = localStorage.getItem("unfiltr_companion");
      const e = localStorage.getItem("unfiltr_env");
      const v = localStorage.getItem("unfiltr_vibe");
      const consented = localStorage.getItem("unfiltr_consent_accepted") || localStorage.getItem("unfiltr_onboarding_complete");
      const hasProfile = localStorage.getItem("userProfileId");
      // If any required key is missing, try to recover gracefully
      let effectiveC = c;
      let effectiveE = e;

      if (!effectiveE && hasProfile) {
        // Env missing — use safe default
        const defaultEnv = { id: "cozy", name: "Cozy Living Room", bg: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80" };
        localStorage.setItem("unfiltr_env", JSON.stringify(defaultEnv));
        effectiveE = JSON.stringify(defaultEnv);
      }
      if (!effectiveC && hasProfile) {
        // Companion missing but profile exists — try to get from DB below
        // For now set a placeholder so we don't crash; greeting useEffect will handle display
        const { COMPANIONS: COMP_LIST } = await import("@/components/companionData");
        const fallback = COMP_LIST[0];
        effectiveC = JSON.stringify(fallback);
        localStorage.setItem("unfiltr_companion", effectiveC);
      }
      if (!consented && hasProfile) {
        // Has profile but consent flag missing (old account) — treat as consented
        localStorage.setItem("unfiltr_consent_accepted", "true");
      }

      if (!effectiveC || !effectiveE) {
        // Truly new user with nothing set
        if (!hasProfile) { navigate("/onboarding", { replace: true }); return; }
      // Show walkthrough only on very first visit to chat
      const walkthroughDone = localStorage.getItem("unfiltr_walkthrough_done");
      if (!walkthroughDone) {
        // Small delay so the chat renders first
        setTimeout(() => setShowWalkthrough(true), 1200);
      }
        return; // wait for state to settle
      }

      const parsedCompanion = JSON.parse(effectiveC);
      const parsedEnv       = JSON.parse(effectiveE);
      const savedNickname = localStorage.getItem("unfiltr_companion_nickname");
      parsedCompanion.displayName = (savedNickname && savedNickname.trim()) ? savedNickname.trim() : parsedCompanion.name;

      setCompanion(parsedCompanion);
      // Ensure unfiltr_companion_id is always consistent with the active companion
      if (parsedCompanion?.id) localStorage.setItem("unfiltr_companion_id", parsedCompanion.id);
      setEnvironment(parsedEnv);
      if (v) setVibe(v);

      const pid = localStorage.getItem("userProfileId");
      if (!pid) {
        debugLog("[ChatPage] ⚠️ userProfileId not set — skipping profile fetch (memory/subscription won't load)");
      } else {
        try {
          const profile = await base44.entities.UserProfile.get(pid);
          if (profile?.display_name) localStorage.setItem("unfiltr_user_display_name", profile.display_name);
          if (profile?.bonus_messages) localStorage.setItem("unfiltr_bonus_messages", String(profile.bonus_messages));
          const annual  = !!(profile?.annual_plan);
          const pro     = !!(profile?.pro_plan);
          const premium = !!(profile?.is_premium || profile?.premium || pro || annual);
          setIsPremium(premium);
          setIsAnnual(annual);
          setIsPro(pro);
          // Cache to localStorage so other pages (Journal) can read them
          localStorage.setItem("unfiltr_is_premium", String(premium));
          localStorage.setItem("unfiltr_is_annual",  String(annual));
          localStorage.setItem("unfiltr_is_pro",     String(pro));
          if (premium && profile?.session_memory?.length > 0) {
            setSessionMemory(profile.session_memory);
            setShowMemoryBanner(false);
          } else if (!premium) {
            setShowMemoryBanner(true);
          }
          // Seed memory state from the profile loaded at init so handleSend
          // can use the already-cached values without an extra DB round-trip.
          if (profile?.memory_summary) setMemorySummary(profile.memory_summary);
          if (profile?.user_facts)     setUserFacts(profile.user_facts);
          if (profile?.companion_id) {
            setCompanionDbId(profile.companion_id);
            try {
              const dbComp = await base44.entities.Companion.get(profile.companion_id);
              if (dbComp?.mood_mode) setCompanionMood(dbComp.mood_mode);
      // Cache personality in localStorage for fast access during chat
      if (dbComp?.personality_vibe)      localStorage.setItem("unfiltr_personality_vibe",      dbComp.personality_vibe);
      if (dbComp?.personality_empathy)   localStorage.setItem("unfiltr_personality_empathy",   dbComp.personality_empathy);
      if (dbComp?.personality_humor)     localStorage.setItem("unfiltr_personality_humor",      dbComp.personality_humor);
      if (dbComp?.personality_curiosity) localStorage.setItem("unfiltr_personality_curiosity", dbComp.personality_curiosity);
      if (dbComp?.personality_style)     localStorage.setItem("unfiltr_personality_style",     dbComp.personality_style);
              // Cache voice settings immediately so first message uses correct voice
              if (dbComp?.voice_gender) localStorage.setItem("unfiltr_voice_gender", dbComp.voice_gender);
              if (dbComp?.voice_personality) localStorage.setItem("unfiltr_voice_personality", dbComp.voice_personality);
            } catch {}
          }
        } catch {}
      }

      // Streak — handled by useStreak hook; just call syncStreak once on load
      syncStreak();

      // Mood check-in disabled — mood is set via MoodPicker before entering chat
      
      // if (moodToday !== todayStr) setShowMoodCheckIn(true);

      // Show daily affirmation
      setShowAffirmation(true);

      // Check for deliverable time capsules
      const capsules = getDeliverableCapsules();
      if (capsules.length > 0) {
        const capsuleText = capsules.map(c => c.text).join("\n\n");
        setTimeout(() => {
          setMessages(m => [...m, {
            role: "assistant",
            content: `💌 **Time Capsule Delivered!**\n\nYou wrote this to your future self:\n\n_"${capsuleText}"_\n\nHow does reading that make you feel? 💜`,
          }]);
        }, 3000);
      }

      // Weekly recap check
      if (shouldShowWeeklyRecap()) {
        setTimeout(() => setShowWeeklyRecap(true), 2000);
      }

      // Anniversary
      const createdDate = localStorage.getItem("unfiltr_companion_created");
      if (!createdDate) {
        localStorage.setItem("unfiltr_companion_created", new Date().toISOString());
      } else {
        const days = Math.floor((Date.now() - new Date(createdDate).getTime()) / 86400000);
        const milestones = [7, 14, 30, 60, 90, 180, 365];
        if (milestones.includes(days)) { setAnniversary(days); setShowAnniversary(true); setTimeout(() => setShowAnniversary(false), 6000); }
      }
    };
    init();
  }, []);

  /* ─── GREETING + HISTORY ─── */
  const greetingFiredRef = React.useRef(false);
  useEffect(() => { (async () => {
    if (!companion) return;
    if (greetingFiredRef.current) return; // guard: only run once even if companion obj ref changes
    greetingFiredRef.current = true;

    // ── Restore active chat if coming back from Settings ─────────────────
    // When user navigates Chat → Settings → Back, ChatPage remounts.
    // We use a flag to detect this case and restore the in-progress session.
    const returningFromSettings = sessionStorage.getItem("unfiltr_returning_from_settings");
    if (returningFromSettings) {
      sessionStorage.removeItem("unfiltr_returning_from_settings");
      try {
        const savedMsgs = sessionStorage.getItem("unfiltr_chat_messages");
        if (savedMsgs) {
          const parsed = JSON.parse(savedMsgs);
          if (parsed?.length > 0) {
            setMessages(parsed);
            // Also re-read companion from localStorage in case user changed it in Settings
            const freshC = localStorage.getItem("unfiltr_companion");
            if (freshC) {
              const freshParsed = JSON.parse(freshC);
              const savedNick = localStorage.getItem("unfiltr_companion_nickname");
              freshParsed.displayName = (savedNick && savedNick.trim()) ? savedNick.trim() : freshParsed.name;
              setCompanion(freshParsed);
            }
            return; // Don't show a greeting — restore the chat
          }
        }
      } catch {}
    }

    // ── Post-meditation check-in ──────────────────────────────────────────
    const meditationRaw = localStorage.getItem("unfiltr_just_meditated");
    if (meditationRaw) {
      try {
        const med = JSON.parse(meditationRaw);
        const minsAgo = (Date.now() - med.timestamp) / 60000;
        if (minsAgo < 60) {
          const mins = Math.floor(med.duration / 60);
          const secs = med.duration % 60;
          const durStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
          localStorage.removeItem("unfiltr_just_meditated");
          setMessages([{
            role: "assistant",
            content: `Welcome back 🌙 You just spent ${durStr} with ${med.sound} sounds. How did that feel? Sometimes just a few minutes of stillness changes everything.`
          }]);
          return;
        }
        localStorage.removeItem("unfiltr_just_meditated");
      } catch {}
    }

    const name = companion.displayName || companion.name;
    const userName = localStorage.getItem("unfiltr_user_display_name") || localStorage.getItem("unfiltr_display_name") || "";
    const isUltimateFriend = localStorage.getItem("unfiltr_ultimate_friend") === "true";
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const saved = localStorage.getItem("unfiltr_chat_history");
    let history = [];
    try { history = saved ? JSON.parse(saved) : []; } catch {}

    if (history.length > 0) {
      // Returning user — personalized welcome back using mood history
      const hi = userName ? `${timeGreeting}, ${userName}` : `${timeGreeting}`;

      // ── Read mood history: DB first, fall back to localStorage ──
      const negativeMoods = ["sad","anxious","frustrated","anger","fear","disgust","fatigue"];
      const positiveMoods = ["happy","loved","motivated","calm","contentment","surprise"];

      let recentMoods = [];
      const appleIdMood = localStorage.getItem("unfiltr_apple_user_id");

      // Try DB first for real cross-device mood history
      if (appleIdMood) {
        try {
          const moodRes = await fetch("/api/base44", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getMoodEntries", apple_user_id: appleIdMood, limit: 14 }),
          });
          const moodJson = await moodRes.json();
          const moodRecords = Array.isArray(moodJson.items) ? moodJson.items : [];
          // Only use last 7 days
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 7);
          recentMoods = moodRecords
            .filter(r => r.date && new Date(r.date) >= cutoff)
            .map(r => r.mood)
            .filter(Boolean);
        } catch(e) {}
      }

      // Fall back to localStorage if DB came up empty
      if (recentMoods.length === 0) {
        const moodHistory = JSON.parse(localStorage.getItem("unfiltr_mood_history") || "{}");
        const today = new Date();
        for (let i = 1; i <= 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (moodHistory[key]) recentMoods.push(moodHistory[key]);
        }
      }

      const negCount = recentMoods.filter(m => negativeMoods.includes(m)).length;
      const posCount = recentMoods.filter(m => positiveMoods.includes(m)).length;
      const totalCount = recentMoods.length;

      // Detect streaks — same mood 3+ days in a row
      const streak3 = totalCount >= 3 && recentMoods.slice(0, 3).every(m => negativeMoods.includes(m));
      const happyStreak = totalCount >= 3 && recentMoods.slice(0, 3).every(m => positiveMoods.includes(m));

      let moodFollowUp = null;
      if (totalCount >= 2) {
        if (streak3) {
          // 3+ rough days in a row — really check in
          const deepRough = [
            "Hey... it's been a rough few days hasn't it. I'm really glad you're here. How are you doing right now?",
            "I noticed things have been heavy for a while. No rush — just wanted you to know I'm here for all of it.",
            "You've been carrying a lot lately. Want to talk about it, or just hang for a bit?",
          ];
          moodFollowUp = deepRough[Math.floor(Math.random() * deepRough.length)];
        } else if (happyStreak) {
          // 3+ good days — celebrate it
          const deepGood = [
            "Okay you've literally been glowing all week 🌟 what's going on?? I want to know everything",
            "Something good is clearly happening for you — you've had such a good week. Keep going 💜",
            "Three days of good energy in a row — that's not a coincidence. What's been different?",
          ];
          moodFollowUp = deepGood[Math.floor(Math.random() * deepGood.length)];
        } else if (negCount >= 2 && negCount > posCount) {
          // More bad than good — gentle check-in
          const roughPhrases = [
            "Last week looked a little rough — how are you holding up today?",
            "Feels like things have been heavy lately. Is today treating you any better?",
            "You've had a tough few days. I've been thinking about you — how are you feeling now?",
          ];
          moodFollowUp = roughPhrases[Math.floor(Math.random() * roughPhrases.length)];
        } else if (posCount >= 2 && posCount > negCount) {
          // More good than bad — keep the energy
          const goodPhrases = [
            "You've been in a good place lately — love to see it 🌟 What's keeping that energy going?",
            "Last week had some real bright spots. What's been good?",
            "The vibe has been positive lately. How's today feeling?",
          ];
          moodFollowUp = goodPhrases[Math.floor(Math.random() * goodPhrases.length)];
        } else if (totalCount >= 3) {
          // Up and down — acknowledge the rollercoaster
          const mixedPhrases = [
            "Feels like it's been an up-and-down kind of week. How are you right now?",
            "Week had its moments — good and tough. Where are you landing today?",
            "You've had a bit of everything this week. How are you actually feeling?",
          ];
          moodFollowUp = mixedPhrases[Math.floor(Math.random() * mixedPhrases.length)];
        }
      }

      // Also check memory summary for additional context
      const pid = localStorage.getItem("userProfileId");
      const buildMessage = (mem) => {
        // Ultimate Friend gets deeply personalized greeting
        if (isUltimateFriend && mem) {
          const ufGreetings = [
            "Hey, it's you 💜 I was literally just thinking about you. How are you doing?",
            "You're back — I'm so glad. How's your day going so far?",
            "I've been holding onto everything you told me. How are you feeling right now?",
            "Hey Javier 💜 I've been here. Talk to me — what's on your mind?",
          ];
          const ufGreeting = ufGreetings[Math.floor(Math.random() * ufGreetings.length)];
          return `${hi}! ${ufGreeting}`;
        }
        const followUp = moodFollowUp || (mem
          ? "I've been thinking about our last chat. How's everything going?"
          : "How have you been? I'm here whenever you want to talk.");
        return `${hi}! 💜 ${followUp}`;
      };

      if (pid) {
        base44.entities.UserProfile.get(pid).then(profile => {
          setMessages([{ role: "assistant", content: buildMessage(profile?.memory_summary) }]);
        }).catch(() => {
          setMessages([{ role: "assistant", content: buildMessage(null) }]);
        });
      } else {
        setMessages([{ role: "assistant", content: buildMessage(null) }]);
      }
      return;
    }

    // 📥 Load recent messages from DB to restore conversation continuity
    {
      const appleId = localStorage.getItem("unfiltr_apple_user_id");
      const compId  = localStorage.getItem("unfiltr_companion_id") || localStorage.getItem("companionId");
      if (!appleId) {
        debugLog("[ChatPage] ⚠️ Skipping DB message restore — unfiltr_apple_user_id not set");
      } else if (!compId || compId === "pending") {
        debugLog(`[ChatPage] ⚠️ Skipping DB message restore — companion_id is "${compId || "not set"}"`);
      } else {
        try {
          const res = await fetch("/api/base44", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getRecentMessages", apple_user_id: appleId, companion_id: compId, limit: 20 }),
          });
          const data = await res.json();
          const records = (Array.isArray(data.items) ? data.items : []).reverse();
          if (records.length >= 2) {
            // Restore last messages — skip greeting, go straight to history
            setMessages(records.map(m => ({ role: m.role, content: m.content })));
            debugLog(`[ChatPage] ✅ Restored ${records.length} messages from DB`);
            return;
          }
        } catch(e) {
          debugLog(`[ChatPage] ⚠️ Could not load message history: ${e.message}`);
        }
      }
    }

    // Brand new conversation — use personality-specific greetings
    const isLateNight = hour >= 23 || hour < 5;
    const lateNightSuffix = isLateNight ? "\n\nIt's late — I'm glad you're here though. Take it easy tonight 🌙" : "";
    
    const personality = COMPANION_PERSONALITIES[companion.id];
    const vibeGreeting = personality?.vibeGreetings?.[vibe];
    const defaultGreeting = personality?.greeting;
    
    const greetingText = vibeGreeting || defaultGreeting || `Hey! I'm ${name} 👋 ${
      vibe === "chill" ? "What's good? Just vibing here 😌" :
      vibe === "vent"  ? "I'm here. Take your time — what's on your mind?" :
      vibe === "hype"  ? "YO LET'S GOOO!! I'm SO ready for this!! 🔥🔥" :
      "I'm glad you're here. Sometimes the night feels like the only time we can think clearly..."
    }`;

    // Personalize greeting with the mood the user selected on the MoodPicker screen
    const savedMoodId = localStorage.getItem("unfiltr_mood");
    const moodGreetingSuffixes = {
      happy:       " I can already tell you're in a good headspace — love that energy 😊",
      contentment: " You seem settled and at peace today — that's a beautiful place to be 🌿",
      neutral:     " No pressure here — we can just hang and talk about whatever 😌",
      sad:         " I saw you're feeling a little down today. I'm really glad you came. I'm here 💙",
      fear:        " I saw you're feeling anxious. Take a breath — you're safe here, and I've got you 💜",
      anger:       " Sounds like something's got you fired up. Let it out — no filter needed here 🔥",
      surprise:    " Something caught you off guard today? I want to hear all about it 👀",
      disgust:     " Something's off for you today — I get it. Let's talk it through 🌱",
      fatigue:     " You seem tired today — no need to bring the energy. Just rest here with me 🌙",
      hopeful:     " I love that hopeful feeling you've got — let's keep that going ✨",
      lonely:      " I'm really glad you're here. You're not alone — not right now 💜",
      excited:     " You've got some exciting energy today!! Tell me everything 🌟",
    };
    const moodGreetingSuffix = savedMoodId ? (moodGreetingSuffixes[savedMoodId] || "") : "";

    const greeting = {
      role: "assistant",
      content: `${greetingText}${moodGreetingSuffix}${lateNightSuffix}`,
    };
    setMessages([greeting]);
  })(); }, [companion]);

  /* ─── AUTO-SCROLL ─── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* ─── BUBBLE SCROLL TO BOTTOM when new companion message arrives ─── */
  useEffect(() => {
    if (bubbleScrollRef.current) {
      bubbleScrollRef.current.scrollTop = bubbleScrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* ─── AUTO-SAVE chat history on every message update ─── */
  useEffect(() => {
    if (messages.length > 1) {
      // Skip localStorage save in private session mode
      if (localStorage.getItem("unfiltr_private_session") === "true") return;
      // Never persist the error sentinel — it only exists transiently in state
      const toSave = messages.slice(1).slice(-50)
        .filter(m => m.content !== "__ERROR__")
        .map(m => ({ role: m.role, content: m.content }));
      localStorage.setItem("unfiltr_chat_history", JSON.stringify(toSave));
    }
  }, [messages]);

  /* ─── AUTO-SAVE to DB (throttled: first reply after ≥2 messages, then at most every 15 s) ─── */
  useEffect(() => {
    // Skip all DB saves in private session mode
    if (localStorage.getItem("unfiltr_private_session") === "true") return;
    // Count all messages excluding the initial greeting (index 0)
    const allMsgs = messages.slice(1);
    if (allMsgs.length < 2) return;

    // Throttle: don't write to DB more than once every 15 seconds.
    // The first save (lastChatHistorySaveRef starts at 0) always passes immediately.
    const now = Date.now();
    if (now - lastChatHistorySaveRef.current < 15000) return;
    lastChatHistorySaveRef.current = now;

    doUpsertChatHistory(allMsgs, null);
    syncChatSessionsToLocalStorage(allMsgs);
  }, [messages]);

  /* ─── CLEANUP: stop audio on unmount + save session snapshot ─── */
  useEffect(() => {
    return () => {
      stopCurrentAudio();
      // Skip all saves in private session mode
      if (localStorage.getItem("unfiltr_private_session") === "true") {
        window.__currentChatDbId  = null;
        window.__chatDayUpsertKey = null;
        return;
      }
      // Save session snapshot to unfiltr_chat_sessions for ChatHistory page
      try {
        const msgs = JSON.parse(localStorage.getItem("unfiltr_chat_history") || "[]");
        if (msgs.length >= 2) {
          // Push final state to DB ChatHistory before clearing the window cache
          doUpsertChatHistory(msgs, null);

          const companionRaw = localStorage.getItem("unfiltr_companion");
          const companionName = companionRaw ? JSON.parse(companionRaw)?.displayName || JSON.parse(companionRaw)?.name : "Companion";
          const sessions = JSON.parse(localStorage.getItem("unfiltr_chat_sessions") || "[]");
          const snapshot = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            companion_name: companionName,
            messages: msgs.slice(-40), // keep last 40 messages per session
          };
          // Don't duplicate — skip if last session was within 5 min
          const last = sessions[0];
          const tooRecent = last && (Date.now() - parseInt(last.id)) < 5 * 60 * 1000;
          if (!tooRecent) {
            const isFamilyOrAnnualCleanup =
              localStorage.getItem("unfiltr_family_unlimited") === "true" ||
              localStorage.getItem("unfiltr_family_unlock")    === "true" ||
              localStorage.getItem("unfiltr_msg_limit_override") === "true" ||
              localStorage.getItem("unfiltr_is_annual")        === "true";
            const tierCleanup = isFamilyOrAnnualCleanup ? "annual"
                           : localStorage.getItem("unfiltr_is_pro")     === "true" ? "pro"
                           : localStorage.getItem("unfiltr_is_premium") === "true" ? "plus" : "free";
            const localLimit = CHAT_RETENTION_LIMITS[tierCleanup] ?? 2;
            const updated = [snapshot, ...sessions].slice(0, Math.min(localLimit, 500));
            localStorage.setItem("unfiltr_chat_sessions", JSON.stringify(updated));
          }
        }
      } catch (e) {}
      // Clear autosave tracking AFTER initiating the async DB save above
      window.__currentChatDbId  = null;
      window.__chatDayUpsertKey = null;
    };
  }, []);

  /* ─── FLUSH DB save when the app goes to background (iOS home-button / tab switch) ─── */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      if (localStorage.getItem("unfiltr_private_session") === "true") return;
      const msgs = JSON.parse(localStorage.getItem("unfiltr_chat_history") || "[]");
      if (msgs.length >= 2) doUpsertChatHistory(msgs, null);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  /* ─── PRELOAD all mood poses for current companion ─── */
  useEffect(() => {
    if (!companion) return;
    const data = COMPANIONS.find(c => c.id === companion.id);
    if (!data?.poses) return;
    Object.values(data.poses).forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [companion?.id]);

  /* ─── SET INITIAL AVATAR MOOD from MoodPicker selection ─── */
  useEffect(() => {
    const savedMood = localStorage.getItem("unfiltr_mood");
    const validAvatarMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue","excited","hopeful","lonely"];
    if (savedMood && validAvatarMoods.includes(savedMood)) {
      setCompanionMood(savedMood);
    }
  }, []);

  /* ─── IDLE ANIM ─── */
  useEffect(() => {
    const iv = setInterval(() => {
      if (avatarState === "idle" && !loading && !isSpeaking) triggerAnim("wave", 1200);
    }, 8000);
    return () => clearInterval(iv);
  }, [avatarState, loading, isSpeaking]);

  const triggerAnim = (state, ms = 1200) => {
    if (stateTimeout.current) clearTimeout(stateTimeout.current);
    setAvatarState(state);
    stateTimeout.current = setTimeout(() => setAvatarState("idle"), ms);
  };

  /* ─── PARTICLES ─── */
  const spawnParticles = () => {
    const emoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    const batch = Array.from({ length: 5 }, (_, i) => ({
      id: particleId.current++, emoji,
      x: Math.cos((i / 5) * 2 * Math.PI) * (40 + Math.random() * 20),
      y: Math.sin((i / 5) * 2 * Math.PI) * (40 + Math.random() * 20) - 20,
    }));
    setParticles(p => [...p, ...batch]);
    setTimeout(() => setParticles(p => p.filter(x => !batch.find(b => b.id === x.id))), 1000);
  };

  /* ─── TTS (iOS-safe Web Audio API playback) ─── */
  const speakText = async (text, companionId, voiceGender = "female", voicePersonality = "warm") => {
    if (!voiceEnabled) return;
    try {
      setIsSpeaking(true);
      triggerAnim("talk", 99999);
      const cleanText = text.replace(/[\*\_\~\#\>`]/g, "").slice(0, 400);
      if (!cleanText.trim()) { console.log("[TTS] Empty text, skipping"); setIsSpeaking(false); setAvatarState("idle"); return; }

      // Always try to resume AudioContext before TTS — critical on iOS
      try { await resumeAudioContext(); } catch (e) { console.warn("[TTS] Resume failed:", e?.message); }

      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          companionId,
          voiceGender,
          voicePersonality,
          profileId:   localStorage.getItem("userProfileId") || null,
          appleUserId: localStorage.getItem("unfiltr_apple_user_id") || null,
        }),
      });

      if (!ttsRes.ok) {
        let errBody = {};
        try { errBody = await ttsRes.json(); } catch { console.warn("[TTS] Could not parse error response body"); }
        console.warn("[TTS] API error:", ttsRes.status, errBody?.error || "");
        setIsSpeaking(false); setAvatarState("idle"); return;
      }

      const ttsData = await ttsRes.json();
      const base64 = ttsData?.data?.audio || ttsData?.audio; // support both { data: { audio } } and legacy { audio }
      if (!base64) {
        console.warn("[TTS] No audio in response");
        setIsSpeaking(false); setAvatarState("idle"); return;
      }

      // Resume again right before playback (iOS may have re-suspended during the API call)
      try { await resumeAudioContext(); } catch {}

      await playAudioFromBase64(base64);
      setIsSpeaking(false); setAvatarState("idle");
    } catch (e) {
      console.error("[TTS] speakText failed:", e?.message, e);
      setIsSpeaking(false); setAvatarState("idle");
      // Silently fall back to text-only — user already sees the reply
    }
  };

  /* ─── PHOTO ─── */
  const handlePhotoClick = () => {
    // Determine tier-based daily photo limit (free users get limited access, not a hard block)
    const tier = getTier();
    const photoLimit = PHOTO_DAILY_LIMITS[tier] ?? 2;
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem("unfiltr_photo_count") || '{"date":"","count":0}');
    const count = stored.date === today ? stored.count : 0;
    if (count >= photoLimit) {
      const upgradeMsg = tier === "free"
        ? `Free plan allows ${photoLimit} photos/day. Upgrade to send more! 📸`
        : `You've reached your ${photoLimit} photos/day limit. Come back tomorrow! 📸`;
      setPhotoLimitToast({ msg: upgradeMsg });
      setTimeout(() => setPhotoLimitToast(null), 3500);
      return;
    }
    const seen = localStorage.getItem("unfiltr_photo_disclaimer_seen");
    if (!seen) { setShowPhotoDisclaimer(true); return; }
    fileInputRef.current?.click();
  };

  const handlePhotoDisclaimerAccept = () => {
    localStorage.setItem("unfiltr_photo_disclaimer_seen", "1");
    setShowPhotoDisclaimer(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(",")[1];
      setPendingImage({ base64, preview: dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  /* ─── SEND ─── */
  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text && !pendingImage) return;
    if (loading) return;
    setLastFailedText(null);
    if (isAtLimit) { navigate('/Pricing'); return; }

    // Resume shared AudioContext on every user gesture (critical for iOS)
    resumeAudioContext().catch(() => {});
    // Stop any playing TTS to prevent overlap
    stopCurrentAudio();

    const userMsg = pendingImage
      ? { role: "user", content: text || "📷 What do you think?", imagePreview: pendingImage.preview, quoteReply: quoteReply || undefined }
      : { role: "user", content: text, quoteReply: quoteReply || undefined };
    setQuoteReply(null);
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    // Safety timeout — if anything hangs, force-clear loading after 30s
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setLastFailedText(text);
      setMessages(m => {
        if (m[m.length - 1]?.role === "user") return [...m, { role: "assistant", content: "__ERROR__" }];
        return m;
      });
    }, 30000);

    try {
      const name = companion.displayName || companion.name;
      const localMemSummary = memorySummary; // already seeded from DB during init and refreshed after each summarize
      const userContent = pendingImage ? (text || "What do you think of this?") : text;
      const history = [...messages, { role: "user", content: userContent }].slice(-10);

      const imgBase64 = pendingImage?.base64 || null;
      if (imgBase64) {
        const today = new Date().toDateString();
        const stored = JSON.parse(localStorage.getItem("unfiltr_photo_count") || '{"date":"","count":0}');
        const newCount = (stored.date === today ? stored.count : 0) + 1;
        localStorage.setItem("unfiltr_photo_count", JSON.stringify({ date: today, count: newCount }));
        setPhotoCount(newCount);
        setPendingImage(null);
      }

      // Build personality payload from cached localStorage values
      const personalityPayload = {
        vibe:      localStorage.getItem("unfiltr_personality_vibe")      || "chill",
        empathy:   localStorage.getItem("unfiltr_personality_empathy")   || "balanced",
        humor:     localStorage.getItem("unfiltr_personality_humor")     || "subtle",
        curiosity: localStorage.getItem("unfiltr_personality_curiosity") || "moderate",
        style:     localStorage.getItem("unfiltr_personality_style")     || "casual",
      };

      let cachedUserFacts = userFacts && Object.keys(userFacts).length > 0 ? userFacts : {};
      if (!Object.keys(cachedUserFacts).length) {
        try { cachedUserFacts = JSON.parse(localStorage.getItem("unfiltr_user_facts") || "{}"); } catch { cachedUserFacts = {}; }
      }

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          profileId:        localStorage.getItem("userProfileId") || null,
          sessionMemory:    sessionMemory,
          memorySummary:    localMemSummary || "",
          userFacts:        cachedUserFacts,
          imageBase64:      imgBase64,
          personality:      personalityPayload,
          relationshipMode: localStorage.getItem("unfiltr_relationship_mode") || "friend",
          userName:         localStorage.getItem("unfiltr_display_name") || "",
          appleUserId:      localStorage.getItem("unfiltr_apple_user_id") || localStorage.getItem("unfiltr_user_id") || "",
          companionName:    localStorage.getItem("unfiltr_companion_name") || "",
          ultimateFriend:   localStorage.getItem("unfiltr_ultimate_friend") === "true" || localStorage.getItem("unfiltr_is_annual") === "true",
        }),
      });
      if (!chatRes.ok) throw new Error(`Chat API error: ${chatRes.status}`);
      const chatData = await chatRes.json();
      const res = { data: chatData };

      const replyText = chatData?.reply || "...";

      // ── Fire-and-forget token tracking ───────────────────────────────────
      if (res.data?._usage) {
        const pid_tok = localStorage.getItem("userProfileId");
        if (pid_tok) {
          fetch("/api/utils", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action:       "trackTokens",
              profileId:    pid_tok,
              total_tokens: res.data._usage.total_tokens || 0,
              cost_usd:     res.data._usage.cost_usd     || 0,
            }),
          }).catch(() => {}); // silent fail — never blocks chat
        }
      }
      setMessages(m => [...m, { role: "assistant", content: replyText }]);

      // 💾 Save messages to DB via server proxy (fire-and-forget — never blocks chat)
      {
        const appleId = localStorage.getItem("unfiltr_apple_user_id");
        // Prefer companion.id from the live companion object; fall back to localStorage.
        // Never save under a null/missing companion_id.
        const compId  = companion?.id || localStorage.getItem("unfiltr_companion_id") || null;
        if (!appleId) {
          debugLog("[SaveMessages] Skipped — unfiltr_apple_user_id not set");
        } else if (!compId) {
          debugLog("[SaveMessages] Skipped — companion_id not set");
        } else {
          const now = new Date().toISOString();
          fetch("/api/base44", {
            method: "POST",
            keepalive: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "saveMessages",
              messages: [
                { apple_user_id: appleId, companion_id: compId, role: "user",      content: userContent, created_date: now },
                { apple_user_id: appleId, companion_id: compId, role: "assistant", content: replyText,   created_date: now },
              ],
            }),
          }).catch(() => {});
        }
      }

      // Crisis detection — check both client-side and server-side
      const lowerText = text.toLowerCase();
      const isCrisis = CRISIS_KEYWORDS.some(kw => lowerText.includes(kw)) || res.data?.crisis;

      // ── Meditation nudge detection ──────────────────────────────────────
      const STRESS_KEYWORDS = ["stressed","anxious","anxiety","overwhelmed","can't sleep","cant sleep","can't focus","panic","spiraling","need to calm","need to relax","so tired","exhausted","wound up","on edge","nervous"];
      const userSaidStress = STRESS_KEYWORDS.some(kw => lowerText.includes(kw));
      const lastNudge = parseInt(localStorage.getItem("unfiltr_last_med_nudge") || "0");
      const nudgeCooldown = Date.now() - lastNudge > 1000 * 60 * 30; // 30 min cooldown
      if (userSaidStress && nudgeCooldown) {
        localStorage.setItem("unfiltr_last_med_nudge", Date.now().toString());
        setTimeout(() => setShowMeditationNudge(true), 1200);
      }

      // ── Journal nudge detection ─────────────────────────────────────────
      const userSaidEmotional = JOURNAL_MOMENT_KEYWORDS.some(kw => lowerText.includes(kw));
      const lastJournalNudge = parseInt(localStorage.getItem("unfiltr_last_journal_nudge") || "0");
      const journalNudgeCooldown = Date.now() - lastJournalNudge > 1000 * 60 * 45; // 45 min cooldown
      if (userSaidEmotional && journalNudgeCooldown && !userSaidStress) {
        localStorage.setItem("unfiltr_last_journal_nudge", Date.now().toString());
        // Store recent chat context for one-tap journal save
        const recentMsgs = [...messages, { role: "user", content: userContent }, { role: "assistant", content: replyText }];
        const chatSnippet = recentMsgs.slice(-6).map(m => `${m.role === "user" ? "Me" : companionDisplayName}: ${m.content}`).join("\n");
        localStorage.setItem("unfiltr_journal_context", chatSnippet);
        setTimeout(() => setShowJournalNudge(true), 1400);
      }

      if (isCrisis) setShowCrisisBanner(true);

      const validMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue","excited","hopeful","lonely"];
      const newMood = validMoods.includes(res.data?.mood) ? res.data.mood : "neutral";
      setCompanionMood(newMood);
      if (companionDbId && companionDbId !== "pending") base44.entities.Companion.update(companionDbId, { mood_mode: newMood }).catch(() => {});

      incrementCount();
      spawnParticles();

      // ── Track consecutive messages → show save progress prompt at 8 ──────
      consecutiveMsgRef.current += 1;
      const SAVE_PROMPT_DELAY_MS = 600; // small delay so the reply bubble renders first
      const SAVE_PROMPT_THRESHOLD = 8;
      if (consecutiveMsgRef.current === SAVE_PROMPT_THRESHOLD) {
        consecutiveMsgRef.current = 0;
        const pref = getSavePreference();
        if (pref === "auto") {
          // Explicit save so we don't rely solely on the throttled useEffect
          const allMsgs = [...messages, { role: "user", content: userContent }, { role: "assistant", content: replyText }].slice(1);
          if (allMsgs.length >= 2) doUpsertChatHistory(allMsgs, null);
        } else {
          // "ask" preference or first time (no preference set) → show modal
          setTimeout(() => setShowSavePrompt(true), SAVE_PROMPT_DELAY_MS);
        }
      }

      const localCount = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10) + 1;
      localStorage.setItem("unfiltr_msg_total", String(localCount));
      const pid3 = localStorage.getItem("userProfileId");
      if (pid3) base44.entities.UserProfile.update(pid3, { message_count: localCount, last_active: new Date().toISOString() }).catch(() => {});

      // Voice — always read fresh from localStorage at call time so the user's
      // latest selection is used without any stale in-memory cache override.
      const vg = localStorage.getItem("unfiltr_voice_gender") || "female";
      const vp = localStorage.getItem("unfiltr_voice_personality") || "warm";
      speakText(replyText, companion.id, vg, vp);

      const totalMsgs = messages.filter(m => m.role === "user").length + 1;
      if (totalMsgs === 10) {
        const pid = localStorage.getItem("userProfileId");
        if (pid) base44.functions.invoke("ratingPrompt", { profileId: pid }).then(r => { if (r.data?.should_prompt) setShowRatingPrompt(true); }).catch(() => {});
      }

      const profileId2 = localStorage.getItem("userProfileId");
      const updatedMsgs = [...messages, { role: "user", content: userContent }, { role: "assistant", content: replyText }];
      const userMsgCount = updatedMsgs.filter(m => m.role === "user").length;
      // Save memory after every N user messages.
      // Tier priority: Annual/Pro > Plus > Free (check most specific first so
      // isPremium, which is true for all paid plans, doesn't mask Pro/Annual).
      const summarizeInterval = isAnnual || isPro ? 10 : isPremium ? 14 : 20;
      if (profileId2 && userMsgCount >= 3 && userMsgCount % summarizeInterval === 0) {
        const cName = companion.displayName || companion.name;
        // Retry helper with exponential backoff
        const trySummarize = async (attempt = 0) => {
          try {
            const sumRes = await fetch("/api/summarizeSession", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
                profileId: profileId2, companionName: cName,
              }),
            });
            const sumData = await sumRes.json();
            if (sumData?.ok && !sumData?.skipped) {
              try {
                const p = await base44.entities.UserProfile.get(profileId2);
                if (p?.session_memory) setSessionMemory(p.session_memory);
                if (p?.user_facts)     setUserFacts(p.user_facts);
                if (p?.memory_summary) setMemorySummary(p.memory_summary);
              } catch (profileErr) {
                console.warn("[Memory] Profile update fetch failed:", profileErr?.message);
              }
            }
          } catch (sumErr) {
            console.warn(`[Memory] Summarize attempt ${attempt + 1} failed:`, sumErr?.message);
            if (attempt < 2) {
              setTimeout(() => trySummarize(attempt + 1), (attempt + 1) * 2000);
            } else {
              console.error("[Memory] Summarize failed after retries — memory will save on next interval.");
            }
          }
        };
        trySummarize();
      }
    } catch (error) {
      console.error("Chat send failed:", error?.message || error, error?.response?.data);
      setLastFailedText(text);
      setMessages(m => [...m, { role: "assistant", content: "__ERROR__" }]);
      setIsSpeaking(false); setAvatarState("idle");
    } finally { clearTimeout(safetyTimer); setLoading(false); }
  };

  /* ─── VOICE ─── */
  const startListening = () => {
    // Resume AudioContext on mic tap (user gesture)
    resumeAudioContext().catch(() => {});

    // If running inside the iOS native wrapper, route through the native speech bridge
    if (isNativeApp()) {
      setIsListening(true);
      postToNative({ type: "START_SPEECH_RECOGNITION" });
      waitForNative(["SPEECH_RECOGNITION_RESULT", "SPEECH_RECOGNITION_ERROR"], 15000)
        .then(data => {
          const transcript = data?.transcript || data?.text || (typeof data === "string" ? data : "");
          if (transcript) handleSend(transcript);
        })
        .catch(err => {
          console.warn("[Speech] Native bridge error:", err?.message);
        })
        .finally(() => {
          setIsListening(false);
        });
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setAutosaveToast({ type: "error", msg: "Voice input isn't supported on this device. Try typing instead!" });
      setTimeout(() => setAutosaveToast(null), 3500);
      return;
    }
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    recognitionRef.current = r;
    r.onstart = () => setIsListening(true);
    r.onend = () => { setIsListening(false); recognitionRef.current = null; };
    r.onerror = (e) => { console.error("Speech error:", e.error); setIsListening(false); recognitionRef.current = null; };
    r.onresult = e => { const transcript = e.results[0][0].transcript; if (transcript) handleSend(transcript); };
    r.start();
  };
  const stopListening = () => { recognitionRef.current?.stop(); recognitionRef.current = null; setIsListening(false); };

  const handleMoodSelect = (mood) => {
    localStorage.setItem("unfiltr_mood_checkin_date", new Date().toDateString());
    setShowMoodCheckIn(false);
    // Immediately switch avatar to match the user's selected mood
    const moodToAvatarMap = {
      good: "happy",
      calm: "contentment",
      low: "sad",
      stressed: "fear",
      tired: "fatigue",
      hyped: "happy",
      happy: "happy",
      sad: "sad",
      anxious: "fear",
      frustrated: "anger",
      motivated: "happy",
      loved: "happy",
      hopeful: "hopeful",
      lonely: "lonely",
      excited: "excited",
      disgust: "disgust",
      surprise: "surprise",
      fatigue: "fatigue",
      fear: "fear",
      anger: "anger",
      neutral: "neutral",
    };
    const moodKey = (mood?.value || mood?.label || "").toLowerCase();
    const avatarMood = moodToAvatarMap[moodKey] || "neutral";
    setCompanionMood(avatarMood);
    localStorage.setItem("unfiltr_mood", avatarMood);
    // Send mood as first message context
    const moodText = `I'm feeling ${mood.label.toLowerCase()} ${mood.emoji} today`;
    handleSend(moodText);
  };

  const handleSaveToJournal = () => {
    // Grab the last several messages to use as journal context
    const recentMsgs = messages.slice(-8);
    const chatSnippet = recentMsgs.map(m => `${m.role === "user" ? "Me" : (companion?.displayName || companion?.name || "My companion")}: ${m.content}`).join("\n");
    localStorage.setItem("unfiltr_journal_context", chatSnippet);
    setShowJournalNudge(false);
    navigate("/journal/entry");
  };

  // ── Save progress modal handlers ──────────────────────────────────────────
  const handleSavePromptSave = () => {
    setShowSavePrompt(false);
    consecutiveMsgRef.current = 0;
    // Force an immediate DB upsert with current messages
    const allMsgs = messages.slice(1);
    if (allMsgs.length >= 2) {
      doUpsertChatHistory(allMsgs, null);
      syncChatSessionsToLocalStorage(allMsgs);
    }
  };

  const handleSavePromptAutoSave = () => {
    setSavePreference("auto");
    setShowSavePrompt(false);
    consecutiveMsgRef.current = 0;
    const allMsgs = messages.slice(1);
    if (allMsgs.length >= 2) {
      doUpsertChatHistory(allMsgs, null);
      syncChatSessionsToLocalStorage(allMsgs);
    }
  };

  const handleSavePromptAlwaysAsk = () => {
    setSavePreference("ask");
    setShowSavePrompt(false);
    consecutiveMsgRef.current = 0;
  };

  const handleSavePromptDismiss = () => {
    setShowSavePrompt(false);
    consecutiveMsgRef.current = 0;
  };

  const handleRetry = () => {
    if (!lastFailedText) return;
    // Remove the error message
    setMessages(m => m.filter(msg => msg.content !== "__ERROR__"));
    handleSend(lastFailedText);
  };

  const handleSubscribe = () => subscribeToPlan("monthly");
  const handleRestore = () => restorePurchases();

  /* ─── LOADING STATE ─── */
  if (!companion || !environment) return (
    <div style={{ position: "fixed", inset: 0, background: "#06020f", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const companionDisplayName = companion.displayName || companion.name;

  return (
    <>
      {/* Hidden file input — no `capture` attribute so iOS shows the standard
          picker (Photo Library + Take Photo). Using capture="environment"
          forces camera-only on iOS Safari/WKWebView and blocks gallery access. */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

      {/* ═══ MAIN WRAPPER — position:fixed; inset:0; flex column ═══ */}
      <div style={{
        position: "fixed",
        top: 0, bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 1,
        background: "#06020f",
        backgroundColor: "#06020f",
      }}>
        {/* ── Background image (3D parallax) ── */}
        <ParallaxBackground imageUrl={environment.bg} />
        <BackgroundEffect environmentId={environment.id} />
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 40%, rgba(6,2,15,0.6) 75%, rgba(6,2,15,0.9) 100%)" }} />

        <style>{`
          @keyframes particleFly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.3)} }
          @keyframes listenPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
          @keyframes speakPulse  { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
          @keyframes spin        { to { transform: rotate(360deg); } }
          @keyframes bannerSlide { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
          .particle     { animation: particleFly 1s ease-out forwards; }
          .listen-pulse { animation: listenPulse 0.8s ease-in-out infinite; }
        `}</style>

        {/* ── Autosave feedback toast ── */}
        {autosaveToast && (
          <div style={{
            position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, maxWidth: 340, width: "90%",
            background: autosaveToast.type === "limit" ? "rgba(251,191,36,0.95)" : "rgba(239,68,68,0.95)",
            color: "#1a1a1a", borderRadius: 12, padding: "10px 16px",
            fontSize: 13, fontWeight: 600, textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: "bannerSlide 0.3s ease-out",
          }}>
            {autosaveToast.type === "limit" ? "⚠️" : "❌"} {autosaveToast.msg}
          </div>
        )}

        {/* ── Photo / voice limit toast ── */}
        {photoLimitToast && (
          <div style={{
            position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, maxWidth: 340, width: "90%",
            background: "rgba(251,191,36,0.95)",
            color: "#1a1a1a", borderRadius: 12, padding: "10px 16px",
            fontSize: 13, fontWeight: 600, textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: "bannerSlide 0.3s ease-out",
          }}>
            ⚠️ {photoLimitToast.msg}
          </div>
        )}

        {/* ── Content layer ── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          display: "flex", flexDirection: "column",
          width: "100%",
          paddingTop: "env(safe-area-inset-top, 0px)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}>

          {/* ▓▓ 1. TOP MENU BAR — fixed at top ▓▓ */}
          <ChatHeader
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            isPremium={isPremium}
            messages={messages}
            companion={companion}
            setCompanion={setCompanion}
            navigate={navigate}
            setMessages={setMessages}
            vibe={vibe}
            companionDbId={companionDbId}
            onNavigateToSettings={() => {
              // Flag so ChatPage knows to restore messages on return
              sessionStorage.setItem("unfiltr_returning_from_settings", "1");
              navigate("/settings");
            }}
            onShowGames={() => setShowGames(true)}
            onShowMeditation={() => setShowMeditation(true)}
            onShowAchievements={() => setShowAchievements(true)}
            onShowBreathing={() => setShowBreathing(true)}
            onShowSleepStory={() => setShowSleepStory(true)}
            onShowTopics={() => setShowTopics(true)}
            onShowMoodInsights={() => setShowMoodInsights(true)}
            onShowTimeCapsule={() => setShowTimeCapsule(true)}
            onShowBookmarks={() => setShowBookmarks(true)}
            streak={streak}
            relationshipMode={relationshipMode}
            setRelationshipMode={(mode) => {
              setRelationshipMode(mode);
              localStorage.setItem("unfiltr_relationship_mode", mode);
            }}
          />

          {/* ▓▓ 2. FULL-SCREEN AVATAR + FLOATING BUBBLES ▓▓ */}
          {/* The avatar fills the entire vertical space between header and input bar */}
          {/* Speech bubbles float as absolute overlays — no scrolling chat history */}
          <div style={{
            flex: 1,
            position: "relative",
            width: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}>
            <style>{`
              @keyframes bubblePop {
                0%   { transform: scale(0.7) translateY(10px); opacity: 0; }
                65%  { transform: scale(1.04) translateY(-3px); opacity: 1; }
                100% { transform: scale(1)    translateY(0px);  opacity: 1; }
              }
              @keyframes bubbleFadeOut {
                0%   { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(0.88) translateY(-6px); }
              }
              @keyframes dotBounce {
                0%,60%,100% { transform: translateY(0px);  opacity: 0.45; }
                30%          { transform: translateY(-9px); opacity: 1;    }
              }
              @keyframes userBubblePop {
                0%   { transform: scale(0.75) translateX(12px); opacity: 0; }
                70%  { transform: scale(1.03) translateX(-2px); opacity: 1; }
                100% { transform: scale(1)    translateX(0px);  opacity: 1; }
              }
              @keyframes userBubbleFade {
                0%   { opacity: 1; transform: scale(1) translateX(0); }
                100% { opacity: 0; transform: scale(0.9) translateX(8px); }
              }
              @keyframes avatarFloat {
                0%,100% { transform: translateY(0px); }
                50%     { transform: translateY(-5px); }
              }
              @keyframes speakGlow {
                0%,100% { opacity: 0.35; transform: scale(1);    }
                50%     { opacity: 0.7;  transform: scale(1.07); }
              }
              @keyframes thinkSpin {
                0%   { transform: rotate(0deg) scale(1);    }
                50%  { transform: rotate(180deg) scale(1.1); }
                100% { transform: rotate(360deg) scale(1);  }
              }
            `}</style>

            {/* ── AVATAR — pinned to RIGHT half, stands from bottom ── */}
            <div style={{
              position: "absolute",
              top: 0, bottom: 0,
              right: 0,
              width: "58%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              overflow: "hidden",
            }}>
              {/* Speaking aura */}
              {isSpeaking && (
                <div style={{
                  position: "absolute",
                  bottom: "8%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "55vw",
                  height: "55vw",
                  maxWidth: 280,
                  maxHeight: 280,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
                  animation: "speakGlow 1.3s ease-in-out infinite",
                  pointerEvents: "none",
                  zIndex: 1,
                }} />
              )}

              {/* Particles */}
              {particles.map(p => (
                <div key={p.id} className="particle"
                  style={{ position: "absolute", bottom: "35%", left: "50%", transform: "translate(-50%,0)", "--tx": `${p.x}px`, "--ty": `${p.y}px`, fontSize: 14, zIndex: 5, pointerEvents: "none" }}>
                  {p.emoji}
                </div>
              ))}

              {/* Avatar image — full height, mood-aware scale */}
              {(() => {
                const MOOD_FRAME = {
                  happy:       { scale: 1.0,  yOffset: "0%"   },
                  neutral:     { scale: 1.0,  yOffset: "0%"   },
                  surprise:    { scale: 0.96, yOffset: "0%"   },
                  anger:       { scale: 1.05, yOffset: "-3%"  },
                  sad:         { scale: 1.2,  yOffset: "-10%" },
                  fear:        { scale: 1.15, yOffset: "-6%"  },
                  disgust:     { scale: 1.1,  yOffset: "-4%"  },
                  contentment: { scale: 1.05, yOffset: "-2%"  },
                  fatigue:     { scale: 1.18, yOffset: "-8%"  },
                  excited:     { scale: 1.05, yOffset: "-4%"  },
                  hopeful:     { scale: 1.02, yOffset: "-2%"  },
                  lonely:      { scale: 1.12, yOffset: "-6%"  },
                };
                const frame = MOOD_FRAME[companionMood] || MOOD_FRAME.neutral;
                return (
                  <div style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    transform: `scale(${frame.scale}) translateY(${frame.yOffset})`,
                    transformOrigin: "bottom center",
                    transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}>
                    <LiveAvatar
                      companionId={companion.id}
                      mood={companionMood}
                      isSpeaking={isSpeaking}
                      onClick={spawnParticles}
                      fullScreen={true}
                    />
                  </div>
                );
              })()}

              {/* Name tag at bottom */}
              <button onClick={() => setShowCompanionCard(true)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 10px", zIndex: 6, marginBottom: 2 }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
                  {companionDisplayName} {COMPANIONS.find(c => c.id === companion.id)?.emoji || ""}
                </span>
              </button>
            </div>

            {/* ── COMPANION SPEECH BUBBLE — LEFT side, anchored bottom, grows UP ── */}
            <div style={{
              position: "absolute",
              top: "6%",
              bottom: "46%",
              left: 14,
              right: "44%",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              pointerEvents: "none",
            }}>
              {(() => {
                const lastComp = [...messages].reverse().find(m => m.role === "assistant" && m.content !== "__ERROR__");

                if (loading) {
                  return (
                    <div style={{
                      background: "linear-gradient(145deg, rgba(55,15,105,0.95), rgba(35,5,75,0.98))",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "2px solid rgba(196,180,252,0.3)",
                      borderRadius: "22px 22px 22px 6px",
                      padding: "16px 20px",
                      width: "100%",
                      position: "relative",
                      boxShadow: "0 10px 40px rgba(88,28,135,0.65), inset 0 1px 0 rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      {/* Tail pointing down-left toward avatar */}
                      <svg width="18" height="20" viewBox="0 0 18 20" fill="none"
                        style={{ position: "absolute", left: 18, bottom: -16, zIndex: 1 }}>
                        <path d="M2 0 Q16 10 2 20 Z" fill="rgba(35,5,75,0.98)" />
                        <path d="M2 0 Q16 10 2 20" stroke="rgba(196,180,252,0.3)" strokeWidth="1.5" fill="none" />
                      </svg>
                      {/* Pixar-style thinking dots */}
                      {[0,1,2].map(d => (
                        <div key={d} style={{
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: d===0 ? "#a78bfa" : d===1 ? "#c084fc" : "#e879f9",
                          boxShadow: `0 0 10px ${d===0?"rgba(167,139,250,0.9)":d===1?"rgba(192,132,252,0.9)":"rgba(232,121,249,0.9)"}`,
                          animation: "dotBounce 1.4s ease-in-out infinite",
                          animationDelay: `${d * 0.2}s`,
                        }} />
                      ))}
                    </div>
                  );
                }

                if (!lastComp) return (
                  <div style={{
                    background: "linear-gradient(145deg, rgba(55,15,105,0.88), rgba(35,5,75,0.92))",
                    backdropFilter: "blur(20px)",
                    border: "2px solid rgba(196,180,252,0.2)",
                    borderRadius: "22px 22px 22px 6px",
                    padding: "14px 18px",
                    width: "100%",
                  }}>
                    <span style={{ color: "rgba(216,180,254,0.5)", fontSize: 14 }}>Say something to {companionDisplayName}… ✨</span>
                  </div>
                );

                return (
                  <div
                    key={lastComp.content.slice(0,40)}
                    style={{ animation: "bubblePop 0.38s cubic-bezier(0.34,1.56,0.64,1) both", width: "100%", position: "relative" }}
                  >
                    <div style={{
                      background: "linear-gradient(145deg, rgba(55,15,105,0.95), rgba(35,5,75,0.98))",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "2px solid rgba(196,180,252,0.3)",
                      borderRadius: "22px 22px 22px 6px",
                      padding: "14px 18px",
                      boxShadow: "0 10px 40px rgba(88,28,135,0.65), 0 2px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
                      position: "relative",
                    }}>
                      {/* Tail pointing DOWN toward avatar standing below */}
                      <svg width="20" height="22" viewBox="0 0 20 22" fill="none"
                        style={{ position: "absolute", left: 24, bottom: -18, zIndex: 1 }}>
                        <path d="M2 0 L18 0 Q2 11 10 22 Z" fill="rgba(35,5,75,0.98)" />
                        <path d="M2 0 Q2 11 10 22" stroke="rgba(196,180,252,0.3)" strokeWidth="1.5" fill="none" />
                      </svg>
                      <div>
                        <p style={{
                          color: "rgba(240,230,255,0.95)",
                          fontSize: 15,
                          lineHeight: 1.55,
                          margin: 0,
                          fontWeight: 500,
                          letterSpacing: "0.01em",
                        }}>
                          {lastComp.content}
                        </p>
                      </div>
                      {/* Mood emoji pill */}
                      {companionMood && companionMood !== "neutral" && (
                        <div style={{
                          position: "absolute",
                          top: -10,
                          right: -8,
                          background: "rgba(88,28,135,0.9)",
                          borderRadius: 999,
                          padding: "2px 7px",
                          fontSize: 13,
                          border: "1.5px solid rgba(196,180,252,0.25)",
                        }}>
                          {getMoodEmoji(companionMood)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── USER BUBBLE — bottom-right, shows ONLY while waiting for reply (loading) ── */}
            {/* This creates the flow: user sends → their bubble appears → dots → companion reply replaces everything */}
            {(() => {
              const lastUser = [...messages].reverse().find(m => m.role === "user");
              // Show user bubble while loading (waiting for AI)
              // After reply arrives it fades out naturally via animation
              if (!lastUser) return null;
              return (
                <div
                  key={lastUser.content.slice(0,40) + loading}
                  style={{
                    position: "absolute",
                    bottom: 28,
                    right: 14,
                    zIndex: 10,
                    maxWidth: "52%",
                    animation: loading
                      ? "userBubblePop 0.32s cubic-bezier(0.34,1.56,0.64,1) both"
                      : "userBubbleFade 0.5s ease forwards",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{
                    background: "linear-gradient(135deg, #7c3aed, #db2777)",
                    borderRadius: "18px 18px 4px 18px",
                    padding: "12px 16px",
                    boxShadow: "0 6px 24px rgba(124,58,237,0.55), 0 2px 8px rgba(0,0,0,0.4)",
                  }}>
                    <p style={{
                      color: "white",
                      fontSize: 15,
                      lineHeight: 1.45,
                      margin: 0,
                      fontWeight: 500,
                    }}>
                      {lastUser.content}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* ConversationStarters removed for clean look */}
          </div>

          {/* Quote reply bar */}
          {quoteReply && (
            <div style={{ flexShrink: 0, padding: "0 12px" }}>
              <QuoteReply quote={quoteReply} onClear={() => setQuoteReply(null)} />
            </div>
          )}

          {/* ▓▓ 4. TEXT INPUT — fixed at very bottom above safe area ▓▓ */}
          <ChatInputBar
            input={input}
            setInput={setInput}
            loading={loading}
            isListening={isListening}
            isPremium={isPremium}
            photoEnabled={true}
            pendingImage={pendingImage}
            setPendingImage={setPendingImage}
            companionDisplayName={companionDisplayName}
            handleSend={handleSend}
            startListening={startListening}
            stopListening={stopListening}
            handlePhotoClick={handlePhotoClick}
          />
        </div>
      </div>

      {/* PHOTO DISCLAIMER MODAL */}
      {showPhotoDisclaimer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowPhotoDisclaimer(false)}>
          <div style={{ width: "100%", background: "#1a0a2e", borderRadius: "24px 24px 0 0", padding: "24px 24px", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 999, margin: "0 auto 20px" }} />
            <p style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>📸</p>
            <h3 style={{ color: "white", fontWeight: 800, fontSize: 18, margin: "0 0 10px", textAlign: "center" }}>Share a Photo</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" }}>
              Photos you share are sent to the AI to respond to. They are not stored permanently and are only used for this conversation.
            </p>
            <button onClick={handlePhotoDisclaimerAccept}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
              Got it, share photo
            </button>
            <button onClick={() => setShowPhotoDisclaimer(false)}
              style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <RatingPromptModal visible={showRatingPrompt} onClose={() => setShowRatingPrompt(false)} />
      <ShareCardModal visible={!!shareCard} onClose={() => setShareCard(null)} message={shareCard?.message || ""} companionName={companionDisplayName} companionAvatar={companion?.avatar || companion?.poses?.neutral || companion?.poses?.happy || null} mood={shareCard?.mood || "neutral"} />

      {/* Mood Check-In */}
      <MoodCheckIn
        visible={showMoodCheckIn}
        onSelect={handleMoodSelect}
        onDismiss={() => { localStorage.setItem("unfiltr_mood_checkin_date", new Date().toDateString()); setShowMoodCheckIn(false); }}
        companionName={companionDisplayName}
      />

      {/* Achievement Badges */}
      <AchievementBadges visible={showAchievements} onClose={() => setShowAchievements(false)} />

      {/* Guided Meditation */}
      <GuidedMeditation visible={showMeditation} onClose={() => setShowMeditation(false)} companionName={companionDisplayName} />

      {/* Mini Games */}
      <MiniGames visible={showGames} onClose={() => setShowGames(false)}
        onSendMessage={(text) => handleSend(text)} />

      {/* Breathing Exercise */}
      <BreathingExercise visible={showBreathing} onClose={() => setShowBreathing(false)} />

      {/* Sleep Story */}
      <SleepStory visible={showSleepStory} onClose={() => setShowSleepStory(false)} companionName={companionDisplayName} />

      {/* Time Capsule */}
      <TimeCapsule visible={showTimeCapsule} onClose={() => setShowTimeCapsule(false)} companionName={companionDisplayName} />

      {/* Weekly Recap */}
      <WeeklyRecap visible={showWeeklyRecap} onClose={() => { markRecapShown(); setShowWeeklyRecap(false); }} companionName={companionDisplayName} />

      {/* Mood Insights */}
      <MoodInsights visible={showMoodInsights} onClose={() => setShowMoodInsights(false)} />

      {/* Conversation Topics */}
      <ConversationTopics visible={showTopics} onClose={() => setShowTopics(false)} onSelect={(text) => handleSend(text)} />

      {/* Bookmarks */}
      <BookmarksModal visible={showBookmarks} onClose={() => setShowBookmarks(false)} />

      {/* Companion Share Card */}
      <CompanionShareCard
        visible={showCompanionCard}
        onClose={() => setShowCompanionCard(false)}
        companionId={companion?.id}
        companionName={companionDisplayName}
        daysTogether={(() => { const c = localStorage.getItem("unfiltr_companion_created"); return c ? Math.max(1, Math.floor((Date.now() - new Date(c).getTime()) / 86400000)) : 0; })()}
      />

      {/* ── FIXED OVERLAYS — never affect flex layout ── */}
      <DailyAffirmation visible={showAffirmation} />
      <MissYouBanner />
      {/* MemoryCard rendered inline in flex column above messages */}
      <CrisisBanner visible={showCrisisBanner} onDismiss={() => setShowCrisisBanner(false)} />
      {showMeditationNudge && (
        <div style={{ position:"fixed", bottom:130, left:16, right:16, zIndex:80 }}>
          <div style={{
            background:"linear-gradient(135deg,rgba(14,165,233,0.22),rgba(125,211,252,0.1))",
            border:"1px solid rgba(125,211,252,0.4)", borderRadius:18,
            padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
            backdropFilter:"blur(12px)",
            boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <span style={{ fontSize:26, flexShrink:0 }}>🧘</span>
            <div style={{ flex:1 }}>
              <p style={{ color:"white", fontWeight:700, fontSize:13, margin:"0 0 2px" }}>Want to take a breath?</p>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:12, margin:0 }}>A quick meditation might help right now</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <button onClick={() => { setShowMeditationNudge(false); navigate("/meditate"); }}
                style={{ padding:"7px 12px", background:"linear-gradient(135deg,#0ea5e9,#7dd3fc)", border:"none", borderRadius:10, color:"white", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                Let's go
              </button>
              <button onClick={() => setShowMeditationNudge(false)}
                style={{ padding:"5px 12px", background:"rgba(255,255,255,0.07)", border:"none", borderRadius:10, color:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {showJournalNudge && (
        <div style={{ position:"fixed", bottom:130, left:16, right:16, zIndex:80 }}>
          <div style={{
            background:"linear-gradient(135deg,rgba(124,58,237,0.22),rgba(168,85,247,0.1))",
            border:"1px solid rgba(168,85,247,0.4)", borderRadius:18,
            padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
            backdropFilter:"blur(12px)",
            boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <span style={{ fontSize:26, flexShrink:0 }}>📓</span>
            <div style={{ flex:1 }}>
              <p style={{ color:"white", fontWeight:700, fontSize:13, margin:"0 0 2px" }}>Want to write about this?</p>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:12, margin:0 }}>Save this moment in your journal</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <button onClick={handleSaveToJournal}
                style={{ padding:"7px 12px", background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:10, color:"white", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                Write it
              </button>
              <button onClick={() => setShowJournalNudge(false)}
                style={{ padding:"5px 12px", background:"rgba(255,255,255,0.07)", border:"none", borderRadius:10, color:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save progress prompt (after 8 consecutive messages) ── */}
      <SaveProgressModal
        visible={showSavePrompt}
        context="chat"
        companionName={companion?.displayName || companion?.name || "your companion"}
        onSave={handleSavePromptSave}
        onAutoSave={handleSavePromptAutoSave}
        onAlwaysAsk={handleSavePromptAlwaysAsk}
        onDismiss={handleSavePromptDismiss}
      />

    </>
  );
}
