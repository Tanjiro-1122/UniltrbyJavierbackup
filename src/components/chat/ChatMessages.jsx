import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Share2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { hapticLight } from "@/components/utils/haptics";
import { soundReceive } from "@/components/utils/sounds";
import SwipeableMessage from "./SwipeableMessage";
import ChatErrorMessage from "./ChatErrorMessage";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

/* ── Comic tail: rendered via CSS class, no JSX element needed ── */
function BubbleTailLeft() { return null; }

/* ── Comic tail: rendered via CSS class, no JSX element needed ── */
function BubbleTailRight() { return null; }

/* ── Sparkle burst on new companion message ─────────────────────── */
function SparkleEffect({ active }) {
  if (!active) return null;
  const sparks = ["✦", "✧", "⋆", "✦", "✧"];
  return (
    <div style={{ position: "absolute", top: -10, left: -10, pointerEvents: "none", zIndex: 20 }}>
      {sparks.map((s, i) => (
        <span key={i} style={{
          position: "absolute",
          fontSize: 10,
          color: i % 2 === 0 ? "#c4b5fd" : "#f9a8d4",
          animation: `sparkle${i} 0.6s ease-out forwards`,
          opacity: 0,
        }}>{s}</span>
      ))}
      <style>{`
        @keyframes sparkle0 { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(-18px,-20px) scale(0.4)} }
        @keyframes sparkle1 { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(20px,-18px) scale(0.4)} }
        @keyframes sparkle2 { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(-12px,16px) scale(0.4)} }
        @keyframes sparkle3 { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(22px,14px) scale(0.4)} }
        @keyframes sparkle4 { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(6px,-24px) scale(0.4)} }
      `}</style>
    </div>
  );
}

