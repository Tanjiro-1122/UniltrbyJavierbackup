import React from "react";
import { Send, Mic, MicOff, Camera, X } from "lucide-react";
import { hapticMedium } from "@/components/utils/haptics";
import { soundSend } from "@/components/utils/sounds";

export default function ChatInputBar({
  input, setInput, loading, isListening, isPremium,
  pendingImage, setPendingImage, companionDisplayName,
  handleSend, startListening, stopListening, handlePhotoClick,
}) {
  return (
    <div style={{
      flexShrink: 0,
      width: "100%",
      padding: "6px 12px calc(8px + env(safe-area-inset-bottom, 8px))",
      background: "transparent",
      boxSizing: "border-box",
    }}>
      {/* Pending image preview */}
      {pendingImage && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ position: "relative" }}>
            <img src={pendingImage.preview} alt="pending" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(168,85,247,0.5)" }} />
            <button onClick={() => setPendingImage(null)}
              style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={9} color="white" />
            </button>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Photo attached</span>
        </div>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 999,
        padding: "6px 10px",
      }}>
        <button onClick={() => isListening ? stopListening() : startListening()}
          style={{ width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isListening ? "#ef4444" : "rgba(255,255,255,0.1)" }}
          className={isListening ? "listen-pulse" : ""}>
          {isListening ? <MicOff size={15} color="white" /> : <Mic size={15} color="rgba(255,255,255,0.65)" />}
        </button>
        <button onClick={handlePhotoClick}
          style={{ width: 30, height: 30, borderRadius: "50%", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.08)" }}>
          <Camera size={14} color={isPremium ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.3)"} />
        </button>
        <input type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend(); }}
          placeholder={isListening ? "Listening…" : `Talk to ${companionDisplayName}…`}
          autoComplete="off"
          autoCorrect="on"
          enterKeyHint="send"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 16, minWidth: 0, caretColor: "#a855f7", WebkitAppearance: "none" }}
        />
        <button onClick={() => { if (loading || (!input.trim() && !pendingImage)) return; hapticMedium(); soundSend(); handleSend(); }} disabled={loading || (!input.trim() && !pendingImage)}
          style={{
            width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: loading || (!input.trim() && !pendingImage) ? "default" : "pointer",
            opacity: loading || (!input.trim() && !pendingImage) ? 0.4 : 1,
            background: "linear-gradient(135deg, #7c3aed, #db2777)",
            transition: "opacity 0.15s",
          }}>
          <Send size={14} color="white" />
        </button>
      </div>
    </div>
  );
}