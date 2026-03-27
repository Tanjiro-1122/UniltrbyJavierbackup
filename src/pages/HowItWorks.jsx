import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MessageCircle, Shield, Brain, BookOpen, Sparkles } from "lucide-react";

const STEPS = [
  { icon: Sparkles,      color: "#a855f7", title: "Choose Your Companion",   desc: "Pick from 12 unique AI companions, each with their own personality, style, and energy." },
  { icon: MessageCircle, color: "#db2777", title: "Set the Vibe",            desc: "Tell your companion how you're feeling. Chill, Vent, Hype, Deep Talk — they match your energy." },
  { icon: Brain,         color: "#3b82f6", title: "They Remember You",       desc: "Premium companions build memory over time. They know your story, your mood, your world." },
  { icon: BookOpen,      color: "#22c55e", title: "Journal Your Thoughts",   desc: "Write freely in your private journal. Your entries are encrypted and only yours." },
  { icon: Shield,        color: "#f59e0b", title: "Your Privacy is Sacred",  desc: "We never sell your data. Your conversations stay between you and your companion — period." },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 0%,#1a0535 0%,#0d0520 40%,#06020f 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui,-apple-system,sans-serif",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(1.5rem,env(safe-area-inset-top)) 16px 16px", flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>How It Works</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Everything you need to know</p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px max(32px,env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 14 }}>
        {STEPS.map(({ icon: Icon, color, title, desc }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            style={{
              display: "flex", gap: 16, alignItems: "flex-start",
              padding: "18px 16px", borderRadius: 18,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>{title}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          </motion.div>
        ))}

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/onboarding/consent")}
          style={{
            width: "100%", padding: "18px", marginTop: 8,
            background: "linear-gradient(135deg,#7c3aed,#a855f7,#db2777)",
            border: "none", borderRadius: 18,
            color: "white", fontWeight: 800, fontSize: 17,
            cursor: "pointer", boxShadow: "0 0 28px rgba(168,85,247,0.4)",
          }}>
          Meet Your Companion →
        </motion.button>
      </div>
    </div>
  );
}
