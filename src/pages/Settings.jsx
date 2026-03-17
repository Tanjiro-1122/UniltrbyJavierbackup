import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trash2, Sparkles, Check, PauseCircle, ShieldCheck, MessageSquareMore, BarChart3, Share2, HelpCircle, Heart } from "lucide-react";
import ReferralSection from "@/components/ReferralSection";
import DisplayNameEditor from "@/components/settings/DisplayNameEditor";
import CompanionShareCard from "@/components/companion/CompanionShareCard";
import NotificationSettings from "@/components/NotificationSettings";
import PaywallModal from "@/components/PaywallModal";
import AppShell from "@/components/shell/AppShell";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";

function CompanionNicknameField({ companion, userProfile }) {
  const [nickname, setNickname] = useState(
    localStorage.getItem("unfiltr_companion_nickname") || ""
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!nickname.trim()) return;
    localStorage.setItem("unfiltr_companion_nickname", nickname.trim());
    const stored = localStorage.getItem("unfiltr_companion");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.displayName = nickname.trim();
      localStorage.setItem("unfiltr_companion", JSON.stringify(parsed));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder={`e.g. "Max", "Luna babe", "my guy"`}
        maxLength={20}
        className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none"
        style={{
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.25)",
        }}
        onFocus={(e) => e.target.style.borderColor = "rgba(139,92,246,0.6)"}
        onBlur={(e) => e.target.style.borderColor = "rgba(139,92,246,0.25)"}
      />
      <button
        onClick={handleSave}
        disabled={!nickname.trim()}
        className="px-4 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-30 active:scale-95 transition-all"
        style={{ background: saved ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg, #7c3aed, #db2777)" }}
      >
        {saved ? "✓" : "Save"}
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile]     = useState(null);
  const [companion, setCompanion]         = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [showPauseModal, setShowPauseModal]       = useState(false);
  const [pauseDuration, setPauseDuration]         = useState("1week");
  const [pausing, setPausing]                     = useState(false);
  const [pauseSuccess, setPauseSuccess]           = useState(false);
  const [showPaywall, setShowPaywall]     = useState(false);
  const [savingCompanion, setSavingCompanion]   = useState(false);
  const [savingBackground, setSavingBackground] = useState(false);
  const [streak, setStreak]               = useState(0);
  const [daysSince, setDaysSince]         = useState(0);
  const [moodHistory, setMoodHistory]     = useState([]);
  const [voiceGender, setVoiceGender]     = useState("female");
  const [voicePersonality, setVoicePersonality] = useState("cheerful");
  const [savingVoice, setSavingVoice]     = useState(false);
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [showCompanionCard, setShowCompanionCard] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const profileId = localStorage.getItem("userProfileId");
      if (!profileId) return;
      const profile = await base44.entities.UserProfile.get(profileId);
      const comp = await base44.entities.Companion.get(profile.companion_id);
      setUserProfile(profile);
      setCompanion(comp);
      setVoiceGender(comp?.voice_gender || "female");
      setVoicePersonality(comp?.voice_personality || "cheerful");
    };

    // Load streak
    const todayStr = new Date().toDateString();
    const streakData = JSON.parse(localStorage.getItem("unfiltr_streak") || '{"date":"","count":0}');
    setStreak(streakData.date === todayStr || streakData.date === new Date(Date.now() - 86400000).toDateString() ? streakData.count : 0);

    // Days with companion
    const created = localStorage.getItem("unfiltr_companion_created");
    if (created) setDaysSince(Math.max(1, Math.floor((Date.now() - new Date(created).getTime()) / 86400000)));

    // Mood history skeleton (last 7 days)
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const moodEmojis = ["😊", "😌", "🥰", "😄", "🌟", "💜", "✨"];
    const history = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (6 - i));
      // Show emoji for past days, null for today (unless data exists)
      const isToday = i === 6;
      return { day: days[d.getDay()], mood: isToday ? null : moodEmojis[i] };
    });
    setMoodHistory(history);

    loadData();

    // Check admin role
    base44.auth.me().then(me => {
      if (me?.role === "admin") setIsAdmin(true);
    }).catch(() => {});
  }, []);

  const handleChangeVoiceGender = async (newGender) => {
    if (savingVoice || !userProfile || !companion) return;
    setSavingVoice(true);
    try {
      await base44.entities.Companion.update(userProfile.companion_id, { voice_gender: newGender });
      setVoiceGender(newGender);
      setCompanion(prev => ({ ...prev, voice_gender: newGender }));
    } catch (e) {
      console.error("Voice gender save error:", e);
    } finally {
      setSavingVoice(false);
    }
  };

  const handleChangeVoicePersonality = async (newPersonality) => {
    if (savingPersonality || !userProfile || !companion) return;
    setSavingPersonality(true);
    try {
      await base44.entities.Companion.update(userProfile.companion_id, { voice_personality: newPersonality });
      setVoicePersonality(newPersonality);
      setCompanion(prev => ({ ...prev, voice_personality: newPersonality }));
    } catch (e) {
      console.error("Voice personality save error:", e);
    } finally {
      setSavingPersonality(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.clear();
  };

  const handleChangeCompanion = async (newCompanion) => {
    if (savingCompanion || newCompanion.name === companion.name) return;
    setSavingCompanion(true);
    await base44.entities.Companion.update(userProfile.companion_id, {
      name: newCompanion.name,
      avatar_url: newCompanion.avatar,
      personality: newCompanion.tagline,
    });
    const updatedComp = { ...newCompanion, systemPrompt: companion.systemPrompt };
    localStorage.setItem("unfiltr_companion", JSON.stringify(updatedComp));
    setCompanion((prev) => ({ ...prev, name: newCompanion.name, avatar_url: newCompanion.avatar }));
    setSavingCompanion(false);
  };

  const handleChangeBackground = async (bgId) => {
    if (savingBackground || bgId === userProfile.background_id) return;
    setSavingBackground(true);
    const profileId = localStorage.getItem("userProfileId");
    await base44.entities.UserProfile.update(profileId, { background_id: bgId });
    const bg = BACKGROUNDS.find((b) => b.id === bgId);
    localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
    setUserProfile((prev) => ({ ...prev, background_id: bgId }));
    setSavingBackground(false);
  };

  const handlePauseAccount = async () => {
    setPausing(true);
    const profileId = localStorage.getItem("userProfileId");
    const now = new Date();
    const until = new Date(now);
    if (pauseDuration === "1week")  until.setDate(until.getDate() + 7);
    if (pauseDuration === "2weeks") until.setDate(until.getDate() + 14);
    if (pauseDuration === "1month") until.setMonth(until.getMonth() + 1);
    await base44.entities.UserProfile.update(profileId, {
      account_paused: true,
      account_paused_at: now.toISOString(),
      account_pause_until: until.toISOString(),
    });
    setUserProfile(prev => ({ ...prev, account_paused: true, account_pause_until: until.toISOString() }));
    setPausing(false);
    setPauseSuccess(true);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const profileId = localStorage.getItem("userProfileId");
    if (profileId) {
      await base44.entities.UserProfile.update(profileId, {
        account_delete_requested: true,
        account_delete_requested_at: new Date().toISOString(),
      });
    }
    localStorage.clear();
    base44.auth.logout();
    alert("Your account will be deleted within 24 hours.");
  };

  if (!userProfile || !companion) return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <AppShell bg="#0d0118" tabs={true} style={{ background: "#0d0118" }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px 14px",
        paddingTop: "12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button
          onClick={() => navigate("/chat")}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Settings</h1>
      </div>

      {/* Content */}
      <div className="scroll-area" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "16px 16px 60px", background: "#0d0118", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── STATS CARD ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.1))",
            border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 16, padding: "16px",
            display: "flex", gap: 0,
          }}>
            {[
              { label: "Day Streak", value: streak > 0 ? `${streak} 🔥` : "Start today!", sub: "consecutive days" },
              { label: "Days Together", value: daysSince, sub: "with your companion" },
              { label: "Messages", value: parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10) || userProfile?.message_count || 0, sub: "total sent" },
            ].map((stat, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 18, margin: 0 }}>{stat.value}</p>
                <p style={{ color: "white", fontWeight: 600, fontSize: 11, margin: "2px 0 0" }}>{stat.label}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, margin: "1px 0 0" }}>{stat.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── MOOD THIS WEEK ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Mood This Week
          </p>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(42,31,74,0.6)",
            borderRadius: 14, padding: "14px 12px",
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          }}>
            {moodHistory.map((entry, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 32, height: entry.mood ? 48 : 32, borderRadius: 10,
                  background: entry.mood ? "linear-gradient(180deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {entry.mood ? <span style={{ fontSize: 16 }}>{entry.mood}</span> : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }}>+</span>}
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>{entry.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Display Name (editable) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Display Name</p>
          <DisplayNameEditor
            userProfile={userProfile}
            onSave={(newName) => setUserProfile(prev => ({ ...prev, display_name: newName }))}
          />
        </motion.div>

        {/* Companion Nickname */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Companion Nickname</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>Give your companion a personal name only you call them.</p>
          <CompanionNicknameField companion={companion} userProfile={userProfile} />
        </motion.div>

        {/* Voice Gender */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Companion Voice</p>
          <div style={{ display: "flex", gap: 10 }}>
            {["male", "female", "neutral"].map(gender => (
              <button
                key={gender}
                onClick={() => handleChangeVoiceGender(gender)}
                disabled={savingVoice}
                style={{
                  flex: 1,
                  padding: "12px 10px",
                  borderRadius: 12,
                  border: voiceGender === gender ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                  background: voiceGender === gender ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                  color: voiceGender === gender ? "white" : "rgba(255,255,255,0.5)",
                  fontWeight: voiceGender === gender ? 700 : 500,
                  fontSize: 13,
                  cursor: savingVoice ? "default" : "pointer",
                  opacity: savingVoice ? 0.6 : 1,
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {gender === "male" && "🎤 Male"}
                {gender === "female" && "✨ Female"}
                {gender === "neutral" && "🤖 Neutral"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Voice Personality */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.095 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Voice Personality</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 8 }}>How your companion sounds when speaking</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { id: "cheerful", emoji: "😊", label: "Cheerful", desc: "Bright & upbeat" },
              { id: "calm", emoji: "🧘", label: "Calm", desc: "Slow & soothing" },
              { id: "energetic", emoji: "⚡", label: "Energetic", desc: "Fast & lively" },
              { id: "professional", emoji: "💼", label: "Professional", desc: "Clear & steady" },
            ].map(p => (
              <button key={p.id} onClick={() => handleChangeVoicePersonality(p.id)}
                disabled={savingPersonality}
                style={{
                  padding: "12px 10px",
                  borderRadius: 14,
                  border: voicePersonality === p.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                  background: voicePersonality === p.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                  cursor: savingPersonality ? "default" : "pointer",
                  opacity: savingPersonality ? 0.6 : 1,
                  transition: "all 0.15s",
                  textAlign: "center",
                }}>
                <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{p.emoji}</span>
                <span style={{ color: voicePersonality === p.id ? "white" : "rgba(255,255,255,0.6)", fontWeight: voicePersonality === p.id ? 700 : 500, fontSize: 13, display: "block" }}>{p.label}</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{p.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Companion Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Your Companion</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {COMPANIONS.map((c) => {
              const isSelected = companion.name === c.name;
              return (
                <button key={c.id} onClick={() => handleChangeCompanion(c)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{
                    position: "relative", width: 56, height: 56, borderRadius: 14, overflow: "hidden",
                    border: isSelected ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.1)",
                    background: isSelected ? "#2d1a4e" : "#1a1a2e",
                    transition: "all 0.15s",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                  }}>
                    <img src={c.avatar} alt={c.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    {isSelected && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={14} color="white" />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: isSelected ? 600 : 500, color: isSelected ? "#c4b5fd" : "rgba(255,255,255,0.5)" }}>{c.name}</span>
                </button>
              );
            })}
          </div>
          {savingCompanion && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 8, textAlign: "center" }}>Saving...</p>}
        </motion.div>

        {/* Background Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Background
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {BACKGROUNDS.map((bg) => {
              const isSelected = userProfile.background_id === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => handleChangeBackground(bg.id)}
                  style={{
                    position: "relative",
                    height: 96,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: isSelected ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.1)",
                    background: "#1a1a2e",
                    cursor: "pointer",
                  }}
                >
                  <img src={bg.url} alt={bg.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 8, textAlign: "center", pointerEvents: "none" }}>
                    <p style={{ color: "white", fontSize: 12, fontWeight: 600, margin: 0 }}>{bg.emoji} {bg.label}</p>
                  </div>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={12} color="#9333ea" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {savingBackground && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8, textAlign: "center" }}>Saving...</p>}
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Notifications
          </p>
          <NotificationSettings
            profileId={localStorage.getItem("userProfileId")}
            initialEnabled={userProfile?.daily_checkins_enabled}
          />
        </motion.div>

        {/* Referral */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <ReferralSection profileId={localStorage.getItem("userProfileId")} />
        </motion.div>

        {/* Fun Stuff */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.285 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Fun Stuff</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => navigate("/PersonalityQuiz")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <span className="flex items-center gap-2">
                <HelpCircle size={16} color="#a855f7" />
                <span className="text-white font-semibold text-sm">Which companion are you?</span>
              </span>
              <span style={{ color: "rgba(168,85,247,0.7)", fontSize: 18 }}>›</span>
            </button>
            <button onClick={() => setShowCompanionCard(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "rgba(219,39,119,0.1)", border: "1px solid rgba(219,39,119,0.2)" }}>
              <span className="flex items-center gap-2">
                <Heart size={16} color="#db2777" />
                <span className="text-white font-semibold text-sm">Share your companion</span>
              </span>
              <span style={{ color: "rgba(219,39,119,0.7)", fontSize: 18 }}>›</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Page Link */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.29 }}>
          <button
            onClick={() => navigate("/Pricing")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.1))", border: "1px solid rgba(168,85,247,0.25)" }}
          >
            <span className="text-white font-semibold text-sm">✨ View Premium Plans</span>
            <span style={{ color: "rgba(168,85,247,0.7)", fontSize: 18 }}>›</span>
          </button>
        </motion.div>

        {/* Premium Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Status</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: (userProfile.premium || userProfile.is_premium) ? "#a855f7" : "rgba(255,255,255,0.4)" }} />
              <p style={{ color: "white", fontWeight: 600, fontSize: 15, margin: 0 }}>{(userProfile.premium || userProfile.is_premium) ? "✨ Premium" : "Free (20 msgs/day)"}</p>
            </div>
            {!(userProfile.premium || userProfile.is_premium) && (
              <button
                onClick={() => setShowPaywall(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", borderRadius: 999, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                <Sparkles size={12} />
                Upgrade
              </button>
            )}
          </div>
        </motion.div>

        {/* Admin Section */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              <ShieldCheck size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Admin Tools
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => navigate("/AdminDashboard")}
                style={{ width: "100%", padding: "13px 16px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 14, color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                <BarChart3 size={16} color="#a855f7" />
                Admin Dashboard
              </button>
              <button
                onClick={() => navigate("/admin/feedback")}
                style={{ width: "100%", padding: "13px 16px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 14, color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                <MessageSquareMore size={16} color="#a855f7" />
                Feedback Manager
              </button>
            </div>
          </motion.div>
        )}

        {/* Account Management */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Account Management</p>
        <button
          onClick={() => { setPauseSuccess(false); setShowPauseModal(true); }}
          style={{ width: "100%", padding: "13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <PauseCircle size={16} />
          {userProfile.account_paused ? "Account Paused 💙" : "Pause My Account"}
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{ width: "100%", padding: "13px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, color: "rgba(239,68,68,0.45)", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Trash2 size={16} />
          Delete My Account
        </button>
        </motion.div>

      </div>

      {/* Paywall */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={() => {
          if (window.webkit?.messageHandlers?.storekit) {
            window.webkit.messageHandlers.storekit.postMessage({ action: "subscribe", productId: "com.unfiltr.premium.monthly" });
          } else {
            alert("In-app purchase: com.unfiltr.premium.monthly ($9.99/month)");
          }
        }}
        onRestore={() => {
          if (window.webkit?.messageHandlers?.storekit) {
            window.webkit.messageHandlers.storekit.postMessage({ action: "restore" });
          } else {
            alert("Restore purchases — handled by Apple StoreKit.");
          }
        }}
      />

      {/* Pause Modal */}
      <AnimatePresence>
        {showPauseModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50"
            onClick={() => setShowPauseModal(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#1a0a2e] border border-white/10 rounded-t-3xl px-6 pt-6"
              style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              {pauseSuccess ? (
                <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>💙</p>
                  <h3 style={{ color: "white", fontWeight: 800, fontSize: 18, margin: "0 0 8px" }}>Account Paused</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
                    Your account is paused. Your companion will be waiting when you're back 💙
                  </p>
                  <button onClick={() => setShowPauseModal(false)}
                    style={{ width: "100%", padding: "13px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 14, color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-white font-bold text-xl mb-1">Pause My Account</h3>
                  <p className="text-white/50 text-sm mb-5">Take a break. Your companion will be right here when you return.</p>

                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Pause duration</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {[
                      { value: "1week",  label: "1 Week" },
                      { value: "2weeks", label: "2 Weeks" },
                      { value: "1month", label: "1 Month" },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setPauseDuration(opt.value)}
                        style={{
                          padding: "13px 16px", borderRadius: 14, textAlign: "left",
                          background: pauseDuration === opt.value ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${pauseDuration === opt.value ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`,
                          color: pauseDuration === opt.value ? "white" : "rgba(255,255,255,0.55)",
                          fontWeight: pauseDuration === opt.value ? 700 : 500, fontSize: 15, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                        {opt.label}
                        {pauseDuration === opt.value && <span style={{ fontSize: 16 }}>✓</span>}
                      </button>
                    ))}
                  </div>

                  <button onClick={handlePauseAccount} disabled={pausing}
                    style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: pausing ? 0.6 : 1, marginBottom: 10 }}>
                    {pausing ? "Pausing…" : "Confirm Pause"}
                  </button>
                  <button onClick={() => setShowPauseModal(false)}
                    style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#1a0a2e] border border-white/10 rounded-t-3xl px-6 pt-6"
              style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-white font-bold text-xl mb-2">Delete Account?</h3>
              <p className="text-white/50 text-sm mb-6">This will permanently delete your profile, companion, and all messages. This cannot be undone.</p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl mb-3 disabled:opacity-50"
              >
                {deleting ? "Processing…" : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3 bg-white/10 text-white/70 font-medium rounded-xl"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Companion Share Card */}
      <CompanionShareCard
        visible={showCompanionCard}
        onClose={() => setShowCompanionCard(false)}
        companionId={companion?.id}
        companionName={localStorage.getItem("unfiltr_companion_nickname") || companion?.name}
        daysTogether={daysSince}
      />
    </AppShell>
  );
}