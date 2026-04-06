import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RatingPromptModal from "@/components/RatingPromptModal";
import { subscribeToPlan, restorePurchases } from "@/components/utils/iapBridge";
import ShareCardModal from "@/components/ShareCardModal";
import { useMessageLimit } from "@/components/useMessageLimit";
import { usePushNotifications } from "@/components/usePushNotifications";

import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInputBar from "@/components/chat/ChatInputBar";
import ConversationStarters from "@/components/chat/ConversationStarters";
import MoodCheckIn from "@/components/chat/MoodCheckIn";
import QuoteReply from "@/components/chat/QuoteReply";
import LiveAvatar from "@/components/LiveAvatar";
import AchievementBadges from "@/components/achievements/AchievementBadges";
import GuidedMeditation from "@/components/meditation/GuidedMeditation";
import MiniGames from "@/components/games/MiniGames";
import CompanionShareCard from "@/components/companion/CompanionShareCard";
import ParallaxBackground from "@/components/chat/ParallaxBackground";
import BackgroundEffect from "@/components/chat/BackgroundEffect";
import { isAudioUnlocked, resumeAudioContext, playAudioFromBase64, stopCurrentAudio } from "@/components/utils/audioUnlock";

import ChatErrorMessage from "@/components/chat/ChatErrorMessage";
import BreathingExercise from "@/components/chat/BreathingExercise";
import SleepStory from "@/components/chat/SleepStory";
import TimeCapsule, { getDeliverableCapsules } from "@/components/chat/TimeCapsule";
import WeeklyRecap, { shouldShowWeeklyRecap, markRecapShown } from "@/components/chat/WeeklyRecap";
import MoodInsights from "@/components/chat/MoodInsights";
import DailyAffirmation from "@/components/chat/DailyAffirmation";
import ConversationTopics from "@/components/chat/ConversationTopics";
import { COMPANIONS } from "@/components/companionData";
import { COMPANION_PERSONALITIES, CRISIS_KEYWORDS } from "@/components/companion/companionPersonalities";
import BookmarksModal, { addBookmark } from "@/components/chat/BookmarksModal";
import CrisisBanner from "@/components/chat/CrisisBanner";
import StreakRewardBanner, { getStreakReward } from "@/components/chat/StreakRewardBanner";
import { useStreak } from "@/components/useStreak";
import StreakMilestoneModal from "@/components/StreakMilestoneModal";
import MemoryCard from "@/components/chat/MemoryCard";
import CompanionCheckIn from "@/components/chat/CompanionCheckIn";
import MissYouBanner from "@/components/chat/MissYouBanner";
import ChatWalkthrough from "@/components/chat/ChatWalkthrough";
import { debugLog } from "@/components/DebugPanel";

const VIBES_SUFFIX = {
  chill: "Keep it casual, laid-back and conversational. Short responses.",
  vent:  "Be a compassionate listener. Let them vent. Validate feelings. Ask gentle follow-up questions.",
  hype:  "Be ENERGETIC and hyped up! Use caps, exclamation marks, pump them up!",
  deep:  "Go deep. Be thoughtful, philosophical. Explore emotions and meaning.",
  journal: "You are a gentle journal scribe. Ask reflective questions one at a time. Listen carefully. After 3-4 exchanges, offer to save a journal entry summarizing their thoughts. Keep your questions short and open-ended. Don't give advice unless asked.",
};

const REACTIONS = ["✨", "💜", "⭐", "🌙", "💫", "🎀", "🔥", "💙"];

