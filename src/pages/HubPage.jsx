import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export default function HubPage() {
  const navigate = useNavigate();

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
      <div style={{
        flexShrink: 0,
        padding: "max(1.4rem,env(safe-area-inset-top)) 18px 8px",
        display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 5,
      }}>
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
            What do you want to do?
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0, fontWeight: 500 }}>
            Choose your experience
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 16, padding: "0 28px", position: "relative", zIndex: 5,
      }}>

        {/* Chat Card */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/vibe")}
          style={{
            width: "100%", padding: "24px 24px", borderRadius: 28,
            border: "2px solid rgba(168,85,247,0.5)",
            background: "linear-gradient(160deg,rgba(124,58,237,0.18) 0%,rgba(168,85,247,0.06) 100%)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 40px rgba(124,58,237,0.25), 0 20px 50px rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", gap: 20,
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
            textAlign: "left",
          }}
        >
          <EmojiIcon emoji="💬" glow="rgba(168,85,247,0.7)" />
          <div>
            <div style={{ color: "#c4b5fd", fontWeight: 800, fontSize: 21, letterSpacing: "-0.3px" }}>Chat</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 500, marginTop: 3 }}>Talk with your companion</div>
            <div style={{ color: "rgba(196,181,253,0.6)", fontSize: 12, marginTop: 5 }}>Pick your vibe → how you feel → let's go</div>
          </div>
        </motion.button>

        {/* Journal Card */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/mood?dest=journal")}
          style={{
            width: "100%", padding: "24px 24px", borderRadius: 28,
            border: "2px solid rgba(52,211,153,0.5)",
            background: "linear-gradient(160deg,rgba(16,185,129,0.18) 0%,rgba(52,211,153,0.06) 100%)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 40px rgba(16,185,129,0.2), 0 20px 50px rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", gap: 20,
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
            textAlign: "left",
          }}
        >
          <EmojiIcon emoji="📓" glow="rgba(52,211,153,0.6)" />
          <div>
            <div style={{ color: "#34d399", fontWeight: 800, fontSize: 21, letterSpacing: "-0.3px" }}>Journal</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 500, marginTop: 3 }}>Write freely, speak your truth</div>
            <div style={{ color: "rgba(52,211,153,0.6)", fontSize: 12, marginTop: 5 }}>How you feel → your private space</div>
          </div>
        </motion.button>

        {/* Meditate Card */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/meditate")}
          style={{
            width: "100%", padding: "24px 24px", borderRadius: 28,
            border: "2px solid rgba(125,211,252,0.5)",
            background: "linear-gradient(160deg,rgba(14,165,233,0.18) 0%,rgba(125,211,252,0.06) 100%)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 40px rgba(14,165,233,0.2), 0 20px 50px rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", gap: 20,
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
            textAlign: "left",
          }}
        >
          <EmojiIcon emoji="🧘" glow="rgba(125,211,252,0.6)" />
          <div>
            <div style={{ color: "#7dd3fc", fontWeight: 800, fontSize: 21, letterSpacing: "-0.3px" }}>Meditate</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 500, marginTop: 3 }}>Ambient sounds + breathing</div>
            <div style={{ color: "rgba(125,211,252,0.6)", fontSize: 12, marginTop: 5 }}>Your companion checks in after 💜</div>
          </div>
        </motion.button>

      </div>

      {/* Bottom safe area */}
      <div style={{ height: "max(20px, env(safe-area-inset-bottom))" }} />
    </div>
  );
}
