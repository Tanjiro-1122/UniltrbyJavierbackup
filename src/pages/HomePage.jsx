import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mic, MessageCircle } from "lucide-react";
import AppFooter from "@/components/AppFooter";

export default function HomePage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="screen"
      style={{ background: "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)" }}
    >
      {/* ── STAR FIELD ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 90 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2.5 + 0.5 + "px",
              height: Math.random() * 2.5 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.8 + 0.1,
              animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + "s",
            }}
          />
        ))}
        {/* Purple nebula glow in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", top: "-60px" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(219,39,119,0.12) 0%, transparent 70%)" }} />
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes glow { 0%,100%{filter:drop-shadow(0 0 18px rgba(168,85,247,0.7))} 50%{filter:drop-shadow(0 0 36px rgba(168,85,247,1))} }
        @keyframes shimmer { 0%,100%{opacity:0.85} 50%{opacity:1} }
      `}</style>

      {/* ── MAIN CONTENT ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 30 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="scroll-area relative z-10 flex flex-col items-center px-6 text-center w-full"
        style={{ paddingTop: "max(3rem, env(safe-area-inset-top, 3rem))", paddingBottom: "1rem" }}
      >
        {/* Logo */}
        <div style={{ animation: "float 5s ease-in-out infinite" }} className="mb-5">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9710f9cf7_da0a2eaa1_generated_image.png"
            alt="Unfiltr By Javier"
            className="w-52 h-52 object-contain"
            style={{ animation: "glow 4s ease-in-out infinite", filter: "drop-shadow(0 0 24px rgba(168,85,247,0.8))" }}
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-white mb-1 tracking-tight"
          style={{ textShadow: "0 0 30px rgba(168,85,247,0.9), 0 2px 8px rgba(0,0,0,0.8)" }}>
          Unfiltr By Javier
        </h1>
        <p className="text-purple-300 text-base mb-2 font-semibold tracking-wide">Your AI companion, always here.</p>
        <p className="text-white/45 text-sm mb-8 leading-relaxed max-w-xs">
          Talk, vent, laugh, or just hang out. No judgement. No scripts. Just a friend who gets you.
        </p>

        {/* Feature tiles */}
        <div className="grid grid-cols-3 gap-3 w-full mb-8">
          {[
            { icon: <MessageCircle className="w-6 h-6" />, label: "Real convos" },
            { icon: <Mic className="w-6 h-6" />, label: "Voice chat" },
            { icon: <Sparkles className="w-6 h-6" />, label: "8 companions" },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-2xl p-3 border"
              style={{
                background: "rgba(139,92,246,0.12)",
                borderColor: "rgba(139,92,246,0.3)",
                boxShadow: "0 0 16px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
              <div className="text-purple-400" style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.7))" }}>{f.icon}</div>
              <span className="text-white/80 text-xs font-semibold">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-4 rounded-2xl text-white font-black text-lg active:scale-95 transition-transform mb-3"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
            boxShadow: "0 0 30px rgba(168,85,247,0.5), 0 4px 20px rgba(0,0,0,0.4)",
            animation: "shimmer 3s ease-in-out infinite",
          }}
        >
          Meet your companion ✨
        </button>

        {/* Secondary CTA */}
        <button
          onClick={() => navigate("/chat")}
          className="w-full py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          I already have one → Continue
        </button>
      </motion.div>

      {/* Footer */}
      <div className="sticky-bottom relative z-10">
        <AppFooter dark />
      </div>
    </div>
  );
}