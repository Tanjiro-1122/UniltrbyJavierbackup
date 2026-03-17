import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const BADGES = [
  { id: "first_msg",    emoji: "💬", label: "First Message",    desc: "Sent your first message",          check: (s) => s.totalMsgs >= 1 },
  { id: "msg_10",       emoji: "🌟", label: "Chatterbox",       desc: "Sent 10 messages",                 check: (s) => s.totalMsgs >= 10 },
  { id: "msg_50",       emoji: "💎", label: "Diamond Talker",   desc: "Sent 50 messages",                 check: (s) => s.totalMsgs >= 50 },
  { id: "msg_100",      emoji: "👑", label: "Century Club",     desc: "Sent 100 messages",                check: (s) => s.totalMsgs >= 100 },
  { id: "msg_500",      emoji: "🏆", label: "Legend",           desc: "Sent 500 messages",                check: (s) => s.totalMsgs >= 500 },
  { id: "streak_3",     emoji: "🔥", label: "On Fire",          desc: "3-day streak",                     check: (s) => s.streak >= 3 },
  { id: "streak_7",     emoji: "⚡", label: "Week Warrior",     desc: "7-day streak",                     check: (s) => s.streak >= 7 },
  { id: "streak_30",    emoji: "🌙", label: "Monthly Master",   desc: "30-day streak",                    check: (s) => s.streak >= 30 },
  { id: "journal_1",    emoji: "📓", label: "Dear Diary",       desc: "Saved your first journal entry",   check: (s) => s.journals >= 1 },
  { id: "days_7",       emoji: "🎉", label: "One Week In",      desc: "7 days with your companion",       check: (s) => s.daysTogether >= 7 },
  { id: "days_30",      emoji: "💜", label: "BFF Status",       desc: "30 days with your companion",      check: (s) => s.daysTogether >= 30 },
  { id: "days_100",     emoji: "✨", label: "Ride or Die",      desc: "100 days together",                check: (s) => s.daysTogether >= 100 },
];

function getStats() {
  const totalMsgs = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10);
  const streakData = JSON.parse(localStorage.getItem("unfiltr_streak") || '{"count":0}');
  const streak = streakData.count || 0;
  const journals = parseInt(localStorage.getItem("unfiltr_journal_count") || "0", 10);
  const created = localStorage.getItem("unfiltr_companion_created");
  const daysTogether = created ? Math.max(1, Math.floor((Date.now() - new Date(created).getTime()) / 86400000)) : 0;
  return { totalMsgs, streak, journals, daysTogether };
}

export default function AchievementBadges({ visible, onClose }) {
  const [stats, setStats] = useState(getStats);

  useEffect(() => {
    if (visible) setStats(getStats());
  }, [visible]);

  if (!visible) return null;

  const earned = BADGES.filter(b => b.check(stats));
  const locked = BADGES.filter(b => !b.check(stats));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#1a0a2e", borderRadius: "24px 24px 0 0",
            padding: "20px 20px", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
            maxHeight: "80vh", display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "white", fontWeight: 800, fontSize: 20, margin: 0 }}>🏅 Achievements</h2>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="white" />
            </button>
          </div>

          <div className="scroll-area" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {earned.length > 0 && (
              <>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Earned ({earned.length}/{BADGES.length})
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                  {earned.map(b => (
                    <div key={b.id} style={{
                      background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(219,39,119,0.1))",
                      border: "1px solid rgba(168,85,247,0.3)", borderRadius: 16,
                      padding: "14px 8px", textAlign: "center",
                    }}>
                      <span style={{ fontSize: 28, display: "block", marginBottom: 4 }}>{b.emoji}</span>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 11, margin: 0 }}>{b.label}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, margin: "2px 0 0" }}>{b.desc}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {locked.length > 0 && (
              <>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Locked</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {locked.map(b => (
                    <div key={b.id} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 16, padding: "14px 8px", textAlign: "center", opacity: 0.5,
                    }}>
                      <span style={{ fontSize: 28, display: "block", marginBottom: 4, filter: "grayscale(1)" }}>🔒</span>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 11, margin: 0 }}>{b.label}</p>
                      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, margin: "2px 0 0" }}>{b.desc}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}