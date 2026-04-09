import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Share2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { hapticLight } from "@/components/utils/haptics";
import { soundReceive } from "@/components/utils/sounds";
import SwipeableMessage from "./SwipeableMessage";
import ChatErrorMessage from "./ChatErrorMessage";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

/* ── Comic speech bubble tail SVG pointing LEFT (companion) ─────── */
function BubbleTailLeft({ color = "rgba(88,28,135,0.55)", border = "rgba(168,85,247,0.25)" }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none"
      style={{ position: "absolute", left: -11, bottom: 12, zIndex: 1 }}>
      <path d="M14 0 Q0 8 14 18 Z" fill={color} />
      <path d="M14 0 Q0 8 14 18" stroke={border} strokeWidth="1" fill="none" />
    </svg>
  );
}

/* ── Comic speech bubble tail SVG pointing RIGHT (user) ─────────── */
function BubbleTailRight({ color = "rgba(124,58,237,0.9)" }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none"
      style={{ position: "absolute", right: -11, bottom: 12, zIndex: 1 }}>
      <path d="M0 0 Q14 8 0 18 Z" fill={color} />
    </svg>
  );
}

export default function ChatMessages({
  messages, loading, companionMood, setShareCard,
  messagesEndRef, onSwipeReply, onRetry, companionName, onBookmark,
}) {
  const [reactions, setReactions] = useState({});
  const [pickerIdx, setPickerIdx] = useState(null);
  const [showTyping, setShowTyping] = useState(false);

  const lastMsg = messages[messages.length - 1];
  useEffect(() => {
    if (lastMsg?.role === "assistant" && messages.length > 1) {
      soundReceive();
      hapticLight();
    }
  }, [messages.length]);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowTyping(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowTyping(false);
    }
  }, [loading]);

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
      padding: "6px 14px 10px",
      display: "flex", flexDirection: "column",
      gap: 10,
    }}>
      <style>{`
        @keyframes bubblePop {
          0% { transform: scale(0.82); opacity: 0; }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes typingWave {
          0%,60%,100%{transform:translateY(0) scale(1);opacity:0.3}
          30%{transform:translateY(-6px) scale(1.3);opacity:1}
        }
        @keyframes textFade { 0%,100%{opacity:0.35} 50%{opacity:0.75} }
        .chat-bubble-enter { animation: bubblePop 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      {pickerIdx !== null && (
        <div onClick={() => setPickerIdx(null)} style={{ position: "fixed", inset: 0, zIndex: 48 }} />
      )}

      {messages.map((msg, i) => {
        if (msg.content === "__ERROR__" && msg.role === "assistant") {
          return (
            <div key={i} style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 8 }}>
              <ChatErrorMessage onRetry={onRetry} />
            </div>
          );
        }

        const isUser = msg.role === "user";

        return (
          <SwipeableMessage key={i} message={msg} onSwipeReply={onSwipeReply || (() => {})}>
            <div style={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: 6,
              position: "relative",
            }}>
              {/* ── Reaction picker ── */}
              {pickerIdx === i && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: isUser ? "auto" : 0,
                  right: isUser ? 0 : "auto",
                  display: "flex", gap: 2, padding: "5px 6px",
                  background: "rgba(26,5,51,0.95)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(168,85,247,0.3)", borderRadius: 999,
                  zIndex: 50, marginBottom: 6,
                }}>
                  {REACTION_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => handleReact(i, emoji)}
                      style={{ width: 30, height: 30, borderRadius: "50%", background: "none", border: "none", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Bubble + tail ── */}
              <div style={{
                position: "relative",
                maxWidth: "78%",
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
              }}>
                <div
                  className="chat-bubble-enter"
                  onContextMenu={(e) => { e.preventDefault(); handleLongPress(i); }}
                  onTouchStart={() => { window.__rxTimer = setTimeout(() => handleLongPress(i), 500); }}
                  onTouchEnd={() => clearTimeout(window.__rxTimer)}
                  onTouchMove={() => clearTimeout(window.__rxTimer)}
                  style={{
                    position: "relative",
                    padding: isUser ? "10px 15px" : "12px 16px",
                    borderRadius: isUser
                      ? "20px 20px 6px 20px"
                      : "20px 20px 20px 6px",
                    fontSize: 14,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                    color: "white",
                    letterSpacing: "0.01em",
                    ...(isUser ? {
                      background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                      boxShadow: "0 3px 16px rgba(124,58,237,0.45)",
                    } : {
                      background: "rgba(255,255,255,0.08)",
                      backdropFilter: "blur(20px)",
                      border: "1.5px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }),
                  }}
                >
                  {/* Tail */}
                  {!isUser && <BubbleTailLeft color="rgba(255,255,255,0.08)" border="rgba(255,255,255,0.14)" />}
                  {isUser && <BubbleTailRight color="rgba(124,58,237,0.95)" />}

                  {/* Quoted reply */}
                  {msg.quoteReply && (
                    <div style={{ borderLeft: "2px solid rgba(168,85,247,0.6)", paddingLeft: 8, marginBottom: 7, opacity: 0.65 }}>
                      <p style={{ fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                        {msg.quoteReply}
                      </p>
                    </div>
                  )}

                  {/* Image */}
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="shared" style={{ width: "100%", maxWidth: 180, borderRadius: 10, marginBottom: 6, display: "block" }} />
                  )}

                  {/* Content */}
                  {msg.role === "assistant" ? (
                    <ReactMarkdown components={{
                      p: ({ children }) => <span style={{ display: "inline" }}>{children}</span>,
                      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      ul: ({ children }) => <ul style={{ margin: "4px 0", paddingLeft: 16 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "4px 0", paddingLeft: 16 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#c4b5fd", textDecoration: "underline" }}>{children}</a>,
                    }}>{msg.content}</ReactMarkdown>
                  ) : msg.content}
                </div>

                {/* Reactions row */}
                {reactions[i]?.length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 4, justifyContent: isUser ? "flex-end" : "flex-start" }}>
                    {reactions[i].map((r, ri) => (
                      <span key={ri} style={{
                        fontSize: 13, background: "rgba(255,255,255,0.12)",
                        borderRadius: 999, padding: "2px 6px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}>{r}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Action buttons (share + bookmark) — companion messages only ── */}
              {!isUser && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0, paddingBottom: 2 }}>
                  <button
                    onClick={() => setShareCard({ message: msg.content, mood: companionMood })}
                    title="Share this moment"
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}>
                    <Share2 size={11} color="rgba(255,255,255,0.5)" />
                  </button>
                  {onBookmark && (
                    <button
                      onClick={() => { onBookmark(msg.content); toast.success("Saved to bookmarks 📌"); }}
                      title="Save to bookmarks"
                      style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "rgba(168,85,247,0.1)",
                        border: "1px solid rgba(168,85,247,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}>
                      <Bookmark size={11} color="rgba(168,85,247,0.75)" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </SwipeableMessage>
        );
      })}

      {/* ── Typing indicator ── */}
      {loading && showTyping && (
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 10, paddingLeft: 18 }}>
          <style>{`
            @keyframes typingWave { 0%,60%,100%{transform:translateY(0) scale(1);opacity:0.25} 30%{transform:translateY(-7px) scale(1.3);opacity:1} }
            @keyframes textFade { 0%,100%{opacity:0.35} 50%{opacity:0.7} }
          `}</style>
          {/* Typing bubble */}
          <div style={{
            position: "relative",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.14)",
            borderRadius: "20px 20px 20px 6px",
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <BubbleTailLeft color="rgba(255,255,255,0.08)" border="rgba(255,255,255,0.14)" />
            {[0,1,2].map(d => (
              <div key={d} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "linear-gradient(135deg, #a855f7, #db2777)",
                animation: `typingWave 1.4s ease-in-out infinite`,
                animationDelay: `${d * 0.2}s`,
                boxShadow: "0 0 6px rgba(168,85,247,0.5)",
              }} />
            ))}
            {companionName && (
              <span style={{ color: "rgba(196,180,252,0.55)", fontSize: 11, fontWeight: 500, animation: "textFade 2.2s ease-in-out infinite", letterSpacing: "0.2px", marginLeft: 2 }}>
                {companionName} is thinking…
              </span>
            )}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
