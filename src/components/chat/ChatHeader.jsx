import React, { useState } from "react";
import {
  Volume2, VolumeX, Settings, Save, BookOpen, ChevronLeft,
  RotateCcw, History, Zap, SlidersHorizontal, Palette,
  Wind, Moon, TrendingUp, Clock, Gamepad2, Trophy, Bookmark,
  Sparkles, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ChatAppearancePanel from "./ChatAppearancePanel";
import ChatCustomizePanel from "./ChatCustomizePanel";

export default function ChatHeader({
  voiceEnabled, setVoiceEnabled,
  isPremium, messages, companion, navigate,
  setMessages, vibe, streak,
  companionDbId, onNavigateToSettings,
  onShowGames, onShowMeditation, onShowAchievements,
  onShowBreathing, onShowSleepStory, onShowTopics,
  onShowMoodInsights, onShowTimeCapsule, onShowBookmarks,
  relationshipMode, setRelationshipMode,
}) {
  const [saving, setSaving]               = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showCustomize, setShowCustomize]   = useState(false);
  const [showQuickMenu, setShowQuickMenu]   = useState(false);

  /* ── Save to journal ── */
  const handleSaveJournal = async () => {
    if (saving) return;
    setSaving(true);
    const convo = messages
      .filter(m => m.content)
      .map(m => `${m.role === "user" ? "Me" : companion.displayName || companion.name}: ${m.content}`)
      .join("\n");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this journal conversation, write a personal journal entry in first person. Also provide a short title (max 6 words) and a mood (one of: happy, neutral, sad, anxious, grateful, reflective, excited).\n\nConversation:\n${convo}`,
      response_json_schema: {
        type: "object",
        properties: { title: { type: "string" }, content: { type: "string" }, mood: { type: "string" } },
      },
    });
    const existing = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    existing.unshift({
      id: Date.now().toString(),
      title: res.title || "Journal Entry",
      content: res.content || convo,
      mood: res.mood || "reflective",
      companion_name: companion.displayName || companion.name,
      created_date: new Date().toISOString(),
    });
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify(existing));
    setSaving(false);
    toast.success("Journal entry saved ✨");
    navigate("/journal");
  };

  /* ── New chat ── */
  const handleNewChat = () => {
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
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Hey";
    setMessages([{ role: "assistant", content: `Fresh start! ${timeGreeting} 👋 What's on your mind?` }]);
  };

  /* ── Export ── */
  const handleExport = () => {
    const data = JSON.stringify(
      messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content })), null, 2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `unfiltr-chat-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Quick menu items ── */
  const quickActions = [
    { label: "Customize", emoji: "🎛️", action: () => { setShowQuickMenu(false); setShowCustomize(true); } },
    { label: "Style",     emoji: "🎨", action: () => { setShowQuickMenu(false); setShowAppearance(true); } },
    { label: "History",   emoji: "📜", action: () => { setShowQuickMenu(false); navigate("/chat-history"); } },
    { label: "New Chat",  emoji: "🔄", action: () => { setShowQuickMenu(false); handleNewChat(); } },
    { label: "Topics",    emoji: "✨", action: () => { setShowQuickMenu(false); onShowTopics(); } },
    { label: "Meditate",  emoji: "🌙", action: () => { setShowQuickMenu(false); onShowMeditation(); } },
    { label: "Mood",      emoji: "📊", action: () => { setShowQuickMenu(false); onShowMoodInsights(); } },
    { label: "Capsule",   emoji: "⏰", action: () => { setShowQuickMenu(false); onShowTimeCapsule(); } },
    { label: "Breathe",   emoji: "🌬️", action: () => { setShowQuickMenu(false); onShowBreathing(); } },
    { label: "Sleep",     emoji: "💤", action: () => { setShowQuickMenu(false); onShowSleepStory(); } },
    { label: "Games",     emoji: "🎮", action: () => { setShowQuickMenu(false); onShowGames(); } },
    { label: "Badges",    emoji: "🏆", action: () => { setShowQuickMenu(false); onShowAchievements(); } },
    { label: "Saved",     emoji: "🔖", action: () => { setShowQuickMenu(false); onShowBookmarks(); } },
    ...(vibe === "journal" && messages.filter(m => m.role === "user").length >= 2
      ? [{ label: "Save Entry", emoji: "📓", action: () => { setShowQuickMenu(false); handleSaveJournal(); } }]
      : []),
    ...(isPremium && vibe !== "journal"
      ? [{ label: "Export",    emoji: "💾", action: () => { setShowQuickMenu(false); handleExport(); } }]
      : []),
  ];

  const companionDisplayName = companion?.displayName || companion?.name || "Companion";

  return (
    <>
      {/* ── HEADER BAR ── */}
      <div style={{
        flexShrink: 0, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", boxSizing: "border-box", minHeight: 48,
      }}>

        {/* LEFT: back + voice + streak badge */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 90 }}>
          <button onClick={() => navigate("/vibe")}
            style={iconBtn}>
            <ChevronLeft size={18} color="white" />
          </button>

          <button onClick={() => setVoiceEnabled(v => !v)}
            style={iconBtn}>
            {voiceEnabled
              ? <Volume2 size={16} color="white" />
              : <VolumeX size={16} color="rgba(255,255,255,0.4)" />}
          </button>

          {/* 🔥 Streak badge — only if streak ≥ 2 */}
          {streak >= 2 && (
            <div style={{
              height: 28, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(251,146,60,0.25), rgba(239,68,68,0.2))",
              border: "1px solid rgba(251,146,60,0.4)",
              display: "flex", alignItems: "center", gap: 3,
              padding: "0 8px",
            }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ color: "#fb923c", fontSize: 12, fontWeight: 700 }}>{streak}</span>
            </div>
          )}
        </div>

        {/* CENTER: companion name */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{
            color: "rgba(255,255,255,0.92)",
            fontSize: 16, fontWeight: 700,
            textShadow: "0 1px 8px rgba(0,0,0,0.8)",
            letterSpacing: "0.01em",
          }}>
            {companionDisplayName}
          </span>
        </div>

        {/* RIGHT: More pill + Settings only */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>

          {/* ⚡ MORE pill — everything lives here */}
          <button onClick={() => setShowQuickMenu(true)}
            style={{
              height: 32, borderRadius: 999,
              background: "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(109,40,217,0.6))",
              border: "1px solid rgba(167,139,250,0.4)",
              display: "flex", alignItems: "center", gap: 5,
              padding: "0 14px", cursor: "pointer",
            }}>
            <Zap size={13} color="#c4b5fd" fill="#c4b5fd" />
            <span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700 }}>More</span>
          </button>

          {/* Settings — only standalone button kept */}
          <button onClick={onNavigateToSettings || (() => navigate("/settings"))} style={iconBtn} title="Settings">
            <Settings size={14} color="white" />
          </button>
        </div>
      </div>

      {/* ── QUICK MENU MODAL ── */}
      {showQuickMenu && (
        <div
          onClick={() => setShowQuickMenu(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 360,
              background: "linear-gradient(180deg, #1a0535 0%, #0e0120 100%)",
              borderRadius: 24,
              border: "1px solid rgba(139,92,246,0.3)",
              padding: "24px 20px 28px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.1)",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 17 }}>⚡ Quick Actions</span>
              <button onClick={() => setShowQuickMenu(false)}
                style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={14} color="white" />
              </button>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {quickActions.map(({ label, emoji, action }) => (
                <button key={label} onClick={action}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 6, padding: "12px 4px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onTouchStart={e => e.currentTarget.style.background = "rgba(139,92,246,0.2)"}
                  onTouchEnd={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                >
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── APPEARANCE PANEL ── */}
      {showAppearance && <ChatAppearancePanel onClose={() => setShowAppearance(false)} />}

      {/* ── CUSTOMIZE PANEL ── */}
      {showCustomize && (
        <ChatCustomizePanel
          companion={companion}
          setCompanion={() => {}}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
          companionDbId={companionDbId}
          triggerMode="panel"
          relationshipMode={relationshipMode}
          onRelationshipChange={setRelationshipMode}
          onClose={() => setShowCustomize(false)}
        />
      )}
    </>
  );
}

/* ── Shared icon button style ── */
const iconBtn = {
  width: 34, height: 34, borderRadius: "50%",
  background: "rgba(255,255,255,0.1)",
  border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};
