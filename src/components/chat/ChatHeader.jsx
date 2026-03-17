import React from "react";
import { Volume2, VolumeX, Settings, Save } from "lucide-react";

export default function ChatHeader({
  voiceEnabled, setVoiceEnabled,
  isPremium, messages, companion, navigate,
  setMessages,
}) {
  const handleNewChat = () => {
    localStorage.removeItem("unfiltr_chat_history");
    const name = companion.displayName || companion.name;
    setMessages([{ role: "assistant", content: `Fresh start! Hey, I'm ${name} 👋 What's up?` }]);
  };

  const handleExport = () => {
    const data = JSON.stringify(messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content })), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unfiltr-chat-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      flexShrink: 0,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "2px 12px",
      boxSizing: "border-box",
    }}>
      <button onClick={() => setVoiceEnabled(v => !v)}
        style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {voiceEnabled ? <Volume2 size={16} color="white" /> : <VolumeX size={16} color="rgba(255,255,255,0.4)" />}
      </button>
      <div style={{ display: "flex", gap: 5 }}>
        {isPremium && (
          <button onClick={handleExport}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            title="Save conversation">
            <Save size={14} color="#a855f7" />
          </button>
        )}
        <button onClick={() => navigate("/settings")}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Settings size={14} color="white" />
        </button>
      </div>
    </div>
  );
}