export default function ChatMessages({
  messages, loading, companionMood, setShareCard,
  messagesEndRef, onSwipeReply, onRetry, companionName, onBookmark,
}) {
  const [reactions, setReactions] = useState({});
  const [pickerIdx, setPickerIdx] = useState(null);
  // Typing indicator is shown in the avatar bubble panel above, not here
  const [sparkleIdx, setSparkleIdx] = useState(null);
  const prevLengthRef = useRef(messages.length);

  // Sound + haptic + sparkle on new companion message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && messages.length > prevLengthRef.current) {
      soundReceive();
      hapticLight();
      setSparkleIdx(messages.length - 1);
      setTimeout(() => setSparkleIdx(null), 700);
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Typing state managed in ChatPage avatar panel

  const handleLongPress = (idx) => {
    hapticLight();
    setPickerIdx(pickerIdx === idx ? null : idx);
  };

  const handleReact = (idx, emoji) => {
    setReactions(prev => {
      const current = prev[idx] || [];
      if (current.includes(emoji)) return { ...prev, [idx]: current.filter(e => e !== emoji) };
      return { ...prev, [idx]: [...current, emoji] };
    });
    setPickerIdx(null);
    hapticLight();
  };

  return (
    <div className="scroll-area" style={{
      flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
      WebkitOverflowScrolling: "touch", overscrollBehavior: "contain",
      scrollbarWidth: "none", msOverflowStyle: "none",
      padding: "8px 16px 14px",
      display: "flex", flexDirection: "column",
      gap: 12,
    }}>
      <style>{`
        /* ── Bubble entrance ── */
        /* ── Comic speech bubble tails via ::before/::after ── */
        .bubble-companion {
          position: relative;
          border-radius: 18px !important;
          margin-bottom: 14px;
        }
        .bubble-companion::after {
          content: "";
          position: absolute;
          bottom: -13px;
          left: 20px;
          width: 0;
          height: 0;
          border-left: 13px solid transparent;
          border-right: 0px solid transparent;
          border-top: 14px solid rgba(67,20,110,0.90);
        }
        .bubble-companion::before {
          content: "";
          position: absolute;
          bottom: -17px;
          left: 18px;
          width: 0;
          height: 0;
          border-left: 15px solid transparent;
          border-right: 2px solid transparent;
          border-top: 17px solid rgba(196,180,252,0.22);
          z-index: -1;
        }

        .bubble-user {
          position: relative;
          border-radius: 18px !important;
          margin-bottom: 14px;
        }
        .bubble-user::after {
          content: "";
          position: absolute;
          bottom: -13px;
          right: 20px;
          width: 0;
          height: 0;
          border-right: 13px solid transparent;
          border-left: 0px solid transparent;
          border-top: 14px solid #7c3aed;
        }
        .bubble-user::before {
          content: "";
          position: absolute;
          bottom: -17px;
          right: 18px;
          width: 0;
          height: 0;
          border-right: 15px solid transparent;
          border-left: 2px solid transparent;
          border-top: 17px solid rgba(0,0,0,0.35);
          z-index: -1;
        }

        @keyframes bubblePop {
          0%   { transform: scale(0.75) translateY(8px); opacity: 0; }
          65%  { transform: scale(1.05) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .bubble-enter {
          animation: bubblePop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        /* ── Typing dots ── */
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          30%            { transform: translateY(-8px) scale(1.25); opacity: 1; }
        }

        /* ── Shimmer on companion bubble ── */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        /* ── Glow pulse on speaking ── */
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 6px 32px rgba(109,40,217,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15); }
          50%       { box-shadow: 0 8px 40px rgba(139,92,246,0.75), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
        }

        /* ── Reaction pill hover ── */
        .reaction-pill:active { transform: scale(1.2); }

        /* ── Companion name label fade ── */
        @keyframes nameFade { 0%,100%{opacity:0.45} 50%{opacity:0.75} }
      `}</style>

      {/* Tap-outside to close reaction picker */}
      {pickerIdx !== null && (
        <div onClick={() => setPickerIdx(null)}
          style={{ position: "fixed", inset: 0, zIndex: 48 }} />
      )}

      {(() => {
        // Find the index of the LAST assistant message (shown in bubble above, not here)
        let lastAssistantIdx = -1;
        for (let j = messages.length - 1; j >= 0; j--) {
          if (messages[j].role === "assistant" && messages[j].content !== "__ERROR__") {
            lastAssistantIdx = j;
            break;
          }
        }
        return messages.map((msg, i) => {
        // Skip the latest companion message — it's shown in the speech bubble above
        if (i === lastAssistantIdx) return null;

        /* ── Error state ── */
        if (msg.content === "__ERROR__" && msg.role === "assistant") {
          return (
            <div key={i} style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 10 }}>
              <ChatErrorMessage onRetry={onRetry} />
            </div>
          );
        }

        const isUser = msg.role === "user";
        const isNewest = i === messages.length - 1;

        return (
          <SwipeableMessage key={i} message={msg} onSwipeReply={onSwipeReply || (() => {})}>
            <div style={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: 8,
              position: "relative",
            }}>

              {/* ── Reaction picker ── */}
              {pickerIdx === i && (
                <div style={{
                  position: "absolute",
                  bottom: "calc(100% + 6px)",
                  left: isUser ? "auto" : 0,
                  right: isUser ? 0 : "auto",
                  display: "flex", gap: 3, padding: "6px 8px",
                  background: "rgba(18,4,38,0.97)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(139,92,246,0.4)",
                  borderRadius: 999,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.15)",
                  zIndex: 50,
                }}>
                  {REACTION_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => handleReact(i, emoji)}
                      style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "none", border: "none",
                        fontSize: 18, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "transform 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >{emoji}</button>
                  ))}
                </div>
              )}

              {/* ── Bubble wrapper ── */}
              <div style={{
                position: "relative",
                maxWidth: "76%",
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
              }}>
                {/* Sparkle burst */}
                {!isUser && sparkleIdx === i && <SparkleEffect active />}

                {/* ── THE BUBBLE ── */}
                <div
                  className={`bubble-enter ${isUser ? "bubble-user" : "bubble-companion"}`}
                  onContextMenu={(e) => { e.preventDefault(); handleLongPress(i); }}
                  onTouchStart={() => { window.__rxTimer = setTimeout(() => handleLongPress(i), 500); }}
                  onTouchEnd={() => clearTimeout(window.__rxTimer)}
                  onTouchMove={() => clearTimeout(window.__rxTimer)}
                  style={{
                    position: "relative",
                    padding: "12px 17px",
                    borderRadius: isUser
                      ? "20px 20px 20px 20px"
                      : "20px 20px 20px 20px",
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                    color: "white",
                    letterSpacing: "0.01em",
                    transition: "box-shadow 0.3s ease",
                    maxHeight: "42vh",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",

                    /* ── User bubble: rich glowing gem ── */
                    ...(isUser ? {
                      background: "linear-gradient(140deg, #8b5cf6 0%, #7c3aed 45%, #db2777 100%)",
                      boxShadow: "0 4px 20px rgba(124,58,237,0.6), 0 1px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                    } : {
                      /* ── Companion bubble: deep jewel with shimmer border ── */
                      background: "linear-gradient(145deg, rgba(88,28,135,0.82) 0%, rgba(67,20,110,0.88) 50%, rgba(76,29,149,0.82) 100%)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "1.5px solid rgba(196,180,252,0.22)",
                      boxShadow: "0 6px 32px rgba(109,40,217,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                      animation: isNewest ? "glowPulse 2.5s ease-in-out 3" : undefined,
                    }),
                  }}
                >
                  {/* Tail handled by CSS ::before/::after on .bubble-companion/.bubble-user */}

                  {/* Quoted reply */}
                  {msg.quoteReply && (
                    <div style={{
                      borderLeft: "2.5px solid rgba(196,180,252,0.55)",
                      paddingLeft: 9, marginBottom: 8,
                      background: "rgba(0,0,0,0.15)",
                      borderRadius: "0 6px 6px 0",
                      padding: "4px 9px",
                    }}>
                      <p style={{ fontSize: 11, margin: 0, opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 210 }}>
                        ↩ {msg.quoteReply}
                      </p>
                    </div>
                  )}

                  {/* Image preview */}
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="shared"
                      style={{ width: "100%", maxWidth: 190, borderRadius: 12, marginBottom: 8, display: "block", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} />
                  )}

                  {/* Message content */}
                  {msg.role === "assistant" ? (
                    <ReactMarkdown components={{
                      p: ({ children }) => <span style={{ display: "inline" }}>{children}</span>,
                      strong: ({ children }) => <strong style={{ fontWeight: 700, color: "#e9d5ff" }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: "#f3e8ff" }}>{children}</em>,
                      ul: ({ children }) => <ul style={{ margin: "5px 0", paddingLeft: 18 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "5px 0", paddingLeft: 18 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                      a: ({ children, href }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#c4b5fd", textDecoration: "underline", textUnderlineOffset: 2 }}>
                          {children}
                        </a>
                      ),
                    }}>{msg.content}</ReactMarkdown>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>

                {/* Reactions row */}
                {reactions[i]?.length > 0 && (
                  <div style={{
                    display: "flex", gap: 4, marginTop: 5,
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    flexWrap: "wrap",
                  }}>
                    {reactions[i].map((r, ri) => (
                      <span key={ri} className="reaction-pill" style={{
                        fontSize: 14,
                        background: "rgba(139,92,246,0.18)",
                        borderRadius: 999, padding: "2px 8px",
                        border: "1px solid rgba(139,92,246,0.3)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        transition: "transform 0.15s",
                        cursor: "pointer",
                      }}>{r}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Action buttons: share + bookmark (companion only) ── */}
              {!isUser && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, paddingBottom: 4 }}>
                  <button
                    onClick={() => setShareCard({ message: msg.content, mood: companionMood })}
                    title="Share this moment"
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                  >
                    <Share2 size={12} color="rgba(255,255,255,0.5)" />
                  </button>

                  {onBookmark && (
                    <button
                      onClick={() => { onBookmark(msg.content); toast.success("Saved ✨"); }}
                      title="Save to bookmarks"
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(168,85,247,0.12)",
                        border: "1px solid rgba(168,85,247,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "background 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(168,85,247,0.25)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(168,85,247,0.12)"}
                    >
                      <Bookmark size={12} color="rgba(168,85,247,0.85)" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </SwipeableMessage>
        );
        });
      })()} {/* end messages IIFE */}

      {/* Typing indicator shown in avatar panel above */}

      <div ref={messagesEndRef} />
    </div>
  );
}



