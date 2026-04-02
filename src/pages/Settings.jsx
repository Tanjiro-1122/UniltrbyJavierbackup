import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Sparkles, Check, Trash2, PauseCircle,
  LogOut, Bell, Shield, Info, Heart, Mic, Palette, User, BookOpen, SlidersHorizontal, Lock
} from "lucide-react";
import PaywallModal from "@/components/PaywallModal";
import ReferralSection from "@/components/ReferralSection";
import DisplayNameEditor from "@/components/settings/DisplayNameEditor";
import CompanionShareCard from "@/components/companion/CompanionShareCard";
import HowToGuide from "@/components/settings/HowToGuide";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import { getMoodWeek } from "@/components/utils/moodTracker";

// ── Sub-screen wrapper ──────────────────────────────────────────────────────
function SubScreen({ title, onBack, children }) {
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: "fixed", inset: 0, backgroundColor: "#06020f", zIndex: 20, display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(14px, env(safe-area-inset-top)) 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#06020f", flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <h2 style={{ color: "white", fontWeight: 700, fontSize: 18, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>
        {children}
      </div>
    </motion.div>
  );
}

// ── Row item ────────────────────────────────────────────────────────────────
function Row({ icon, iconBg = "#1e1040", label, value, onPress, danger = false, last = false }) {
  return (
    <button onClick={onPress} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: onPress ? "pointer" : "default", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)", textAlign: "left" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, color: danger ? "#f87171" : "white", fontWeight: 500, fontSize: 15 }}>{label}</span>
      {value && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginRight: 4 }}>{value}</span>}
      {onPress && <ChevronRight size={15} color="rgba(255,255,255,0.2)" />}
    </button>
  );
}

