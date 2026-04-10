import React, { useState, useEffect } from "react";
import { X, TrendingUp } from "lucide-react";
import { MOOD_COLORS, MOOD_LABELS, getMoodColor, getMoodLabel } from "@/lib/moodConfig";

const STORAGE_KEY = "unfiltr_mood_history";

function getMoodHistory(days = 30) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, mood: history[key] || null, day: d.getDate() });
  }
  return result;
}

function getMoodCounts(data) {
  const counts = {};
  data.forEach(d => {
    if (d.mood) counts[d.mood] = (counts[d.mood] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count }));
}

export default function MoodInsights({ visible, onClose }) {
  const [range, setRange] = useState(7);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (visible) setData(getMoodHistory(range));
  }, [visible, range]);

  if (!visible) return null;
  const counts = getMoodCounts(data);
  const logged = data.filter(d => d.mood).length;
  const topMood = counts[0]?.mood;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(6,2,15,0.97)", backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top, 12px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={18} color="#c084fc" />
          <h2 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: 0 }}>Mood Insights</h2>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color="white" />
        </button>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: "0 16px 24px", overflowY: "auto" }}>
        {/* Range picker */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[7, 14, 30].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: range === r ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${range === r ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: range === r ? "#c084fc" : "rgba(255,255,255,0.5)",
            }}>
              {r}d
            </button>
          ))}
        </div>

        {/* Mini mood calendar */}
        <div style={{
          padding: 14, borderRadius: 16,
          background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)",
          marginBottom: 16,
        }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, margin: "0 0 10px" }}>MOOD TIMELINE</p>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {data.map((d, i) => (
              <div key={i} title={d.mood || "No log"} style={{
                width: 24, height: 24, borderRadius: 6,
                background: d.mood ? (getMoodColor(d.mood)) + "40" : "rgba(255,255,255,0.04)",
                border: d.mood ? `1px solid ${getMoodColor(d.mood)}50` : "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "rgba(255,255,255,0.4)",
              }}>
                {d.day}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {logged > 0 ? (
          <>
            <div style={{
              padding: 14, borderRadius: 16,
              background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)",
              marginBottom: 16,
            }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, margin: "0 0 10px" }}>TOP MOODS</p>
              {counts.slice(0, 4).map(({ mood, count }) => (
                <div key={mood} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / logged) * 100}%`, borderRadius: 4, background: getMoodColor(mood) }} />
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, minWidth: 80 }}>{getMoodLabel(mood)}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{count}</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: 14, borderRadius: 16,
              background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)",
              textAlign: "center",
            }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                You logged your mood <strong style={{ color: "#c084fc" }}>{logged}</strong> out of {data.length} days.
                {topMood && <> Your most frequent mood was <strong style={{ color: getMoodColor(topMood) }}>{getMoodLabel(topMood)}</strong>.</>}
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <span style={{ fontSize: 40 }}>🫥</span>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 12 }}>
              No mood data yet. Start checking in daily to see your trends!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}