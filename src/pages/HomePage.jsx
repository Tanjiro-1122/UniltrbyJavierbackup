import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

const BG_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/61d996564_generated_image.png";
const LUNA_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/5ec326653_generated_image.png";

const REACTIONS = ["✨", "💜", "⭐", "🌙", "💫", "🎀"];
const PHRASES = ["Hi there!", "You called?", "Hehe~", "What's up?", "👋", "Yay!"];

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [lunaState, setLunaState] = useState("idle"); // idle | wave | jump | spin
  const [speechBubble, setSpeechBubble] = useState(null);
  const [particles, setParticles] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const stateTimeout = useRef(null);
  const particleId = useRef(0);

  // Auto idle animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      if (lunaState === "idle") {
        const actions = ["wave", "jump"];
        const pick = actions[Math.floor(Math.random() * actions.length)];
        triggerAction(pick);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [lunaState]);

  const triggerAction = (action, phrase) => {
    if (stateTimeout.current) clearTimeout(stateTimeout.current);
    setLunaState(action);
    if (phrase) {
      setSpeechBubble(phrase);
      setTimeout(() => setSpeechBubble(null), 2000);
    }
    stateTimeout.current = setTimeout(() => setLunaState("idle"), 1000);
  };

  const handleLunaClick = () => {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    triggerAction("jump", phrase);

    // Spawn particles
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: particleId.current++,
      emoji: reaction,
      angle: (i / 6) * 360,
      x: Math.cos((i / 6) * 2 * Math.PI) * (40 + Math.random() * 30),
      y: Math.sin((i / 6) * 2 * Math.PI) * (40 + Math.random() * 30) - 20,
    }));
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setParticles((p) => p.filter((par) => !newParticles.find((n) => n.id === par.id)));
    }, 900);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    triggerAction("wave", "Got it! 💜");
    setMessage("");
  };

  const lunaAnimation = {
    idle: "luna-idle",
    wave: "luna-wave",
    jump: "luna-jump",
    spin: "luna-spin",
  }[lunaState];

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
      }}
    >
      {/* Subtle dark overlay */}
      <div className="absolute inset-0 bg-[#0d0520]/30" />

      <style>{`
        @keyframes idleBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes wave {
          0%   { transform: translateY(0) rotate(0deg); }
          20%  { transform: translateY(-10px) rotate(-8deg); }
          40%  { transform: translateY(-10px) rotate(8deg); }
          60%  { transform: translateY(-10px) rotate(-8deg); }
          80%  { transform: translateY(-5px) rotate(4deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes jump {
          0%   { transform: translateY(0) scale(1); }
          30%  { transform: translateY(-30px) scale(1.08); }
          60%  { transform: translateY(-15px) scale(1.04); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes particleFly {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.3); }
        }
        @keyframes bubblePop {
          0%   { opacity: 0; transform: scale(0.5) translateY(10px); }
          20%  { opacity: 1; transform: scale(1.05) translateY(-2px); }
          80%  { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.9) translateY(-5px); }
        }
        .luna-idle    { animation: idleBob 2.5s ease-in-out infinite; }
        .luna-wave    { animation: wave 1s ease-in-out forwards; }
        .luna-jump    { animation: jump 0.8s ease-in-out forwards; }
        .luna-spin    { animation: spin 1s ease-in-out forwards; }
        .luna-hover   { filter: drop-shadow(0 0 22px rgba(200, 120, 255, 0.9)) brightness(1.1); cursor: pointer; }
        .speech-bubble { animation: bubblePop 2s ease-in-out forwards; }
        .particle     { animation: particleFly 0.9s ease-out forwards; }
      `}</style>

      {/* Main content */}
      <div className="relative flex flex-col h-full">
        {/* Luna area — bottom of screen */}
        <div className="flex-1 flex items-end justify-center">
          <div className="relative flex flex-col items-center" style={{ marginBottom: "-4px" }}>

            {/* Speech bubble */}
            {speechBubble && (
              <div
                className="speech-bubble absolute bg-white text-purple-800 font-bold text-sm px-3 py-1.5 rounded-2xl shadow-lg whitespace-nowrap"
                style={{ bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }}
              >
                {speechBubble}
                <div
                  className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0"
                  style={{ borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "8px solid white" }}
                />
              </div>
            )}

            {/* Particles */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="particle absolute text-lg pointer-events-none"
                style={{
                  "--tx": `${p.x}px`,
                  "--ty": `${p.y}px`,
                  bottom: "60%",
                  left: "50%",
                  transform: "translate(-50%, 0)",
                }}
              >
                {p.emoji}
              </div>
            ))}

            {/* Name */}
            <p
              className="text-white font-bold text-xl mb-1 tracking-wide select-none"
              style={{ textShadow: "0 0 14px rgba(200,150,255,0.9)" }}
            >
              Luna
            </p>

            {/* Luna character */}
            <div
              className={`${lunaAnimation} ${isHovered ? "luna-hover" : ""}`}
              style={{
                filter: `drop-shadow(0 0 16px rgba(180, 100, 255, 0.6))`,
                transition: "filter 0.2s",
                cursor: "pointer",
              }}
              onClick={handleLunaClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <img
                src={LUNA_URL}
                alt="Luna"
                style={{
                  height: "260px",
                  width: "auto",
                  display: "block",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="w-full max-w-xl mx-auto px-4 pb-5 pt-2">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 shadow-lg">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Say something to Luna..."
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-500 transition-colors shrink-0 shadow"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}