// ── Section card ────────────────────────────────────────────────────────────
function Section({ children }) {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ── Companion Nickname ───────────────────────────────────────────────────────
function NicknameField() {
  const [nick, setNick] = useState(localStorage.getItem("unfiltr_companion_nickname") || "");
  const [saved, setSaved] = useState(false);
  const save = () => {
    if (!nick.trim()) return;
    localStorage.setItem("unfiltr_companion_nickname", nick.trim());
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 10 }}>Give your companion a personal nickname only you call them.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" value={nick} onChange={e => setNick(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
          placeholder={`e.g. "Max", "Luna babe"`} maxLength={20}
          style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.08)", color: "white", fontSize: 14, outline: "none" }}
        />
        <button onClick={save} disabled={!nick.trim()}
          style={{ padding: "11px 18px", borderRadius: 12, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", background: saved ? "rgba(34,197,94,0.35)" : "linear-gradient(135deg,#7c3aed,#db2777)", opacity: !nick.trim() ? 0.3 : 1 }}>
          {saved ? "✓" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState(null); // null = home, or "profile"|"companion"|"background"|"share"|"howto"|"account"
  const [userProfile, setUserProfile]         = useState(null);
  const [companion, setCompanion]             = useState(() => { try { const s = localStorage.getItem("unfiltr_companion"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [showPaywall, setShowPaywall]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [showPauseModal, setShowPauseModal]   = useState(false);
  const [pauseDuration, setPauseDuration]     = useState("1week");
  const [pausing, setPausing]                 = useState(false);
  const [pauseSuccess, setPauseSuccess]       = useState(false);
  const [savingCompanion, setSavingCompanion] = useState(false);
  const [voiceGender, setVoiceGender]         = useState(localStorage.getItem("unfiltr_voice_gender") || "female");
  const [voicePersonality, setVoicePersonality] = useState(localStorage.getItem("unfiltr_voice_personality") || "cheerful");
  const [streak, setStreak]                   = useState(0);
  const [daysSince, setDaysSince]             = useState(0);
  const [moodHistory, setMoodHistory]         = useState([]);
  const [isAdmin, setIsAdmin]                 = useState(() => localStorage.getItem("unfiltr_admin_unlocked") === "true");
  const [tapCount, setTapCount]               = useState(0);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyCode, setFamilyCode]           = useState("");
  const [familyCodeError, setFamilyCodeError] = useState("");
  const [familySuccess, setFamilySuccess]     = useState(false);
  const [showCodeModal, setShowCodeModal]     = useState(false);
  const [adminCode, setAdminCode]             = useState("");
  const [codeError, setCodeError]             = useState("");
  const [showCompanionCard, setShowCompanionCard] = useState(false);
  const [personalityVibe, setPersonalityVibe]           = useState("chill");
  const [personalityEmpathy, setPersonalityEmpathy]     = useState("balanced");
  const [personalityHumor, setPersonalityHumor]         = useState("subtle");
  const [personalityCuriosity, setPersonalityCuriosity] = useState("moderate");
  const [personalityStyle, setPersonalityStyle]         = useState("casual");
  const [savingPersonality, setSavingPersonality]       = useState(false);
  const [personalitySaved, setPersonalitySaved]         = useState(false);

  // PIN state
  const [pinScreen, setPinScreen]     = useState(null); // null | "set" | "change" | "disable"
  const [pinInput, setPinInput]       = useState([]);
  const [pinConfirm, setPinConfirm]   = useState([]);
  const [pinStage, setPinStage]       = useState("create"); // "create" | "confirm" | "verify"
  const [pinError, setPinError]       = useState("");
  const [pinShake, setPinShake]       = useState(false);
  const [pinSaved, setPinSaved]       = useState(false);
  const hasPin = !!localStorage.getItem("unfiltr_pin");

  const isPremium = !!(userProfile?.is_premium || userProfile?.premium || localStorage.getItem("unfiltr_is_premium") === "true");
  const currentBg = (() => { try { return JSON.parse(localStorage.getItem("unfiltr_env") || "{}"); } catch { return {}; } })();

  useEffect(() => {
    const todayStr = new Date().toDateString();
    const sd = JSON.parse(localStorage.getItem("unfiltr_streak") || '{"date":"","count":0}');
    setStreak(sd.date === todayStr || sd.date === new Date(Date.now() - 86400000).toDateString() ? sd.count : 0);
    const created = localStorage.getItem("unfiltr_companion_created");
    if (created) setDaysSince(Math.max(1, Math.floor((Date.now() - new Date(created).getTime()) / 86400000)));
    setMoodHistory(getMoodWeek());
    if (localStorage.getItem("unfiltr_admin_unlocked") === "true") setIsAdmin(true);
    (async () => {
      try {
        const profileId = localStorage.getItem("userProfileId");
        if (!profileId) return;
        const profile = await base44.entities.UserProfile.get(profileId).catch(() => null);
        if (!profile) return;
        setUserProfile(profile);
        // Always keep display_name in localStorage as local backup
        if (profile?.display_name) {
          localStorage.setItem("unfiltr_display_name", profile.display_name);
        }
        // Ensure companion_id is always persisted
        if (profile?.companion_id && profile.companion_id !== "pending") {
          localStorage.setItem("unfiltr_companion_id", profile.companion_id);
          localStorage.setItem("companionId", profile.companion_id);
        }
        const resolvedCompanionId = profile?.companion_id || localStorage.getItem("unfiltr_companion_id") || localStorage.getItem("companionId");
        if (resolvedCompanionId && resolvedCompanionId !== "pending") {
          const comp = await base44.entities.Companion.get(resolvedCompanionId).catch(() => null);
          if (comp) {
            setCompanion(comp);
            if (comp.personality_vibe)      { setPersonalityVibe(comp.personality_vibe);      localStorage.setItem("unfiltr_personality_vibe", comp.personality_vibe); }
            if (comp.personality_empathy)   { setPersonalityEmpathy(comp.personality_empathy); localStorage.setItem("unfiltr_personality_empathy", comp.personality_empathy); }
            if (comp.personality_humor)     { setPersonalityHumor(comp.personality_humor);     localStorage.setItem("unfiltr_personality_humor", comp.personality_humor); }
            if (comp.personality_curiosity) { setPersonalityCuriosity(comp.personality_curiosity); localStorage.setItem("unfiltr_personality_curiosity", comp.personality_curiosity); }
            if (comp.personality_style)     { setPersonalityStyle(comp.personality_style);     localStorage.setItem("unfiltr_personality_style", comp.personality_style); }
          }
        }
      } catch (e) {}
    })();
  }, []);

  const handleTriquetraTap = () => {
    const next = tapCount + 1; setTapCount(next);
    if (next >= 5) { setTapCount(0); setShowCodeModal(true); }
  };
  const handleCodeSubmit = () => {
    if (adminCode.trim().toLowerCase() === "huertasfam") {
      // Persist admin unlock permanently in localStorage
      localStorage.setItem("unfiltr_admin_unlocked", "true");
      sessionStorage.setItem("unfiltr_admin_session", "true");
      setIsAdmin(true);
      setShowCodeModal(false);
      setAdminCode("");
      setCodeError("");
      // Navigate directly to the standalone admin page
      navigate("/AdminDashboard");
    } else {
      setCodeError("Invalid code.");
      setAdminCode("");
    }
  };
  const handleFamilyCodeSubmit = async () => {
    if (familyCode.trim().toLowerCase() === "huertasfam") {
      localStorage.setItem("unfiltr_is_premium", "true");
      localStorage.setItem("unfiltr_family_unlock", "true");
      try {
        const profileId = localStorage.getItem("userProfileId");
        if (profileId) await base44.entities.UserProfile.update(profileId, { is_premium: true, annual_plan: true, bonus_messages: 99999 });
      } catch {}
      setFamilySuccess(true); setFamilyCode(""); setFamilyCodeError("");
      setTimeout(() => { setFamilySuccess(false); setShowFamilyModal(false); setUserProfile(p => p ? { ...p, is_premium: true } : p); }, 2000);
    } else { setFamilyCodeError("Invalid code."); setFamilyCode(""); }
  };
  const handleSignOut = () => {
    Object.keys(localStorage).forEach(k => { if (k.startsWith("unfiltr_") || k === "userProfileId") localStorage.removeItem(k); });
    navigate("/", { replace: true });
  };
  const handleChangeCompanion = async (c) => {
    if (savingCompanion) return;
    setSavingCompanion(true);
    const companionId = userProfile?.companion_id || localStorage.getItem("unfiltr_companion_id");
    if (!companionId) {
      // Save to localStorage only if no DB record
      localStorage.setItem("unfiltr_companion", JSON.stringify({ ...c }));
      setCompanion(c);
      setSavingCompanion(false);
      return;
    }
    try {
      await base44.entities.Companion.update(companionId, { name: c.name, avatar_id: c.id, avatar_gender: c.gender || "female", personality_preset: c.tagline || "friendly" });
      localStorage.setItem("unfiltr_companion", JSON.stringify({ ...c, systemPrompt: companion?.systemPrompt }));
      setCompanion(p => ({ ...p, ...c, name: c.name, avatar_url: c.avatar }));
    } catch(e) { console.error('companion update failed', e); }
    setSavingCompanion(false);
  };
  const handleChangeBackground = (bg) => {
    localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
    setUserProfile(p => ({ ...p }));
  };
  const handlePauseAccount = async () => {
    try {
      setPausing(true);
      const profileId = localStorage.getItem("userProfileId");
      const now = new Date(); const until = new Date(now);
      if (pauseDuration === "1week") until.setDate(until.getDate() + 7);
      if (pauseDuration === "2weeks") until.setDate(until.getDate() + 14);
      if (pauseDuration === "1month") until.setMonth(until.getMonth() + 1);
      await base44.entities.UserProfile.update(profileId, { account_paused: true, account_paused_at: now.toISOString(), account_pause_until: until.toISOString() });
      setUserProfile(p => ({ ...p, account_paused: true }));
      setPausing(false); setPauseSuccess(true);
    } catch (e) { console.error(e); }
  };
  const handleDeleteAccount = async () => {
    setDeleting(true);
    const profileId = localStorage.getItem("userProfileId");
    if (profileId) await base44.entities.UserProfile.update(profileId, { account_delete_requested: true, account_delete_requested_at: new Date().toISOString() });
    Object.keys(localStorage).forEach(k => { if (k.startsWith("unfiltr_") || k === "userProfileId") localStorage.removeItem(k); });
    navigate("/age-verification", { replace: true });
  };

  const VOICE_PERSONALITIES = [
    { id: "cheerful", emoji: "😊", label: "Cheerful", desc: "Bright & upbeat" },
    { id: "calm", emoji: "🧘", label: "Calm", desc: "Slow & soothing" },
    { id: "energetic", emoji: "⚡", label: "Energetic", desc: "Fast & lively" },
    { id: "professional", emoji: "💼", label: "Professional", desc: "Clear & steady" },
  ];

  // ── Save personality to DB ────────────────────────────────────────────────
  const handleSavePersonality = async () => {
    if (savingPersonality) return;
    setSavingPersonality(true);

    // Always save to localStorage immediately — this is what chat reads
    localStorage.setItem("unfiltr_personality_vibe",      personalityVibe);
    localStorage.setItem("unfiltr_personality_empathy",   personalityEmpathy);
    localStorage.setItem("unfiltr_personality_style",     personalityStyle);
    localStorage.setItem("unfiltr_personality_humor",     personalityHumor);
    localStorage.setItem("unfiltr_personality_curiosity", personalityCuriosity);

    // Also persist to DB if we have a companion record
    const companionId = userProfile?.companion_id || localStorage.getItem("unfiltr_companion_id");
    if (companionId) {
      try {
        await base44.entities.Companion.update(companionId, {
          personality_vibe:      personalityVibe,
          personality_empathy:   personalityEmpathy,
          personality_humor:     personalityHumor,
          personality_curiosity: personalityCuriosity,
          personality_style:     personalityStyle,
        });
      } catch (e) {
        console.warn("Personality DB save failed (localStorage is fine):", e);
      }
    }

    setSavingPersonality(false);
    setPersonalitySaved(true);
    setTimeout(() => { setPersonalitySaved(false); navigate("/chat"); }, 1200);
  };

  // ── PIN helpers ───────────────────────────────────────────────────────────
  const openPinScreen = (mode) => {
    setPinScreen(mode);
    setPinInput([]); setPinConfirm([]);
    setPinStage(mode === "change" || mode === "disable" ? "verify" : "create");
    setPinError(""); setPinSaved(false);
  };
  const closePinScreen = () => { setPinScreen(null); setPinInput([]); setPinConfirm([]); setPinError(""); };
  const triggerPinShake = () => { setPinShake(true); setTimeout(() => setPinShake(false), 500); };
  const handlePinDigit = (d) => {
    const cur = pinStage === "confirm" ? pinConfirm : pinInput;
    const set = pinStage === "confirm" ? setPinConfirm : setPinInput;
    if (cur.length >= 4) return;
    const next = [...cur, d];
    set(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (pinStage === "verify") {
          // verifying existing PIN before change/disable
          if (next.join("") === localStorage.getItem("unfiltr_pin")) {
            if (pinScreen === "disable") {
              localStorage.removeItem("unfiltr_pin");
              setPinSaved(true);
              setTimeout(() => closePinScreen(), 1200);
            } else {
              // change — move to create new
              setPinStage("create"); setPinInput([]); setPinError("");
            }
          } else { triggerPinShake(); setPinError("Wrong PIN"); setPinInput([]); }
        } else if (pinStage === "create") {
          setPinStage("confirm"); setPinConfirm([]); setPinError("");
        } else {
          // confirm stage
          if (next.join("") === pinInput.join("")) {
            localStorage.setItem("unfiltr_pin", pinInput.join(""));
            setPinSaved(true);
            setTimeout(() => closePinScreen(), 1200);
          } else { triggerPinShake(); setPinError("PINs don't match — try again"); setPinConfirm([]); }
        }
      }, 60);
    }
  };
  const handlePinDelete = () => {
    if (pinStage === "confirm") setPinConfirm(p => p.slice(0, -1));
    else setPinInput(p => p.slice(0, -1));
  };

  // ── Sub-screens ────────────────────────────────────────────────────────────
  const screens = {
    profile: (
      <SubScreen title="Profile" onBack={() => setScreen(null)}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Display Name</p>
          <DisplayNameEditor userProfile={userProfile} onSave={n => setUserProfile(p => ({ ...p, display_name: n }))} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Companion Nickname</p>
          <NicknameField />
        </div>
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Mood This Week</p>
          <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
            {moodHistory.map((entry, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: 32, height: entry.mood ? 46 : 32, borderRadius: 9, background: entry.mood ? "linear-gradient(180deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  {entry.mood ? <span style={{ fontSize: 15 }}>{entry.mood}</span> : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>+</span>}
                </div>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>{entry.day}</span>
              </div>
            ))}
          </div>
        </div>
      </SubScreen>
    ),

    companion: (
      <SubScreen title="Companion & Voice" onBack={() => setScreen(null)}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Your Companion</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
          {COMPANIONS.map(c => {
            const sel = companion?.name === c.name;
            return (
              <button key={c.id} onClick={() => handleChangeCompanion(c)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{ position: "relative", width: 58, height: 70, borderRadius: 15, overflow: "hidden", border: sel ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.07)", background: sel ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", transform: sel ? "scale(1.07)" : "scale(1)", transition: "all 0.15s", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }} />
                  {sel && <div style={{ position: "absolute", inset: 0, background: "rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={14} color="white" /></div>}
                </div>
                <span style={{ fontSize: 10, color: sel ? "#c4b5fd" : "rgba(255,255,255,0.4)", fontWeight: sel ? 700 : 400 }}>{c.name}</span>
              </button>
            );
          })}
        </div>
        {savingCompanion && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", marginBottom: 16 }}>Saving...</p>}

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Voice</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["male","female","neutral"].map(g => (
            <button key={g} onClick={() => { setVoiceGender(g); localStorage.setItem("unfiltr_voice_gender", g); }}
              style={{ flex: 1, padding: "11px 8px", borderRadius: 12, border: voiceGender === g ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)", background: voiceGender === g ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)", color: voiceGender === g ? "white" : "rgba(255,255,255,0.45)", fontWeight: voiceGender === g ? 700 : 500, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>
              {g === "male" ? "🎤 Male" : g === "female" ? "✨ Female" : "🤖 Neutral"}
            </button>
          ))}
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Voice Personality</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {VOICE_PERSONALITIES.map(p => (
            <button key={p.id} onClick={() => { setVoicePersonality(p.id); localStorage.setItem("unfiltr_voice_personality", p.id); }}
              style={{ padding: "12px 10px", borderRadius: 13, border: voicePersonality === p.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)", background: voicePersonality === p.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 20, display: "block", marginBottom: 3 }}>{p.emoji}</span>
              <span style={{ color: voicePersonality === p.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: voicePersonality === p.id ? 700 : 500, fontSize: 12, display: "block" }}>{p.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{p.desc}</span>
            </button>
          ))}
        </div>
      </SubScreen>
    ),

    background: (
      <SubScreen title="Background" onBack={() => setScreen(null)}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {BACKGROUNDS.map(bg => {
            const sel = currentBg?.id === bg.id;
            return (
              <button key={bg.id} onClick={() => handleChangeBackground(bg)} style={{ position: "relative", height: 95, borderRadius: 15, overflow: "hidden", border: sel ? "2px solid #a855f7" : "2px solid transparent", cursor: "pointer", background: "#111" }}>
                <img src={bg.url} alt={bg.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
                <p style={{ position: "absolute", left: 0, right: 0, bottom: 7, textAlign: "center", color: "white", fontSize: 11, fontWeight: 600, margin: 0 }}>{bg.emoji} {bg.label}</p>
                {sel && <div style={{ position: "absolute", top: 7, right: 7, width: 20, height: 20, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={12} color="#9333ea" /></div>}
              </button>
            );
          })}
        </div>
      </SubScreen>
    ),

    share: (
      <SubScreen title="Share & Refer" onBack={() => setScreen(null)}>
        <button onClick={() => setShowCompanionCard(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "rgba(219,39,119,0.1)", border: "1px solid rgba(219,39,119,0.2)", borderRadius: 14, cursor: "pointer", marginBottom: 16 }}>
          <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>💜 Share your companion</span>
          <ChevronRight size={16} color="rgba(219,39,119,0.6)" />
        </button>
        <ReferralSection profileId={localStorage.getItem("userProfileId")} />
      </SubScreen>
    ),

    howto: (
      <SubScreen title="How to Use Unfiltr" onBack={() => setScreen(null)}>
        <HowToGuide />
      </SubScreen>
    ),


    personality: (
      <SubScreen title="Personality" onBack={() => setScreen(null)}>
        {/* Vibe */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Overall Vibe</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
          {[
            { id: "chill",      emoji: "😌", label: "Chill",      desc: "Low-key, easy" },
            { id: "playful",    emoji: "😄", label: "Playful",    desc: "Light & fun" },
            { id: "deep",       emoji: "🌌", label: "Deep",       desc: "Thoughtful" },
            { id: "motivating", emoji: "🔥", label: "Motivating", desc: "Hype you up" },
            { id: "sarcastic",  emoji: "😏", label: "Sarcastic",  desc: "Witty edge" },
          ].map(o => (
            <button key={o.id} onClick={() => setPersonalityVibe(o.id)}
              style={{ padding: "12px 8px", borderRadius: 13, border: personalityVibe === o.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)", background: personalityVibe === o.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 3 }}>{o.emoji}</span>
              <span style={{ color: personalityVibe === o.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: personalityVibe === o.id ? 700 : 500, fontSize: 12, display: "block" }}>{o.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{o.desc}</span>
            </button>
          ))}
        </div>

        {/* Empathy */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Empathy Level</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "listener", emoji: "👂", label: "Listener",  desc: "Just vibes" },
            { id: "balanced", emoji: "⚖️",  label: "Balanced",  desc: "Both worlds" },
            { id: "advisor",  emoji: "💡", label: "Advisor",   desc: "Real input" },
          ].map(o => (
            <button key={o.id} onClick={() => setPersonalityEmpathy(o.id)}
              style={{ flex: 1, padding: "13px 8px", borderRadius: 13, border: personalityEmpathy === o.id ? "2px solid #db2777" : "1px solid rgba(255,255,255,0.08)", background: personalityEmpathy === o.id ? "rgba(219,39,119,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 3 }}>{o.emoji}</span>
              <span style={{ color: personalityEmpathy === o.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: personalityEmpathy === o.id ? 700 : 500, fontSize: 12, display: "block" }}>{o.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{o.desc}</span>
            </button>
          ))}
        </div>

        {/* Humor */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Humor</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "none",     emoji: "🧊", label: "None",      desc: "Straight up" },
            { id: "subtle",   emoji: "😏", label: "Subtle",    desc: "Dry wit" },
            { id: "fullsend", emoji: "😂", label: "Full Send", desc: "All in" },
          ].map(o => (
            <button key={o.id} onClick={() => setPersonalityHumor(o.id)}
              style={{ flex: 1, padding: "13px 8px", borderRadius: 13, border: personalityHumor === o.id ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.08)", background: personalityHumor === o.id ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 3 }}>{o.emoji}</span>
              <span style={{ color: personalityHumor === o.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: personalityHumor === o.id ? 700 : 500, fontSize: 12, display: "block" }}>{o.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{o.desc}</span>
            </button>
          ))}
        </div>

        {/* Curiosity */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Curiosity</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "quiet",    emoji: "🤫", label: "Quiet",    desc: "Let you talk" },
            { id: "moderate", emoji: "🙂", label: "Moderate", desc: "Some questions" },
            { id: "curious",  emoji: "🔍", label: "Curious",  desc: "Digs deeper" },
          ].map(o => (
            <button key={o.id} onClick={() => setPersonalityCuriosity(o.id)}
              style={{ flex: 1, padding: "13px 8px", borderRadius: 13, border: personalityCuriosity === o.id ? "2px solid #06b6d4" : "1px solid rgba(255,255,255,0.08)", background: personalityCuriosity === o.id ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 3 }}>{o.emoji}</span>
              <span style={{ color: personalityCuriosity === o.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: personalityCuriosity === o.id ? 700 : 500, fontSize: 12, display: "block" }}>{o.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{o.desc}</span>
            </button>
          ))}
        </div>

        {/* Style */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Conversational Style</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
          {[
            { id: "casual",        emoji: "👟", label: "Casual",        desc: "Everyday chat" },
            { id: "thoughtful",    emoji: "💭", label: "Thoughtful",    desc: "Reflective" },
            { id: "philosophical", emoji: "🦉", label: "Philosophical", desc: "Big picture" },
            { id: "hype",          emoji: "🚀", label: "Hype",          desc: "Energy boost" },
          ].map(o => (
            <button key={o.id} onClick={() => setPersonalityStyle(o.id)}
              style={{ padding: "13px 10px", borderRadius: 13, border: personalityStyle === o.id ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.08)", background: personalityStyle === o.id ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 3 }}>{o.emoji}</span>
              <span style={{ color: personalityStyle === o.id ? "white" : "rgba(255,255,255,0.55)", fontWeight: personalityStyle === o.id ? 700 : 500, fontSize: 12, display: "block" }}>{o.label}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{o.desc}</span>
            </button>
          ))}
        </div>

        {/* Save Button */}
        <button onClick={handleSavePersonality} disabled={savingPersonality}
          style={{ width: "100%", padding: "15px", background: personalitySaved ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg,#7c3aed,#db2777)", border: personalitySaved ? "1px solid rgba(34,197,94,0.5)" : "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: savingPersonality ? "default" : "pointer", opacity: savingPersonality ? 0.6 : 1, transition: "all 0.3s" }}>
          {personalitySaved ? "✓ Saved — takes effect next chat" : savingPersonality ? "Saving..." : "Save Personality"}
        </button>
      </SubScreen>
    ),
    pin: (
      <SubScreen title="App Lock / PIN" onBack={() => setScreen(null)}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Set a 4-digit PIN to lock the app. Every time you open Unfiltr, you'll need to enter it first.
          </p>
          {!hasPin ? (
            <button onClick={() => openPinScreen("set")} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              🔒 Set a PIN
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => openPinScreen("change")} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                🔄 Change PIN
              </button>
              <button onClick={() => openPinScreen("disable")} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                🔓 Remove PIN
              </button>
            </div>
          )}
        </div>
      </SubScreen>
    ),
    account: (
      <SubScreen title="Account" onBack={() => setScreen(null)}>
        <Section>
          <Row icon={<LogOut size={15} color="rgba(255,255,255,0.7)" />} iconBg="rgba(255,255,255,0.08)" label="Sign Out" onPress={handleSignOut} />
          <Row icon={<PauseCircle size={15} color="rgba(255,255,255,0.7)" />} iconBg="rgba(255,255,255,0.08)"
            label={userProfile?.account_paused ? "Account Paused 💙" : "Pause My Account"}
            onPress={() => setShowPauseModal(true)} last />
        </Section>
        <Section>
          <Row icon={<Trash2 size={15} color="#f87171" />} iconBg="rgba(239,68,68,0.12)" label="Delete My Account" onPress={() => setShowDeleteConfirm(true)} danger last />
        </Section>
      </SubScreen>
    ),
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, backgroundColor: "#06020f", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(14px, env(safe-area-inset-top)) 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#06020f", flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div onClick={handleTriquetraTap} style={{ cursor: "default", userSelect: "none" }}>
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.5 }}>
            <path d="M50 15 C30 15 15 30 15 50 C15 65 25 77 38 82 C28 72 25 58 30 45 C35 32 46 25 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
            <path d="M50 15 C54 25 65 32 70 45 C75 58 72 72 62 82 C75 77 85 65 85 50 C85 30 70 15 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
            <path d="M38 82 C42 86 46 88 50 88 C54 88 58 86 62 82 C58 78 54 76 50 76 C46 76 42 78 38 82Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
            <circle cx="50" cy="50" r="8" stroke="#a855f7" strokeWidth="2" fill="rgba(168,85,247,0.15)"/>
          </svg>
        </div>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0, flex: 1 }}>Settings</h1>
        {isPremium && <span style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>✨ Premium</span>}
      </div>

      {/* ── Main scroll ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>

        {/* Stats */}
        <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(219,39,119,0.1))", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 16, padding: "14px 16px", display: "flex", marginBottom: 20 }}>
          {[
            { label: "Day Streak", value: streak > 0 ? `${streak} 🔥` : "0", sub: "consecutive days" },
            { label: "Days Together", value: daysSince, sub: "with companion" },
            { label: "Messages", value: userProfile?.message_count || 0, sub: "total sent" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 18, margin: 0 }}>{s.value}</p>
              <p style={{ color: "white", fontWeight: 600, fontSize: 11, margin: "2px 0 0" }}>{s.label}</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "1px 0 0" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Premium banner (if not premium) */}
        {!isPremium && (
          <button onClick={() => setShowPaywall(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(219,39,119,0.15))", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 16, cursor: "pointer", marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>Upgrade to Premium</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>Unlimited messages · Voice · All companions</p>
            </div>
            <ChevronRight size={16} color="rgba(168,85,247,0.7)" />
          </button>
        )}

        {/* Main menu */}
        <Section>
          <Row icon={<User size={15} color="white" />} iconBg="#3b1a6e" label="Profile" value={userProfile?.display_name || localStorage.getItem("unfiltr_display_name") || ""} onPress={() => setScreen("profile")} />
          <Row icon={<Mic size={15} color="white" />} iconBg="#6d1a40" label="Companion & Voice" value={companion?.name || ""} onPress={() => setScreen("companion")} />
          <Row icon={<Palette size={15} color="white" />} iconBg="#4a3200" label="Background" value={currentBg?.label || ""} onPress={() => setScreen("background")} />
          <Row icon={<Heart size={15} color="white" />} iconBg="#6d1a40" label="Share & Refer" onPress={() => setScreen("share")} />
          <Row icon={<SlidersHorizontal size={15} color="white" />} iconBg="#1a3a6d" label="Personality" onPress={() => setScreen("personality")} />
          <Row icon={<Lock size={15} color="white" />} iconBg="#1a2a6d" label="App Lock / PIN" value={hasPin ? "On 🔒" : "Off"} onPress={() => setScreen("pin")} />
          <Row icon={<Info size={15} color="white" />} iconBg="#1a2a6d" label="How to Use Unfiltr" onPress={() => setScreen("howto")} last />
        </Section>

        <Section>
          <Row icon={<Shield size={15} color="white" />} iconBg="#4a0a0a" label="Account" onPress={() => setScreen("account")} last />
        </Section>

        {isAdmin && (
          <Section>
            <Row icon={<span style={{ fontSize: 14 }}>🛡️</span>} iconBg="#1a0a3d" label="Admin Dashboard" onPress={() => navigate("/AdminDashboard")} last />
          </Section>
        )}

        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 11, userSelect: "none" }}>v1.2.0</span>
        </div>
      </div>

      {/* ── Sub-screens (slide in) ── */}
      <AnimatePresence>
        {screen && screens[screen]}
      </AnimatePresence>

      {/* ── Paywall ── */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribe={() => setUserProfile(p => p ? { ...p, is_premium: true } : p)} />

      {/* ── PIN Keypad Modal ── */}
      {pinScreen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,2,15,0.97)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display',system-ui,sans-serif" }}>
          <button onClick={closePinScreen} style={{ position: "absolute", top: "max(20px,env(safe-area-inset-top))", left: 20, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={20} color="white" />
          </button>
          <div style={{ marginBottom: 8, fontSize: 40 }}>🔒</div>
          <h2 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 6px", textAlign: "center" }}>
            {pinSaved ? (pinScreen === "disable" ? "PIN Removed ✓" : "PIN Saved ✓") :
             pinStage === "verify" ? "Enter Current PIN" :
             pinStage === "confirm" ? "Confirm Your PIN" : "Set Your PIN"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 32px", textAlign: "center" }}>
            {pinSaved ? "All set!" :
             pinStage === "verify" ? "Enter your existing PIN first" :
             pinStage === "confirm" ? "Re-enter to confirm" : "Choose a 4-digit code"}
          </p>
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            {[0,1,2,3].map(i => {
              const cur = pinStage === "confirm" ? pinConfirm : pinInput;
              return (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: i < cur.length ? "#a855f7" : "rgba(255,255,255,0.15)",
                  border: "2px solid " + (i < cur.length ? "#a855f7" : "rgba(255,255,255,0.2)"),
                  transition: "all 0.15s",
                  transform: pinShake ? ["translateX(-6px)","translateX(6px)","translateX(-4px)","translateX(4px)"][i] : "none",
                }} />
              );
            })}
          </div>
          {pinError && <p style={{ color: "#f87171", fontSize: 13, margin: "6px 0 10px", textAlign: "center" }}>{pinError}</p>}
          {!pinSaved && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)", gap: 12, marginTop: 16 }}>
              {[1,2,3,4,5,6,7,8,9].map(d => (
                <button key={d} onClick={() => handlePinDigit(String(d))} style={{ height: 72, borderRadius: 18, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 26, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>{d}</button>
              ))}
              <div />
              <button onClick={() => handlePinDigit("0")} style={{ height: 72, borderRadius: 18, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 26, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>0</button>
              <button onClick={handlePinDelete} style={{ height: 72, borderRadius: 18, border: "none", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", WebkitTapHighlightColor: "transparent" }}>⌫</button>
            </div>
          )}
        </div>
      )}

      {/* ── Companion Share Card ── */}
      <CompanionShareCard visible={showCompanionCard} onClose={() => setShowCompanionCard(false)} companionId={companion?.id} companionName={localStorage.getItem("unfiltr_companion_nickname") || companion?.name} daysTogether={daysSince} />

      {/* ── Family Code Modal ── */}
      <AnimatePresence>
        {showFamilyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => { if (!familySuccess) { setShowFamilyModal(false); setFamilyCode(""); setFamilyCodeError(""); } }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1a0535", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 320 }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <svg width="38" height="38" viewBox="0 0 100 100" fill="none">
                  <path d="M50 15 C30 15 15 30 15 50 C15 65 25 77 38 82 C28 72 25 58 30 45 C35 32 46 25 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
                  <path d="M50 15 C54 25 65 32 70 45 C75 58 72 72 62 82 C75 77 85 65 85 50 C85 30 70 15 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
                  <path d="M38 82 C42 86 46 88 50 88 C54 88 58 86 62 82 C58 78 54 76 50 76 C46 76 42 78 38 82Z" stroke="#a855f7" strokeWidth="3" fill="none"/>
                  <circle cx="50" cy="50" r="8" stroke="#a855f7" strokeWidth="2" fill="rgba(168,85,247,0.15)"/>
                </svg>
              </div>
              {familySuccess ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 46, marginBottom: 10 }}>🎉</div>
                  <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 20, margin: "0 0 6px" }}>Access Granted!</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Welcome to the family 💜</p>
                </div>
              ) : (
                <>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 17, margin: "0 0 6px", textAlign: "center" }}>Family Access</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 16px", textAlign: "center" }}>Enter your access code</p>
                  <input type="password" value={familyCode} onChange={e => { setFamilyCode(e.target.value); setFamilyCodeError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleFamilyCodeSubmit()} placeholder="Enter code..." autoFocus
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", color: "white", fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
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
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => { setShowCodeModal(false); setAdminCode(""); setCodeError(""); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#0d0520", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 300 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 17, textAlign: "center", margin: "0 0 6px" }}>🛡️ Admin Access</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center", margin: "0 0 18px" }}>Enter the admin code to unlock.</p>
              <input type="password" value={adminCode} onChange={e => { setAdminCode(e.target.value); setCodeError(""); }}
                onKeyDown={e => e.key === "Enter" && handleCodeSubmit()} placeholder="Admin code" autoFocus
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", color: "white", fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              {codeError && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 8px", textAlign: "center" }}>{codeError}</p>}
              <button onClick={handleCodeSubmit} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Unlock & Open Admin</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pause Modal ── */}
      <AnimatePresence>
        {showPauseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setShowPauseModal(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", background: "#1a0a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", padding: "24px 24px max(2rem,env(safe-area-inset-bottom,2rem))" }}>
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
                    {[{v:"1week",l:"1 Week"},{v:"2weeks",l:"2 Weeks"},{v:"1month",l:"1 Month"}].map(o => (
                      <button key={o.v} onClick={() => setPauseDuration(o.v)}
                        style={{ padding: "13px 16px", borderRadius: 14, textAlign: "left", background: pauseDuration === o.v ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${pauseDuration === o.v ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`, color: pauseDuration === o.v ? "white" : "rgba(255,255,255,0.55)", fontWeight: pauseDuration === o.v ? 700 : 500, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {o.l}{pauseDuration === o.v && <span>✓</span>}
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
            onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", background: "#1a0a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", padding: "24px 24px max(2rem,env(safe-area-inset-bottom,2rem))" }}>
              <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 99, margin: "0 auto 20px" }} />
              <h3 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: "0 0 8px" }}>Delete Account?</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 20 }}>This permanently deletes your profile, companion, and all messages. Cannot be undone.</p>
              <button onClick={handleDeleteAccount} disabled={deleting}
                style={{ width: "100%", padding: "13px", background: "#dc2626", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: deleting ? 0.5 : 1, marginBottom: 10 }}>
                {deleting ? "Processing…" : "Yes, delete everything"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}




