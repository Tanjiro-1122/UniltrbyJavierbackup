import React from "react";

/* ═══════════════════════════════════════════════════════════════
   ThemedBubble — SVG-powered chat bubble themes for Unfiltr
   Each theme is a self-contained SVG/CSS component.
   Usage: <ThemedBubble role="user"|"assistant" content="..." theme="imessage" fontFamily="..." fontSize={15} isLoading={false} />
═══════════════════════════════════════════════════════════════ */

/* ── Typing dots shared component ── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 4px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "rgba(196,180,252,0.9)",
          animation: "typingBounce 1.1s ease-in-out infinite",
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0) scale(1); opacity: 0.35; }
          30%          { transform: translateY(-7px) scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   THEME DEFINITIONS
══════════════════════════════════════════════════════════════ */

/* ── 1. iMessage ── classic rounded + CSS triangle tail ── */
function BubbleIMessage({ isUser, children, isLoading }) {
  const userBg   = "linear-gradient(140deg, #8b5cf6 0%, #7c3aed 45%, #db2777 100%)";
  const compBg   = "linear-gradient(145deg, rgba(88,28,135,0.85), rgba(67,20,110,0.92))";
  const tailColor = isUser ? "#7c3aed" : "rgba(67,20,110,0.90)";

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <div style={{
        background: isUser ? userBg : compBg,
        border: isUser ? "none" : "1.5px solid rgba(196,180,252,0.22)",
        borderRadius: 20,
        ...(isUser ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
        padding: isLoading ? "14px 18px" : "11px 16px",
        boxShadow: isUser
          ? "0 4px 20px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.2)"
          : "0 6px 28px rgba(109,40,217,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
        color: "white",
        position: "relative",
      }}>
        {isLoading ? <TypingDots /> : children}
      </div>
      {/* CSS triangle tail */}
      {!isLoading && (
        <div style={{
          position: "absolute",
          bottom: 0,
          ...(isUser ? { right: -7 } : { left: -7 }),
          width: 0, height: 0,
          borderTop: "10px solid transparent",
          borderBottom: "0px solid transparent",
          ...(isUser
            ? { borderLeft: `10px solid ${tailColor}` }
            : { borderRight: `10px solid ${tailColor}` }),
        }} />
      )}
    </div>
  );
}

/* ── 2. Thought Bubble ── floating circles tail ── */
function BubbleThought({ isUser, children, isLoading }) {
  const bg = isUser
    ? "linear-gradient(140deg, #8b5cf6, #7c3aed 45%, #db2777)"
    : "linear-gradient(145deg, rgba(88,28,135,0.85), rgba(76,29,149,0.9))";
  const dotColor = isUser ? "#7c3aed" : "rgba(67,20,110,0.9)";

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", paddingBottom: 18 }}>
      <div style={{
        background: bg,
        border: isUser ? "none" : "1.5px solid rgba(196,180,252,0.22)",
        borderRadius: 999,
        padding: isLoading ? "14px 20px" : "12px 20px",
        boxShadow: "0 4px 24px rgba(109,40,217,0.45)",
        color: "white",
      }}>
        {isLoading ? <TypingDots /> : children}
      </div>
      {/* Thought bubble circles */}
      {[
        { size: 10, bottom: 8,  offset: isUser ? "auto" : 18, right: isUser ? 18 : "auto" },
        { size: 6,  bottom: 2,  offset: isUser ? "auto" : 10, right: isUser ? 10 : "auto" },
        { size: 4,  bottom: -2, offset: isUser ? "auto" : 4,  right: isUser ? 4  : "auto" },
      ].map((dot, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: dot.bottom,
          left: dot.offset !== "auto" ? dot.offset : "auto",
          right: dot.right !== "auto" ? dot.right : "auto",
          width: dot.size, height: dot.size,
          borderRadius: "50%",
          background: dotColor,
          border: "1.5px solid rgba(196,180,252,0.2)",
        }} />
      ))}
    </div>
  );
}

