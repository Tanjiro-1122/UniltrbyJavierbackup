import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";

const WORLD_BG = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/19c79bde2_generated_image.png";

const QUOTES = [
  "Writing is the painting of the voice.",
  "The journal is a vehicle for my sense of selfhood.",
  "Fill your paper with the breathings of your heart.",
  "In the journal I do not just express myself — I create myself.",
  "Write hard and clear about what hurts.",
];

export default function JournalHome() {
  const navigate = useNavigate();
  const [entryCount, setEntryCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [companion, setCompanion] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  useEffect(() => {
    try {
      const entries = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
      setEntryCount(entries.length);
      const thisMonth = new Date().toISOString().slice(0, 7);
      setMonthCount(entries.filter(e => e.date?.startsWith(thisMonth)).length);
    } catch {}
    try {
      const saved = localStorage.getItem("unfiltr_companion");
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = COMPANIONS.find(c => c.id === parsed.id || c.name === parsed.name);
        if (found) setCompanion(found);
        else if (COMPANIONS.length > 0) setCompanion(COMPANIONS[0]);
      } else if (COMPANIONS.length > 0) {
        setCompanion(COMPANIONS[0]);
      }
    } catch {}
  }, []);

  const companionImg = companion?.poses?.contentment || companion?.poses?.happy || companion?.poses?.neutral || "";
  const nickName = localStorage.getItem("unfiltr_companion_nickname") || companion?.displayName || companion?.name || "";

  const tiles = [
    {
      id: "classic",
      icon: "✏️",
      title: "Classic Mode",
      sub: "Just you and the page",
      accent: "#a78bfa",
      glow: "rgba(167,139,250,0.45)",
      border: "rgba(167,139,250,0.35)",
      bg: "linear-gradient(145deg, rgba(109,40,217,0.5) 0%, rgba(76,29,149,0.3) 60%, rgba(15,5,40,0.6) 100%)",
      route: "/journal/entry",
    },
    {
      id: "immersive",
      icon: "🌍",
      title: "Immersive Mode",
      sub: "Write inside a world",
      accent: "#60a5fa",
      glow: "rgba(96,165,250,0.45)",
      border: "rgba(96,165,250,0.35)",
      bg: "linear-gradient(145deg, rgba(29,78,216,0.5) 0%, rgba(30,58,138,0.3) 60%, rgba(5,10,40,0.6) 100%)",
      route: "/journal/world",
    },
    {
      id: "saved",
      icon: "📚",
      title: "Saved Entries",
      sub: entryCount > 0 ? `${entryCount} entries · ${monthCount} this month` : "Your memories live here",
      accent: "#34d399",
      glow: "rgba(52,211,153,0.4)",
      border: "rgba(52,211,153,0.3)",
      bg: "linear-gradient(145deg, rgba(6,95,70,0.45) 0%, rgba(4,60,45,0.3) 60%, rgba(2,15,10,0.6) 100%)",
      route: "/journal/list",
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
      background: "#06020f",
    }}>
      {/* Full-screen ambient background from beach world */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: `url(${WORLD_BG})`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
        opacity: 0.12,
      }} />
      {/* Deep overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(to bottom, rgba(6,2,15,0.7) 0%, rgba(6,2,15,0.45) 35%, rgba(6,2,15,0.85) 75%, rgba(6,2,15,0.98) 100%)",
      }} />

      {/* Purple + green ambient orbs */}
      <div style={{
        position: "absolute", top: "-8%", left: "50%", transform: "translateX(-50%)",
        width: 420, height: 320, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(109,40,217,0.4) 0%, transparent 65%)",
        filter: "blur(50px)", pointerEvents: "none", zIndex: 1,
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "-10%",
        width: 240, height: 240, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 65%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 1,
      }} />

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", gap: 14,
          paddingTop: "max(54px, env(safe-area-inset-top, 54px))",
          padding: "max(54px, env(safe-area-inset-top, 54px)) 20px 0",
        }}
      >
        <button onClick={() => navigate("/hub")} style={{
          width: 40, height: 40, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent",
        }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: "-0.4px" }}>
            My Journal 📓
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "2px 0 0" }}>
            {nickName ? `${nickName} is listening 💜` : "Your private space"}
          </p>
        </div>
      </motion.div>

      {/* ── COMPANION + QUOTE CENTER ── */}
      <div style={{
        position: "relative", zIndex: 5,
        display: "flex", flexDirection: "column", alignItems: "center",
        marginTop: 16, marginBottom: 8,
      }}>
        {/* Companion avatar — small, ethereal */}
        {companionImg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: avatarLoaded ? 1 : 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              width: 130, height: 170,
              filter: "drop-shadow(0 0 28px rgba(167,139,250,0.5))",
            }}
          >
            <img
              src={companionImg}
              onLoad={() => setAvatarLoaded(true)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom" }}
            />
          </motion.div>
        )}

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            color: "rgba(255,255,255,0.22)", fontSize: 12,
            fontStyle: "italic", textAlign: "center",
            margin: "6px 32px 0",
            lineHeight: 1.5,
            fontFamily: "'Georgia', serif",
          }}
        >
          "{quote}"
        </motion.p>
      </div>

      {/* ── MODE TILES ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", gap: 12,
        padding: "0 20px",
      }}>
        {tiles.map((tile, i) => (
          <motion.button
            key={tile.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300, damping: 28 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(tile.route)}
            style={{
              width: "100%", padding: "18px 20px",
              borderRadius: 22,
              border: `1.5px solid ${tile.border}`,
              background: tile.bg,
              backdropFilter: "blur(20px)",
              boxShadow: `0 0 30px ${tile.glow}, 0 10px 30px rgba(0,0,0,0.45)`,
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", textAlign: "left",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: `${tile.glow.replace('0.45)', '0.2)')}`,
              border: `1px solid ${tile.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
              boxShadow: `0 0 18px ${tile.glow}`,
            }}>
              {tile.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                color: tile.accent, fontWeight: 800, fontSize: 17,
                letterSpacing: "-0.3px",
                textShadow: `0 0 14px ${tile.glow}`,
              }}>
                {tile.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginTop: 3, fontWeight: 500 }}>
                {tile.sub}
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 20, flexShrink: 0 }}>›</div>
          </motion.button>
        ))}
      </div>

      {/* Bottom safe area */}
      <div style={{ height: "max(24px, env(safe-area-inset-bottom, 24px))" }} />
    </div>
  );
}
