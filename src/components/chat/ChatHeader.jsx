import React, { useState } from "react";
import { Volume2, VolumeX, Settings, Save, BookOpen, ChevronLeft, RotateCcw, History, Gamepad2, Wind, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ChatHeader({
  voiceEnabled, setVoiceEnabled,
  isPremium, messages, companion, navigate,
  setMessages, vibe,
  onShowGames, onShowMeditation, onShowAchievements,
}) {
  const [saving, setSaving] = useState(false);

  const handleSaveJournal = async () => {
    if (saving) return;
    const profileId = localStorage.getItem("userProfileId");
    if (!profileId) return;
    setSaving(true);
    const convo = messages.filter(m => m.content).map(m => `${m.role === "user" ? "Me" : companion.displayName || companion.name}: ${m.content}`).join("\n");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this journal conversation, write a personal journal entry in first person from the user's perspective. Also provide a short title (max 6 words) and a mood (one of: happy, neutral, sad, anxious, grateful, reflective, excited).\n\nConversation:\n${convo}`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          mood: { type: "string" },
        },
      },
    });
    await base44.entities.JournalEntry.create({
      user_profile_id: profileId,
      title: res.title || "Journal Entry",
      content: res.content || convo,
      mood: res.mood || "reflective",
      companion_name: companion.displayName || companion.name,
    });
    setSaving(false);
    toast.success("Journal entry saved ✨");
    navigate("/journal");
  };
  const handleNewChat = async () => {
    // Save current messages to Message entity before clearing
    const profileId = localStorage.getItem("userProfileId");
    const userMessages = messages.filter(m => m.role === "user" && m.content);
    if (profileId && userMessages.length > 0) {
      const companionId = companion?.id || "";
      const toSave = messages.filter(m => m.content && m.content !== "__ERROR__").slice(0, 20);
      // Fire and forget — don't block the new chat
      Promise.all(toSave.map(m =>
        base44.entities.Message.create({
          user_profile_id: profileId,
          companion_id: companionId,
          role: m.role,
          content: m.content,
        })
      )).catch(() => {});
    }
    localStorage.removeItem("unfiltr_chat_history");
    const name = companion.displayName || companion.name;
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Hey";
    setMessages([{ role: "assistant", content: `Fresh start! ${timeGreeting} 👋 What's on your mind?` }]);
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
      padding: "8px 12px",
      boxSizing: "border-box",
      minHeight: 44,
    }}>
      {/* Left side: back + voice */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={() => navigate("/")}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={18} color="white" />
        </button>
        <button onClick={() => setVoiceEnabled(v => !v)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {voiceEnabled ? <Volume2 size={16} color="white" /> : <VolumeX size={16} color="rgba(255,255,255,0.4)" />}
        </button>
      </div>

      {/* Center: feature icons */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={onShowMeditation}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          title="Breathe">
          <Wind size={13} color="rgba(255,255,255,0.5)" />
        </button>
        <button onClick={onShowGames}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          title="Games">
          <Gamepad2 size={13} color="rgba(255,255,255,0.5)" />
        </button>
        <button onClick={onShowAchievements}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          title="Achievements">
          <Trophy size={13} color="rgba(255,255,255,0.5)" />
        </button>
      </div>

      {/* Right side: actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {vibe === "journal" && messages.filter(m => m.role === "user").length >= 2 && (
          <button onClick={handleSaveJournal} disabled={saving}
            style={{ height: 36, borderRadius: 18, background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: saving ? "default" : "pointer", padding: "0 12px", opacity: saving ? 0.5 : 1 }}
            title="Save journal entry">
            <BookOpen size={14} color="#4ade80" />
            <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>{saving ? "Saving…" : "Save Entry"}</span>
          </button>
        )}
        {isPremium && vibe !== "journal" && (
          <button onClick={handleExport}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            title="Save conversation">
            <Save size={14} color="#a855f7" />
          </button>
        )}
        <button onClick={() => navigate("/ChatHistory")}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          title="Chat history">
          <History size={14} color="white" />
        </button>
        <button onClick={handleNewChat}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          title="New chat">
          <RotateCcw size={14} color="white" />
        </button>
        <button onClick={() => navigate("/settings")}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Settings size={14} color="white" />
        </button>
      </div>
    </div>
  );
}