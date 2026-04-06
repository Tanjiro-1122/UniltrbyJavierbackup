import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Calendar, Heart } from "lucide-react";

const MOOD_META = {
  happy:      { emoji: "😊", label: "Happy",      color: "#facc15" },
  motivated:  { emoji: "🚀", label: "Motivated",  color: "#a78bfa" },
  loved:      { emoji: "🥰", label: "Loved",      color: "#f472b6" },
  calm:       { emoji: "😌", label: "Calm",        color: "#34d399" },
  neutral:    { emoji: "😐", label: "Neutral",    color: "#94a3b8" },
  anxious:    { emoji: "😰", label: "Anxious",    color: "#fb923c" },
  frustrated: { emoji: "😤", label: "Frustrated", color: "#f87171" },
  sad:        { emoji: "😢", label: "Sad",         color: "#60a5fa" },
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function MoodInsights() {
  const navigate = useNavigate();
  const [moodHistory, setMoodHistory] = useState({});
  const [weekDays, setWeekDays] = useState([]);
  const [moodCounts, setMoodCounts] = useState({});
  const [streak, setStreak] = useState(0);
  const [topMood, setTopMood] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("unfiltr_mood_history") || "{}";
    let history = {};
    try { history = JSON.parse(raw); } catch {}
    setMoodHistory(history);

    // Build last 14 days
    const days = [];
    const counts = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const mood = history[key] || null;
      days.push({ key, label: DAYS[d.getDay()], date: d.getDate(), mood });
      if (mood) counts[mood] = (counts[mood] || 0) + 1;
    }
    setWeekDays(days);
    setMoodCounts(counts);

    // Top mood
    const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    if (top) setTopMood(top[0]);

    // Current streak (consecutive days with any mood logged)
    const sd = localStorage.getItem("unfiltr_streak");
    if (sd) {
      try { setStreak(JSON.parse(sd).count || 0); } catch {}
    }
  }, []);

  const totalDays = Object.keys(moodHistory).length;
  const positives = ["happy","motivated","loved","calm"];
  const negatives = ["sad","anxious","frustrated"];
  const posCount = Object.entries(moodCounts).filter(([m]) => positives.includes(m)).reduce((a,[,v])=>a+v,0);
  const negCount = Object.entries(moodCounts).filter(([m]) => negatives.includes(m)).reduce((a,[,v])=>a+v,0);
  const posPercent = totalDays > 0 ? Math.round((posCount / (posCount + negCount || 1)) * 100) : null;

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"radial-gradient(ellipse at 50% 0%, #1a0535 0%, #0d0520 40%, #06020f 100%)",
      color:"white", fontFamily:"system-ui,-apple-system,sans-serif",
      overflowY:"auto", padding:"max(3rem,env(safe-area-inset-top)) 20px 40px"
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={() => navigate(-1)} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:10, padding:"8px 10px", color:"white", cursor:"pointer" }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontWeight:800, fontSize:20 }}>Mood Insights</div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>Your emotional patterns</div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { label:"Day Streak", value: streak > 0 ? `🔥 ${streak}` : "—", sub:"keep going" },
          { label:"Days Logged", value: totalDays || "—", sub:"total check-ins" },
          { label:"Positivity", value: posPercent !== null ? `${posPercent}%` : "—", sub:"last 14 days" },
        ].map(s => (
          <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:"#a78bfa" }}>{s.value}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* 14-Day Grid */}
      <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, padding:"16px 14px", marginBottom:20 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:"rgba(255,255,255,0.7)" }}>
          <Calendar size={14} style={{ display:"inline", marginRight:6 }} />Last 14 Days
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
          {weekDays.map(d => {
            const meta = d.mood ? MOOD_META[d.mood] : null;
            const isToday = d.key === new Date().toISOString().slice(0,10);
            return (
              <div key={d.key} style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:3 }}>{d.label}</div>
                <div style={{
                  width:34, height:34, borderRadius:10, margin:"0 auto",
                  background: meta ? `${meta.color}22` : "rgba(255,255,255,0.04)",
                  border: isToday ? "1.5px solid rgba(168,85,247,0.6)" : "1px solid rgba(255,255,255,0.07)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18
                }}>
                  {meta ? meta.emoji : <span style={{color:"rgba(255,255,255,0.15)",fontSize:12}}>·</span>}
                </div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{d.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Moods Breakdown */}
      {Object.keys(moodCounts).length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, padding:"16px 14px", marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:"rgba(255,255,255,0.7)" }}>
            <TrendingUp size={14} style={{ display:"inline", marginRight:6 }} />Mood Breakdown
          </div>
          {Object.entries(moodCounts).sort((a,b)=>b[1]-a[1]).map(([mood, count]) => {
            const meta = MOOD_META[mood] || { emoji:"😐", label: mood, color:"#94a3b8" };
            const pct = Math.round((count / (posCount + negCount || 1)) * 100);
            return (
              <div key={mood} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                  <span>{meta.emoji} {meta.label}</span>
                  <span style={{ color:"rgba(255,255,255,0.4)" }}>{count}x</span>
                </div>
                <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:6, overflow:"hidden" }}>
                  <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,delay:0.2}}
                    style={{ height:"100%", borderRadius:99, background: meta.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Insight card */}
      {topMood && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          style={{ background:`${MOOD_META[topMood]?.color || "#a78bfa"}18`, border:`1px solid ${MOOD_META[topMood]?.color || "#a78bfa"}33`, borderRadius:16, padding:"16px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <Heart size={16} style={{ color: MOOD_META[topMood]?.color }} />
            <span style={{ fontWeight:700, fontSize:14 }}>Your Vibe This Month</span>
          </div>
          <p style={{ margin:0, color:"rgba(255,255,255,0.7)", fontSize:13, lineHeight:1.5 }}>
            {(() => {
              const positives = ["happy","motivated","loved","calm"];
              const negatives = ["sad","anxious","frustrated"];
              if (positives.includes(topMood)) return `You've been feeling ${MOOD_META[topMood].label.toLowerCase()} most often lately ${MOOD_META[topMood].emoji} — that's something worth noticing. Keep nurturing whatever's been lifting you up.`;
              if (negatives.includes(topMood)) return `${MOOD_META[topMood].label} has been showing up a lot lately ${MOOD_META[topMood].emoji}. That's okay — you're here, you're aware, and that matters. Be gentle with yourself.`;
              return `Your emotional landscape has been ${MOOD_META[topMood].label.toLowerCase()} ${MOOD_META[topMood].emoji}. Every day you check in is a day you're paying attention to yourself.`;
            })()}
          </p>
        </motion.div>
      )}

      {totalDays === 0 && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", marginTop:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
          <div style={{ fontWeight:600 }}>No mood data yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Pick a mood on the home screen to start tracking</div>
        </div>
      )}
    </div>
  );
}
