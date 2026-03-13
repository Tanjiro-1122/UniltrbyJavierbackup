import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, ChevronDown, Loader2, Volume2, VolumeX, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LiveAvatar from "@/components/LiveAvatar";
import PaywallModal from "@/components/PaywallModal";
import PullToRefresh from "@/components/PullToRefresh";
import { useMessageLimit } from "@/components/useMessageLimit";

const VIBES_SUFFIX = {
  chill: "Keep it casual, laid-back and conversational. Short responses.",
  vent: "Be a compassionate listener. Let them vent. Validate feelings. Ask gentle follow-up questions.",
  hype: "Be ENERGETIC and hyped up! Use caps, exclamation marks, pump them up!",
  deep: "Go deep. Be thoughtful, philosophical. Explore emotions and meaning.",
};

const REACTIONS = ["✨", "💜", "⭐", "🌙", "💫", "🎀", "🔥", "💙"];

export default function ChatPage() {
  const navigate = useNavigate();
  const [companion, setCompanion] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [vibe, setVibe] = useState("chill");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarState, setAvatarState] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [companionMood, setCompanionMood] = useState("neutral");
  const [companionDbId, setCompanionDbId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { isAtLimit, remaining, incrementCount, FREE_LIMIT } = useMessageLimit(isPremium);
  const [particles, setParticles] = useState([]);
  const particleId = useRef(0);
  const stateTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const init = async () => {
    const c = localStorage.getItem("unfiltr_companion");
    const e = localStorage.getItem("unfiltr_env");
    const v = localStorage.getItem("unfiltr_vibe");
    if (!c || !e) { navigate("/companions"); return; }
    const parsedCompanion = JSON.parse(c);
    const parsedEnv = JSON.parse(e);
    setCompanion(parsedCompanion);
    setEnvironment(parsedEnv);
    if (v) setVibe(v);
    // Load premium status and companion DB record
    const profileId = localStorage.getItem("userProfileId");
    if (profileId) {
      const profile = await base44.entities.UserProfile.get(profileId);
      setIsPremium(!!profile?.premium);
      if (profile?.companion_id) {
        setCompanionDbId(profile.companion_id);
        const dbCompanion = await base44.entities.Companion.get(profile.companion_id);
        if (dbCompanion?.mood_mode) setCompanionMood(dbCompanion.mood_mode);
      }
    }
    };
    init();
  }, []);

  useEffect(() => {
    if (companion) {
      const greeting = {
        role: "assistant",
        content: `Hey! I'm ${companion.name} 👋 ${
          vibe === "chill" ? "What's good? Just vibing here 😌" :
          vibe === "vent" ? "I'm here. Take your time — what's on your mind?" :
          vibe === "hype" ? "YO LET'S GOOO!! I'm SO ready for this!! 🔥🔥" :
          "I'm glad you're here. Sometimes the night feels like the only time we can think clearly..."
        }`,
      };
      setMessages([greeting]);
    }
  }, [companion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto idle animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (avatarState === "idle" && !loading && !isSpeaking) {
        triggerAnimation("wave", 1200);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [avatarState, loading, isSpeaking]);

  const triggerAnimation = (state, duration = 1200) => {
    if (stateTimeout.current) clearTimeout(stateTimeout.current);
    setAvatarState(state);
    stateTimeout.current = setTimeout(() => setAvatarState("idle"), duration);
  };

  const spawnParticles = () => {
    const emoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    const newP = Array.from({ length: 5 }, (_, i) => ({
      id: particleId.current++,
      emoji,
      x: Math.cos((i / 5) * 2 * Math.PI) * (40 + Math.random() * 20),
      y: Math.sin((i / 5) * 2 * Math.PI) * (40 + Math.random() * 20) - 20,
    }));
    setParticles((p) => [...p, ...newP]);
    setTimeout(() => setParticles((p) => p.filter((par) => !newP.find((n) => n.id === par.id))), 1000);
  };

  const speakText = async (text, companionId) => {
    if (!voiceEnabled) return;
    try {
      setIsSpeaking(true);
      setAvatarState("talk");
      const response = await base44.functions.invoke("tts", { text, companionId });
      const base64 = response.data?.audio;
      if (!base64) throw new Error("No audio");

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); setAvatarState("idle"); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); setAvatarState("idle"); };
      await audio.play();
    } catch {
      setIsSpeaking(false);
      setAvatarState("idle");
    }
  };

  const handleSend = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim() || loading) return;
    if (isAtLimit) { setShowPaywall(true); return; }
    const userMsg = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = `${companion.systemPrompt}\n\nCurrent vibe: ${vibe}. ${VIBES_SUFFIX[vibe]}\nKeep responses concise — 1-3 sentences max.`;
      const history = [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const response = await base44.functions.invoke("chat", { messages: history, systemPrompt });
      const replyText = response.data?.reply || "...";
      const reply = { role: "assistant", content: replyText };
      setMessages((m) => [...m, reply]);
      // Detect mood from reply and update DB
      const lowerReply = replyText.toLowerCase();
      let newMood = "neutral";
      if (vibe === "hype" || /😄|😁|🔥|yay|awesome|excited|great|amazing|haha|lol|woah|YES|amazing|incredible|awesome|perfect/.test(lowerReply)) {
        newMood = "happy";
      } else if (/😢|😞|sad|sorry|hard|tough|hurt|pain|miss|cry|difficult|rough|struggling|down/.test(lowerReply)) {
        newMood = "sad";
      } else {
        newMood = "neutral";
      }
      setCompanionMood(newMood);
      if (companionDbId) {
        base44.entities.Companion.update(companionDbId, { mood_mode: newMood });
      }
      incrementCount();
      spawnParticles();
      await speakText(replyText, companion.id);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Hmm, lost the signal. Try again? 🌙" }]);
      setIsSpeaking(false);
      setAvatarState("idle");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (recognitionRef.current) recognitionRef.current.stop();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleRefresh = async () => {
    // Clear messages and reset to greeting
    if (companion) {
      const greeting = {
        role: "assistant",
        content: `Hey! I'm ${companion.name} 👋 ${
          vibe === "chill" ? "What's good? Just vibing here 😌" :
          vibe === "vent" ? "I'm here. Take your time — what's on your mind?" :
          vibe === "hype" ? "YO LET'S GOOO!! I'm SO ready for this!! 🔥🔥" :
          "I'm glad you're here. Sometimes the night feels like the only time we can think clearly..."
        }`,
      };
      setMessages([greeting]);
    }
    await new Promise(r => setTimeout(r, 500));
  };

  const handleSubscribe = () => {
    // StoreKit will be called from the native layer via window.webkit.messageHandlers
    // For web/testing, we show an alert
    if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: "subscribe", productId: "com.unfiltr.premium.monthly" });
    } else {
      alert("In-app purchase: com.unfiltr.premium.monthly ($9.99/month)\nThis will be handled by Apple StoreKit in the native app.");
    }
  };

  const handleRestore = () => {
    if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: "restore" });
    } else {
      alert("Restore purchases — handled by Apple StoreKit in the native app.");
    }
  };

  if (!companion || !environment) return null;

  return (
    <>
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundImage: `url(${environment.bg})`, backgroundSize: "cover", backgroundPosition: "center bottom" }}
    >
      <div className="absolute inset-0 bg-black/25" />

      <style>{`
        @keyframes particleFly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.3)} }
        @keyframes listenPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
        .particle { animation: particleFly 1s ease-out forwards; }
        .listen-pulse { animation: listenPulse 0.8s ease-in-out infinite; }
      `}</style>

      <div className="relative flex flex-col h-full z-10">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 pb-3 bg-black/40 backdrop-blur-md border-b border-white/10"
          style={{ paddingTop: "max(3rem, env(safe-area-inset-top, 3rem))" }}
        >
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>

          <div className="text-center">
            <p className="text-white font-bold">{companion.name}</p>
            <p className="text-white/50 text-xs capitalize">{vibe} mode • {environment.label}</p>
            {!isPremium && (
              <button onClick={() => setShowPaywall(true)} className="mt-0.5 text-[10px] text-purple-300/70 bg-purple-500/10 px-2 py-0.5 rounded-full">
                {remaining}/{FREE_LIMIT} msgs left
              </button>
            )}
            {isPremium && (
              <p className="text-[10px] text-purple-400/80">✨ Premium</p>
            )}
          </div>

          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Avatar zone */}
        <div className="flex items-end justify-center pt-4" style={{ height: "280px" }}>
          <div className="relative flex flex-col items-center">
            {/* Greenscreen effect - subtle shadow grounding */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none" style={{
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%)",
              zIndex: 0
            }} />
            
            {/* Speaking glow ring */}
            {isSpeaking && (
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: "0 0 40px 20px rgba(168,85,247,0.4)", borderRadius: "50%", zIndex: 2 }} />
            )}
            {/* Particles */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="particle absolute text-base pointer-events-none"
                style={{ "--tx": `${p.x}px`, "--ty": `${p.y}px`, bottom: "55%", left: "50%", transform: "translate(-50%,0)", zIndex: 3 }}
              >
                {p.emoji}
              </div>
            ))}
            <div style={{ position: "relative", zIndex: 1 }}>
              <LiveAvatar
                companionId={companion.id}
                mood={companionMood}
                isSpeaking={isSpeaking}
                onClick={() => { spawnParticles(); }}
              />
            </div>
          </div>
        </div>

        {/* Messages with Pull-to-Refresh */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-md"
                      : "bg-black/50 backdrop-blur-md text-white border border-white/10 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-white/50 text-xs">{companion.name} is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </PullToRefresh>

        {/* Input bar */}
        <div className="px-4 pt-2 pb-20" style={{ paddingBottom: "max(5rem, env(safe-area-inset-bottom, 5rem))" }}>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/15 rounded-full px-4 py-2 shadow-lg">
            {/* Mic button */}
            <button
              onPointerDown={startListening}
              onPointerUp={stopListening}
              className={`w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-all ${
                isListening
                  ? "bg-red-500 listen-pulse"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white/70" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : `Talk to ${companion.name}...`}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shrink-0 shadow disabled:opacity-40 active:scale-90 transition-transform"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-white/20 text-xs mt-2">Hold 🎤 to speak • Tap to type</p>
        </div>
      </div>
    </div>

    <PaywallModal
      visible={showPaywall}
      onClose={() => setShowPaywall(false)}
      onSubscribe={handleSubscribe}
      onRestore={handleRestore}
    />
    </>
  );
}