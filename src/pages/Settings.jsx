import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, ChevronRight, Trash2, Sparkles, Check, PauseCircle, User, Palette, Mic, Heart, Shield, Info, LogOut } from "lucide-react";
import { getMoodWeek } from "@/components/utils/moodTracker";
import ReferralSection from "@/components/ReferralSection";
import DisplayNameEditor from "@/components/settings/DisplayNameEditor";
import CompanionShareCard from "@/components/companion/CompanionShareCard";
import PaywallModal from "@/components/PaywallModal";
import HowToGuide from "@/components/settings/HowToGuide";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";

// ── Collapsible Section Drawer ──────────────────────────────────────────────
function Drawer({ icon: Icon, iconColor = "#a855f7", title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${iconColor}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color={iconColor} />
        </div>
        <span style={{ flex: 1, color: "white", fontWeight: 600, fontSize: 15 }}>{title}</span>
        {badge && (
          <span style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, marginRight: 6 }}>{badge}</span>
        )}
        <ChevronDown size={16} color="rgba(255,255,255,0.35)" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ paddingTop: 14 }}>{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Companion Nickname Field ─────────────────────────────────────────────────
function CompanionNicknameField() {
  const [nickname, setNickname] = useState(localStorage.getItem("unfiltr_companion_nickname") || "");
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    if (!nickname.trim()) return;
    localStorage.setItem("unfiltr_companion_nickname", nickname.trim());
    const stored = localStorage.getItem("unfiltr_companion");
    if (stored) { try { const p = JSON.parse(stored); p.displayName = nickname.trim(); localStorage.setItem("unfiltr_companion", JSON.stringify(p)); } catch {} }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <input
        type="text" value={nickname} onChange={e => setNickname(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSave()}
        placeholder={`e.g. "Max", "Luna babe", "my guy"`} maxLength={20}
        style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.08)", color: "white", fontSize: 14, outline: "none" }}
      />
      <button onClick={handleSave} disabled={!nickname.trim()}
        style={{ padding: "11px 16px", borderRadius: 12, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", background: saved ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg,#7c3aed,#db2777)", opacity: !nickname.trim() ? 0.3 : 1 }}>
        {saved ? "✓" : "Save"}
      </button>
    </div>
  );
}

// ── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile]           = useState(null);
  const [companion, setCompanion]               = useState(() => { try { const s = localStorage.getItem("unfiltr_companion"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]                 = useState(false);
  const [showPauseModal, setShowPauseModal]     = useState(false);
  const [pauseDuration, setPauseDuration]       = useState("1week");
  const [pausing, setPausing]                   = useState(false);
  const [pauseSuccess, setPauseSuccess]         = useState(false);
  const [showPaywall, setShowPaywall]           = useState(false);
  const [savingCompanion, setSavingCompanion]   = useState(false);
  const [savingBackground, setSavingBackground] = useState(false);
  const [streak, setStreak]                     = useState(0);
  const [daysSince, setDaysSince]               = useState(0);
  const [moodHistory, setMoodHistory]           = useState([]);
  const [voiceGender, setVoiceGender]           = useState("female");
  const [voicePersonality, setVoicePersonality] = useState("cheerful");
  const [savingVoice, setSavingVoice]           = useState(false);
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [isAdmin, setIsAdmin]                   = useState(false);
  const [familyTapCount, setFamilyTapCount]     = useState(0);
  const [showFamilyModal, setShowFamilyModal]   = useState(false);
  const [familyCode, setFamilyCode]             = useState("");
  const [familyCodeError, setFamilyCodeError]   = useState("");
  const [familySuccess, setFamilySuccess]       = useState(false);
  const [showCompanionCard, setShowCompanionCard] = useState(false);
  const [showCodeModal, setShowCodeModal]       = useState(false);
  const [adminCode, setAdminCode]               = useState("");
  const [codeError, setCodeError]               = useState("");

  const handleTriquetraTap = () => {
    const next = (parseInt(localStorage.getItem('_atc') || '0')) + 1;
    localStorage.setItem('_atc', next);
    if (next >= 5) { localStorage.setItem('_atc', '0'); setShowCodeModal(true); }
  };

  const handleCodeSubmit = () => {
    if (adminCode.trim().toLowerCase() === "huertasfam") {
      localStorage.setItem("unfiltr_admin_unlocked", "true");
      setIsAdmin(true); setShowCodeModal(false); setAdminCode(""); setCodeError("");
    } else { setCodeError("Invalid code."); setAdminCode(""); }
  };

  const handleFamilyTriquetraTap = () => {
    const next = familyTapCount + 1;
    setFamilyTapCount(next);
    if (next >= 5) { setFamilyTapCount(0); setShowFamilyModal(true); }
  };

  const handleFamilyCodeSubmit = async () => {
    if (familyCode.trim().toLowerCase() === "huertasfam") {
      localStorage.setItem("unfiltr_is_premium", "true");
      localStorage.setItem("unfiltr_family_unlock", "true");
      try {
        const profileId = localStorage.getItem("userProfileId");
        if (profileId) await base44.entities.UserProfile.update(profileId, { is_premium: true, annual_plan: true, bonus_messages: 99999 });
      } catch (e) {}
      setFamilySuccess(true);
      setFamilyCode(""); setFamilyCodeError("");
      setTimeout(() => {
        setFamilySuccess(false); setShowFamilyModal(false);
        setUserProfile(prev => prev ? { ...prev, is_premium: true, annual_plan: true } : prev);
      }, 2000);
    } else { setFamilyCodeError("Invalid code."); setFamilyCode(""); }
  };

  useEffect(() => {
    const loadData = async () => {
      const storedComp = localStorage.getItem("unfiltr_companion");
      if (storedComp) { try { setCompanion(JSON.parse(storedComp)); } catch {} }
      try {
        const profileId = localStorage.getItem("userProfileId");
        if (!profileId) return;
        const profile = await base44.entities.UserProfile.get(profileId).catch(() => null);
        if (!profile) return;
        setUserProfile(profile);
        if (profile?.display_name === "Javier 1122") setIsAdmin(true);
        setVoiceGender(localStorage.getItem("unfiltr_voice_gender") || "female");
        setVoicePersonality(localStorage.getItem("unfiltr_voice_personality") || "cheerful");
        if (profile?.companion_id) {
          const comp = await base44.entities.Companion.get(profile.companion_id).catch(() => null);
          if (comp) { setCompanion(comp); }
        }
      } catch (e) { console.warn("Settings loadData:", e.message); }
    };
    const todayStr = new Date().toDateString();
    const streakData = JSON.parse(localStorage.getItem("unfiltr_streak") || '{"date":"","count":0}');
    setStreak(streakData.date === todayStr || streakData.date === new Date(Date.now() - 86400000).toDateString() ? streakData.count : 0);
    const created = localStorage.getItem("unfiltr_companion_created");
    if (created) setDaysSince(Math.max(1, Math.floor((Date.now() - new Date(created).getTime()) / 86400000)));
    setMoodHistory(getMoodWeek());
    loadData();
  }, []);

  const handleChangeVoiceGender = (newGender) => {
    setVoiceGender(newGender);
    localStorage.setItem("unfiltr_voice_gender", newGender);
  };

  const handleChangeVoicePersonality = (newPersonality) => {
    setVoicePersonality(newPersonality);
    localStorage.setItem("unfiltr_voice_personality", newPersonality);
  };

  const handleSignOut = () => {
    // Clear all app data then redirect to landing
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("unfiltr_") || k === "userProfileId") localStorage.removeItem(k);
    });
    navigate("/", { replace: true });
  };

  const handleChangeCompanion = async (newCompanion) => {
    if (savingCompanion || newCompanion.name === companion?.name) return;
    setSavingCompanion(true);
    if (!userProfile?.companion_id) { setSavingCompanion(false); return; }
    await base44.entities.Companion.update(userProfile?.companion_id, {
      name: newCompanion.name, avatar_id: newCompanion.id,
      avatar_gender: newCompanion.gender || "female",
      personality_preset: newCompanion.tagline || "friendly",
    });
    localStorage.setItem("unfiltr_companion", JSON.stringify({ ...newCompanion, systemPrompt: companion?.systemPrompt }));
    setCompanion(prev => ({ ...prev, name: newCompanion.name, avatar_url: newCompanion.avatar }));
    setSavingCompanion(false);
  };

  const handleChangeBackground = (bgId) => {
    if (savingBackground) return;
    const bg = BACKGROUNDS.find(b => b.id === bgId);
    if (!bg) return;
    localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
    setUserProfile(prev => ({ ...prev }));
  };

  const handlePauseAccount = async () => {
    try {
      setPausing(true);
      const profileId = localStorage.getItem("userProfileId");
      const now = new Date(); const until = new Date(now);
      if (pauseDuration === "1week")  until.setDate(until.getDate() + 7);
      if (pauseDuration === "2weeks") until.setDate(until.getDate() + 14);
      if (pauseDuration === "1month") until.setMonth(until.getMonth() + 1);
      await base44.entities.UserProfile.update(profileId, { account_paused: true, account_paused_at: now.toISOString(), account_pause_until: until.toISOString() });
      setUserProfile(prev => ({ ...prev, account_paused: true, account_pause_until: until.toISOString() }));
      setPausing(false); setPauseSuccess(true);
    } catch (e) { console.error('[handlePauseAccount]', e); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const profileId = localStorage.getItem("userProfileId");
    if (profileId) {
      await base44.entities.UserProfile.update(profileId, { account_delete_requested: true, account_delete_requested_at: new Date().toISOString() });
    }
    Object.keys(localStorage).forEach(k => { if (k.startsWith("unfiltr_") || k === "userProfileId") localStorage.removeItem(k); });
    navigate("/age-verification", { replace: true });
  };

  const isPremium = !!(userProfile?.is_premium || userProfile?.premium || localStorage.getItem("unfiltr_is_premium") === "true");
  const currentBg = (() => { try { return JSON.parse(localStorage.getItem("unfiltr_env") || "{}"); } catch { return {}; } })();

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#06020f", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12, padding: "max(12px, env(safe-area-inset-top)) 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#06020f" }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div onClick={handleFamilyTriquetraTap} style={{ cursor: "default", userSelect: "none" }}>
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
            <path d="M50 15 C30 15 15 30 15 50 C15 65 25 77 38 82 C28 72 25 58 30 45 C35 32 46 25 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
            <path d="M50 15 C54 25 65 32 70 45 C75 58 72 72 62 82 C75 77 85 65 85 50 C85 30 70 15 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
            <path d="M38 82 C42 86 46 88 50 88 C54 88 58 86 62 82 C58 78 54 76 50 76 C46 76 42 78 38 82Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
            <circle cx="50" cy="50" r="8" stroke="#a855f7" strokeWidth="2" fill="rgba(168,85,247,0.15)"/>
          </svg>
        </div>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0, flex: 1 }}>Settings</h1>
        {isPremium && <span style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>✨ Premium</span>}
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Stats bar */}
        <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.1))", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 16, padding: "14px 16px", display: "flex", gap: 0 }}>
          {[
            { label: "Day Streak", value: streak > 0 ? `${streak} 🔥` : "0", sub: "consecutive days" },
            { label: "Days Together", value: daysSince, sub: "with companion" },
            { label: "Messages", value: parseInt(localStorage.getItem("unfiltr_msg_total") || "0", 10) || userProfile?.message_count || 0, sub: "total sent" },
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 18, margin: 0 }}>{stat.value}</p>
              <p style={{ color: "white", fontWeight: 600, fontSize: 11, margin: "2px 0 0" }}>{stat.label}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, margin: "1px 0 0" }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── PROFILE drawer ── */}
        <Drawer icon={User} iconColor="#a855f7" title="Profile" defaultOpen={true}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Display Name</p>
          <DisplayNameEditor userProfile={userProfile} onSave={n => setUserProfile(prev => ({ ...prev, display_name: n }))} />
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "14px 0 4px" }}>Companion Nickname</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 8px" }}>Give your companion a name only you call them.</p>
          <CompanionNicknameField />

          {/* Mood week */}
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "16px 0 10px" }}>Mood This Week</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 10px" }}>
            {moodHistory.map((entry, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 30, height: entry.mood ? 44 : 30, borderRadius: 8, background: entry.mood ? "linear-gradient(180deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  {entry.mood ? <span style={{ fontSize: 14 }}>{entry.mood}</span> : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>+</span>}
                </div>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>{entry.day}</span>
              </div>
            ))}
          </div>
        </Drawer>

        {/* ── COMPANION & VOICE drawer ── */}
        <Drawer icon={Mic} iconColor="#db2777" title="Companion & Voice">
          {/* Companion picker */}
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Your Companion</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {COMPANIONS.map(c => {
              const isSelected = companion?.name === c.name;
              return (
                <button key={c.id} onClick={() => handleChangeCompanion(c)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ position: "relative", width: 54, height: 54, borderRadius: 14, overflow: "hidden", border: isSelected ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.08)", background: isSelected ? "#2d1a4e" : "#1a1a2e", transition: "all 0.15s", transform: isSelected ? "scale(1.06)" : "scale(1)" }}>
                    <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    {isSelected && <div style={{ position: "absolute", inset: 0, background: "rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={13} color="white" /></div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#c4b5fd" : "rgba(255,255,255,0.45)" }}>{c.name}</span>
                </button>
              );
            })}
          </div>
          {savingCompanion && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 8, textAlign: "center" }}>Saving...</p>}

          {/* Voice gender */}
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "16px 0 8px" }}>Voice</p>
          <div style={{ display: "flex", gap: 8 }}>
            {["male","female","neutral"].map(g => (
              <button key={g} onClick={() => handleChangeVoiceGender(g)} style={{ flex: 1, padding: "11px 8px", borderRadius: 12, border: voiceGender === g ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)", background: voiceGender === g ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)", color: voiceGender === g ? "white" : "rgba(255,255,255,0.45)", fontWeight: voiceGender === g ? 700 : 500, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>
                {g === "male" ? "🎤 Male" : g === "female" ? "✨ Female" : "🤖 Neutral"}
              </button>
            ))}
          </div>

          {/* Voice personality */}
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", margin: "14px 0 8px" }}>Voice Personality</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ id:"cheerful",emoji:"😊",label:"Cheerful",desc:"Bright & upbeat"},{id:"calm",emoji:"🧘",label:"Calm",desc:"Slow & soothing"},{id:"energetic",emoji:"⚡",label:"Energetic",desc:"Fast & lively"},{id:"professional",emoji:"💼",label:"Professional",desc:"Clear & steady"}].map(p => (
              <button key={p.id} onClick={() => handleChangeVoicePersonality(p.id)} style={{ padding: "11px 10px", borderRadius: 12, border: voicePersonality === p.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)", background: voicePersonality === p.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center" }}>
                <span style={{ fontSize: 18, display: "block", marginBottom: 3 }}>{p.emoji}</span>
                <span style={{ color: voicePersonality === p.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: voicePersonality === p.id ? 700 : 500, fontSize: 12, display: "block" }}>{p.label}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{p.desc}</span>
              </button>
            ))}
          </div>
        </Drawer>

        {/* ── BACKGROUND drawer ── */}
        <Drawer icon={Palette} iconColor="#f59e0b" title="Background" badge={currentBg?.label || null}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {BACKGROUNDS.map(bg => {
              const isSelected = currentBg?.id === bg.id;
              return (
                <button key={bg.id} onClick={() => handleChangeBackground(bg.id)} style={{ position: "relative", height: 90, borderRadius: 14, overflow: "hidden", border: isSelected ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.08)", background: "#1a1a2e", cursor: "pointer" }}>
                  <img src={bg.url} alt={bg.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)", pointerEvents: "none" }} />
                  <p style={{ position: "absolute", left: 0, right: 0, bottom: 7, textAlign: "center", color: "white", fontSize: 11, fontWeight: 600, margin: 0, pointerEvents: "none" }}>{bg.emoji} {bg.label}</p>
                  {isSelected && <div style={{ position: "absolute", top: 7, right: 7, width: 18, height: 18, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={11} color="#9333ea" /></div>}
                </button>
              );
            })}
          </div>
        </Drawer>

        {/* ── PREMIUM drawer ── */}
        <Drawer icon={Sparkles} iconColor="#f59e0b" title="Premium" badge={isPremium ? "Active" : "Free"}>
          {isPremium ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
              <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 17, margin: "0 0 4px" }}>You're Premium!</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Unlimited messages, all companions, voice & more.</p>
            </div>
          ) : (
            <>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 14 }}>Unlock unlimited messages, voice responses, all moods, and more.</p>
              <button onClick={() => setShowPaywall(true)} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Sparkles size={16} /> View Premium Plans
              </button>
            </>
          )}
        </Drawer>

        {/* ── SHARE drawer ── */}
        <Drawer icon={Heart} iconColor="#db2777" title="Share & Refer">
          <button onClick={() => setShowCompanionCard(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(219,39,119,0.1)", border: "1px solid rgba(219,39,119,0.2)", borderRadius: 12, cursor: "pointer", marginBottom: 10 }}>
            <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>💜 Share your companion</span>
            <ChevronRight size={16} color="rgba(219,39,119,0.6)" />
          </button>
          <ReferralSection profileId={localStorage.getItem("userProfileId")} />
        </Drawer>

        {/* ── HOW TO USE drawer ── */}
        <Drawer icon={Info} iconColor="#60a5fa" title="How to Use Unfiltr">
          <HowToGuide />
        </Drawer>

        {/* ── ACCOUNT drawer ── */}
        <Drawer icon={Shield} iconColor="#ef4444" title="Account">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Sign Out */}
            <button onClick={handleSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer" }}>
              <LogOut size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 14 }}>Sign Out</span>
            </button>

            {/* Pause */}
            <button onClick={() => setShowPauseModal(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer" }}>
              <PauseCircle size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 14 }}>{userProfile?.account_paused ? "Account Paused 💙" : "Pause My Account"}</span>
            </button>

            {/* Delete */}
            <button onClick={() => setShowDeleteConfirm(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, cursor: "pointer" }}>
              <Trash2 size={16} color="#ef4444" />
              <span style={{ color: "#ef4444", fontWeight: 600, fontSize: 14 }}>Delete My Account</span>
            </button>
          </div>
        </Drawer>

        {/* Admin shortcut */}
        {isAdmin && (
          <button onClick={() => navigate("/admin")} style={{ width: "100%", padding: "12px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 12, color: "#a855f7", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            🛡️ Admin Dashboard
          </button>
        )}

        {/* Version */}
        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          <span onClick={handleTriquetraTap} style={{ color: "rgba(255,255,255,0.12)", fontSize: 11, cursor: "default", userSelect: "none" }}>v1.2.0</span>
        </div>

      </div>

      {/* ── Paywall Modal ── */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribe={() => setUserProfile(prev => prev ? { ...prev, is_premium: true } : prev)} />

      {/* ── Family Code Modal ── */}
      <AnimatePresence>
        {showFamilyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => { if (!familySuccess) { setShowFamilyModal(false); setFamilyCode(""); setFamilyCodeError(""); } }}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1a0535", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 320 }}
            >
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                  <path d="M50 15 C30 15 15 30 15 50 C15 65 25 77 38 82 C28 72 25 58 30 45 C35 32 46 25 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
                  <path d="M50 15 C54 25 65 32 70 45 C75 58 72 72 62 82 C75 77 85 65 85 50 C85 30 70 15 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
                  <path d="M38 82 C42 86 46 88 50 88 C54 88 58 86 62 82 C58 78 54 76 50 76 C46 76 42 78 38 82Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
                  <circle cx="50" cy="50" r="8" stroke="#a855f7" strokeWidth="2" fill="rgba(168,85,247,0.15)"/>
                </svg>
              </div>
              {familySuccess ? (
                <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 20, margin: "0 0 6px" }}>Access Granted!</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>Welcome to the family 💜</p>
                </div>
              ) : (
                <>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 18, margin: "0 0 6px", textAlign: "center" }}>Family Access</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 18px", textAlign: "center" }}>Enter your access code</p>
                  <input type="password" value={familyCode} onChange={e => { setFamilyCode(e.target.value); setFamilyCodeError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleFamilyCodeSubmit()} placeholder="Enter code..." autoFocus
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", color: "white", fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
                  />
                  {familyCodeError && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 8px", textAlign: "center" }}>{familyCodeError}</p>}
                  <button onClick={handleFamilyCodeSubmit} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Unlock</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Admin Code Modal ── */}
      <AnimatePresence>
        {showCodeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => { setShowCodeModal(false); setAdminCode(""); setCodeError(""); }}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#0d0520", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 300 }}
            >
              <p style={{ color: "white", fontWeight: 700, fontSize: 17, textAlign: "center", margin: "0 0 16px" }}>🛡️ Admin Access</p>
              <input type="password" value={adminCode} onChange={e => { setAdminCode(e.target.value); setCodeError(""); }}
                onKeyDown={e => e.key === "Enter" && handleCodeSubmit()} placeholder="Admin code" autoFocus
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", color: "white", fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              />
              {codeError && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 8px", textAlign: "center" }}>{codeError}</p>}
              <button onClick={handleCodeSubmit} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Enter</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pause Modal ── */}
      <AnimatePresence>
        {showPauseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setShowPauseModal(false)}
          >
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", background: "#1a0a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", padding: "24px 24px max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
              <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 99, margin: "0 auto 20px" }} />
              {pauseSuccess ? (
                <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>💙</div>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 18, margin: "0 0 6px" }}>Account Paused</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Your companion will be waiting when you return.</p>
                </div>
              ) : (
                <>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Pause My Account</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 18 }}>Take a break — your companion will be here when you return.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {[{value:"1week",label:"1 Week"},{value:"2weeks",label:"2 Weeks"},{value:"1month",label:"1 Month"}].map(opt => (
                      <button key={opt.value} onClick={() => setPauseDuration(opt.value)}
                        style={{ padding: "13px 16px", borderRadius: 14, textAlign: "left", background: pauseDuration === opt.value ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${pauseDuration === opt.value ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`, color: pauseDuration === opt.value ? "white" : "rgba(255,255,255,0.55)", fontWeight: pauseDuration === opt.value ? 700 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {opt.label}
                        {pauseDuration === opt.value && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                  <button onClick={handlePauseAccount} disabled={pausing}
                    style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: pausing ? 0.6 : 1, marginBottom: 10 }}>
                    {pausing ? "Pausing…" : "Confirm Pause"}
                  </button>
                  <button onClick={() => setShowPauseModal(false)} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", background: "#1a0a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", padding: "24px 24px max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
              <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 99, margin: "0 auto 20px" }} />
              <h3 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: "0 0 8px" }}>Delete Account?</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 20 }}>This will permanently delete your profile, companion, and all messages. Cannot be undone.</p>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{ width: "100%", padding: "13px", background: "#dc2626", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: deleting ? 0.5 : 1, marginBottom: 10 }}>
                {deleting ? "Processing…" : "Yes, delete everything"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Companion Share Card ── */}
      <CompanionShareCard visible={showCompanionCard} onClose={() => setShowCompanionCard(false)} companionId={companion?.id} companionName={localStorage.getItem("unfiltr_companion_nickname") || companion?.name} daysTogether={daysSince} />

    </div>
  );
}
