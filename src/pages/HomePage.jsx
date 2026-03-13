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
    <div className="fixed inset-0 bg-gradient-to-b from-[#0d0520] via-[#1a0a35] to-[#0d0520] flex flex-col items-center justify-center overflow-hidden pb-20">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.7 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 3 + "s",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow { 0%,100%{text-shadow:0 0 20px #a855f7} 50%{text-shadow:0 0 40px #a855f7, 0 0 60px #7c3aed} }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 40 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm w-full"
      >
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/ff69cdc46_da0a2eaa1_generated_image.png" 
            alt="Unfiltr By Javier" 
            className="w-40 h-40 object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="text-4xl font-black text-white mb-2" style={{ animation: "glow 3s ease-in-out infinite" }}>
          Unfiltr By Javier
        </h1>
        <p className="text-purple-300 text-lg mb-2 font-medium">Your AI companion, always here.</p>
        <p className="text-white/50 text-sm mb-10 leading-relaxed">
          Talk, vent, laugh, or just hang out. No judgement. No scripts. Just a friend who gets you.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 w-full mb-10">
          {[
            { icon: <MessageCircle className="w-5 h-5" />, label: "Real convos" },
            { icon: <Mic className="w-5 h-5" />, label: "Voice chat" },
            { icon: <Sparkles className="w-5 h-5" />, label: "8 companions" },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-purple-400">{f.icon}</div>
              <span className="text-white/70 text-xs font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-xl shadow-purple-500/30 active:scale-95 transition-transform"
        >
          Meet your companion ✨
        </button>
        <button
          onClick={() => navigate("/chat")}
          className="mt-3 w-full py-3 rounded-2xl border border-white/20 text-white/60 font-medium text-sm"
        >
          I already have one → Continue
        </button>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 z-10">
        <AppFooter dark />
      </div>
    </div>
  );
}