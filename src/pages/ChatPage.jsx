import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Mic, MicOff, Loader2, Volume2, VolumeX, Settings, Brain, Camera, X, Share2, MessageSquare, Save } from "lucide-react";
import RatingPromptModal from "@/components/RatingPromptModal";
import { subscribeToPlan, restorePurchases } from "@/components/utils/iapBridge";
import ShareCardModal from "@/components/ShareCardModal";
import { base44 } from "@/api/base44Client";
import LiveAvatar from "@/components/LiveAvatar";
import PaywallModal from "@/components/PaywallModal";
import { useMessageLimit } from "@/components/useMessageLimit";
import { usePushNotifications } from "@/components/usePushNotifications";
import AppShell from "@/components/shell/AppShell";

const VIBES_SUFFIX = {
  chill: "Keep it casual, laid-back and conversational. Short responses.",
  vent:  "Be a compassionate listener. Let them vent. Validate feelings. Ask gentle follow-up questions.",
  hype:  "Be ENERGETIC and hyped up! Use caps, exclamation marks, pump them up!",
  deep:  "Go deep. Be thoughtful, philosophical. Explore emotions and meaning.",
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
  const [shareCard, setShareCard]             = useState(null); // { message, mood }

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
            await base44.entities.UserProfile.update(profileId, { 
              is_premium: true, 
              annual_plan: result.plan === 'annual' 
            });
            setIsPremium(true);
            setShowPaywall(false);
          }
        }
      } catch (e) {
        console.error('Native message error:', e);
      }
    };

    window.addEventListener('message', handleNativeMessage);
    return () => window.removeEventListener('message', handleNativeMessage);
  }, [profileId]);

  const particleId    = useRef(0);
  const stateTimeout  = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef      = useRef(null);
  const fileInputRef  = useRef(null);

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
      parsedCompanion.displayName =
        (savedNickname && savedNickname.trim()) ? savedNickname.trim() : parsedCompanion.name;

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
            } catch { /* use default */ }
          }
        } catch { /* free tier */ }
      }

      // ── Streak logic ──
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

      // ── Anniversary logic ──
      const createdDate = localStorage.getItem("unfiltr_companion_created");
      if (!createdDate) {
        localStorage.setItem("unfiltr_companion_created", new Date().toISOString());
      } else {
        const days = Math.floor((Date.now() - new Date(createdDate).getTime()) / 86400000);
        const milestones = [7, 14, 30, 60, 90, 180, 365];
        if (milestones.includes(days)) {
          setAnniversary(days);
          setShowAnniversary(true);
          setTimeout(() => setShowAnniversary(false), 6000);
        }
      }
    };
    init();
  }, []);

  /* ─── GREETING + LOAD LOCAL HISTORY ─── */
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

    // Check for welcome-back flag (premium returning users)
    const welcomeBack = localStorage.getItem("unfiltr_welcome_back");
    if (welcomeBack) {
      localStorage.removeItem("unfiltr_welcome_back");
      const saved = localStorage.getItem("unfiltr_chat_history");
      let history = [];
      try { history = saved ? JSON.parse(saved) : []; } catch { /* ignore */ }
      const welcomeMsg = {
        role: "assistant",
        content: `Hey, welcome back! 💜 I remember our last chat. Ready to pick up where we left off?`,
      };
      if (history.length > 0) {
        setMessages([welcomeMsg, ...history]);
      } else {
        setMessages([welcomeMsg]);
      }
      return;
    }

    // Load chat history from localStorage
    const saved = localStorage.getItem("unfiltr_chat_history");
    if (saved) {
      try {
        const history = JSON.parse(saved);
        if (history.length > 0) {
          setMessages([greeting, ...history]);
          return;
        }
      } catch { /* ignore bad data */ }
    }
    setMessages([greeting]);
  }, [companion]);

  /* ─── AUTO-SCROLL ─── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── IDLE ANIMATION LOOP ─── */
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
      id: particleId.current++,
      emoji,
      x: Math.cos((i / 5) * 2 * Math.PI) * (40 + Math.random() * 20),
      y: Math.sin((i / 5) * 2 * Math.PI) * (40 + Math.random() * 20) - 20,
    }));
    setParticles(p => [...p, ...batch]);
    setTimeout(() => setParticles(p => p.filter(x => !batch.find(b => b.id === x.id))), 1000);
  };

  /* ─── TTS ─── */
  const speakText = async (text, companionId, voiceGender = "female") => {
    if (!voiceEnabled) return;
    try {
      setIsSpeaking(true); 
      triggerAnim("talk", 99999);
      // Call TTS with voiceGender preference
      const res = await base44.functions.invoke("tts", { text, companionId, voiceGender });
      const base64 = res.data?.audio;
      if (!base64) throw new Error("no audio");
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = audio.onerror = () => { setIsSpeaking(false); setAvatarState("idle"); URL.revokeObjectURL(url); };
      await audio.play();
    } catch { 
      setIsSpeaking(false); 
      setAvatarState("idle"); 
    }
  };

  /* ─── PHOTO ─── */
  const handlePhotoClick = () => {
    if (!isPremium) { setShowPaywall(true); return; }
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem("unfiltr_photo_count") || '{"date":"","count":0}');
    const count = stored.date === today ? stored.count : 0;
    if (count >= PHOTO_DAILY_LIMIT) {
      alert(`You've reached your ${PHOTO_DAILY_LIMIT} photos/day limit. Come back tomorrow! 📸`);
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
    if (isAtLimit) { setShowPaywall(true); return; }

    const userMsg = pendingImage
      ? { role: "user", content: text || "📷 What do you think?", imagePreview: pendingImage.preview }
      : { role: "user", content: text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const name         = companion.displayName || companion.name;
      // Fetch memory_summary for non-premium users too (lightweight memory)
      let memorySummary = "";
      try {
        const pid2 = localStorage.getItem("userProfileId");
        if (pid2) {
          const prof = await base44.entities.UserProfile.get(pid2);
          memorySummary = prof?.memory_summary || "";
        }
      } catch { /* ignore */ }
      const systemPrompt = `${companion.systemPrompt}\nYour name is ${name}.\nCurrent vibe: ${vibe}. ${VIBES_SUFFIX[vibe]}\nKeep responses concise — 1–3 sentences max.${memorySummary ? `\n\nWhat you remember about this user from past conversations:\n${memorySummary}` : ""}`;
      const userContent  = pendingImage ? (text || "What do you think of this?") : text;
      const history      = [...messages, { role: "user", content: userContent }].slice(-10);

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
        systemPrompt,
        isPremium,
        sessionMemory: isPremium ? sessionMemory : [],
        memorySummary: memorySummary || "",
        imageBase64: imgBase64,
      });
      const replyText = res.data?.reply || "...";
      setMessages(m => {
        const updated = [...m, { role: "assistant", content: replyText }];
        // Save chat history locally (skip greeting at index 0, keep last 50 messages)
        const toSave = updated.slice(1).slice(-50).map(msg => ({ role: msg.role, content: msg.content }));
        localStorage.setItem("unfiltr_chat_history", JSON.stringify(toSave));
        return updated;
      });

      const validMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue"];
      const newMood = validMoods.includes(res.data?.mood) ? res.data.mood : "neutral";
      setCompanionMood(newMood);
      if (companionDbId) base44.entities.Companion.update(companionDbId, { mood_mode: newMood });

      incrementCount();
      spawnParticles();

      // Increment local message count and sync to DB
      const localCount = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10) + 1;
      localStorage.setItem("unfiltr_msg_total", String(localCount));
      const pid3 = localStorage.getItem("userProfileId");
      if (pid3) {
        base44.entities.UserProfile.update(pid3, { message_count: localCount }).catch(() => {});
      }
      // Get voice_gender from companion DB if available
      const voiceGender = companionDbId 
        ? (await base44.entities.Companion.get(companionDbId))?.voice_gender || "female"
        : "female";
      speakText(replyText, companion.id, voiceGender);

      // Rating prompt after 10th message
      const totalMsgs = [...messages, { role: "user" }].filter(m => m.role === "user").length;
      if (totalMsgs === 10) {
        const pid = localStorage.getItem("userProfileId");
        if (pid) {
          base44.functions.invoke("ratingPrompt", { profileId: pid }).then(res => {
            if (res.data?.should_prompt) setShowRatingPrompt(true);
          }).catch(() => {});
        }
      }

      // Auto-summarize: every 10 msgs for premium, every 5 for free users
      const profileId = localStorage.getItem("userProfileId");
      const updatedMsgs = [...messages, { role: "user", content: userContent }, { role: "assistant", content: replyText }];
      const userMsgCount = updatedMsgs.filter(m => m.role === "user").length;
      const summarizeInterval = isPremium ? 10 : 5;
      if (profileId && userMsgCount >= 3 && userMsgCount % summarizeInterval === 0) {
        const cName = companion.displayName || companion.name;
        base44.functions.invoke("summarizeSession", {
          messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
          profileId,
          companionName: cName,
          isPremium,
        }).then(res => {
          if (res.data?.ok && !res.data?.skipped) {
            base44.entities.UserProfile.get(profileId).then(profile => {
              if (profile?.session_memory) setSessionMemory(profile.session_memory);
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Hmm, lost the signal. Try again? 🌙" }]);
      setIsSpeaking(false); setAvatarState("idle");
    } finally { setLoading(false); }
  };

  /* ─── VOICE ─── */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) recognitionRef.current.stop();
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    recognitionRef.current = r;
    r.onstart  = () => setIsListening(true);
    r.onend    = () => setIsListening(false);
    r.onerror  = () => setIsListening(false);
    r.onresult = e => handleSend(e.results[0][0].transcript);
    r.start();
  };
  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };

  /* ─── IAP ─── */
  const handleSubscribe = () => subscribeToPlan("monthly");
  const handleRestore = () => restorePurchases();

  /* ─── LOADING STATE ─── */
  if (!companion || !environment) return (
    <AppShell tabs={true} style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
    </AppShell>
  );

  const companionDisplayName = companion.displayName || companion.name;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <AppShell
        tabs={true}
        style={{
          backgroundImage: `url(${environment.bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.22)", pointerEvents: "none" }} />

        <style>{`
          @keyframes particleFly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.3)} }
          @keyframes listenPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
          @keyframes speakPulse  { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
          @keyframes spin        { to { transform: rotate(360deg); } }
          @keyframes bannerSlide { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
          .particle     { animation: particleFly 1s ease-out forwards; }
          .listen-pulse { animation: listenPulse 0.8s ease-in-out infinite; }
        `}</style>

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%", overflow: "hidden" }}>

          {/* ── AVATAR + NAME SECTION (transparent, fixed above chat box) ── */}
          <div style={{
            flexShrink: 0, position: "relative",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "6px 16px 0",
            width: "100%",
          }}>
            {/* Controls row */}
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <button onClick={() => setVoiceEnabled(v => !v)}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {voiceEnabled ? <Volume2 size={14} color="white" /> : <VolumeX size={14} color="rgba(255,255,255,0.4)" />}
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                {isPremium && (
                  <button onClick={() => {
                    const data = JSON.stringify(messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content })), null, 2);
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `unfiltr-chat-${new Date().toISOString().slice(0,10)}.json`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                    style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    title="Save conversation">
                    <Save size={13} color="#a855f7" />
                  </button>
                )}
                <button onClick={() => {
                  localStorage.removeItem("unfiltr_chat_history");
                  const name = companion.displayName || companion.name;
                  setMessages([{ role: "assistant", content: `Fresh start! Hey, I'm ${name} 👋 What's up?` }]);
                }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  title="New chat">
                  <MessageSquare size={13} color="rgba(255,255,255,0.6)" />
                </button>
                <button onClick={() => navigate("/settings")}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Settings size={14} color="white" />
                </button>
              </div>
            </div>

            {/* Avatar + particles */}
            <div style={{ position: "relative", width: 172, height: 172, marginTop: 2 }}>
              {isSpeaking && (
                <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)", animation: "speakPulse 1.2s ease-in-out infinite", pointerEvents: "none" }} />
              )}
              {particles.map(p => (
                <div key={p.id} className="particle"
                  style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, 0)", "--tx": `${p.x}px`, "--ty": `${p.y}px`, fontSize: 12, zIndex: 3, pointerEvents: "none" }}>
                  {p.emoji}
                </div>
              ))}
              <LiveAvatar companionId={companion.id} mood={companionMood} isSpeaking={isSpeaking} onClick={spawnParticles} />
            </div>

            {/* Name + info */}
            <p style={{ color: "white", fontWeight: 700, fontSize: 17, margin: "6px 0 0" }}>{companionDisplayName}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "2px 0 0", textTransform: "capitalize" }}>{vibe} mode · {environment.label}</p>
            {!isPremium ? (
              <button onClick={() => setShowPaywall(true)}
                style={{ margin: "3px 0 8px", fontSize: 10, color: "rgba(196,180,252,0.75)", background: "rgba(139,92,246,0.15)", border: "none", padding: "2px 8px", borderRadius: 999, cursor: "pointer" }}>
                {remaining}/{FREE_LIMIT} msgs left
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "2px 0 8px" }}>
                <p style={{ fontSize: 10, color: "rgba(168,85,247,0.8)", margin: 0 }}>✨ Premium</p>
                {sessionMemory.length > 0 && (
                  <span style={{ fontSize: 10, color: "rgba(168,85,247,0.6)", display: "flex", alignItems: "center", gap: 2 }}>
                    · <Brain size={9} color="rgba(168,85,247,0.6)" /> {sessionMemory.length} memories
                  </span>
                )}
              </div>
            )}

            {/* Banners overlay */}
            {showStreakBanner && (
              <div style={{
                position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(135deg, rgba(234,88,12,0.9), rgba(239,68,68,0.9))",
                backdropFilter: "blur(12px)", borderRadius: 999,
                padding: "6px 14px", zIndex: 20, whiteSpace: "nowrap",
                animation: "bannerSlide 0.4s ease-out forwards",
                boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
              }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>🔥 {streak} day streak!</span>
              </div>
            )}
            {showAnniversary && anniversary && (
              <div style={{
                position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(219,39,119,0.95))",
                backdropFilter: "blur(12px)", borderRadius: 14,
                padding: "6px 14px", zIndex: 20, whiteSpace: "nowrap",
                animation: "bannerSlide 0.4s ease-out forwards",
                boxShadow: "0 4px 24px rgba(168,85,247,0.5)",
                textAlign: "center",
              }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 12 }}>🎉 {anniversary} Days Together! ✨</span>
              </div>
            )}
          </div>

          {/* MEMORY BANNER — free users only */}
          {showMemoryBanner && !isPremium && (
            <div onClick={() => setShowPaywall(true)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "6px 16px",
                background: "rgba(139,92,246,0.12)",
                borderBottom: "1px solid rgba(139,92,246,0.2)",
                cursor: "pointer",
              }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ color: "rgba(196,180,252,0.85)", fontSize: 11, fontWeight: 600 }}>Unlock Memory — they'll remember you forever</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#a855f7", background: "rgba(168,85,247,0.2)", padding: "2px 6px", borderRadius: 999 }}>Premium</span>
            </div>
          )}

          {/* ── CONVERSATION BOX (bounded, only this scrolls) ── */}
          <div style={{
            flex: "0 0 34%", minHeight: 0,
            display: "flex", flexDirection: "column",
            margin: "8px 10px 0",
            background: "rgba(8,3,16,0.82)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
            overflow: "hidden",
          }}>
            <div style={{
              flex: 1, minHeight: 0,
              overflowY: "auto", overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              padding: "12px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 5 }}>
                  <div style={{
                    maxWidth: "82%", padding: "9px 14px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    fontSize: 13, lineHeight: 1.5, wordBreak: "break-word", color: "white",
                    ...(msg.role === "user"
                      ? { background: "linear-gradient(135deg, #7c3aed, #db2777)" }
                      : { background: "rgba(88,28,135,0.45)", border: "1px solid rgba(168,85,247,0.15)", boxShadow: "0 0 8px rgba(168,85,247,0.08)" }
                    ),
                  }}>
                    {msg.imagePreview && (
                      <img src={msg.imagePreview} alt="shared" style={{ width: "100%", maxWidth: 180, borderRadius: 8, marginBottom: 5, display: "block" }} />
                    )}
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <button onClick={() => setShareCard({ message: msg.content, mood: companionMood })}
                      style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Share2 size={10} color="rgba(255,255,255,0.3)" />
                    </button>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(88,28,135,0.45)", border: "1px solid rgba(168,85,247,0.15)", display: "flex", alignItems: "center", gap: 5 }}>
                    <style>{`@keyframes typingBounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }`}</style>
                    {[0, 1, 2].map(d => (
                      <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", animation: `typingBounce 1.2s ease-in-out infinite`, animationDelay: `${d * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── TYPING FIELD (fixed at bottom) ── */}
          <div style={{ flexShrink: 0, padding: "8px 12px", paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))", background: "linear-gradient(180deg, rgba(6,2,15,0) 0%, rgba(6,2,15,0.72) 24%, rgba(6,2,15,0.95) 100%)" }}>
            {/* Pending image preview */}
            {pendingImage && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ position: "relative" }}>
                  <img src={pendingImage.preview} alt="pending" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(168,85,247,0.5)" }} />
                  <button onClick={() => setPendingImage(null)}
                    style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={9} color="white" />
                  </button>
                </div>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Photo attached</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "7px 10px" }}>
              <button onPointerDown={startListening} onPointerUp={stopListening}
                style={{ width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isListening ? "#ef4444" : "rgba(255,255,255,0.1)" }}
                className={isListening ? "listen-pulse" : ""}>
                {isListening ? <MicOff size={15} color="white" /> : <Mic size={15} color="rgba(255,255,255,0.65)" />}
              </button>
              <button onClick={handlePhotoClick}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.08)" }}>
                <Camera size={14} color={isPremium ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.3)"} />
              </button>
              <input type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder={isListening ? "Listening…" : `Talk to ${companionDisplayName}…`}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 14, minWidth: 0, caretColor: "#a855f7" }}
              />
              <button onClick={() => handleSend()} disabled={loading || (!input.trim() && !pendingImage)}
                style={{ width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || (!input.trim() && !pendingImage) ? "default" : "pointer", opacity: loading || (!input.trim() && !pendingImage) ? 0.4 : 1, background: "linear-gradient(135deg, #7c3aed, #db2777)", transition: "opacity 0.15s" }}>
                <Send size={14} color="white" />
              </button>
            </div>
          </div>

        </div>
      </AppShell>

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

      <PaywallModal
         visible={showPaywall}
         onClose={() => setShowPaywall(false)}
         onSubscribe={handleSubscribe}
         onRestore={handleRestore}
         isAndroid={/android/i.test(navigator.userAgent)}
       />

       <RatingPromptModal
        visible={showRatingPrompt}
        onClose={() => setShowRatingPrompt(false)}
      />

      <ShareCardModal
        visible={!!shareCard}
        onClose={() => setShareCard(null)}
        message={shareCard?.message || ""}
        companionName={companionDisplayName}
        mood={shareCard?.mood || "neutral"}
      />
    </>
  );
}