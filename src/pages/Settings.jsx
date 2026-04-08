import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trash2, Sparkles, Check, PauseCircle } from "lucide-react";
import ReferralSection from "@/components/ReferralSection";
import PaywallModal from "@/components/PaywallModal";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import BottomTabs from "@/components/BottomTabs";

function CompanionNicknameField({ companion, userProfile }) {
  const [nickname, setNickname] = useState(
    localStorage.getItem("unfiltr_companion_nickname") || ""
  );
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) return;
    // Save to localStorage
    localStorage.setItem("unfiltr_companion_nickname", nickname.trim());
    const stored = localStorage.getItem("unfiltr_companion");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.displayName = nickname.trim();
      localStorage.setItem("unfiltr_companion", JSON.stringify(parsed));
    }
    // Save to DB
    try {
      const companionId = userProfile?.companion_id;
      if (companionId) {
        await base44.entities.Companion.update(companionId, { nickname: nickname.trim() });
      }
    } catch(e) { console.error("nickname DB save failed:", e); }
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
  const [personality, setPersonality] = useState({
    vibe: 5, empathy: 5, humor: 5, curiosity: 5, style: 5
  });
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [personalitySaved, setPersonalitySaved] = useState(false);
  const [streak, setStreak]               = useState(0);
  const [daysSince, setDaysSince]         = useState(0);
  const [moodHistory, setMoodHistory]     = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileId = localStorage.getItem("userProfileId");
        if (!profileId) return;
        const profile = await base44.entities.UserProfile.get(profileId);
        setUserProfile(profile);
        if (profile?.companion_id) {
          const comp = await base44.entities.Companion.get(profile.companion_id);
          setCompanion(comp);
          // Load saved personality sliders
          setPersonality({
            vibe:      comp?.personality_vibe      ?? 5,
            empathy:   comp?.personality_empathy   ?? 5,
            humor:     comp?.personality_humor     ?? 5,
            curiosity: comp?.personality_curiosity ?? 5,
            style:     comp?.personality_style     ?? 5,
          });
        } else {
          // Fallback: build companion object from localStorage
          const stored = localStorage.getItem("unfiltr_companion");
          if (stored) setCompanion(JSON.parse(stored));
        }
      } catch(e) {
        console.error("Settings loadData error:", e);
        const stored = localStorage.getItem("unfiltr_companion");
        if (stored) setCompanion(JSON.parse(stored));
      }
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
    const history = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (6 - i));
      return { day: days[d.getDay()], mood: null };
    });
    setMoodHistory(history);

    loadData();
  }, []);

  const handleSignOut = async () => {
    localStorage.clear();
  };

  const handleChangeCompanion = async (newCompanion) => {
    if (savingCompanion) return;
    // Allow re-selecting same companion (just refresh), guard only on exact same id
    if (newCompanion.id === companion?.avatar_id || newCompanion.name === companion?.name) {
      // Still allow — user may want to reselect
    }
    setSavingCompanion(true);
    try {
      const companionId = userProfile?.companion_id;
      if (companionId) {
        await base44.entities.Companion.update(companionId, {
          name: newCompanion.name,
          avatar_id: newCompanion.id,
          avatar_url: newCompanion.avatar,
          personality_preset: newCompanion.tagline,
        });
      }
      const updatedComp = { ...newCompanion, systemPrompt: companion?.systemPrompt || "" };
      localStorage.setItem("unfiltr_companion", JSON.stringify(updatedComp));
      setCompanion((prev) => ({ ...prev, name: newCompanion.name, avatar_id: newCompanion.id, avatar_url: newCompanion.avatar }));
    } catch(e) {
      console.error("handleChangeCompanion error:", e);
      // Still update localStorage so it works even if DB fails
      const updatedComp = { ...newCompanion, systemPrompt: companion?.systemPrompt || "" };
      localStorage.setItem("unfiltr_companion", JSON.stringify(updatedComp));
      setCompanion((prev) => ({ ...prev, name: newCompanion.name, avatar_url: newCompanion.avatar }));
    }
    setSavingCompanion(false);
  };

  const handleChangeBackground = async (bgId) => {
    if (savingBackground) return;
    setSavingBackground(true);
    try {
      const profileId = localStorage.getItem("userProfileId");
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, { background_id: bgId });
      }
      const bg = BACKGROUNDS.find((b) => b.id === bgId);
      if (bg) {
        localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
      }
      setUserProfile((prev) => ({ ...prev, background_id: bgId }));
    } catch(e) {
      console.error("handleChangeBackground error:", e);
      // Still update localStorage
      const bg = BACKGROUNDS.find((b) => b.id === bgId);
      if (bg) localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
      setUserProfile((prev) => ({ ...prev, background_id: bgId }));
    }
    setSavingBackground(false);
  };

  const handleSavePersonality = async () => {
    setSavingPersonality(true);
    try {
      const companionId = userProfile?.companion_id;
      if (companionId) {
        await base44.entities.Companion.update(companionId, {
          personality_vibe:      personality.vibe,
          personality_empathy:   personality.empathy,
          personality_humor:     personality.humor,
          personality_curiosity: personality.curiosity,
          personality_style:     personality.style,
        });
      }
      // Also cache in localStorage so ChatPage can read it
      const stored = localStorage.getItem("unfiltr_companion");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.personality_vibe      = personality.vibe;
        parsed.personality_empathy   = personality.empathy;
        parsed.personality_humor     = personality.humor;
        parsed.personality_curiosity = personality.curiosity;
        parsed.personality_style     = personality.style;
        localStorage.setItem("unfiltr_companion", JSON.stringify(parsed));
      }
      setPersonalitySaved(true);
      setTimeout(() => setPersonalitySaved(false), 2500);
    } catch(e) { console.error("personality save error:", e); }
    setSavingPersonality(false);
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
    <div className="screen" style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #1a0a2e 100%)" }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px 14px",
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Settings</h1>
      </div>

      {/* Content */}
      <div className="scroll-area px-4 py-6 space-y-6">

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
              { label: "Messages", value: userProfile?.message_count || 0, sub: "total sent" },
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
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Mood This Week
          </p>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "14px 12px",
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          }}>
            {moodHistory.map((entry, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: entry.mood ? 44 : 28, borderRadius: 8,
                  background: entry.mood ? "linear-gradient(180deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {entry.mood && <span style={{ fontSize: 14 }}>{entry.mood}</span>}
                </div>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>{entry.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Display Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Display Name</p>
          <p className="text-white font-semibold text-lg">{userProfile.display_name}</p>
        </motion.div>

        {/* Companion Nickname */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Companion Nickname</p>
          <p className="text-white/40 text-xs mb-2">Give your companion a personal name only you call them.</p>
          <CompanionNicknameField companion={companion} userProfile={userProfile} />
        </motion.div>

        {/* Companion Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Your Companion</p>
          <div className="grid grid-cols-4 gap-3">
            {COMPANIONS.map((c) => {
              // Compare by id (avatar_id) first, then name as fallback
              const storedComp = (() => { try { return JSON.parse(localStorage.getItem("unfiltr_companion") || "{}"); } catch { return {}; } })();
              const currentCompanionId = companion?.avatar_id || storedComp?.id;
              const currentCompanionName = companion?.name || storedComp?.name;
              const isSelected = (currentCompanionId && currentCompanionId === c.id) || (!currentCompanionId && currentCompanionName === c.name);
              return (
                <button key={c.id} onClick={() => handleChangeCompanion(c)} className="flex flex-col items-center gap-1.5 relative">
                  <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? "border-purple-500 scale-105" : "border-white/10"}`}
                    style={{ background: isSelected ? "#2d1a4e" : "#1a1a2e" }}>
                    <img src={c.poses?.neutral || c.avatar} alt={c.name} className="w-full h-full object-cover object-top" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isSelected ? "text-purple-300" : "text-white/50"}`}>{c.name}</span>
                </button>
              );
            })}
          </div>
          {savingCompanion && <p className="text-white/30 text-xs mt-2 text-center">Saving...</p>}
        </motion.div>

        {/* Background Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Background</p>
          <div className="grid grid-cols-2 gap-3">
            {BACKGROUNDS.map((bg) => {
              const isSelected = userProfile.background_id === bg.id;
              return (
                <button key={bg.id} onClick={() => handleChangeBackground(bg.id)}
                  className={`relative h-24 rounded-2xl border-2 overflow-hidden transition-all ${isSelected ? "border-purple-500" : "border-white/10"}`}>
                  <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 p-2 text-center pointer-events-none">
                    <p className="text-white text-xs font-semibold">{bg.emoji} {bg.label}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {savingBackground && <p className="text-white/30 text-xs mt-2 text-center">Saving...</p>}
        </motion.div>

        {/* ── PERSONALITY SLIDERS ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Personality</p>
          <p className="text-white/30 text-xs mb-4">Tune how your companion talks to you.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { key: "vibe",      label: "Energy",    lo: "Calm 😌",    hi: "Hype 🔥" },
              { key: "empathy",   label: "Empathy",   lo: "Direct 🎯",  hi: "Nurturing 🤗" },
              { key: "humor",     label: "Humor",     lo: "Serious 🧐", hi: "Funny 😂" },
              { key: "curiosity", label: "Curiosity", lo: "Chill 😎",   hi: "Curious 🔍" },
              { key: "style",     label: "Style",     lo: "Casual 👋",  hi: "Deep 🌊" },
            ].map(({ key, label, lo, hi }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "rgba(168,85,247,0.8)", fontSize: 12 }}>{personality[key]}/10</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, width: 60, textAlign: "right", flexShrink: 0 }}>{lo}</span>
                  <input
                    type="range" min={1} max={10} step={1}
                    value={personality[key]}
                    onChange={(e) => setPersonality(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: "#a855f7", cursor: "pointer", height: 4 }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, width: 60, flexShrink: 0 }}>{hi}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSavePersonality}
            disabled={savingPersonality}
            style={{
              marginTop: 20, width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
              color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer",
              background: personalitySaved
                ? "rgba(34,197,94,0.3)"
                : "linear-gradient(135deg, #7c3aed, #a855f7)",
              opacity: savingPersonality ? 0.6 : 1,
              transition: "background 0.3s",
            }}
          >
            {personalitySaved ? "✓ Saved!" : savingPersonality ? "Saving..." : "Save Personality"}
          </button>
        </motion.div>

        {/* Referral */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <ReferralSection profileId={localStorage.getItem("userProfileId")} />
        </motion.div>

        {/* Pricing / Upgrade */}
        <button
          onClick={() => navigate("/Pricing")}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 16, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(219,39,119,0.15))",
            border: "1px solid rgba(168,85,247,0.35)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>Go Premium</p>
              <p style={{ color: "rgba(196,180,252,0.6)", fontSize: 12, margin: "2px 0 0" }}>Unlimited messages & more</p>
            </div>
          </div>
          <span style={{ color: "#a855f7", fontSize: 13, fontWeight: 700 }}>View Plans →</span>
        </button>

        {/* Premium Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Status</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${(userProfile.premium || userProfile.is_premium) ? "bg-purple-500" : "bg-white/30"}`} />
              <p className="text-white font-semibold">{(userProfile.premium || userProfile.is_premium) ? "✨ Premium" : "Free (20 msgs/day)"}</p>
            </div>
            {!(userProfile.premium || userProfile.is_premium) && (
              <button
                onClick={() => setShowPaywall(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full"
              >
                <Sparkles className="w-3 h-3" />
                Upgrade
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Account Management */}
      <motion.div className="sticky-bottom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, textAlign: "center" }}>Account Management</p>
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

      {/* Paywall */}
      <BottomTabs />

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
              className="w-full max-w-[430px] bg-[#1a0a2e] border border-white/10 rounded-t-3xl px-6 pt-6"
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
              className="w-full max-w-[430px] bg-[#1a0a2e] border border-white/10 rounded-t-3xl px-6 pt-6"
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
    </div>
  );
}