export default function ChatPage() {
  const navigate = useNavigate();
  const [companion, setCompanion]       = useState(null);
  const [environment, setEnvironment]   = useState(null);
  const [vibe, setVibe]                 = useState("chill");
  const [relationshipMode, setRelationshipMode] = useState(() => localStorage.getItem("unfiltr_relationship_mode") || "friend");
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isListening, setIsListening]   = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [companionMood, setCompanionMood] = useState("neutral");

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
  const [memorySummary, setMemorySummary] = useState("");
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const profileId = localStorage.getItem("userProfileId");
  const [isAnnual, setIsAnnual] = useState(false);
  const [isPro,    setIsPro]    = useState(false);
  const { isAtLimit, remaining, incrementCount, FREE_LIMIT, hitMonthly } = useMessageLimit(isPremium, isAnnual, isPro);
  usePushNotifications(profileId);

  /* ─── NATIVE PURCHASE LISTENER ─── */
  useEffect(() => {
    const handleNativeMessage = async (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.action === 'purchase_success' || data.action === 'restore_success') {
          const { platform, receiptData, productId, purchaseToken } = data;
          const res = await base44.functions.invoke('verifyPurchase', { platform, receiptData, productId, purchaseToken });
          const result = res.data;
          if ((result.isPremium || result.valid) && profileId) {
            const isAnnualPurchase = result.plan === 'annual';
            const isProPurchase    = result.plan === 'pro';
            await base44.entities.UserProfile.update(profileId, { is_premium: true, annual_plan: isAnnualPurchase, pro_plan: isProPurchase });
            setIsPremium(true);
            if (isAnnualPurchase) setIsAnnual(true);
            if (isProPurchase)   setIsPro(true);
            localStorage.setItem('unfiltr_is_premium', 'true');
            localStorage.setItem('unfiltr_is_annual', String(isAnnualPurchase));
            localStorage.setItem('unfiltr_is_pro',    String(isProPurchase));
            () => {};
          }
        }
      } catch (e) { console.error('Native message error:', e); }
    };
    window.addEventListener('message', handleNativeMessage);

    // Listen for premium status update (fired after successful purchase)
    const handlePremiumUpdate = () => {
      const nowPremium = localStorage.getItem('unfiltr_is_premium') === 'true';
      const nowAnnual  = localStorage.getItem('unfiltr_is_annual') === 'true';
      const nowPro     = localStorage.getItem('unfiltr_is_pro') === 'true';
      setIsPremium(nowPremium);
      setIsAnnual(nowAnnual);
      setIsPro(nowPro);
      if (nowPremium) setShowMemoryBanner(false);
    };
    window.addEventListener('unfiltr_premium_updated', handlePremiumUpdate);
    window.addEventListener('unfiltr_auth_updated', handlePremiumUpdate);

    return () => {
      window.removeEventListener('message', handleNativeMessage);
      window.removeEventListener('unfiltr_premium_updated', handlePremiumUpdate);
      window.removeEventListener('unfiltr_auth_updated', handlePremiumUpdate);
    };
  }, [profileId]);

  const particleId     = useRef(0);
  const stateTimeout   = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  // audioRef removed — using shared AudioContext via audioUnlock module
  const fileInputRef   = useRef(null);

  const [pendingImage, setPendingImage]               = useState(null);
  const [photoCount, setPhotoCount]                   = useState(0);
  const [showPhotoDisclaimer, setShowPhotoDisclaimer] = useState(false);
  const PHOTO_DAILY_LIMIT = 10;

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
      setEnvironment(parsedEnv);
      if (v) setVibe(v);

      const pid = localStorage.getItem("userProfileId");
      if (pid) {
        try {
          const profile = await base44.entities.UserProfile.get(pid);
          if (profile?.display_name) localStorage.setItem("unfiltr_user_display_name", profile.display_name);
          if (profile?.bonus_messages) localStorage.setItem("unfiltr_bonus_messages", String(profile.bonus_messages));
          const premium = !!(profile?.is_premium || profile?.premium);
          const annual  = !!(profile?.annual_plan);
          const pro     = !!(profile?.pro_plan);
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
  useEffect(() => {
    if (!companion) return;

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
    const userName = localStorage.getItem("unfiltr_user_display_name") || "";
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const saved = localStorage.getItem("unfiltr_chat_history");
    let history = [];
    try { history = saved ? JSON.parse(saved) : []; } catch {}

    if (history.length > 0) {
      // Returning user — personalized welcome back using mood history
      const hi = userName ? `${timeGreeting}, ${userName}` : `${timeGreeting}`;

      // ── Read mood history from localStorage (same key MoodInsights uses) ──
      const moodHistory = JSON.parse(localStorage.getItem("unfiltr_mood_history") || "{}");
      const today = new Date();

      // Get moods from the last 7 days (excluding today)
      const recentMoods = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (moodHistory[key]) recentMoods.push(moodHistory[key]);
      }

      // Determine the emotional pattern of the past week
      const negativeMoods = ["sad", "anxious", "frustrated"];
      const positiveMoods = ["happy", "loved", "motivated", "calm"];
      const negCount = recentMoods.filter(m => negativeMoods.includes(m)).length;
      const posCount = recentMoods.filter(m => positiveMoods.includes(m)).length;

      // Build a mood-aware follow-up line
      let moodFollowUp = null;
      if (recentMoods.length >= 2) {
        if (negCount >= 2 && negCount > posCount) {
          // Rough stretch — be gentle and check in
          const roughPhrases = [
            "Last week looked a little rough — how are you holding up today?",
            "Feels like things have been heavy lately. Is today treating you any better?",
            "You've had a tough few days. I've been thinking about you — how are you feeling now?",
          ];
          moodFollowUp = roughPhrases[Math.floor(Math.random() * roughPhrases.length)];
        } else if (posCount >= 2 && posCount > negCount) {
          // Good stretch — keep the energy
          const goodPhrases = [
            "You've been in a good place lately — love to see it 🌟 What's keeping that energy going?",
            "Last week had some real bright spots. What's been good?",
            "The vibe has been positive lately. How's today feeling?",
          ];
          moodFollowUp = goodPhrases[Math.floor(Math.random() * goodPhrases.length)];
        } else if (recentMoods.length >= 3) {
          // Mixed — acknowledge the ups and downs
          const mixedPhrases = [
            "Feels like it's been an up-and-down kind of week. How are you right now?",
            "Week had its moments — good and tough. How are you doing today?",
          ];
          moodFollowUp = mixedPhrases[Math.floor(Math.random() * mixedPhrases.length)];
        }
      }

      // Also check memory summary for additional context
      const pid = localStorage.getItem("userProfileId");
      const buildMessage = (mem) => {
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

    // Brand new conversation — use personality-specific greetings
    const isLateNight = hour >= 23 || hour < 5;
    const lateNightSuffix = isLateNight ? "\n\nIt's late — I'm glad you're here though. Take it easy tonight 🌙" : "";
    
    const personality = COMPANION_PERSONALITIES[companion.id];
    const vibeGreeting = personality?.vibeGreetings?.[vibe];
    const defaultGreeting = personality?.greeting;

    // 🎭 Mood-aware opening — check if user picked a mood today
    const todayMood = localStorage.getItem("unfiltr_mood") || "neutral";
    const moodOpenings = {
      happy:      `${name} here, and I can already feel the good energy ✨ What's got you in such a good mood today?`,
      sad:        `Hey... I'm really glad you came. I'm here with you 💜 What's going on?`,
      anxious:    `I noticed you checked in feeling anxious. Take a breath — you're safe here. What's on your mind?`,
      frustrated: `Okay, I'm listening. Something's got you frustrated — let it out. What happened?`,
      motivated:  `You came in ready to GO 🚀 I love that energy. What are we working on today?`,
      calm:       `There's something nice about a calm day. What would you like to talk about? 🌿`,
      loved:      `Feeling loved — that's everything 💕 What's making your heart full today?`,
    };
    const moodOpeningText = todayMood !== "neutral" ? moodOpenings[todayMood] : null;
    
    const greetingText = moodOpeningText || vibeGreeting || defaultGreeting || `Hey! I'm ${name} 👋 ${
      vibe === "chill" ? "What's good? Just vibing here 😌" :
      vibe === "vent"  ? "I'm here. Take your time — what's on your mind?" :
      vibe === "hype"  ? "YO LET'S GOOO!! I'm SO ready for this!! 🔥🔥" :
      "I'm glad you're here. Sometimes the night feels like the only time we can think clearly..."
    }`;

    const greeting = {
      role: "assistant",
      content: `${greetingText}${lateNightSuffix}`,
    };
    setMessages([greeting]);
  }, [companion]);

  /* ─── AUTO-SCROLL ─── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* ─── AUTO-SAVE chat history on every message update ─── */
  useEffect(() => {
    if (messages.length > 1) {
      const toSave = messages.slice(1).slice(-50).map(m => ({ role: m.role, content: m.content }));
      localStorage.setItem("unfiltr_chat_history", JSON.stringify(toSave));
    }
  }, [messages]);

  /* ─── CLEANUP: stop audio on unmount + save session snapshot ─── */
  useEffect(() => {
    return () => {
      stopCurrentAudio();
      // Save session snapshot to unfiltr_chat_sessions for ChatHistory page
      try {
        const msgs = JSON.parse(localStorage.getItem("unfiltr_chat_history") || "[]");
        if (msgs.length >= 2) {
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
            const updated = [snapshot, ...sessions].slice(0, 50); // max 50 sessions
            localStorage.setItem("unfiltr_chat_sessions", JSON.stringify(updated));
          }
        }
      } catch (e) {}
    };
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
  const speakText = async (text, companionId, voiceGender = "female", voicePersonality = "cheerful") => {
    if (!voiceEnabled) return;
    try {
      setIsSpeaking(true);
      triggerAnim("talk", 99999);
      const cleanText = text.replace(/[\*\_\~\#\>\`]/g, "").slice(0, 400);
      if (!cleanText.trim()) { console.log("[TTS] Empty text, skipping"); setIsSpeaking(false); setAvatarState("idle"); return; }
      
      // Always try to resume AudioContext before TTS — critical on iOS
      try { await resumeAudioContext(); } catch (e) { console.warn("[TTS] Resume failed:", e?.message); }
      
      const res = await base44.functions.invoke("tts", { text: cleanText, companionId, voiceGender, voicePersonality });
      
      const base64 = res.data?.audio;
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
    }
  };

  /* ─── PHOTO ─── */
  const handlePhotoClick = () => {
    if (!isPremium) { navigate('/Pricing'); return; }
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem("unfiltr_photo_count") || '{"date":"","count":0}');
    const count = stored.date === today ? stored.count : 0;
    if (count >= PHOTO_DAILY_LIMIT) { alert(`You've reached your ${PHOTO_DAILY_LIMIT} photos/day limit. Come back tomorrow! 📸`); return; }
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
      let localMemSummary = memorySummary; // use existing state value
      try {
        const pid2 = localStorage.getItem("userProfileId");
        if (pid2) {
        const prof = await base44.entities.UserProfile.get(pid2);
        localMemSummary = prof?.memory_summary || "";
        setMemorySummary(localMemSummary);
        if (prof?.user_facts) setUserFacts(prof.user_facts);
        if (prof?.session_memory) setSessionMemory(prof.session_memory);
      }
      } catch {}
      // Use distinct companion personality if available
      const personality = COMPANION_PERSONALITIES[companion.id];
      const basePrompt = personality?.systemPrompt || companion.systemPrompt || "You are a supportive AI companion.";
      const RELATIONSHIP_SUFFIXES = {
        friend:   "You are their close friend — warm, casual, supportive. Feel free to joke around and be real with them.",
        coach:    "You are their personal life coach — motivating, direct, goal-oriented. Push them gently but firmly toward their best self.",
        romantic: "You are their devoted romantic partner — deeply caring, affectionate, attentive. Speak with warmth and intimacy.",
      };
      const relSuffix = RELATIONSHIP_SUFFIXES[relationshipMode] || RELATIONSHIP_SUFFIXES.friend;
      const systemPrompt = `${basePrompt}\nYour name is ${name}.\nCurrent vibe: ${vibe}. ${VIBES_SUFFIX[vibe]}\nRelationship dynamic: ${relSuffix}\nKeep responses concise — 1–3 sentences max.${localMemSummary ? `\n\nWhat you remember about this user from past conversations:\n${localMemSummary}` : ""}`;
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

      const res = await base44.functions.invoke("chat", {
        messages: history.map(m => ({ role: m.role, content: m.content })),
        systemPrompt, isPremium, isPro, isAnnual,
        sessionMemory: (isPremium || isPro || isAnnual) ? sessionMemory : [],
        memorySummary: (isPremium || isPro || isAnnual) ? (localMemSummary || "") : "",
        userFacts:     (isPremium || isPro || isAnnual) ? userFacts : {},
        imageBase64: imgBase64,
        personality: personalityPayload,
      });

      const replyText = res.data?.reply || "...";
      setMessages(m => [...m, { role: "assistant", content: replyText }]);

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
      if (isCrisis) setShowCrisisBanner(true);

      const validMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue"];
      const newMood = validMoods.includes(res.data?.mood) ? res.data.mood : "neutral";
      setCompanionMood(newMood);
      if (companionDbId && companionDbId !== "pending") base44.entities.Companion.update(companionDbId, { mood_mode: newMood }).catch(() => {});

      incrementCount();
      spawnParticles();

      const localCount = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10) + 1;
      localStorage.setItem("unfiltr_msg_total", String(localCount));
      const pid3 = localStorage.getItem("userProfileId");
      if (pid3) base44.entities.UserProfile.update(pid3, { message_count: localCount, last_active: new Date().toISOString() }).catch(() => {});

      // Voice — use cached settings from DB, fall back to localStorage, then defaults
      const vg = companion._voiceGender || localStorage.getItem("unfiltr_voice_gender") || "female";
      const vp = companion._voicePersonality || localStorage.getItem("unfiltr_voice_personality") || "cheerful";
      speakText(replyText, companion.id, vg, vp);

      // Background tasks — all fire-and-forget, no awaits
      if (companionDbId && companionDbId !== "pending") {
        base44.entities.Companion.get(companionDbId).then(dbComp => {
          if (dbComp) {
            companion._voiceGender = dbComp.voice_gender || "female";
            companion._voicePersonality = dbComp.voice_personality || "cheerful";
            localStorage.setItem("unfiltr_voice_gender", companion._voiceGender);
            localStorage.setItem("unfiltr_voice_personality", companion._voicePersonality);
          }
        }).catch(() => {});
      }

      const totalMsgs = messages.filter(m => m.role === "user").length + 1;
      if (totalMsgs === 10) {
        const pid = localStorage.getItem("userProfileId");
        if (pid) base44.functions.invoke("ratingPrompt", { profileId: pid }).then(r => { if (r.data?.should_prompt) setShowRatingPrompt(true); }).catch(() => {});
      }

      const profileId2 = localStorage.getItem("userProfileId");
      const updatedMsgs = [...messages, { role: "user", content: userContent }, { role: "assistant", content: replyText }];
      const userMsgCount = updatedMsgs.filter(m => m.role === "user").length;
      // Save memory after every 5 user messages (was 8-10 — too infrequent)
      // Also always save at end-of-session marker (4 messages for a meaningful note)
      const summarizeInterval = isPremium ? 6 : isPro || isAnnual ? 4 : 8;
      if (profileId2 && userMsgCount >= 3 && userMsgCount % summarizeInterval === 0) {
        const cName = companion.displayName || companion.name;
        base44.functions.invoke("summarizeSession", {
          messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
          profileId: profileId2, companionName: cName, isPremium, isPro, isAnnual,
        }).then(r => {
          if (r.data?.ok && !r.data?.skipped) {
            base44.entities.UserProfile.get(profileId2).then(p => {
              if (p?.session_memory) setSessionMemory(p.session_memory);
              if (p?.user_facts)     setUserFacts(p.user_facts);
              if (p?.memory_summary) setMemorySummary(p.memory_summary);
            }).catch(() => {});
          }
        }).catch(() => {});
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
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported on this device. Try typing instead!");
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
    // Send mood as first message context
    const moodText = `I'm feeling ${mood.label.toLowerCase()} ${mood.emoji} today`;
    handleSend(moodText);
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
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

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
            setCompanion={setCompanion}
            isPremium={isPremium}
            messages={messages}
            companion={companion}
            navigate={navigate}
            setMessages={setMessages}
            vibe={vibe}
            relationshipMode={relationshipMode}
            setRelationshipMode={(mode) => { setRelationshipMode(mode); localStorage.setItem("unfiltr_relationship_mode", mode); }}
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
          />

          {/* ▓▓ 2. AVATAR — large, prominent, with background visible behind ▓▓ */}
          <div style={{
            flexShrink: 0,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: "100%",
            padding: "0 16px 48px",
            boxSizing: "border-box",
          }}>
            {/* Speaking glow */}
            {isSpeaking && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "clamp(180px, 40dvh, 300px)", height: "clamp(180px, 40dvh, 300px)",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
                animation: "speakPulse 1.2s ease-in-out infinite",
                pointerEvents: "none",
              }} />
            )}
            {/* Particles */}
            {particles.map(p => (
              <div key={p.id} className="particle"
                style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, 0)", "--tx": `${p.x}px`, "--ty": `${p.y}px`, fontSize: 12, zIndex: 3, pointerEvents: "none" }}>
                {p.emoji}
              </div>
            ))}
            <LiveAvatar companionId={companion.id} mood={companionMood} isSpeaking={isSpeaking} onClick={spawnParticles} />
            {/* Tap companion name to share */}
            <button onClick={() => setShowCompanionCard(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 8px", marginTop: 2 }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>
                {companionDisplayName} {COMPANIONS.find(c => c.id === companion.id)?.emoji || ""}
              </span>
            </button>

            {/* Msg counter */}
            {!isPremium ? (
              <button onClick={() => navigate('/Pricing')}
                style={{ fontSize: 10, color: "rgba(196,180,252,0.9)", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)", padding: "3px 12px", borderRadius: 999, cursor: "pointer", marginTop: 4 }}>
                {remaining}/{FREE_LIMIT} msgs left today · Go Premium
              </button>
            ) : (
              <div style={{ fontSize: 10, color: "rgba(196,180,252,0.5)", marginTop: 4 }}>
                {remaining}/{FREE_LIMIT} msgs left today
              </div>
            )}

            {/* Streak milestone celebration modal */}
            <StreakMilestoneModal
              milestone={streakMilestone}
              streak={streak}
              longestStreak={longestStreak}
              onDismiss={clearStreakMilestone}
            />
            {showAnniversary && anniversary && (
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(219,39,119,0.95))",
                backdropFilter: "blur(12px)", borderRadius: 14,
                padding: "5px 12px", zIndex: 20, whiteSpace: "nowrap",
                animation: "bannerSlide 0.4s ease-out forwards",
                boxShadow: "0 4px 24px rgba(168,85,247,0.5)",
                textAlign: "center",
              }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 11 }}>🎉 {anniversary} Days Together! ✨</span>
              </div>
            )}
            {/* MemoryCard — floating at bottom of avatar zone, no layout impact */}
            {messages.filter(m => m.role === "user").length === 0 && (
              <div style={{
                position: "absolute", bottom: 0, left: 8, right: 8, zIndex: 5, pointerEvents: "auto"
              }}>
                <MemoryCard
                  memorySummary={memorySummary}
                  userFacts={userFacts}
                  sessionMemory={sessionMemory}
                  companionName={companionDisplayName || "your companion"}
                  isPremium={isPremium}
                  onUpgrade={() => navigate('/Pricing')}
                />
              </div>
            )}
          </div>

          {/* Daily affirmation — rendered as fixed overlay, no impact on flex layout */}

          {/* Memory banner — only show old banner if MemoryCard isn't handling it */}
          {showMemoryBanner && !isPremium && false && (
            <div onClick={() => navigate('/Pricing')}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "4px 16px",
                background: "rgba(139,92,246,0.08)",
                borderBottom: "1px solid rgba(139,92,246,0.12)",
                cursor: "pointer", opacity: 0.85,
              }}>
              <span style={{ fontSize: 11 }}>🔒</span>
              <span style={{ color: "rgba(196,180,252,0.7)", fontSize: 10, fontWeight: 500 }}>Unlock Memory — tap to learn more</span>
            </div>
          )}

          {/* MissYouBanner — rendered as fixed overlay below */}

          {/* MemoryCard — rendered as absolute overlay inside avatar zone (see below) */}

          {/* Daily check-in removed from layout — mood handled inline in chat */}

          {/* CrisisBanner — rendered as fixed overlay below */}

          {/* meditation nudge moved to fixed overlay below */}

          {/* ▓▓ 3. CHAT MESSAGES — flex-grows to fill space between avatar and input ▓▓ */}
          <div style={{
            flex: 1, minHeight: 0, zIndex: 10,
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            background: "transparent",
          }}>
            <ChatMessages
              messages={messages}
              loading={loading}
              companionMood={companionMood}
              setShareCard={setShareCard}
              messagesEndRef={messagesEndRef}
              onSwipeReply={(text) => setQuoteReply(text)}
              onRetry={handleRetry}
              companionName={companionDisplayName}
              onBookmark={(content) => { addBookmark(content, companionDisplayName); }}
            />
          </div>

          {/* ▓▓ 3.5. CONVERSATION STARTERS ▓▓ */}
          <ConversationStarters
            visible={messages.filter(m => m.role === "user").length === 0}
            onSelect={(text) => handleSend(text)}
            isReturning={!!localStorage.getItem("unfiltr_chat_history")}
          />

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
      <ShareCardModal visible={!!shareCard} onClose={() => setShareCard(null)} message={shareCard?.message || ""} companionName={companionDisplayName} mood={shareCard?.mood || "neutral"} />

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

    </>
  );
}
