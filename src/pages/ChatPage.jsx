import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Settings, ChevronDown, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

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
  const [particles, setParticles] = useState([]);
  const [speechBubble, setSpeechBubble] = useState(null);
  const particleId = useRef(0);
  const stateTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const c = localStorage.getItem("unfiltr_companion");
    const e = localStorage.getItem("unfiltr_env");
    const v = localStorage.getItem("unfiltr_vibe");
    if (!c || !e) { navigate("/companions"); return; }
    setCompanion(JSON.parse(c));
    setEnvironment(JSON.parse(e));
    if (v) setVibe(v);
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
      if (avatarState === "idle" && !loading) {
        triggerAnimation("wave");
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [avatarState, loading]);

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
      x: Math.cos((i / 5) * 2 * Math.PI) * (35 + Math.random() * 25),
      y: Math.sin((i / 5) * 2 * Math.PI) * (35 + Math.random() * 25) - 15,
    }));
    setParticles((p) => [...p, ...newP]);
    setTimeout(() => setParticles((p) => p.filter((par) => !newP.find((n) => n.id === par.id))), 1000);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    triggerAnimation("idle");

    try {
      const systemPrompt = `${companion.systemPrompt}\n\nCurrent vibe: ${vibe}. ${VIBES_SUFFIX[vibe]}\nKeep responses concise and conversational — 1-3 sentences max unless asked for more.`;
      const history = [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content }));

      const response = await base44.functions.invoke("chat", { messages: history, systemPrompt });
      const reply = { role: "assistant", content: response.data?.reply || "..." };
      setMessages((m) => [...m, reply]);
      triggerAnimation("wave", 1500);
      spawnParticles();
      setSpeechBubble("💬");
      setTimeout(() => setSpeechBubble(null), 1500);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Hmm, lost the signal for a sec. Try again? 🌙" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!companion || !environment) return null;

  const avatarAnim = { idle: "avatar-idle", wave: "avatar-wave", jump: "avatar-jump" }[avatarState];

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundImage: `url(${environment.bg})`, backgroundSize: "cover", backgroundPosition: "center bottom" }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <style>{`
        @keyframes avatarIdle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes avatarWave { 0%{transform:translateY(0) rotate(0)} 20%{transform:translateY(-12px) rotate(-8deg)} 40%{transform:translateY(-12px) rotate(8deg)} 60%{transform:translateY(-12px) rotate(-5deg)} 100%{transform:translateY(0) rotate(0)} }
        @keyframes avatarJump { 0%{transform:translateY(0) scale(1)} 40%{transform:translateY(-25px) scale(1.08)} 100%{transform:translateY(0) scale(1)} }
        @keyframes particleFly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.3)} }
        @keyframes bubblePop { 0%{opacity:0;transform:scale(0.5) translateY(8px)} 20%{opacity:1;transform:scale(1.05)} 80%{opacity:1} 100%{opacity:0;transform:scale(0.9)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .avatar-idle { animation: avatarIdle 2.5s ease-in-out infinite; }
        .avatar-wave { animation: avatarWave 1.2s ease-in-out forwards; }
        .avatar-jump { animation: avatarJump 0.8s ease-in-out forwards; }
        .particle    { animation: particleFly 1s ease-out forwards; }
        .speech-bub  { animation: bubblePop 1.5s ease-in-out forwards; }
        .msg-in      { animation: msgIn 0.3s ease-out; }
      `}</style>

      <div className="relative flex flex-col h-full z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-12 pb-2">
          <button onClick={() => navigate("/companions")} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center">
            <ChevronDown className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <p className="text-white font-bold">{companion.name}</p>
            <p className="text-white/50 text-xs capitalize">{vibe} mode</p>
          </div>
          <button onClick={() => navigate("/companions")} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Avatar zone */}
        <div className="flex items-end justify-center" style={{ height: "240px" }}>
          <div className="relative flex flex-col items-center">
            {speechBubble && (
              <div className="speech-bub absolute -top-8 bg-white text-purple-800 text-xs font-bold px-3 py-1.5 rounded-2xl shadow whitespace-nowrap">
                {speechBubble}
                <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid white" }} />
              </div>
            )}
            {particles.map((p) => (
              <div key={p.id} className="particle absolute text-base pointer-events-none" style={{ "--tx": `${p.x}px`, "--ty": `${p.y}px`, bottom: "60%", left: "50%", transform: "translate(-50%,0)" }}>
                {p.emoji}
              </div>
            ))}
            <div
              className={avatarAnim}
              onClick={() => { triggerAnimation("jump", 800); spawnParticles(); }}
              style={{ cursor: "pointer", filter: "drop-shadow(0 0 18px rgba(180,100,255,0.7))" }}
            >
              <img
                src={companion.avatar}
                alt={companion.name}
                style={{ height: "200px", width: "auto", mixBlendMode: "multiply", userSelect: "none", pointerEvents: "none" }}
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
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
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start">
              <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-white/50 text-xs">{companion.name} is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-8 pt-2">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/15 rounded-full px-4 py-2 shadow-lg">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Talk to ${companion.name}...`}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shrink-0 shadow disabled:opacity-40 active:scale-90 transition-transform"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}