import React from "react";
import { Send, Mic, MicOff, Camera, X } from "lucide-react";
import { hapticMedium } from "@/components/utils/haptics";
import { soundSend } from "@/components/utils/sounds";

export default function ChatInputBar({
  input, setInput, loading, isListening, isPremium,
  pendingImage, setPendingImage, companionDisplayName,
  handleSend, startListening, stopListening, handlePhotoClick,
}) {
  const canSend = input.trim().length > 0 || !!pendingImage;

  return (
    <div style={{
      flexShrink: 0,
      width: "100%",
      boxSizing: "border-box",
      background: "transparent",
      padding: "8px 12px",
      paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
    }}>
      {/* ── Pending image preview ── */}
      {pendingImage && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div style={{ position: "relative" }}>
            <img src={pendingImage.preview} alt="pending" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(168,85,247,0.5)" }} />
            <button onClick={() => setPendingImage(null)}
              style={{ position: "absolute", top: -5, right: -5, width: 17, height: 17, borderRadius: "50%", background: "#ef4444", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={9} color="white" />
            </button>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Photo attached</span>
        </div>
      )}

      {/* ── Input row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)",
        border: "1.5px solid rgba(255,255,255,0.13)",
        borderRadius: 999,
        padding: "5px 5px 5px 10px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>

        {/* Photo button */}
        <button onClick={handlePhotoClick}
          style={{
            width: 32, height: 32, borderRadius: "50%", border: "none", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: isPremium ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.06)",
          }}>
          <Camera size={15} color={isPremium ? "rgba(168,85,247,1)" : "rgba(255,255,255,0.28)"} />
        </button>

        {/* Text input */}
        <input type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend(); }}
          placeholder={isListening ? "Listening…" : `Talk to ${companionDisplayName}…`}
          autoComplete="off"
          style={{
            flex: 1, minWidth: 0, background: "none", border: "none", outline: "none",
            color: "white", fontSize: 14, lineHeight: 1.4,
            caretColor: "#a855f7",
          }}
        />

        {/* Mic button */}
        <button
          onClick={() => isListening ? stopListening() : startListening()}
          className={isListening ? "listen-pulse" : ""}
          style={{
            width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: isListening ? "#ef4444" : "rgba(255,255,255,0.09)",
            transition: "background 0.2s",
          }}>
          {isListening
            ? <MicOff size={15} color="white" />
            : <Mic size={16} color="rgba(255,255,255,0.7)" />}
        </button>

        {/* Send button — glows when ready */}
        <button
          onClick={() => { soundSend(); hapticMedium(); handleSend(); }}
          disabled={!canSend || loading}
          style={{
            width: 38, height: 38, borderRadius: "50%", border: "none", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: canSend ? "pointer" : "default",
            background: canSend
              ? "linear-gradient(135deg, #7c3aed, #db2777)"
              : "rgba(255,255,255,0.06)",
            boxShadow: canSend ? "0 0 18px rgba(168,85,247,0.55)" : "none",
            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            transform: canSend ? "scale(1)" : "scale(0.92)",
          }}>
          <Send size={15} color={canSend ? "white" : "rgba(255,255,255,0.2)"} />
        </button>
      </div>
    </div>
  );
}