/* ── 3. Comic / Spiky burst ── SVG clip-path ── */
function BubbleComic({ isUser, children, isLoading }) {
  const bg = isUser
    ? "linear-gradient(140deg, #f59e0b, #ef4444)"
    : "linear-gradient(145deg, #1d4ed8, #7c3aed)";

  // SVG starburst polygon
  const spikes = 12;
  const cx = 50, cy = 50, outerR = 50, innerR = 38;
  const points = Array.from({ length: spikes * 2 }, (_, i) => {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${cx + r * Math.cos(angle)}% ${cy + r * Math.sin(angle)}%`;
  }).join(", ");

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <div style={{
        background: bg,
        clipPath: `polygon(${points})`,
        padding: isLoading ? "28px 28px" : "22px 24px",
        color: "white",
        fontWeight: 800,
        textShadow: "1px 1px 0 rgba(0,0,0,0.4)",
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
        minWidth: 80,
        textAlign: "center",
      }}>
        {isLoading ? <TypingDots /> : children}
      </div>
    </div>
  );
}

/* ── 4. Neon Glow ── sharp square with animated SVG glow ── */
function BubbleNeon({ isUser, children, isLoading }) {
  const color = isUser ? "#a855f7" : "#06b6d4";
  const bg    = isUser
    ? "rgba(88,28,135,0.4)"
    : "rgba(6,182,212,0.08)";

  return (
    <div style={{
      position: "relative", display: "inline-block", maxWidth: "100%",
    }}>
      <div style={{
        background: bg,
        border: `1.5px solid ${color}`,
        borderRadius: 8,
        padding: isLoading ? "14px 18px" : "11px 16px",
        color: "white",
        boxShadow: `0 0 12px ${color}88, 0 0 28px ${color}44, inset 0 0 12px ${color}11`,
        animation: "neonFlicker 3s ease-in-out infinite",
        position: "relative",
      }}>
        {/* Corner accents */}
        {["0,0", "auto,0", "0,auto", "auto,auto"].map((pos, i) => {
          const [t,r,b,l] = [
            i < 2 ? -1 : "auto", i % 2 === 1 ? -1 : "auto",
            i >= 2 ? -1 : "auto", i % 2 === 0 ? -1 : "auto",
          ];
          return (
            <div key={i} style={{
              position: "absolute", top: t, right: r, bottom: b, left: l,
              width: 8, height: 8,
              borderTop:    (i < 2)      ? `2px solid ${color}` : "none",
              borderBottom: (i >= 2)     ? `2px solid ${color}` : "none",
              borderLeft:   (i % 2 === 0) ? `2px solid ${color}` : "none",
              borderRight:  (i % 2 === 1) ? `2px solid ${color}` : "none",
            }} />
          );
        })}
        {isLoading ? <TypingDots /> : children}
      </div>
      <style>{`
        @keyframes neonFlicker {
          0%,100% { box-shadow: 0 0 12px ${color}88, 0 0 28px ${color}44, inset 0 0 12px ${color}11; }
          50%      { box-shadow: 0 0 20px ${color}cc, 0 0 40px ${color}66, inset 0 0 16px ${color}22; }
        }
      `}</style>
    </div>
  );
}

/* ── 5. Sticky Note ── folded corner, slight rotation ── */
function BubbleSticky({ isUser, children, isLoading }) {
  const colors = isUser
    ? { bg: "#fde68a", fold: "#f59e0b", text: "#1c1917" }
    : { bg: "#ddd6fe", fold: "#8b5cf6", text: "#1c1917" };

  return (
    <div style={{
      position: "relative", display: "inline-block", maxWidth: "100%",
      transform: isUser ? "rotate(0.8deg)" : "rotate(-0.6deg)",
      filter: "drop-shadow(2px 4px 8px rgba(0,0,0,0.35))",
    }}>
      <div style={{
        background: colors.bg,
        borderRadius: "4px 12px 12px 4px",
        padding: isLoading ? "16px 18px 16px 14px" : "12px 18px 12px 14px",
        color: colors.text,
        fontWeight: 600,
        position: "relative",
        overflow: "hidden",
        /* Left colored strip */
        borderLeft: `4px solid ${colors.fold}`,
      }}>
        {/* Folded corner */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 0, height: 0,
          borderStyle: "solid",
          borderWidth: "0 16px 16px 0",
          borderColor: `transparent ${colors.fold} transparent transparent`,
        }} />
        {isLoading ? <TypingDots /> : children}
      </div>
    </div>
  );
}

/* ── 6. Pill ── fully rounded, minimal ── */
function BubblePill({ isUser, children, isLoading }) {
  const bg = isUser
    ? "linear-gradient(140deg, #8b5cf6, #7c3aed 45%, #db2777)"
    : "linear-gradient(145deg, rgba(88,28,135,0.85), rgba(67,20,110,0.92))";

  return (
    <div style={{ display: "inline-block", maxWidth: "100%" }}>
      <div style={{
        background: bg,
        border: isUser ? "none" : "1.5px solid rgba(196,180,252,0.22)",
        borderRadius: 999,
        padding: isLoading ? "14px 24px" : "11px 22px",
        color: "white",
        boxShadow: "0 4px 20px rgba(109,40,217,0.4)",
      }}>
        {isLoading ? <TypingDots /> : children}
      </div>
    </div>
  );
}

/* ── 7. Minimal ── border only, no fill ── */
function BubbleMinimal({ isUser, children, isLoading }) {
  const borderColor = isUser ? "rgba(168,85,247,0.7)" : "rgba(196,180,252,0.35)";

  return (
    <div style={{ display: "inline-block", maxWidth: "100%" }}>
      <div style={{
        background: "transparent",
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        padding: isLoading ? "14px 18px" : "11px 16px",
        color: "white",
      }}>
        {isLoading ? <TypingDots /> : children}
      </div>
    </div>
  );
}

/* ── 8. Retro SMS ── old-school green terminal feel ── */
function BubbleRetro({ isUser, children, isLoading }) {
  const bg = isUser ? "#166534" : "#14532d";
  const border = isUser ? "#22c55e" : "#16a34a";

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <div style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 6,
        padding: isLoading ? "14px 18px" : "10px 14px",
        color: "#4ade80",
        fontFamily: "'Courier New', monospace",
        fontSize: "0.92em",
        boxShadow: `0 0 10px ${border}66`,
        position: "relative",
      }}>
        {/* Scan-line overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)",
          pointerEvents: "none", borderRadius: 4,
        }} />
        {isLoading ? <TypingDots /> : children}
      </div>
      {/* Pixelated tail */}
      {!isLoading && (
        <div style={{
          position: "absolute", bottom: 4,
          ...(isUser ? { right: -8 } : { left: -8 }),
          width: 8, height: 8,
          background: bg,
          border: `2px solid ${border}`,
          borderRadius: 1,
        }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   THEME MAP — id matches BUBBLE_STYLES ids in ChatAppearancePanel
══════════════════════════════════════════════════════════════ */
const THEME_MAP = {
  imessage: BubbleIMessage,
  cloud:    BubbleThought,
  spiky:    BubbleComic,
  neon:     BubbleNeon,
  sticky:   BubbleSticky,
  pill:     BubblePill,
  minimal:  BubbleMinimal,
  retro:    BubbleRetro,
};

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export default function ThemedBubble({
  role, content, children, theme = "imessage",
  fontFamily, fontSize = 15, isLoading = false,
}) {
  const isUser  = role === "user";
  const BubbleComponent = THEME_MAP[theme] || BubbleIMessage;

  return (
    <BubbleComponent isUser={isUser} isLoading={isLoading}>
      <span style={{
        fontFamily: fontFamily || "inherit",
        fontSize,
        lineHeight: 1.55,
        wordBreak: "break-word",
        display: "block",
      }}>
        {children || content}
      </span>
    </BubbleComponent>
  );
}

export { THEME_MAP };
