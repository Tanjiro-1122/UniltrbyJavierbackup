import React, { useState } from "react";
import {
  Volume2, VolumeX, Settings, ChevronLeft, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ChatCustomizePanel from "./ChatCustomizePanel";

/* ─────────────────────────────────────────
   Disney/Pixar-style quick action items
   Each has a big expressive emoji + label + soft glow color
───────────────────────────────────────── */
const BASE_ACTIONS = [
  { id: "customize", label: "Customize", emoji: "🎨",  glow: "#f472b6", desc: "Voice, avatar, vibe" },
  { id: "history",   label: "History",   emoji: "📖",  glow: "#6366f1", desc: "Past chats" },
  { id: "newchat",   label: "New Chat",  emoji: "🌟",  glow: "#f59e0b", desc: "Fresh start" },
  { id: "topics",    label: "Topics",    emoji: "💫",  glow: "#8b5cf6", desc: "What to talk" },
  { id: "mood",      label: "Mood",      emoji: "🌈",  glow: "#ec4899", desc: "Track feelings" },
  { id: "capsule",   label: "Capsule",   emoji: "🔮",  glow: "#06b6d4", desc: "Time capsule" },
  { id: "sleep",     label: "Sleep",     emoji: "🌙",  glow: "#4f46e5", desc: "Sleep story" },
  { id: "games",     label: "Games",     emoji: "🎮",  glow: "#10b981", desc: "Play games" },
  { id: "badges",    label: "Badges",    emoji: "🏅",  glow: "#f59e0b", desc: "Achievements" },
  { id: "saved",     label: "Saved",     emoji: "💜",  glow: "#db2777", desc: "Bookmarks" },
];

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
  const [showCustomize, setShowCustomize]   = useState(false);
  const [showOptions, setShowOptions]       = useState(false);

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

  /* ── Route quick action taps ── */
  const handleAction = (id) => {
    setShowOptions(false);
    switch (id) {
      case "customize":  return setShowCustomize(true);
      case "history":  return navigate("/chat-history");
      case "newchat":  return handleNewChat();
      case "topics":   return onShowTopics();
      case "mood":     return onShowMoodInsights();
      case "capsule":  return onShowTimeCapsule();
      case "sleep":    return onShowSleepStory();
      case "games":    return onShowGames();
      case "badges":   return onShowAchievements();
      case "saved":    return onShowBookmarks();
      case "saveentry":return handleSaveJournal();
      case "export":   return handleExport();
    }
  };

  /* ── Build final action list ── */
  const actions = [
    ...BASE_ACTIONS,
    ...(vibe === "journal" && messages.filter(m => m.role === "user").length >= 2
      ? [{ id: "saveentry", label: "Save Entry", emoji: "📓", glow: "#4ade80", desc: "Save to journal" }]
      : []),
    ...(isPremium && vibe !== "journal"
      ? [{ id: "export", label: "Export", emoji: "💾", glow: "#94a3b8", desc: "Download chat" }]
      : []),
  ];

  const companionDisplayName = companion?.displayName || companion?.name || "Companion";

  return (
    <>
      <style>{`
        @keyframes optionsPop {
          0%   { opacity: 0; transform: scale(0.92) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-2px); }
        }
        .options-modal { animation: optionsPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
        .action-card:active { transform: scale(0.93) !important; }
      `}</style>

      {/* ── HEADER BAR ── */}
      <div style={{
        flexShrink: 0, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", boxSizing: "border-box", minHeight: 50,
      }}>

        {/* LEFT: back + voice + streak */}
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <button onClick={() => navigate("/vibe")} style={iconBtn}>
            <ChevronLeft size={18} color="white" />
          </button>

          <button onClick={() => setVoiceEnabled(v => !v)} style={iconBtn}>
            {voiceEnabled
              ? <Volume2 size={16} color="white" />
              : <VolumeX size={16} color="rgba(255,255,255,0.35)" />}
          </button>

          {streak >= 2 && (
            <div style={{
              height: 26, borderRadius: 13,
              background: "linear-gradient(135deg, rgba(251,146,60,0.22), rgba(239,68,68,0.18))",
              border: "1px solid rgba(251,146,60,0.35)",
              display: "flex", alignItems: "center", gap: 3, padding: "0 8px",
            }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ color: "#fb923c", fontSize: 11, fontWeight: 800 }}>{streak}</span>
            </div>
          )}
        </div>

        {/* CENTER: companion name */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{
            color: "white",
            fontSize: 16, fontWeight: 800,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            letterSpacing: "0.01em",
          }}>
            {companionDisplayName}
          </span>
        </div>

        {/* RIGHT: ✨ Options pill + ⚙️ Settings */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

          {/* ✨ OPTIONS PILL */}
          <button
            onClick={() => setShowOptions(true)}
            style={{
              height: 34, borderRadius: 999,
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
              border: "none",
              boxShadow: "0 0 18px rgba(168,85,247,0.55), 0 2px 8px rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 16px", cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onTouchStart={e => { e.currentTarget.style.transform = "scale(0.95)"; e.currentTarget.style.boxShadow = "0 0 28px rgba(168,85,247,0.8), 0 2px 8px rgba(0,0,0,0.3)"; }}
            onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 18px rgba(168,85,247,0.55), 0 2px 8px rgba(0,0,0,0.3)"; }}
          >
            <span style={{ fontSize: 13 }}>✨</span>
            <span style={{ color: "white", fontSize: 13, fontWeight: 800, letterSpacing: "0.02em" }}>Options</span>
          </button>

          {/* ⚙️ Settings */}
          <button onClick={onNavigateToSettings || (() => navigate("/settings"))} style={iconBtn} title="Settings">
            <Settings size={14} color="rgba(255,255,255,0.85)" />
          </button>
        </div>
      </div>

      {/* ── OPTIONS MODAL ── */}
      {showOptions && (
        <div
          onClick={() => setShowOptions(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex", alignItems: "flex-end",
            paddingBottom: 0,
          }}
        >
          <div
            className="options-modal"
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              background: "linear-gradient(180deg, #1c0540 0%, #0d0120 100%)",
              borderRadius: "28px 28px 0 0",
              border: "1px solid rgba(168,85,247,0.25)",
              borderBottom: "none",
              padding: "20px 20px 44px",
              boxSizing: "border-box",
              boxShadow: "0 -12px 60px rgba(124,58,237,0.35)",
            }}
          >
            {/* Handle bar */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: "rgba(255,255,255,0.2)",
              margin: "0 auto 20px",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <p style={{ color: "white", fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: "-0.01em" }}>✨ Options</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>What would you like to do?</p>
              </div>
              <button onClick={() => setShowOptions(false)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                <X size={14} color="rgba(255,255,255,0.7)" />
              </button>
            </div>

            {/* Action grid — Disney/Pixar style cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}>
              {actions.map(({ id, label, emoji, glow, desc }) => (
                <button
                  key={id}
                  className="action-card"
                  onClick={() => handleAction(id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 7,
                    padding: "14px 6px 12px",
                    background: `radial-gradient(ellipse at 50% 0%, ${glow}22 0%, rgba(255,255,255,0.03) 70%)`,
                    border: `1px solid ${glow}33`,
                    borderRadius: 18,
                    cursor: "pointer",
                    transition: "transform 0.15s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Glow spot behind emoji */}
                  <div style={{
                    position: "absolute", top: 6, left: "50%",
                    transform: "translateX(-50%)",
                    width: 36, height: 36, borderRadius: "50%",
                    background: `radial-gradient(circle, ${glow}40 0%, transparent 70%)`,
                    filter: "blur(6px)",
                  }} />
                  <span style={{ fontSize: 26, lineHeight: 1, position: "relative", zIndex: 1 }}>{emoji}</span>
                  <span style={{
                    color: "rgba(255,255,255,0.88)",
                    fontSize: 10, fontWeight: 700,
                    textAlign: "center", lineHeight: 1.2,
                    position: "relative", zIndex: 1,
                    letterSpacing: "0.01em",
                  }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── APPEARANCE PANEL ── */}

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

const iconBtn = {
  width: 34, height: 34, borderRadius: "50%",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0,
};
