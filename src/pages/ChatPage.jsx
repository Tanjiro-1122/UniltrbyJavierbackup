import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RatingPromptModal from "@/components/RatingPromptModal";
import { subscribeToPlan, restorePurchases } from "@/components/utils/iapBridge";
import ShareCardModal from "@/components/ShareCardModal";
import PaywallModal from "@/components/PaywallModal";
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

import { COMPANIONS } from "@/components/companionData";

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
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isListening, setIsListening]   = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [companionMood, setCompanionMood] = useState("neutral");
  const [companionDbId, setCompanionDbId] = useState(null);
  const [isPremium, setIsPremium]       = useState(false);
  const [sessionMemory, setSessionMemory] = useState([]);
  const [showPaywall, setShowPaywall]   = useState(false);
  const [showMemoryBanner, setShowMemoryBanner] = useState(false);
  const [avatarState, setAvatarState]   = useState("idle");
  const [particles, setParticles]       = useState([]);
  const [streak, setStreak]             = useState(0);
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

  const profileId = localStorage.getItem("userProfileId");
  const { isAtLimit, remaining, incrementCount, FREE_LIMIT } = useMessageLimit(isPremium);
  usePushNotifications(profileId);

  /* ─── NATIVE PURCHASE LISTENER ─── */
  useEffect(() => {
    const handleNativeMessage = async (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.action === 'purchase_success' || data.action === 'restore_success') {
          const { platform, receiptData, productId, purchaseToken } = data;
          const res = await fetch('/functions/verifyPurchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, receiptData, productId, purchaseToken })
          });
          const result = await res.json();
          if (result.valid && profileId) {
            await base44.entities.UserProfile.update(profileId, { is_premium: true, annual_plan: result.plan === 'annual' });
            setIsPremium(true);
            setShowPaywall(false);
          }
        }
      } catch (e) { console.error('Native message error:', e); }
    };
    window.addEventListener('message', handleNativeMessage);
    return () => window.removeEventListener('message', handleNativeMessage);
  }, [profileId]);

  const particleId     = useRef(0);
  const stateTimeout   = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef       = useRef(null);
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
      if (!c || !e) { navigate("/"); return; }

      const parsedCompanion = JSON.parse(c);
      const parsedEnv       = JSON.parse(e);
      const savedNickname = localStorage.getItem("unfiltr_companion_nickname");
      parsedCompanion.displayName = (savedNickname && savedNickname.trim()) ? savedNickname.trim() : parsedCompanion.name;

      setCompanion(parsedCompanion);
      setEnvironment(parsedEnv);
      if (v) setVibe(v);

      const pid = localStorage.getItem("userProfileId");
      if (pid) {
        try {
          const profile = await base44.entities.UserProfile.get(pid);
          const premium = !!(profile?.is_premium || profile?.premium);
          setIsPremium(premium);
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
              // Cache voice settings immediately so first message uses correct voice
              if (dbComp?.voice_gender) localStorage.setItem("unfiltr_voice_gender", dbComp.voice_gender);
              if (dbComp?.voice_personality) localStorage.setItem("unfiltr_voice_personality", dbComp.voice_personality);
            } catch {}
          }
        } catch {}
      }

      // Streak
      const todayStr = new Date().toDateString();
      const streakData = JSON.parse(localStorage.getItem("unfiltr_streak") || '{"date":"","count":0}');
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      let newStreak = 1;
      if (streakData.date === yesterday.toDateString()) newStreak = streakData.count + 1;
      else if (streakData.date === todayStr) newStreak = streakData.count;
      if (streakData.date !== todayStr) {
        localStorage.setItem("unfiltr_streak", JSON.stringify({ date: todayStr, count: newStreak }));
        if (newStreak > 1) { setStreak(newStreak); setShowStreakBanner(true); setTimeout(() => setShowStreakBanner(false), 4000); }
        else setStreak(newStreak);
      } else { setStreak(streakData.count); }

      // Mood check-in (once per day)
      const moodToday = localStorage.getItem("unfiltr_mood_checkin_date");
      if (moodToday !== todayStr) setShowMoodCheckIn(true);

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
    const name = companion.displayName || companion.name;
    const greeting = {
      role: "assistant",
      content: `Hey! I'm ${name} 👋 ${
        vibe === "chill" ? "What's good? Just vibing here 😌" :
        vibe === "vent"  ? "I'm here. Take your time — what's on your mind?" :
        vibe === "hype"  ? "YO LET'S GOOO!! I'm SO ready for this!! 🔥🔥" :
        "I'm glad you're here. Sometimes the night feels like the only time we can think clearly..."
      }`,
    };

    const welcomeBack = localStorage.getItem("unfiltr_welcome_back");
    if (welcomeBack) {
      localStorage.removeItem("unfiltr_welcome_back");
      const saved = localStorage.getItem("unfiltr_chat_history");
      let history = [];
      try { history = saved ? JSON.parse(saved) : []; } catch {}
      const welcomeMsg = { role: "assistant", content: `Hey, welcome back! 💜 I remember our last chat. Ready to pick up where we left off?` };
      setMessages(history.length > 0 ? [welcomeMsg, ...history] : [welcomeMsg]);
      return;
    }

    const saved = localStorage.getItem("unfiltr_chat_history");
    if (saved) {
      try {
        const history = JSON.parse(saved);
        if (history.length > 0) { setMessages([greeting, ...history]); return; }
      } catch {}
    }
    setMessages([greeting]);
  }, [companion]);

  /* ─── AUTO-SCROLL ─── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

  /* ─── TTS ─── */
  const speakText = async (text, companionId, voiceGender = "female", voicePersonality = "cheerful") => {
    if (!voiceEnabled) return;
    try {
      setIsSpeaking(true);
      triggerAnim("talk", 99999);
      const cleanText = text.replace(/[\*\_\~\#\>\`]/g, "").slice(0, 400);
      if (!cleanText.trim()) { setIsSpeaking(false); setAvatarState("idle"); return; }
      const res = await base44.functions.invoke("tts", { text: cleanText, companionId, voiceGender, voicePersonality });
      const base64 = res.data?.audio;
      if (!base64) { console.warn("TTS: no audio returned"); setIsSpeaking(false); setAvatarState("idle"); return; }
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = audio.onerror = () => { setIsSpeaking(false); setAvatarState("idle"); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) { console.warn("TTS failed:", e?.message); setIsSpeaking(false); setAvatarState("idle"); }
  };

  /* ─── PHOTO ─── */
  const handlePhotoClick = () => {
    if (!isPremium) { setShowPaywall(true); return; }
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
    if (isAtLimit) { setShowPaywall(true); return; }

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
      setMessages(m => {
        if (m[m.length - 1]?.role === "user") return [...m, { role: "assistant", content: "Hmm, that took too long. Try again? 🌙" }];
        return m;
      });
    }, 30000);

    try {
      const name = companion.displayName || companion.name;
      let memorySummary = "";
      try {
        const pid2 = localStorage.getItem("userProfileId");
        if (pid2) { const prof = await base44.entities.UserProfile.get(pid2); memorySummary = prof?.memory_summary || ""; }
      } catch {}
      const systemPrompt = `${companion.systemPrompt}\nYour name is ${name}.\nCurrent vibe: ${vibe}. ${VIBES_SUFFIX[vibe]}\nKeep responses concise — 1–3 sentences max.${memorySummary ? `\n\nWhat you remember about this user from past conversations:\n${memorySummary}` : ""}`;
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

      const res = await base44.functions.invoke("chat", {
        messages: history.map(m => ({ role: m.role, content: m.content })),
        systemPrompt, isPremium,
        sessionMemory: isPremium ? sessionMemory : [],
        memorySummary: memorySummary || "",
        imageBase64: imgBase64,
      });

      const replyText = res.data?.reply || "...";
      setMessages(m => {
        const updated = [...m, { role: "assistant", content: replyText }];
        const toSave = updated.slice(1).slice(-50).map(msg => ({ role: msg.role, content: msg.content }));
        localStorage.setItem("unfiltr_chat_history", JSON.stringify(toSave));
        return updated;
      });

      const validMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue"];
      const newMood = validMoods.includes(res.data?.mood) ? res.data.mood : "neutral";
      console.log("[Mood] detected:", res.data?.mood, "→ applied:", newMood);
      setCompanionMood(newMood);
      if (companionDbId && companionDbId !== "pending") base44.entities.Companion.update(companionDbId, { mood_mode: newMood }).catch(() => {});

      incrementCount();
      spawnParticles();

      const localCount = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10) + 1;
      localStorage.setItem("unfiltr_msg_total", String(localCount));
      const pid3 = localStorage.getItem("userProfileId");
      if (pid3) base44.entities.UserProfile.update(pid3, { message_count: localCount }).catch(() => {});

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

      const totalMsgs = [...messages, { role: "user" }].filter(m => m.role === "user").length;
      if (totalMsgs === 10) {
        const pid = localStorage.getItem("userProfileId");
        if (pid) base44.functions.invoke("ratingPrompt", { profileId: pid }).then(r => { if (r.data?.should_prompt) setShowRatingPrompt(true); }).catch(() => {});
      }

      const profileId2 = localStorage.getItem("userProfileId");
      const updatedMsgs = [...messages, { role: "user", content: userContent }, { role: "assistant", content: replyText }];
      const userMsgCount = updatedMsgs.filter(m => m.role === "user").length;
      const summarizeInterval = isPremium ? 10 : 5;
      if (profileId2 && userMsgCount >= 3 && userMsgCount % summarizeInterval === 0) {
        const cName = companion.displayName || companion.name;
        base44.functions.invoke("summarizeSession", {
          messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
          profileId: profileId2, companionName: cName, isPremium,
        }).then(r => {
          if (r.data?.ok && !r.data?.skipped) {
            base44.entities.UserProfile.get(profileId2).then(p => { if (p?.session_memory) setSessionMemory(p.session_memory); }).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch (error) {
      console.error("Chat send failed:", error?.message || error, error?.response?.data);
      const fallbackText = error?.response?.data?.error || error?.message || "Hmm, lost the signal. Try again? 🌙";
      setMessages(m => [...m, { role: "assistant", content: fallbackText }]);
      setIsSpeaking(false); setAvatarState("idle");
    } finally { clearTimeout(safetyTimer); setLoading(false); }
  };

  /* ─── VOICE ─── */
  const startListening = () => {
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

  const handleSubscribe = () => subscribeToPlan("monthly");
  const handleRestore = () => restorePurchases();

  /* ─── LOADING STATE ─── */
  if (!companion || !environment) return (
    <div style={{ position: "fixed", inset: 0, background: "#1a0533", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
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
        inset: 0,
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 1,
        background: "#1a0533",
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
            isPremium={isPremium}
            messages={messages}
            companion={companion}
            navigate={navigate}
            setMessages={setMessages}
            vibe={vibe}
            onShowGames={() => setShowGames(true)}
            onShowMeditation={() => setShowMeditation(true)}
            onShowAchievements={() => setShowAchievements(true)}
          />

          {/* ▓▓ 2. AVATAR — large, prominent, with background visible behind ▓▓ */}
          <div style={{
            flexShrink: 0,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: "100%",
            padding: "0 16px",
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

            {/* Free msg counter */}
            {!isPremium && (
              <button onClick={() => setShowPaywall(true)}
                style={{ fontSize: 10, color: "rgba(196,180,252,0.9)", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)", padding: "3px 12px", borderRadius: 999, cursor: "pointer", marginTop: 4 }}>
                {remaining}/{FREE_LIMIT} msgs left · Unlock unlimited
              </button>
            )}

            {/* Streak banner */}
            {showStreakBanner && (
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(135deg, rgba(234,88,12,0.9), rgba(239,68,68,0.9))",
                backdropFilter: "blur(12px)", borderRadius: 999,
                padding: "5px 12px", zIndex: 20, whiteSpace: "nowrap",
                animation: "bannerSlide 0.4s ease-out forwards",
                boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
              }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 11 }}>🔥 {streak} day streak!</span>
              </div>
            )}
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
          </div>

          {/* Memory banner */}
          {showMemoryBanner && !isPremium && (
            <div onClick={() => setShowPaywall(true)}
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

          {/* ▓▓ 3. CHAT MESSAGES — scrollable middle section ▓▓ */}
          <div style={{
            flex: 1, minHeight: 0,
            display: "flex", flexDirection: "column",
            background: "linear-gradient(180deg, rgba(6,2,15,0.3) 0%, rgba(6,2,15,0.85) 30%)",
            overflow: "hidden",
            borderRadius: "16px 16px 0 0",
          }}>
            <ChatMessages
              messages={messages}
              loading={loading}
              companionMood={companionMood}
              setShareCard={setShareCard}
              messagesEndRef={messagesEndRef}
              onSwipeReply={(text) => setQuoteReply(text)}
            />
          </div>

          {/* ▓▓ 3.5. CONVERSATION STARTERS ▓▓ */}
          <ConversationStarters
            visible={messages.filter(m => m.role === "user").length === 0}
            onSelect={(text) => handleSend(text)}
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

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribe={handleSubscribe} onRestore={handleRestore} isAndroid={/android/i.test(navigator.userAgent)} />
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

      {/* Companion Share Card */}
      <CompanionShareCard
        visible={showCompanionCard}
        onClose={() => setShowCompanionCard(false)}
        companionId={companion?.id}
        companionName={companionDisplayName}
        daysTogether={(() => { const c = localStorage.getItem("unfiltr_companion_created"); return c ? Math.max(1, Math.floor((Date.now() - new Date(c).getTime()) / 86400000)) : 0; })()}
      />
    </>
  );
}