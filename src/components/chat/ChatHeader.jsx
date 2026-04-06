import React, { useState } from "react";
import {
  Volume2, VolumeX, Settings, Save, BookOpen,
  ChevronLeft, RotateCcw, History, Moon,
  TrendingUp, Clock, Gamepad2, Trophy, Bookmark,
  MessageCircle, X, Zap, Wind, Moon as SleepIcon
} from "lucide-react";
import ChatCustomizePanel from "@/components/chat/ChatCustomizePanel";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ChatHeader({
  voiceEnabled, setVoiceEnabled,
  setCompanion,
  isPremium, messages, companion, navigate,
  setMessages, vibe,
  relationshipMode, setRelationshipMode,
  onNavigateToSettings,
  onShowGames, onShowMeditation, onShowAchievements,
  onShowBreathing, onShowSleepStory,
  onShowTopics, onShowMoodInsights, onShowTimeCapsule, onShowBookmarks,
  streak,
}) {
  const [saving, setSaving] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const handleSaveJournal = async () => {
    if (saving) return;
    setSaving(true);
    setShowQuickMenu(false);
    const convo = messages.filter(m => m.content).map(m =>
      `${m.role === "user" ? "Me" : companion.displayName || companion.name}: ${m.content}`
    ).join("\n");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this journal conversation, write a personal journal entry in first person. Also provide a short title (max 6 words) and a mood (one of: happy, neutral, sad, anxious, grateful, reflective, excited).\n\nConversation:\n${convo}`,
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
    sessionStorage.removeItem("unfiltr_chat_messages");
    sessionStorage.removeItem("unfiltr_returning_from_settings");
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Hey";
    setMessages([{ role: "assistant", content: `Fresh start! ${timeGreeting} 👋 What's on your mind?` }]);
  };

  const handleExport = () => {
    const data = JSON.stringify(
      messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content })),
      null, 2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unfiltr-chat-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build quick actions list
  const quickActions = [
    { icon: <MessageCircle size={15} />, label: "Topics",    color: "#c084fc", action: () => { onShowTopics?.();       setShowQuickMenu(false); } },
    { icon: <Moon size={15} />,          label: "Meditate",  color: "#818cf8", action: () => { onShowMeditation?.();   setShowQuickMenu(false); } },
    { icon: <TrendingUp size={15} />,    label: "Mood",      color: "#34d399", action: () => { onShowMoodInsights?.(); setShowQuickMenu(false); } },
    { icon: <Clock size={15} />,         label: "Capsule",   color: "#fbbf24", action: () => { onShowTimeCapsule?.();  setShowQuickMenu(false); } },
    { icon: <Wind size={15} />,          label: "Breathe",   color: "#67e8f9", action: () => { onShowBreathing?.();   setShowQuickMenu(false); } },
    { icon: <SleepIcon size={15} />,     label: "Sleep",     color: "#a78bfa", action: () => { onShowSleepStory?.();  setShowQuickMenu(false); } },
    { icon: <Gamepad2 size={15} />,      label: "Games",     color: "#f472b6", action: () => { onShowGames?.();       setShowQuickMenu(false); } },
    { icon: <Trophy size={15} />,        label: "Badges",    color: "#f59e0b", action: () => { onShowAchievements?.();setShowQuickMenu(false); } },
    { icon: <Bookmark size={15} />,      label: "Saved",     color: "#60a5fa", action: () => { onShowBookmarks?.();   setShowQuickMenu(false); } },
  ];

  if (vibe === "journal" && messages.filter(m => m.role === "user").length >= 2) {
    quickActions.unshift({
      icon: <BookOpen size={15} />,
      label: saving ? "Saving…" : "Save Entry",
      color: "#4ade80",
      action: handleSaveJournal,
    });
  }
  if (isPremium && vibe !== "journal") {
    quickActions.push({
      icon: <Save size={15} />,
      label: "Export",
      color: "#a78bfa",
      action: () => { handleExport(); setShowQuickMenu(false); },
    });
  }

  return (
    <>
      {/* ── Header bar ── */}
      <div style={{
        flexShrink: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "10px",
        paddingBottom: "8px",
        paddingLeft: "12px",
        paddingRight: "12px",
        boxSizing: "border-box",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
      }}>

        {/* LEFT: back + voice + streak */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <IconBtn onClick={() => navigate(-1)}>
            <ChevronLeft size={18} color="white" />
          </IconBtn>

          <IconBtn onClick={() => setVoiceEnabled(v => !v)}>
            {voiceEnabled
              ? <Volume2 size={15} color="white" />
              : <VolumeX size={15} color="rgba(255,255,255,0.35)" />
            }
          </IconBtn>

          {streak >= 2 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 3,
              background: streak >= 30
                ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                : streak >= 7
                ? "linear-gradient(135deg,#a855f7,#ec4899)"
                : "rgba(249,115,22,0.2)",
              border: streak >= 7 ? "none" : "1px solid rgba(249,115,22,0.45)",
              borderRadius: 20, padding: "3px 8px",
            }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ color: "white", fontWeight: 800, fontSize: 11 }}>{streak}</span>
            </div>
          )}
        </div>

        {/* CENTER: companion name only */}
        <div style={{ flex: 1, textAlign: "center", paddingLeft: 6, paddingRight: 6, minWidth: 0 }}>
          {companion && (
            <span style={{
              color: "white", fontWeight: 700, fontSize: 15,
              textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              letterSpacing: 0.2,
              display: "block",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {companion.displayName || companion.name}
            </span>
          )}
        </div>

        {/* RIGHT: More pill + history + new chat + customize + settings */}
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          {/* ⚡ More — collapses all feature icons */}
          <button
            onClick={() => setShowQuickMenu(true)}
            style={{
              height: 28, borderRadius: 999,
              background: "rgba(168,85,247,0.18)",
              border: "1px solid rgba(168,85,247,0.45)",
              display: "flex", alignItems: "center", gap: 4,
              padding: "0 10px", cursor: "pointer", flexShrink: 0,
            }}
          >
            <Zap size={11} color="#c084fc" />
            <span style={{ color: "#c084fc", fontSize: 11, fontWeight: 700 }}>More</span>
          </button>

          <IconBtn onClick={() => navigate("/chat-history")} title="History">
            <History size={14} color="white" />
          </IconBtn>

          <IconBtn onClick={handleNewChat} title="New chat">
            <RotateCcw size={14} color="white" />
          </IconBtn>

          {/* Customize panel (sliders icon) */}
          <ChatCustomizePanel
            companion={companion}
            setCompanion={setCompanion}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            triggerMode="icon"
            companionName={companion?.name || "Companion"}
            relationshipMode={relationshipMode}
            onRelationshipChange={setRelationshipMode}
          />

          <IconBtn onClick={() => onNavigateToSettings ? onNavigateToSettings() : navigate("/settings")}>
            <Settings size={14} color="white" />
          </IconBtn>
        </div>
      </div>

      {/* ── Quick Actions modal ── */}
      {showQuickMenu && (
        <>
          <div
            onClick={() => setShowQuickMenu(false)}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          />
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 201,
            background: "rgba(12,4,28,0.97)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 22,
            padding: "18px 16px",
            width: "min(300px, 86vw)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>✨ Quick Actions</span>
              <button onClick={() => setShowQuickMenu(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                <X size={16} color="rgba(255,255,255,0.45)" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {quickActions.map((a, i) => (
                <button key={i} onClick={a.action}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "12px 8px", borderRadius: 14,
                    background: `${a.color}15`,
                    border: `1px solid ${a.color}30`,
                    cursor: "pointer",
                  }}>
                  <span style={{ color: a.color }}>{a.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 600, textAlign: "center" }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0,
      }}>
      {children}
    </button>
  );
}
