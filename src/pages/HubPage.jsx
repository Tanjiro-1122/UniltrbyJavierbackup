// v4-deploy-trigger
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { COMPANIONS } from "../components/companionData";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { text: "Still up?",      emoji: "🌙" };
  if (h < 12) return { text: "Good morning",   emoji: "✨" };
  if (h < 17) return { text: "Good afternoon", emoji: "💫" };
  if (h < 21) return { text: "Good evening",   emoji: "🌙" };
  return       { text: "Night owl mode",        emoji: "⭐" };
}

export default function HubPage() {
  const navigate = useNavigate();
  const [companion, setCompanion] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const name = localStorage.getItem("unfiltr_display_name") || null;
  const nickName = localStorage.getItem("unfiltr_companion_nickname") || null;
  const greeting = getGreeting();

  useEffect(() => {
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

  const companionImg = companion?.poses?.happy || companion?.poses?.neutral || companion?.avatar || "";
  const companionDisplayName = nickName || companion?.displayName || companion?.name || "";

  const tiles = [
    {
      id: "chat",
      label: "Chat",
      sublabel: "Talk with " + (companionDisplayName || "your companion"),
      icon: null,
      notoEmoji: "1f4ac", emojiChar: "💬",  // speech bubble
      accent: "#a78bfa",
      accentDark: "rgba(109,40,217,0.85)",
      glow: "rgba(139,92,246,0.55)",
      border: "rgba(167,139,250,0.4)",
      bg: "linear-gradient(145deg, rgba(109,40,217,0.55) 0%, rgba(76,29,149,0.4) 60%, rgba(20,5,50,0.5) 100%)",
      route: "/mood?dest=chat",
      badge: null,
    },
    {
      id: "journal",
      label: "Journal",
      sublabel: "Your private space",
      icon: null,
      notoEmoji: "270f", emojiChar: "✏️",   // pencil
      accent: "#34d399",
      accentDark: "rgba(5,120,80,0.85)",
      glow: "rgba(52,211,153,0.5)",
      border: "rgba(52,211,153,0.35)",
      bg: "linear-gradient(145deg, rgba(6,95,70,0.6) 0%, rgba(4,65,50,0.45) 60%, rgba(2,20,15,0.5) 100%)",
      route: "/mood?dest=journal",
      badge: null,
    },
    {
      id: "meditate",
      label: "Meditate",
      sublabel: "Breathe & reset",
      icon: null,
      notoEmoji: "2728", emojiChar: "✨",   // sparkles
      accent: "#7dd3fc",
      accentDark: "rgba(3,105,161,0.85)",
      glow: "rgba(56,189,248,0.45)",
      border: "rgba(125,211,252,0.3)",
      bg: "linear-gradient(145deg, rgba(3,105,161,0.5) 0%, rgba(7,89,133,0.38) 60%, rgba(2,20,40,0.5) 100%)",
      route: "/meditate",
      badge: null,
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0,
      fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
      background: "radial-gradient(ellipse at 50% 0%, rgba(88,28,220,0.55) 0%, #0a0118 40%, #04010d 100%)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── Top ambient glow ── */}
      <div style={{
        position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 380,
        background: "radial-gradient(ellipse, rgba(109,40,217,0.4) 0%, transparent 72%)",
        filter: "blur(50px)", pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          flexShrink: 0,
          paddingTop: "max(52px, env(safe-area-inset-top, 52px))",
          padding: "max(52px, env(safe-area-inset-top, 52px)) 22px 0",
          position: "relative", zIndex: 5,
          display: "flex", alignItems: "center", gap: 16,
        }}
      >
        {/* Companion circle — show avatar image cropped to face area */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(109,40,217,0.35))",
          border: "2px solid rgba(167,139,250,0.55)",
          boxShadow: "0 0 22px rgba(139,92,246,0.45)",
          overflow: "hidden",
          position: "relative",
        }}>
          {companionImg ? (
            <img src={companionImg} alt={companionDisplayName}
              onLoad={() => setAvatarLoaded(true)}
              style={{
                position: "absolute",
                bottom: "-10%", left: "50%",
                transform: "translateX(-50%)",
                width: "160%", height: "160%",
                objectFit: "cover",
                objectPosition: "top center",
                opacity: avatarLoaded ? 1 : 0,
                transition: "opacity 0.3s",
              }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#c4b5fd",
            }}>
              {companionDisplayName ? companionDisplayName.charAt(0).toUpperCase() : "✨"}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <h1 style={{
              color: "white", fontWeight: 800, fontSize: 22,
              margin: 0, letterSpacing: "-0.4px",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}>
              {name ? `${greeting.text}, ${name.split(" ")[0]}` : greeting.text}
            </h1>
            <span style={{ fontSize: 22 }}>{greeting.emoji}</span>
          </div>
          <p style={{
            color: "rgba(255,255,255,0.38)", fontSize: 13,
            margin: "2px 0 0", fontWeight: 500,
          }}>
            {companionDisplayName ? `${companionDisplayName} is here for you` : "What do you need today?"}
          </p>
        </div>
      </motion.div>

      {/* ── TILE GRID ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "20px 20px",
        gap: 14,
        position: "relative", zIndex: 5,
      }}>

        {/* TOP ROW — Chat (large) */}
        <motion.button
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 26 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/mood?dest=chat")}
          style={{
            width: "100%",
            height: 160,
            borderRadius: 28,
            border: `1.5px solid ${tiles[0].border}`,
            background: tiles[0].bg,
            backdropFilter: "blur(24px)",
            boxShadow: `0 0 50px ${tiles[0].glow}, 0 16px 48px rgba(0,0,0,0.55)`,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            overflow: "hidden",
            position: "relative",
            display: "flex", alignItems: "flex-end",
            padding: "22px 24px",
            textAlign: "left",
          }}
        >
          {/* Companion avatar inside chat tile */}
          {companionImg && (
            <div style={{
              position: "absolute",
              right: 0, bottom: 0,
              height: "100%",
              width: 140,
              display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
              overflow: "hidden",
            }}>
              <img
                src={companionImg}
                alt=""
                style={{
                  height: "130%",
                  width: "auto",
                  objectFit: "contain",
                  objectPosition: "bottom right",
                  opacity: avatarLoaded ? 0.85 : 0,
                  filter: "drop-shadow(0 0 20px rgba(139,92,246,0.6))",
                  transition: "opacity 0.4s",
                }}
              />
              {/* Fade gradient on right edge */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to right, rgba(50,10,100,0.7) 0%, transparent 50%)",
                pointerEvents: "none",
              }} />
            </div>
          )}

          {/* Sparkle glow orb in tile */}
          <div style={{
            position: "absolute", top: -30, left: "30%",
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)",
            filter: "blur(20px)", pointerEvents: "none",
          }} />

          {/* Companion avatar inside chat tile */}
          {companionImg && (
            <div style={{
              position: "absolute",
              right: 0, bottom: 0,
              height: "100%", width: 140,
              display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
              overflow: "hidden",
            }}>
              <img src={companionImg} alt="" style={{
                height: "130%", width: "auto",
                objectFit: "contain", objectPosition: "bottom right",
                opacity: avatarLoaded ? 0.9 : 0,
                filter: "drop-shadow(0 0 20px rgba(139,92,246,0.6))",
                transition: "opacity 0.4s",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to right, rgba(50,10,100,0.75) 0%, transparent 55%)",
                pointerEvents: "none",
              }} />
            </div>
          )}

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ marginBottom: 6, lineHeight: 1 }}>
            <span style={{ fontSize: 36, filter: "drop-shadow(0 0 12px rgba(139,92,246,0.8))" }}>💬</span>
          </div>
            <div style={{
              color: tiles[0].accent, fontWeight: 900, fontSize: 26,
              letterSpacing: "-0.5px", lineHeight: 1,
              textShadow: `0 0 20px ${tiles[0].glow}`,
            }}>
              Chat
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 500, marginTop: 4 }}>
              {tiles[0].sublabel}
            </div>
          </div>
        </motion.button>

        {/* BOTTOM ROW — Journal + Meditate side by side */}
        <div style={{ display: "flex", gap: 14 }}>
          {[tiles[1], tiles[2]].map((tile, i) => (
            <motion.button
              key={tile.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.18 + i * 0.08, type: "spring", stiffness: 280, damping: 26 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(tile.route)}
              style={{
                flex: 1,
                height: 160,
                borderRadius: 26,
                border: `1.5px solid ${tile.border}`,
                background: tile.bg,
                backdropFilter: "blur(24px)",
                boxShadow: `0 0 35px ${tile.glow}, 0 14px 36px rgba(0,0,0,0.55)`,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                overflow: "hidden",
                position: "relative",
                display: "flex", flexDirection: "column",
                alignItems: "flex-start", justifyContent: "flex-end",
                padding: "18px 18px",
                textAlign: "left",
              }}
            >
              {/* Ambient glow orb */}
              <div style={{
                position: "absolute", top: -20, right: -20,
                width: 100, height: 100, borderRadius: "50%",
                background: `radial-gradient(circle, ${tile.glow} 0%, transparent 70%)`,
                filter: "blur(18px)", pointerEvents: "none",
              }} />

              <div style={{ fontSize: 40, marginBottom: 8, lineHeight: 1, position: "relative", zIndex: 2 }}>
                {tile.notoEmoji ? (
                  <span style={{ fontSize: 40, lineHeight: 1, filter: `drop-shadow(0 0 10px ${tile.glow || "rgba(255,255,255,0.5)"})` }}>{tile.emojiChar || "✨"}</span>
                ) : tile.icon}
              </div>
              <div style={{
                color: tile.accent, fontWeight: 900, fontSize: 20,
                letterSpacing: "-0.4px", lineHeight: 1, position: "relative", zIndex: 2,
                textShadow: `0 0 16px ${tile.glow}`,
              }}>
                {tile.label}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.38)", fontSize: 12,
                fontWeight: 500, marginTop: 4, position: "relative", zIndex: 2,
                lineHeight: 1.3,
              }}>
                {tile.sublabel}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Bottom safe area ── */}
      <div style={{ height: "max(16px, env(safe-area-inset-bottom, 16px))", flexShrink: 0 }} />
    </div>
  );
}



