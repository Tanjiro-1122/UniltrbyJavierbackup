import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Calendar, Heart, Sparkles } from "lucide-react";

const MOOD_META = {
  happy:       { emoji: "😊", label: "Happy",       color: "#facc15" },
  motivated:   { emoji: "🚀", label: "Motivated",   color: "#a78bfa" },
  loved:       { emoji: "🥰", label: "Loved",        color: "#f472b6" },
  calm:        { emoji: "😌", label: "Calm",         color: "#34d399" },
  neutral:     { emoji: "😐", label: "Neutral",     color: "#94a3b8" },
  anxious:     { emoji: "😰", label: "Anxious",     color: "#fb923c" },
  frustrated:  { emoji: "😤", label: "Frustrated",  color: "#f87171" },
  sad:         { emoji: "😢", label: "Sad",          color: "#60a5fa" },
  anger:       { emoji: "😠", label: "Angry",        color: "#ef4444" },
  fear:        { emoji: "😨", label: "Fear",         color: "#f97316" },
  disgust:     { emoji: "🤢", label: "Disgust",      color: "#84cc16" },
  surprise:    { emoji: "😲", label: "Surprise",     color: "#e879f9" },
  contentment: { emoji: "🙂", label: "Content",     color: "#4ade80" },
  fatigue:     { emoji: "😴", label: "Tired",        color: "#6366f1" },
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function MoodInsights() {
  const navigate = useNavigate();
  const [weekDays,   setWeekDays]   = useState([]);
  const [moodCounts, setMoodCounts] = useState({});
  const [streak,     setStreak]     = useState(0);
  const [topMood,    setTopMood]    = useState(null);
  const [totalDays,  setTotalDays]  = useState(0);
  const [posPercent, setPosPercent] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [aiInsight,  setAiInsight]  = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [dataSource, setDataSource] = useState("local"); // "db" | "local"

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    setLoading(true);
    const positives = ["happy","motivated","loved","calm","contentment","surprise"];
    const negatives = ["sad","anxious","frustrated","anger","fear","disgust","fatigue"];

    let historyMap = {}; // { "2026-04-01": "happy", ... }

    // ── Try DB first ──────────────────────────────────────────────────────
    const appleId = localStorage.getItem("unfiltr_apple_user_id");
    if (appleId) {
      try {
        const res = await fetch("/api/base44", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getMoodEntries", apple_user_id: appleId, limit: 60 }),
        });
        const json = await res.json();
        const records = Array.isArray(json.items) ? json.items : [];
        if (records.length > 0) {
          // DB has data — build map (one entry per day, most recent wins)
          records.forEach(r => {
            if (r.date && r.mood && !historyMap[r.date]) {
              historyMap[r.date] = r.mood;
            }
          });
          setDataSource("db");
        }
      } catch(e) {}
    }

    // ── Fall back to localStorage if DB empty ─────────────────────────────
    if (Object.keys(historyMap).length === 0) {
      try {
        historyMap = JSON.parse(localStorage.getItem("unfiltr_mood_history") || "{}");
        setDataSource("local");
      } catch {}
    } else {
      // Merge with localStorage so nothing is lost
      try {
        const local = JSON.parse(localStorage.getItem("unfiltr_mood_history") || "{}");
        Object.entries(local).forEach(([k, v]) => {
          if (!historyMap[k]) historyMap[k] = v;
        });
      } catch {}
    }

    // ── Build 14-day grid ─────────────────────────────────────────────────
    const days = [];
    const counts = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const mood = historyMap[key] || null;
      days.push({ key, label: DAYS[d.getDay()], date: d.getDate(), mood });
      if (mood) counts[mood] = (counts[mood] || 0) + 1;
    }
    setWeekDays(days);
    setMoodCounts(counts);

    const total = Object.keys(historyMap).length;
    setTotalDays(total);

    const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    if (top) setTopMood(top[0]);

    const posCount = Object.entries(counts).filter(([m]) => positives.includes(m)).reduce((a,[,v])=>a+v,0);
    const negCount = Object.entries(counts).filter(([m]) => negatives.includes(m)).reduce((a,[,v])=>a+v,0);
    const pct = (posCount + negCount) > 0 ? Math.round((posCount / (posCount + negCount)) * 100) : null;
    setPosPercent(pct);

    // Streak from localStorage
    try {
      const sd = localStorage.getItem("unfiltr_streak");
      if (sd) setStreak(JSON.parse(sd).count || 0);
    } catch {}

    setLoading(false);

    // ── Generate AI insight after data loads ──────────────────────────────
    if (Object.keys(counts).length >= 3) {
      generateAiInsight(historyMap, counts, positives, negatives);
    }
  };

  const generateAiInsight = async (historyMap, counts, positives, negatives) => {
    setInsightLoading(true);
    try {
      // Build a plain-language summary to send to AI
      const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
      const topMoods = sorted.slice(0, 3).map(([m, c]) => `${MOOD_META[m]?.label || m} (${c}x)`).join(", ");
      const posCount = sorted.filter(([m]) => positives.includes(m)).reduce((a,[,v])=>a+v,0);
      const negCount = sorted.filter(([m]) => negatives.includes(m)).reduce((a,[,v])=>a+v,0);
      const trend = posCount > negCount ? "mostly positive" : negCount > posCount ? "mostly difficult" : "mixed";

      // Use the companion name for personalization
      let companionName = "your companion";
      try {
        const raw = localStorage.getItem("unfiltr_companion");
        if (raw) {
          const c = JSON.parse(raw);
          companionName = c.displayName || c.name || "your companion";
        }
      } catch {}

      const prompt = `The user has been tracking their mood. Here's what the last 14 days looked like: top moods were ${topMoods}. The overall trend was ${trend} (${posCount} positive days, ${negCount} difficult days). Write a warm, 2-sentence personal insight for them — not generic, feel like it comes from someone who actually cares. Be honest but kind. Don't start with "You've been".`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: `You are ${companionName}, a caring AI companion. Give a short, warm, real insight about the user's mood patterns. 2 sentences max. Conversational tone.`,
          isPremium: localStorage.getItem("unfiltr_is_premium") === "true",
        }),
      });
      const data = await res.json();
      if (data?.reply) setAiInsight(data.reply);
    } catch(e) {}
    setInsightLoading(false);
  };

  const positives = ["happy","motivated","loved","calm","contentment","surprise"];
  const negatives = ["sad","anxious","frustrated","anger","fear","disgust","fatigue"];
  const posCount = Object.entries(moodCounts).filter(([m]) => positives.includes(m)).reduce((a,[,v])=>a+v,0);
  const negCount = Object.entries(moodCounts).filter(([m]) => negatives.includes(m)).reduce((a,[,v])=>a+v,0);

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
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:20 }}>Mood Insights</div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>
            {dataSource === "db" ? "✦ Synced across devices" : "Your emotional patterns"}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>💜</div>
          <div>Loading your mood data...</div>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
            {[
              { label:"Day Streak",  value: streak > 0 ? `🔥 ${streak}` : "—",          sub:"keep going" },
              { label:"Days Logged", value: totalDays || "—",                            sub:"total check-ins" },
              { label:"Positivity",  value: posPercent !== null ? `${posPercent}%` : "—", sub:"last 14 days" },
            ].map(s => (
              <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"14px 10px", textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:"#a78bfa" }}>{s.value}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:3 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* AI Insight Card */}
          {(aiInsight || insightLoading) && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              style={{
                background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1))",
                border:"1px solid rgba(168,85,247,0.3)", borderRadius:16,
                padding:"16px 18px", marginBottom:20,
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <Sparkles size={16} color="#a78bfa" />
                <span style={{ fontWeight:700, fontSize:13, color:"#c4b5fd" }}>Companion Insight</span>
              </div>
              {insightLoading ? (
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:13 }}>Thinking about your week...</div>
              ) : (
                <p style={{ margin:0, color:"rgba(255,255,255,0.85)", fontSize:14, lineHeight:1.6 }}>{aiInsight}</p>
              )}
            </motion.div>
          )}

          {/* 14-Day Grid */}
          <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, padding:"16px 14px", marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:"rgba(255,255,255,0.7)" }}>
              <Calendar size={14} style={{ display:"inline", marginRight:6 }} />Last 14 Days
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
              {weekDays.map(d => {
                const meta = d.mood ? (MOOD_META[d.mood] || { emoji:"😐", color:"#94a3b8" }) : null;
                const isToday = d.key === new Date().toISOString().slice(0,10);
                return (
                  <div key={d.key} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:3 }}>{d.label}</div>
                    <div style={{
                      width:34, height:34, borderRadius:10, margin:"0 auto",
                      background: meta ? `${meta.color}22` : "rgba(255,255,255,0.04)",
                      border: isToday ? "1.5px solid rgba(168,85,247,0.6)" : "1px solid rgba(255,255,255,0.07)",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:18
                    }}>
                      {meta ? meta.emoji : <span style={{color:"rgba(255,255,255,0.15)",fontSize:12}}>·</span>}
                    </div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{d.date}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood Breakdown */}
          {Object.keys(moodCounts).length > 0 && (
            <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, padding:"16px 14px", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:"rgba(255,255,255,0.7)" }}>
                <TrendingUp size={14} style={{ display:"inline", marginRight:6 }} />Mood Breakdown
              </div>
              {Object.entries(moodCounts).sort((a,b)=>b[1]-a[1]).map(([mood, count]) => {
                const meta = MOOD_META[mood] || { emoji:"😐", label: mood, color:"#94a3b8" };
                const total = posCount + negCount || 1;
                const pct = Math.round((count / total) * 100);
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

          {/* Top Mood Card */}
          {topMood && !aiInsight && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
              style={{
                background:`${MOOD_META[topMood]?.color || "#a78bfa"}18`,
                border:`1px solid ${MOOD_META[topMood]?.color || "#a78bfa"}33`,
                borderRadius:16, padding:"16px 18px"
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <Heart size={16} style={{ color: MOOD_META[topMood]?.color }} />
                <span style={{ fontWeight:700, fontSize:14 }}>Your Vibe This Month</span>
              </div>
              <p style={{ margin:0, color:"rgba(255,255,255,0.7)", fontSize:13, lineHeight:1.5 }}>
                {positives.includes(topMood)
                  ? `You've been feeling ${MOOD_META[topMood].label.toLowerCase()} most often lately ${MOOD_META[topMood].emoji} — that's something worth noticing. Keep nurturing whatever's been lifting you up.`
                  : negatives.includes(topMood)
                  ? `${MOOD_META[topMood].label} has been showing up a lot lately ${MOOD_META[topMood].emoji}. That's okay — you're here, you're aware, and that matters. Be gentle with yourself.`
                  : `Your emotional landscape has been ${MOOD_META[topMood].label.toLowerCase()} ${MOOD_META[topMood].emoji}. Every day you check in is a day you're paying attention to yourself.`
                }
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
        </>
      )}
    </div>
  );
}
