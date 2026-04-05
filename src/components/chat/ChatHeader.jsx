import React, { useState } from "react";
import { Volume2, VolumeX, Save, BookOpen, ChevronLeft, RotateCcw, History, Gamepad2, Trophy, Moon, TrendingUp, Clock, Bookmark, MessageCircle, MoreHorizontal, X } from "lucide-react";
import ChatCustomizePanel from "@/components/chat/ChatCustomizePanel";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatHeader({
  voiceEnabled, setVoiceEnabled,
  isPremium, messages, companion, setCompanion, navigate,
  setMessages, vibe,
  onShowGames, onShowMeditation, onShowAchievements,
  onShowTopics, onShowMoodInsights, onShowTimeCapsule, onShowBookmarks,
}) {
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Hey";
    setMessages([{ role: "assistant", content: `Fresh start! ${timeGreeting} 👋 What's on your mind?` }]);
    setMenuOpen(false);
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
    setMenuOpen(false);
  };

  // Menu items for the ··· bottom sheet
  const menuItems = [
    { icon: "💬", label: "Conversation Topics", action: () => { onShowTopics(); setMenuOpen(false); } },
    { icon: "🌙", label: "Meditate",            action: () => { onShowMeditation(); setMenuOpen(false); } },
    { icon: "📊", label: "Mood Insights",        action: () => { onShowMoodInsights(); setMenuOpen(false); } },
    { icon: "⏳", label: "Time Capsule",         action: () => { onShowTimeCapsule(); setMenuOpen(false); } },
    { icon: "🎮", label: "Mini Games",           action: () => { onShowGames(); setMenuOpen(false); } },
    { icon: "🏆", label: "Achievements",         action: () => { onShowAchievements(); setMenuOpen(false); } },
    { icon: "🔖", label: "Saved Messages",       action: () => { onShowBookmarks(); setMenuOpen(false); } },
    { icon: "🕐", label: "Chat History",         action: () => { navigate("/chat-history"); setMenuOpen(false); } },
    ...(isPremium && vibe !== "journal" ? [{ icon: "💾", label: "Export Chat",    action: handleExport }] : []),
    { icon: "🔄", label: "New Chat",             action: handleNewChat, highlight: true },
  ];

  return (
    <>
      {/* ── Header bar ── */}
      <div style={{
        flexShrink: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
        paddingBottom: "8px",
        paddingLeft: "12px",
        paddingRight: "12px",
        boxSizing: "border-box",
        minHeight: 56,
      }}>
        {/* LEFT: back */}
        <button onClick={() => navigate("/hub")}
          style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <ChevronLeft size={18} color="white" />
        </button>

        {/* CENTER: companion name + customize trigger */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
          <ChatCustomizePanel
            companion={companion}
            setCompanion={setCompanion}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            triggerMode="name"
            companionName={companion?.displayName || companion?.name || "Companion"}
          />
        </div>

        {/* RIGHT: journal save (when applicable) + voice + ··· menu */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {vibe === "journal" && messages.filter(m => m.role === "user").length >= 2 && (
            <button onClick={handleSaveJournal} disabled={saving}
              style={{ height: 32, borderRadius: 16, background: "rgba(74,222,128,0.18)", border: "1px solid rgba(74,222,128,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: saving ? "default" : "pointer", padding: "0 10px", opacity: saving ? 0.5 : 1 }}>
              <BookOpen size={13} color="#4ade80" />
              <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>{saving ? "…" : "Save"}</span>
            </button>
          )}
          <button onClick={() => setVoiceEnabled(v => !v)}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {voiceEnabled ? <Volume2 size={16} color="white" /> : <VolumeX size={16} color="rgba(255,255,255,0.35)" />}
          </button>
          <button onClick={() => setMenuOpen(true)}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <MoreHorizontal size={18} color="white" />
          </button>
        </div>
      </div>

      {/* ── ··· Bottom sheet menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 200 }}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                background: "#120820",
                borderRadius: "20px 20px 0 0",
                padding: "12px 0 max(24px, env(safe-area-inset-bottom, 24px))",
                zIndex: 201,
                maxHeight: "75vh",
                overflowY: "auto",
              }}
            >
              {/* Handle */}
              <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 999, margin: "0 auto 16px" }} />

              {/* Items */}
              {menuItems.map((item, i) => (
                <button key={i} onClick={item.action}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 20px",
                    background: item.highlight ? "rgba(168,85,247,0.08)" : "none",
                    border: "none",
                    borderTop: i === menuItems.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    cursor: "pointer", textAlign: "left",
                  }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{item.icon}</span>
                  <span style={{ color: item.highlight ? "#c084fc" : "white", fontSize: 15, fontWeight: item.highlight ? 700 : 500 }}>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
