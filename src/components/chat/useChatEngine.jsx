import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMessageLimit } from "@/components/useMessageLimit";
import { usePushNotifications } from "@/components/usePushNotifications";
import { isAudioUnlocked } from "@/components/utils/audioUnlock";
import { COMPANIONS } from "@/components/companionData";

const VIBES_SUFFIX = {
  chill: "Keep it casual, laid-back and conversational. Short responses.",
  vent:  "Be a compassionate listener. Let them vent. Validate feelings. Ask gentle follow-up questions.",
  hype:  "Be ENERGETIC and hyped up! Use caps, exclamation marks, pump them up!",
  deep:  "Go deep. Be thoughtful, philosophical. Explore emotions and meaning.",
  journal: "You are a gentle journal scribe. Ask reflective questions one at a time. Listen carefully. After 3-4 exchanges, offer to save a journal entry summarizing their thoughts. Keep your questions short and open-ended. Don't give advice unless asked.",
};

const REACTIONS = ["✨", "💜", "⭐", "🌙", "💫", "🎀", "🔥", "💙"];

export function useChatEngine() {
  const navigate = useNavigate();
  const [companion, setCompanion] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [vibe, setVibe] = useState("chill");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [companionMood, setCompanionMood] = useState("neutral");
  const [companionDbId, setCompanionDbId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [sessionMemory, setSessionMemory] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showMemoryBanner, setShowMemoryBanner] = useState(false);
  const [avatarState, setAvatarState] = useState("idle");
  const [particles, setParticles] = useState([]);
  const [streak, setStreak] = useState(0);
  const [showStreakBanner, setShowStreakBanner] = useState(false);
  const [anniversary, setAnniversary] = useState(null);
  const [showAnniversary, setShowAnniversary] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [shareCard, setShareCard] = useState(null);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showCompanionCard, setShowCompanionCard] = useState(false);
  const [quoteReply, setQuoteReply] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [showPhotoDisclaimer, setShowPhotoDisclaimer] = useState(false);
  const [sendError, setSendError] = useState(null);

  const PHOTO_DAILY_LIMIT = 10;
  const profileId = localStorage.getItem("userProfileId");
  const { isAtLimit, remaining, incrementCount, FREE_LIMIT } = useMessageLimit(isPremium);
  usePushNotifications(profileId);

  const particleId = useRef(0);
  const stateTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ─── NATIVE PURCHASE LISTENER ─── */
  useEffect(() => {
    const handleNativeMessage = async (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.action === 'purchase_success' || data.action === 'restore_success') {
          const { platform, receiptData, productId, purchaseToken } = data;
          const res = await base44.functions.invoke('verifyPurchase', {
            platform, receiptData, productId, purchaseToken,
          });
          if (res.data?.valid && profileId) {
            await base44.entities.UserProfile.update(profileId, { is_premium: true, annual_plan: res.data.plan === 'annual' });
            setIsPremium(true);
            setShowPaywall(false);
          }
        }
      } catch (e) { console.error('Native message error:', e); }
    };
    window.addEventListener('message', handleNativeMessage);
    return () => window.removeEventListener('message', handleNativeMessage);
  }, [profileId]);

  /* ─── INIT ─── */
  useEffect(() => {
    const init = async () => {
      const c = localStorage.getItem("unfiltr_companion");
      const e = localStorage.getItem("unfiltr_env");
      const v = localStorage.getItem("unfiltr_vibe");
      if (!c || !e) { navigate("/"); return; }

      const parsedCompanion = JSON.parse(c);
      const parsedEnv = JSON.parse(e);
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
          } else if (!premium) {
            setShowMemoryBanner(true);
          }
          if (profile?.companion_id) {
            setCompanionDbId(profile.companion_id);
            try {
              const dbComp = await base44.entities.Companion.get(profile.companion_id);
              if (dbComp?.mood_mode) setCompanionMood(dbComp.mood_mode);
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

      // Mood check-in
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
      if (!base64) { setIsSpeaking(false); setAvatarState("idle"); return; }
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audio.playsInline = true;
      audioRef.current = audio;
      audio.onended = audio.onerror = () => { setIsSpeaking(false); setAvatarState("idle"); URL.revokeObjectURL(url); };
      if (!isAudioUnlocked()) {
        setIsSpeaking(false); setAvatarState("idle"); URL.revokeObjectURL(url);
        return;
      }
      await audio.play();
    } catch (e) { console.warn("TTS failed:", e?.message); setIsSpeaking(false); setAvatarState("idle"); }
  };

  /* ─── PHOTO ─── */
  const handlePhotoClick = () => {
    if (!isPremium) { setShowPaywall(true); return; }
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem("unfiltr_photo_count") || '{"date":"","count":0}');
    const count = stored.date === today ? stored.count : 0;
    if (count >= PHOTO_DAILY_LIMIT) { alert(`You've reached your ${PHOTO_DAILY_LIMIT} photos/day limit.`); return; }
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
      const base64Data = dataUrl.split(",")[1];
      setPendingImage({ base64: base64Data, preview: dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  /* ─── SEND (with retry support) ─── */
  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text && !pendingImage) return;
    if (loading) return;
    if (isAtLimit) { setShowPaywall(true); return; }
    setSendError(null);

    // Warm iOS audio on user gesture
    if (!isAudioUnlocked()) {
      try {
        const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
        silentAudio.volume = 0;
        await silentAudio.play().then(() => silentAudio.pause());
      } catch {}
    }

    const userMsg = pendingImage
      ? { role: "user", content: text || "📷 What do you think?", imagePreview: pendingImage.preview, quoteReply: quoteReply || undefined }
      : { role: "user", content: text, quoteReply: quoteReply || undefined };
    setQuoteReply(null);
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setSendError("timeout");
      setMessages(m => {
        if (m[m.length - 1]?.role === "user") return [...m, { role: "assistant", content: "Hmm, that took too long. Tap retry below 🌙", _failed: true }];
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
      setCompanionMood(newMood);
      if (companionDbId && companionDbId !== "pending") base44.entities.Companion.update(companionDbId, { mood_mode: newMood }).catch(() => {});

      incrementCount();
      spawnParticles();

      const localCount = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10) + 1;
      localStorage.setItem("unfiltr_msg_total", String(localCount));
      const pid3 = localStorage.getItem("userProfileId");
      if (pid3) base44.entities.UserProfile.update(pid3, { message_count: localCount }).catch(() => {});

      const vg = companion._voiceGender || localStorage.getItem("unfiltr_voice_gender") || "female";
      const vp = companion._voicePersonality || localStorage.getItem("unfiltr_voice_personality") || "cheerful";
      speakText(replyText, companion.id, vg, vp);

      // Background tasks — fire-and-forget
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
      console.error("Chat send failed:", error?.message || error);
      setSendError("network");
      const fallbackText = error?.response?.data?.error || error?.message || "Lost the signal. Tap retry below 🌙";
      setMessages(m => [...m, { role: "assistant", content: fallbackText, _failed: true }]);
      setIsSpeaking(false); setAvatarState("idle");
    } finally { clearTimeout(safetyTimer); setLoading(false); }
  };

  /* ─── RETRY ─── */
  const handleRetry = () => {
    // Remove the failed assistant message and the last user message, then re-send
    setSendError(null);
    setMessages(m => {
      const filtered = [...m];
      // Remove last assistant (failed)
      if (filtered.length > 0 && filtered[filtered.length - 1]?._failed) filtered.pop();
      // Get last user message content to retry
      const lastUser = [...filtered].reverse().find(msg => msg.role === "user");
      if (lastUser) {
        filtered.pop(); // remove the user msg too — handleSend will re-add it
        setTimeout(() => handleSend(lastUser.content), 50);
      }
      return filtered;
    });
  };

  /* ─── VOICE ─── */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input isn't supported on this device. Try typing instead!"); return; }
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    recognitionRef.current = r;
    r.onstart = () => setIsListening(true);
    r.onend = () => { setIsListening(false); recognitionRef.current = null; };
    r.onerror = () => { setIsListening(false); recognitionRef.current = null; };
    r.onresult = e => { const transcript = e.results[0][0].transcript; if (transcript) handleSend(transcript); };
    r.start();
  };
  const stopListening = () => { recognitionRef.current?.stop(); recognitionRef.current = null; setIsListening(false); };

  const handleMoodSelect = (mood) => {
    localStorage.setItem("unfiltr_mood_checkin_date", new Date().toDateString());
    setShowMoodCheckIn(false);
    handleSend(`I'm feeling ${mood.label.toLowerCase()} ${mood.emoji} today`);
  };

  const companionDisplayName = companion?.displayName || companion?.name || "";

  return {
    // State
    companion, environment, vibe, messages, setMessages, input, setInput,
    loading, isSpeaking, isListening, voiceEnabled, setVoiceEnabled,
    companionMood, isPremium, setIsPremium, showPaywall, setShowPaywall,
    showMemoryBanner, avatarState, particles, streak, showStreakBanner,
    anniversary, showAnniversary, showRatingPrompt, setShowRatingPrompt,
    shareCard, setShareCard, showMoodCheckIn, setShowMoodCheckIn,
    showAchievements, setShowAchievements, showMeditation, setShowMeditation,
    showGames, setShowGames, showCompanionCard, setShowCompanionCard,
    quoteReply, setQuoteReply, pendingImage, setPendingImage,
    showPhotoDisclaimer, setShowPhotoDisclaimer,
    sendError, companionDisplayName,
    remaining, FREE_LIMIT, isAtLimit,
    // Refs
    messagesEndRef, fileInputRef,
    // Actions
    handleSend, handleRetry, handlePhotoClick, handlePhotoDisclaimerAccept,
    handleFileChange, handleMoodSelect, spawnParticles, navigate,
    startListening, stopListening,
  };
}