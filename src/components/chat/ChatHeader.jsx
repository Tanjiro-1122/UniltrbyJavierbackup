import React, { useState } from "react";
import { Volume2, VolumeX, Settings, Save, BookOpen, ChevronLeft, RotateCcw, History, Gamepad2, Wind, Trophy, Moon, Sparkles, TrendingUp, Clock, Bookmark, Palette } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ChatAppearancePanel from "./ChatAppearancePanel";

export default function ChatHeader({
  voiceEnabled, setVoiceEnabled,
  isPremium, messages, companion, navigate,
  setMessages, vibe,
  onShowGames, onShowMeditation, onShowAchievements,
  onShowBreathing, onShowSleepStory, onShowTopics, onShowMoodInsights, onShowTimeCapsule, onShowBookmarks,
}) {
  const [saving, setSaving] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  const handleSaveJournal = async () => {
    if (saving) return;
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
    const existing = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    const entry = {
      id: Date.now().toString(),
      title: res.title || "Journal Entry",
      content: res.content || convo,
      mood: res.mood || "reflective",
      companion_name: companion.displayName || companion.name,
      created_date: new Date().toISOString(),
    };
    existing.unshift(entry);
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify(existing));
    setSaving(false);
    toast.success("Journal entry saved ✨");
    navigate("/journal");
  };

  const handleNewChat = async () => {
    const userMessages = messages.filter(m => m.role === "user" && m.content);
    if (userMessages.length > 0) {
      const toSave = messages.filter(m => m.content && m.content !== "__ERROR__").slice(0, 20);
      const session = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        companion_id: companion?.id || "",
        companion_name: companion.displayName || companion.name,
        messages: toSave.map(m => ({ role: m.role, content: m.content })),
      };
      const history = JSON.parse(localStorage.getItem("unfiltr_chat_sessions") || "[]");
      history.unshift(session);
      localStorage.setItem("unfiltr_chat_sessions", JSON.stringify(history.slice(0, 50)));
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
    <>
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
          <button onClick={() => navigate("/vibe")}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} color="white" />
          </button>
          <button onClick={() => setVoiceEnabled(v => !v)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {voiceEnabled ? <Volume2 size={16} color="white" /> : <VolumeX size={16} color="rgba(255,255,255,0.4)" />}
          </button>
        </div>

        {/* Center: feature icons */}
        <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "nowrap", overflowX: "auto", scrollbarWidth: "none" }}>
          <HeaderIconBtn onClick={onShowBreathing} icon={<Wind size={13} />} title="Breathe" />
          <HeaderIconBtn onClick={onShowMeditation} icon={<Moon size={13} />} title="Meditate" />
          <HeaderIconBtn onClick={onShowSleepStory} icon={<span style={{ fontSize: 13 }}>🌙</span>} title="Sleep Story" />
          <HeaderIconBtn onClick={onShowTopics} icon={<Sparkles size={13} />} title="Topics" />
          <HeaderIconBtn onClick={onShowMoodInsights} icon={<TrendingUp size={13} />} title="Mood" />
          <HeaderIconBtn onClick={onShowTimeCapsule} icon={<Clock size={13} />} title="Capsule" />
          <HeaderIconBtn onClick={onShowGames} icon={<Gamepad2 size={13} />} title="Games" />
          <HeaderIconBtn onClick={onShowAchievements} icon={<Trophy size={13} />} title="Badges" />
          <HeaderIconBtn onClick={onShowBookmarks} icon={<Bookmark size={13} />} title="Saved" />
          {/* ── NEW: Appearance button ── */}
          <HeaderIconBtn onClick={() => setShowAppearance(true)} icon={<Palette size={13} />} title="Appearance" />
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
          <button onClick={() => navigate("/chat-history")}
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

      {/* Appearance bottom sheet */}
      {showAppearance && <ChatAppearancePanel onClose={() => setShowAppearance(false)} />}
    </>
  );
}

function HeaderIconBtn({ onClick, icon, title }) {
  return (
    <button onClick={onClick}
      style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "rgba(255,255,255,0.5)" }}
      title={title}>
      {icon}
    </button>
  );
}
