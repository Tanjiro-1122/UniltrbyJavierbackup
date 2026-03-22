import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Share2 } from "lucide-react";
import { hapticLight } from "@/components/utils/haptics";
import { soundReceive } from "@/components/utils/sounds";
import SwipeableMessage from "./SwipeableMessage";
import ChatErrorMessage from "./ChatErrorMessage";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

export default function ChatMessages({ messages, loading, companionMood, setShareCard, messagesEndRef, onSwipeReply, onRetry, companionName }) {
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

  // Delay typing indicator by 500ms to avoid flash on fast responses
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
      padding: "10px 12px", display: "flex", flexDirection: "column",
      gap: 8, justifyContent: "flex-end",
    }}>
      {pickerIdx !== null && (
        <div onClick={() => setPickerIdx(null)} style={{ position: "fixed", inset: 0, zIndex: 48 }} />
      )}

      {messages.map((msg, i) => {
        // Error message — render standalone retry UI
        if (msg.content === "__ERROR__" && msg.role === "assistant") {
          return (
            <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
              <ChatErrorMessage onRetry={onRetry} />
            </div>
          );
        }

        return (
        <SwipeableMessage key={i} message={msg} onSwipeReply={onSwipeReply || (() => {})}>
          <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 5, position: "relative" }}>
            <div style={{ position: "relative", maxWidth: "82%" }}>
              {/* Reaction picker */}
              {pickerIdx === i && (
                <div style={{
                  position: "absolute", bottom: "100%", left: msg.role === "user" ? "auto" : 0, right: msg.role === "user" ? 0 : "auto",
                  display: "flex", gap: 2, padding: "5px 6px",
                  background: "rgba(26,5,51,0.95)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(168,85,247,0.3)", borderRadius: 999,
                  zIndex: 50, marginBottom: 4,
                }}>
                  {REACTION_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => handleReact(i, emoji)}
                      style={{ width: 30, height: 30, borderRadius: "50%", background: "none", border: "none", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div
                onContextMenu={(e) => { e.preventDefault(); handleLongPress(i); }}
                onTouchStart={() => { window.__rxTimer = setTimeout(() => handleLongPress(i), 500); }}
                onTouchEnd={() => clearTimeout(window.__rxTimer)}
                onTouchMove={() => clearTimeout(window.__rxTimer)}
                style={{
                  padding: "9px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontSize: 13, lineHeight: 1.5, wordBreak: "break-word", color: "white",
                  ...(msg.role === "user"
                    ? { background: "linear-gradient(135deg, #7c3aed, #db2777)" }
                    : { background: "rgba(88,28,135,0.45)", border: "1px solid rgba(168,85,247,0.15)", boxShadow: "0 0 8px rgba(168,85,247,0.08)" }
                  ),
                }}
              >
                {msg.imagePreview && (
                  <img src={msg.imagePreview} alt="shared" style={{ width: "100%", maxWidth: 180, borderRadius: 8, marginBottom: 5, display: "block" }} />
                )}
                {msg.quoteReply && (
                  <div style={{ borderLeft: "2px solid rgba(168,85,247,0.5)", paddingLeft: 8, marginBottom: 6, opacity: 0.6 }}>
                    <p style={{ fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                      {msg.quoteReply}
                    </p>
                  </div>
                )}
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span style={{ display: "inline" }}>{children}</span>,
                      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      ul: ({ children }) => <ul style={{ margin: "4px 0", paddingLeft: 16 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "4px 0", paddingLeft: 16 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#c4b5fd", textDecoration: "underline" }}>{children}</a>,
                    }}
                  >{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>

              {/* Reactions display */}
              {reactions[i]?.length > 0 && (
                <div style={{ display: "flex", gap: 2, marginTop: 2, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {reactions[i].map((r, ri) => (
                    <span key={ri} style={{
                      fontSize: 11, background: "rgba(255,255,255,0.1)",
                      borderRadius: 999, padding: "1px 4px",
                    }}>{r}</span>
                  ))}
                </div>
              )}
            </div>

            {msg.role === "assistant" && (
              <button onClick={() => setShareCard({ message: msg.content, mood: companionMood })}
                style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Share2 size={10} color="rgba(255,255,255,0.3)" />
              </button>
            )}
          </div>
        </SwipeableMessage>
        );
      })}
      {loading && showTyping && (
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 8 }}>
          <div style={{
            padding: "10px 16px", borderRadius: "20px 20px 20px 6px",
            background: "linear-gradient(135deg, rgba(88,28,135,0.5), rgba(139,92,246,0.2))",
            border: "1px solid rgba(168,85,247,0.2)",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 12px rgba(168,85,247,0.1)",
          }}>
            <style>{`
              @keyframes typingWave { 0%,60%,100%{transform:translateY(0) scale(1);opacity:0.3} 30%{transform:translateY(-6px) scale(1.2);opacity:1} }
              @keyframes textPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
            `}</style>
            {companionName && (
              <span style={{ color: "rgba(196,180,252,0.7)", fontSize: 11, fontWeight: 600, animation: "textPulse 2s ease-in-out infinite" }}>
                {companionName} is thinking
              </span>
            )}
            {[0, 1, 2].map(d => (
              <div key={d} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "linear-gradient(135deg, #a855f7, #db2777)",
                animation: `typingWave 1.4s ease-in-out infinite`,
                animationDelay: `${d * 0.18}s`,
              }} />
            ))}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}