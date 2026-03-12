import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Splash() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          navigate("/chat");
        } else {
          setIsAuth(false);
        }
      } catch {
        setIsAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isAuth === null) return null;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center overflow-hidden max-w-[430px] mx-auto">
      {/* Animated Celtic Triquetra */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-32 h-32 mb-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="30" r="15" fill="none" stroke="url(#purpleGrad)" strokeWidth="2.5" />
        <circle cx="30" cy="65" r="15" fill="none" stroke="url(#purpleGrad)" strokeWidth="2.5" />
        <circle cx="70" cy="65" r="15" fill="none" stroke="url(#purpleGrad)" strokeWidth="2.5" />
        <path d="M 50 30 Q 40 45 30 65" fill="none" stroke="url(#purpleGrad)" strokeWidth="2.5" />
        <path d="M 50 30 Q 60 45 70 65" fill="none" stroke="url(#purpleGrad)" strokeWidth="2.5" />
        <path d="M 30 65 Q 50 50 70 65" fill="none" stroke="url(#purpleGrad)" strokeWidth="2.5" />
      </motion.svg>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-white mb-3">Unfiltered</h1>
        <p className="text-white/60 text-lg">Your space. No filters.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="fixed bottom-0 left-0 right-0 px-4 pb-8 max-w-[430px] mx-auto flex flex-col gap-3"
      >
        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          Get Started →
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95"
        >
          Sign In
        </button>
      </motion.div>
    </div>
  );
}