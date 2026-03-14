import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Mic, MicOff, Loader2, Volume2, VolumeX, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LiveAvatar from "@/components/LiveAvatar";
import PaywallModal from "@/components/PaywallModal";
import { useMessageLimit } from "@/components/useMessageLimit";

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

  const { isAtLimit, remaining, incrementCount, FREE_LIMIT } = useMessageLimit(isPremium);
  const particleId    = useRef(0);
  const stateTimeout  = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef      = useRef(null);

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

      const profileId = localStorage.getItem("userProfileId");
      if (profileId) {
        try {
          const profile = await base44.entities.UserProfile.get(profileId);
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
    };
    init();
  }, []);

  /* ─── GREETING ─── */
  useEffect(() => {
    if (!companion) return;
    const name = companion.displayName || companion.name;
    setMessages([{
      role: "assistant",
      content: `Hey! I'm ${name} 👋 ${
        vibe === "chill" ? "What's good? Just vibing here 😌" :
        vibe === "vent"  ? "I'm here. Take your time — what's on your mind?" :
        vibe === "hype"  ? "YO LET'S GOOO!! I'm SO ready for this!! 🔥🔥" :
        "I'm glad you're here. Sometimes the night feels like the only time we can think clearly..."
      }`,
    }]);
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
  const speakText = async (text, companionId) => {
    if (!voiceEnabled) return;
    try {
      setIsSpeaking(true); triggerAnim("talk", 99999);
      const res    = await base44.functions.invoke("tts", { text, companionId });
      const base64 = res.data?.audio;
      if (!base64) throw new Error("no audio");
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const url   = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = audio.onerror = () => { setIsSpeaking(false); setAvatarState("idle"); URL.revokeObjectURL(url); };
      await audio.play();
    } catch { setIsSpeaking(false); setAvatarState("idle"); }
  };

  /* ─── SEND ─── */
  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || loading) return;
    if (isAtLimit) { setShowPaywall(true); return; }

    setMessages(m => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const name         = companion.displayName || companion.name;
      const systemPrompt = `${companion.systemPrompt}\nYour name is ${name}.\nCurrent vibe: ${vibe}. ${VIBES_SUFFIX[vibe]}\nKeep responses concise — 1–3 sentences max.`;
      const history      = [...messages, { role: "user", content: text }].slice(-10);
      const res          = await base44.functions.invoke("chat", {
        messages: history.map(m => ({ role: m.role, content: m.content })),
        systemPrompt,
        isPremium,
        sessionMemory: isPremium ? sessionMemory : [],
      });
      const replyText = res.data?.reply || "...";
      setMessages(m => [...m, { role: "assistant", content: replyText }]);

      const validMoods = ["happy","neutral","sad","fear","disgust","surprise","anger","contentment","fatigue"];
      const newMood = validMoods.includes(res.data?.mood) ? res.data.mood : "neutral";
      setCompanionMood(newMood);
      if (companionDbId) base44.entities.Companion.update(companionDbId, { mood_mode: newMood });

      incrementCount();
      spawnParticles();
      await speakText(replyText, companion.id);

      // Auto-summarize session every 10 user messages (premium only)
      if (isPremium) {
        const profileId = localStorage.getItem("userProfileId");
        const updatedMsgs = [...messages, { role: "user", content: text }, { role: "assistant", content: replyText }];
        const userMsgCount = updatedMsgs.filter(m => m.role === "user").length;
        if (profileId && userMsgCount > 0 && userMsgCount % 10 === 0) {
          base44.functions.invoke("summarizeSession", {
            messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
            profileId,
            companionName: companion.displayName || companion.name,
          }).then(res => {
            if (res.data?.ok && !res.data?.skipped) {
              base44.entities.UserProfile.get(profileId).then(profile => {
                if (profile?.session_memory) setSessionMemory(profile.session_memory);
              }).catch(() => {});
            }
          }).catch(() => {});
        }
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
  const handleSubscribe = () => {
    if (/android/i.test(navigator.userAgent) && window.webkit?.messageHandlers?.billing) {
      window.webkit.messageHandlers.billing.postMessage({ action: "subscribe", productId: "com.unfiltr.premium.monthly" });
    } else if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: "subscribe", productId: "com.unfiltr.premium.monthly" });
    } else {
      alert("In-app purchase: com.unfiltr.premium.monthly ($9.99/month)");
    }
  };
  const handleRestore = () => {
    if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: "restore" });
    }
  };

  /* ─── LOADING STATE ─── */
  if (!companion || !environment) return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#06020f" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const companionDisplayName = companion.displayName || companion.name;

  return (
    <>
      <div
        className="screen no-tabs"
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
          .particle     { animation: particleFly 1s ease-out forwards; }
          .listen-pulse { animation: listenPulse 0.8s ease-in-out infinite; }
        `}</style>

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* TOP BAR */}
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px 12px",
            paddingTop: "max(2.5rem, env(safe-area-inset-top, 2.5rem))",
            background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <button onClick={() => setVoiceEnabled(v => !v)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {voiceEnabled ? <Volume2 size={16} color="white" /> : <VolumeX size={16} color="rgba(255,255,255,0.4)" />}
            </button>

            <div style={{ textAlign: "center", flex: 1, padding: "0 8px" }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>{companionDisplayName}</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "2px 0 0", textTransform: "capitalize" }}>{vibe} mode · {environment.label}</p>
              {!isPremium ? (
                <button onClick={() => setShowPaywall(true)}
                  style={{ marginTop: 3, fontSize: 10, color: "rgba(196,180,252,0.75)", background: "rgba(139,92,246,0.15)", border: "none", padding: "2px 8px", borderRadius: 999, cursor: "pointer" }}>
                  {remaining}/{FREE_LIMIT} msgs left
                </button>
              ) : (
                <p style={{ marginTop: 2, fontSize: 10, color: "rgba(168,85,247,0.8)" }}>✨ Premium</p>
              )}
            </div>

            <button onClick={() => navigate("/settings")}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Settings size={16} color="white" />
            </button>
          </div>

          {/* MEMORY BANNER — free users only */}
          {showMemoryBanner && !isPremium && (
            <div
              onClick={() => setShowPaywall(true)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "7px 16px",
                background: "rgba(139,92,246,0.12)",
                borderBottom: "1px solid rgba(139,92,246,0.2)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13 }}>🔒</span>
              <span style={{ color: "rgba(196,180,252,0.85)", fontSize: 12, fontWeight: 600 }}>
                Unlock Memory — she'll remember you forever
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", background: "rgba(168,85,247,0.2)", padding: "2px 7px", borderRadius: 999 }}>
                Premium
              </span>
            </div>
          )}

          {/* AVATAR ZONE */}
          <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 240, height: 50, background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
            {isSpeaking && (
              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)", animation: "speakPulse 1.2s ease-in-out infinite", pointerEvents: "none" }} />
            )}
            {particles.map(p => (
              <div key={p.id} className="particle"
                style={{ position: "absolute", bottom: "45%", left: "50%", transform: "translate(-50%, 0)", "--tx": `${p.x}px`, "--ty": `${p.y}px`, fontSize: 14, zIndex: 3, pointerEvents: "none" }}>
                {p.emoji}
              </div>
            ))}
            <div style={{ pointerEvents: "auto", paddingBottom: 4 }}>
              <LiveAvatar companionId={companion.id} mood={companionMood} isSpeaking={isSpeaking} onClick={spawnParticles} />
            </div>
          </div>

          {/* CHAT PANEL */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "52%", background: "linear-gradient(to bottom, rgba(8,3,16,0) 0%, rgba(8,3,16,0.9) 10%, rgba(8,3,16,0.97) 100%)" }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "8px 16px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "82%", padding: "10px 16px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: 14, lineHeight: 1.5, wordBreak: "break-word", color: "white",
                    ...(msg.role === "user"
                      ? { background: "linear-gradient(135deg, #7c3aed, #db2777)" }
                      : { background: "rgba(88,28,135,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(168,85,247,0.2)", boxShadow: "0 0 12px rgba(168,85,247,0.12)" }
                    ),
                  }}>{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "10px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(88,28,135,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(168,85,247,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={14} color="#a855f7" style={{ animation: "spin 0.8s linear infinite" }} />
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{companionDisplayName} is thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ flexShrink: 0, padding: "6px 16px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "8px 12px" }}>
                <button onPointerDown={startListening} onPointerUp={stopListening}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isListening ? "#ef4444" : "rgba(255,255,255,0.1)" }}
                  className={isListening ? "listen-pulse" : ""}>
                  {isListening ? <MicOff size={16} color="white" /> : <Mic size={16} color="rgba(255,255,255,0.65)" />}
                </button>
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening…" : `Talk to ${companionDisplayName}…`}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 14, minWidth: 0, caretColor: "#a855f7" }}
                />
                <button onClick={() => handleSend()} disabled={loading || !input.trim()}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || !input.trim() ? "default" : "pointer", opacity: loading || !input.trim() ? 0.4 : 1, background: "linear-gradient(135deg, #7c3aed, #db2777)", transition: "opacity 0.15s" }}>
                  <Send size={15} color="white" />
                </button>
              </div>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 11, margin: "5px 0 0" }}>Hold 🎤 to speak · Tap to type</p>
            </div>

            <div style={{ flexShrink: 0, height: "max(12px, env(safe-area-inset-bottom, 12px))" }} />
          </div>

        </div>
      </div>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        onRestore={handleRestore}
        isAndroid={/android/i.test(navigator.userAgent)}
      />
    </>
  );
}