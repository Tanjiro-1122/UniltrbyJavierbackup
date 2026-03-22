import React, { useState, useEffect } from "react";
import { X, TrendingUp, MessageSquare, Calendar } from "lucide-react";
import { getMoodWeek } from "@/components/utils/moodTracker";

const RECAP_KEY = "unfiltr_weekly_recap_shown";

export function shouldShowWeeklyRecap() {
  const last = localStorage.getItem(RECAP_KEY);
  const now = new Date();
  const day = now.getDay();
  // Show on Sunday
  if (day !== 0) return false;
  const today = now.toDateString();
  if (!last) {
    // First time — mark and show
    return true;
  }
  return last !== today;
}

export function markRecapShown() {
  localStorage.setItem(RECAP_KEY, new Date().toDateString());
}

export default function WeeklyRecap({ visible, onClose, companionName }) {
  const [moodWeek, setMoodWeek] = useState([]);
  const [stats, setStats] = useState({ totalMsgs: 0, streak: 0, journalCount: 0 });

  useEffect(() => {
    if (!visible) return;
    setMoodWeek(getMoodWeek());

    const totalMsgs = parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10);
    const streakData = JSON.parse(localStorage.getItem("unfiltr_streak") || '{"count":0}');
    const journalEntries = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    setStats({ totalMsgs, streak: streakData.count, journalCount: journalEntries.length });
  }, [visible]);

  if (!visible) return null;

  const moodsLogged = moodWeek.filter(d => d.mood).length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(6,2,15,0.97)", backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "0 24px",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16,
        paddingTop: "env(safe-area-inset-top, 12px)",
        background: "rgba(255,255,255,0.1)", border: "none",
        borderRadius: "50%", width: 36, height: 36,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}>
        <X size={18} color="white" />
      </button>

      <div style={{ textAlign: "center", maxWidth: 340, width: "100%" }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 8 }}>📊</span>
        <h2 style={{ color: "white", fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>Your Week with {companionName}</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 24 }}>Here's how it went</p>

        {/* Mood row */}
        <div style={{
          display: "flex", justifyContent: "space-between", gap: 4,
          padding: "14px 12px", borderRadius: 16,
          background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)",
          marginBottom: 12,
        }}>
          {moodWeek.map((d, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <span style={{ fontSize: 18, display: "block", minHeight: 24 }}>{d.mood || "·"}</span>
              <span style={{ color: d.isToday ? "#c084fc" : "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: d.isToday ? 700 : 400 }}>{d.day}</span>
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
          <StatBox icon={<MessageSquare size={14} color="#a855f7" />} value={stats.totalMsgs} label="Messages" />
          <StatBox icon={<TrendingUp size={14} color="#f97316" />} value={`${stats.streak}🔥`} label="Streak" />
          <StatBox icon={<Calendar size={14} color="#4ade80" />} value={stats.journalCount} label="Journals" />
        </div>

        {moodsLogged >= 3 && (
          <p style={{ color: "rgba(196,180,252,0.6)", fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>
            You've been checking in {moodsLogged} days this week — that's amazing self-awareness! 💜
          </p>
        )}

        <button onClick={() => { markRecapShown(); onClose(); }} style={{
          width: "100%", padding: "14px", borderRadius: 14, border: "none",
          background: "linear-gradient(135deg, #7c3aed, #db2777)",
          color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>
          Keep going ✨
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label }) {
  return (
    <div style={{
      padding: "12px 8px", borderRadius: 14,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      textAlign: "center",
    }}>
      <div style={{ marginBottom: 4 }}>{icon}</div>
      <p style={{ color: "white", fontSize: 18, fontWeight: 800, margin: 0 }}>{value}</p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "2px 0 0" }}>{label}</p>
    </div>
  );
}