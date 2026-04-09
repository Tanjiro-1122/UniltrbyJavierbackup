import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar } from "lucide-react";

const EMOTION_COLORS = {
  happy:       "#facc15",
  hopeful:     "#4ade80",
  grateful:    "#34d399",
  excited:     "#f97316",
  relieved:    "#60a5fa",
  neutral:     "#94a3b8",
  confused:    "#a78bfa",
  anxious:     "#f87171",
  overwhelmed: "#ef4444",
  lonely:      "#818cf8",
  sad:         "#6366f1",
  angry:       "#dc2626",
};

const EMOTION_EMOJI = {
  happy: "😊", hopeful: "🌱", grateful: "🙏", excited: "⚡", relieved: "😮‍💨",
  neutral: "😶", confused: "🤔", anxious: "😰", overwhelmed: "😫", lonely: "🌧",
  sad: "😢", angry: "😤",
};

const EMOTION_VALENCE = {
  happy: 5, hopeful: 4.5, grateful: 4.5, excited: 4, relieved: 4,
  neutral: 3, confused: 2.5, anxious: 2, overwhelmed: 1.5, lonely: 2,
  sad: 1.5, angry: 1,
};

export default function MoodTrendGraph({ emotionalTimeline = [], isPremium, onUpgrade }) {
  const [range, setRange] = useState(14); // 14 or 30 days

  if (!isPremium) {
    return (
      <div style={{
        borderRadius: 18, background: "rgba(168,85,247,0.06)",
        border: "1px solid rgba(168,85,247,0.12)",
        padding: "18px 18px 14px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <TrendingUp size={15} color="#a855f7" />
          <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Your Mood Trend</span>
        </div>
        <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 60 }}>
            {[4,3,5,2,4,3,4,5,3,4,5,4,3,5].map((v,i) => (
              <div key={i} style={{
                flex: 1, borderRadius: "4px 4px 0 0",
                background: `rgba(168,85,247,${0.3 + v*0.1})`,
                height: `${v*20}%`,
              }} />
            ))}
          </div>
        </div>
        <button onClick={onUpgrade} style={{
          marginTop: 12, width: "100%", padding: "10px",
          background: "linear-gradient(135deg,#7c3aed,#a855f7)",
          border: "none", borderRadius: 12, color: "white",
          fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          Unlock Mood Trends ✨
        </button>
      </div>
    );
  }

  if (!emotionalTimeline?.length) return null;

  // Filter to selected range
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - range);
  const filtered = emotionalTimeline
    .filter(e => new Date(e.date) >= cutoff)
    .reverse(); // oldest→newest for chart

  if (filtered.length < 2) return null;

  // Compute valence scores
  const points = filtered.map(e => ({
    ...e,
    valence: EMOTION_VALENCE[e.emotion] || 3,
  }));

  const maxV = 5, minV = 1;
  const normalize = v => (v - minV) / (maxV - minV);

  // Emotion streak
  const latest = emotionalTimeline[0];
  const streak = emotionalTimeline.filter(e => e.emotion === latest.emotion).length;
  const streakMsg = streak >= 3
    ? `You've felt ${latest.emotion} for ${streak} sessions in a row`
    : null;

  // Most common emotion
  const counts = {};
  filtered.forEach(e => counts[e.emotion] = (counts[e.emotion] || 0) + 1);
  const dominant = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];

  return (
    <div style={{
      borderRadius: 18, background: "rgba(168,85,247,0.06)",
      border: "1px solid rgba(168,85,247,0.12)",
      padding: "18px 18px 14px", marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={15} color="#a855f7" />
          <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Mood Trend</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[14, 30].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "3px 10px", borderRadius: 99, border: "none",
              background: range === r ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.06)",
              color: range === r ? "#c084fc" : "rgba(255,255,255,0.35)",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: "relative", height: 72 }}>
        {/* Y-axis guidelines */}
        {[0.25, 0.5, 0.75].map(frac => (
          <div key={frac} style={{
            position: "absolute", left: 0, right: 0,
            top: `${(1 - frac) * 100}%`,
            borderTop: "1px dashed rgba(255,255,255,0.05)",
          }} />
        ))}

        {/* Bars */}
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: "100%", position: "relative", zIndex: 1 }}>
          {points.map((p, i) => {
            const pct = Math.max(0.08, normalize(p.valence));
            const color = EMOTION_COLORS[p.emotion] || "#94a3b8";
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }} animate={{ height: `${pct * 100}%` }}
                transition={{ delay: i * 0.02, type: "spring", damping: 20 }}
                style={{
                  flex: 1, borderRadius: "3px 3px 0 0",
                  background: `${color}99`,
                  border: `1px solid ${color}55`,
                  minWidth: 4,
                  cursor: "default",
                  title: `${p.emotion} — ${p.date}`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {dominant && (
          <div style={{
            flex: 1, padding: "8px 10px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>Most felt</div>
            <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              {EMOTION_EMOJI[dominant[0]] || "•"} {dominant[0]}
            </div>
          </div>
        )}
        {latest && (
          <div style={{
            flex: 1, padding: "8px 10px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>Latest</div>
            <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              {EMOTION_EMOJI[latest.emotion] || "•"} {latest.emotion}
            </div>
          </div>
        )}
      </div>

      {/* Streak warning */}
      {streakMsg && (
        <div style={{
          marginTop: 10, padding: "7px 10px", borderRadius: 10,
          background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)",
        }}>
          <span style={{ color: "rgba(168,85,247,0.8)", fontSize: 12 }}>💜 {streakMsg}</span>
        </div>
      )}
    </div>
  );
}
