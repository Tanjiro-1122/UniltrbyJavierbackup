import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Up late?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Up late?";
}

const EmojiIcon = ({ emoji, glow }) => (
  <div style={{
    width: 64, height: 64, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 46,
    filter: `drop-shadow(0 0 18px ${glow})`,
  }}>
    {emoji}
  </div>
);

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1 + 0.15, type: "spring", stiffness: 260, damping: 24 },
  }),
};

export default function HubPage() {
  const navigate = useNavigate();
  const name = localStorage.getItem("unfiltr_display_name") || 
               localStorage.getItem("unfiltr_companion_nickname") || null;
  const greeting = getGreeting();

  const cards = [
    {
      emoji: "💬",
      glow: "rgba(168,85,247,0.7)",
      border: "rgba(168,85,247,0.5)",
      bg: "linear-gradient(160deg,rgba(124,58,237,0.18) 0%,rgba(168,85,247,0.06) 100%)",
      shadow: "0 0 40px rgba(124,58,237,0.25), 0 20px 50px rgba(0,0,0,0.6)",
      title: "Chat",
      titleColor: "#c4b5fd",
      sub: "Talk with your companion",
      hint: "Pick your vibe → how you feel → let's go",
      hintColor: "rgba(196,181,253,0.6)",
      onClick: () => navigate("/vibe"),
    },
    {
      emoji: "📓",
      glow: "rgba(52,211,153,0.6)",
      border: "rgba(52,211,153,0.5)",
      bg: "linear-gradient(160deg,rgba(16,185,129,0.18) 0%,rgba(52,211,153,0.06) 100%)",
      shadow: "0 0 40px rgba(16,185,129,0.2), 0 20px 50px rgba(0,0,0,0.6)",
      title: "Journal",
      titleColor: "#34d399",
      sub: "Write freely, speak your truth",
      hint: "How you feel → your private space",
      hintColor: "rgba(52,211,153,0.6)",
      onClick: () => navigate("/mood?dest=journal"),
    },
    {
      emoji: "🧘",
      glow: "rgba(125,211,252,0.6)",
      border: "rgba(125,211,252,0.5)",
      bg: "linear-gradient(160deg,rgba(14,165,233,0.18) 0%,rgba(125,211,252,0.06) 100%)",
      shadow: "0 0 40px rgba(14,165,233,0.2), 0 20px 50px rgba(0,0,0,0.6)",
      title: "Meditate",
      titleColor: "#7dd3fc",
      sub: "Ambient sounds + breathing",
      hint: "Your companion checks in after 💜",
      hintColor: "rgba(125,211,252,0.6)",
      onClick: () => navigate("/meditate"),
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      fontFamily: "'SF Pro Display',system-ui,-apple-system,sans-serif",
      display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 20%, rgba(124,58,237,0.4) 0%, #0d0218 45%, #06020f 100%)",
    }}>
      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
        width: 440, height: 440, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          flexShrink: 0,
          padding: "max(1.4rem,env(safe-area-inset-top)) 18px 8px",
          display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 5,
        }}
      >
        <button onClick={() => navigate(-1)} style={{
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: "-0.5px" }}>
            {name ? `${greeting}, ${name.split(" ")[0]} 👋` : "What do you want to do?"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0, fontWeight: 500 }}>
            {name ? "Choose your experience" : "Choose your experience"}
          </p>
        </div>
      </motion.div>

      {/* Cards */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 16, padding: "0 28px", position: "relative", zIndex: 5,
      }}>
        {cards.map((card, i) => (
          <motion.button
            key={card.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.97 }}
            onClick={card.onClick}
            style={{
              width: "100%", padding: "24px 24px", borderRadius: 28,
              border: `2px solid ${card.border}`,
              background: card.bg,
              backdropFilter: "blur(20px)",
              boxShadow: card.shadow,
              display: "flex", alignItems: "center", gap: 20,
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
              textAlign: "left",
            }}
          >
            <EmojiIcon emoji={card.emoji} glow={card.glow} />
            <div>
              <div style={{ color: card.titleColor, fontWeight: 800, fontSize: 21, letterSpacing: "-0.3px" }}>
                {card.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 500, marginTop: 3 }}>
                {card.sub}
              </div>
              <div style={{ color: card.hintColor, fontSize: 12, marginTop: 5 }}>
                {card.hint}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Bottom safe area */}
      <div style={{ height: "max(20px, env(safe-area-inset-bottom))" }} />
    </div>
  );
}
