import React from "react";
import { Share2 } from "lucide-react";

export default function ChatMessages({ messages, loading, companionMood, setShareCard, messagesEndRef }) {
  return (
    <div className="scroll-area" style={{
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      WebkitOverflowScrolling: "touch",
      overscrollBehavior: "contain",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      padding: "10px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      justifyContent: "flex-end",
    }}>
      {messages.map((msg, i) => (
        <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 5 }}>
          <div style={{
            maxWidth: "82%", padding: "9px 14px",
            borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            fontSize: 13, lineHeight: 1.5, wordBreak: "break-word", color: "white",
            ...(msg.role === "user"
              ? { background: "linear-gradient(135deg, #7c3aed, #db2777)" }
              : { background: "rgba(88,28,135,0.45)", border: "1px solid rgba(168,85,247,0.15)", boxShadow: "0 0 8px rgba(168,85,247,0.08)" }
            ),
          }}>
            {msg.imagePreview && (
              <img src={msg.imagePreview} alt="shared" style={{ width: "100%", maxWidth: 180, borderRadius: 8, marginBottom: 5, display: "block" }} />
            )}
            {msg.content}
          </div>
          {msg.role === "assistant" && (
            <button onClick={() => setShareCard({ message: msg.content, mood: companionMood })}
              style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Share2 size={10} color="rgba(255,255,255,0.3)" />
            </button>
          )}
        </div>
      ))}
      {loading && (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(88,28,135,0.45)", border: "1px solid rgba(168,85,247,0.15)", display: "flex", alignItems: "center", gap: 5 }}>
            <style>{`@keyframes typingBounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }`}</style>
            {[0, 1, 2].map(d => (
              <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", animation: `typingBounce 1.2s ease-in-out infinite`, animationDelay: `${d * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}