import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, SlidersHorizontal } from "lucide-react";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const VOICE_PERSONALITIES = [
  { id: "cheerful",     emoji: "😊", label: "Cheerful",      desc: "Bright & upbeat" },
  { id: "calm",         emoji: "🧘", label: "Calm",          desc: "Slow & soothing" },
  { id: "energetic",    emoji: "⚡", label: "Energetic",     desc: "Fast & lively" },
  { id: "professional", emoji: "💼", label: "Professional",  desc: "Clear & steady" },
];

const PERSONALITY_VIBES = [
  { id: "chill",      emoji: "😎", label: "Chill" },
  { id: "supportive", emoji: "🤗", label: "Supportive" },
  { id: "playful",    emoji: "🎉", label: "Playful" },
  { id: "deep",       emoji: "🌊", label: "Deep" },
];

const PERSONALITY_STYLES = [
  { id: "casual",   emoji: "👟", label: "Casual" },
  { id: "poetic",   emoji: "🌸", label: "Poetic" },
  { id: "direct",   emoji: "🎯", label: "Direct" },
  { id: "nurturing",emoji: "🌱", label: "Nurturing" },
];

const TABS = ["Companion", "Background", "Voice", "Personality", "Mode"];

// ── Chip button ──────────────────────────────────────────────────────────────
function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 14px", borderRadius: 999,
      border: active ? "1.5px solid #a855f7" : "1.5px solid rgba(255,255,255,0.1)",
      background: active ? "rgba(168,85,247,0.22)" : "rgba(255,255,255,0.04)",
      color: active ? "#e9d5ff" : "rgba(255,255,255,0.45)",
      fontSize: 13, fontWeight: active ? 700 : 500,
      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

export default function ChatCustomizePanel({ companion, setCompanion, voiceEnabled, setVoiceEnabled, triggerMode = "icon", companionName = "Companion", relationshipMode: initRelMode = "friend", onRelationshipChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Companion");
  const [relMode, setRelMode] = useState(() => localStorage.getItem("unfiltr_relationship_mode") || initRelMode || "friend");

  // ── Companion ──
  const [savingCompanion, setSavingCompanion] = useState(false);

  // ── Background ──
  const [currentBg, setCurrentBg] = useState(() => localStorage.getItem("unfiltr_background") || "living_room");

  // ── Voice ──
  const [voiceGender, setVoiceGender]           = useState(() => localStorage.getItem("unfiltr_voice_gender") || "female");
  const [voicePersonality, setVoicePersonality] = useState(() => localStorage.getItem("unfiltr_voice_personality") || "cheerful");

  // ── Personality ──
  const [pVibe,    setPVibe]    = useState(() => localStorage.getItem("unfiltr_personality_vibe")    || "chill");
  const [pStyle,   setPStyle]   = useState(() => localStorage.getItem("unfiltr_personality_style")   || "casual");
  const [pHumor,   setPHumor]   = useState(() => localStorage.getItem("unfiltr_personality_humor")   || "subtle");
  const [pEmpathy, setPEmpathy] = useState(() => localStorage.getItem("unfiltr_personality_empathy") || "balanced");
  const [saving,   setSaving]   = useState(false);

  // Sync from localStorage on open
  useEffect(() => {
    if (open) {
      setCurrentBg(localStorage.getItem("unfiltr_background") || "living_room");
      setVoiceGender(localStorage.getItem("unfiltr_voice_gender") || "female");
      setVoicePersonality(localStorage.getItem("unfiltr_voice_personality") || "cheerful");
      setPVibe(localStorage.getItem("unfiltr_personality_vibe")    || "chill");
      setPStyle(localStorage.getItem("unfiltr_personality_style")  || "casual");
      setPHumor(localStorage.getItem("unfiltr_personality_humor")  || "subtle");
      setPEmpathy(localStorage.getItem("unfiltr_personality_empathy") || "balanced");
    }
  }, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChangeCompanion = async (c) => {
    setSavingCompanion(true);
    const companionId = localStorage.getItem("unfiltr_companion_id") || localStorage.getItem("companionId");
    try {
      if (companionId) {
        await base44.entities.Companion.update(companionId, { name: c.name, avatar_id: c.id, avatar_gender: c.gender || "female" });
      }
      localStorage.setItem("unfiltr_companion", JSON.stringify({ ...c, systemPrompt: companion?.systemPrompt }));
      setCompanion({ ...c, systemPrompt: companion?.systemPrompt });
      toast.success(`Switched to ${c.name} ✨`);
    } catch (e) {
      localStorage.setItem("unfiltr_companion", JSON.stringify({ ...c, systemPrompt: companion?.systemPrompt }));
      setCompanion({ ...c, systemPrompt: companion?.systemPrompt });
    }
    setSavingCompanion(false);
  };

  const handleChangeBg = (bgId) => {
    setCurrentBg(bgId);
    localStorage.setItem("unfiltr_background", bgId);
    window.dispatchEvent(new CustomEvent("unfiltr_background_change", { detail: bgId }));
    // Also update unfiltr_env so Settings and ChatPage stay in sync
    const bg = BACKGROUNDS.find(b => b.id === bgId);
    if (bg) {
      const envObj = { id: bg.id, label: bg.label, bg: bg.url };
      localStorage.setItem("unfiltr_env", JSON.stringify(envObj));
      window.dispatchEvent(new CustomEvent("unfiltr_env_change", { detail: envObj }));
    }
  };

  const handleSaveVoice = () => {
    localStorage.setItem("unfiltr_voice_gender", voiceGender);
    localStorage.setItem("unfiltr_voice_personality", voicePersonality);
    window.dispatchEvent(new Event("unfiltr_voice_updated"));
    toast.success("Voice updated ✨");
  };

  const handleSavePersonality = async () => {
    if (saving) return;
    setSaving(true);
    localStorage.setItem("unfiltr_personality_vibe",      pVibe);
    localStorage.setItem("unfiltr_personality_empathy",   pEmpathy);
    localStorage.setItem("unfiltr_personality_style",     pStyle);
    localStorage.setItem("unfiltr_personality_humor",     pHumor);
    const companionId = localStorage.getItem("unfiltr_companion_id") || localStorage.getItem("companionId");
    if (companionId) {
      try {
        await base44.entities.Companion.update(companionId, {
          personality_vibe: pVibe, personality_empathy: pEmpathy,
          personality_humor: pHumor, personality_style: pStyle,
        });
      } catch (e) { /* localStorage is fine */ }
    }
    setSaving(false);
    toast.success("Personality saved ✨");
  };

  // ── Tab content ───────────────────────────────────────────────────────────
  const tabContent = {
    Companion: (
      <div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Your Companion</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {COMPANIONS.map(c => {
            const sel = companion?.name === c.name;
            return (
              <button key={c.id} onClick={() => handleChangeCompanion(c)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <div style={{
                  width: 56, height: 68, borderRadius: 14, overflow: "hidden",
                  border: sel ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.08)",
                  background: sel ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                  transform: sel ? "scale(1.08)" : "scale(1)", transition: "all 0.15s",
                  display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative",
                }}>
                  <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }} />
                  {sel && <div style={{ position: "absolute", inset: 0, background: "rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={13} color="white" />
                  </div>}
                </div>
                <span style={{ fontSize: 10, color: sel ? "#c4b5fd" : "rgba(255,255,255,0.4)", fontWeight: sel ? 700 : 400 }}>{c.name}</span>
              </button>
            );
          })}
        </div>
        {savingCompanion && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", marginTop: 12 }}>Saving...</p>}
      </div>
    ),

    Background: (
      <div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Scene</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {BACKGROUNDS.map(bg => {
            const sel = currentBg === bg.id;
            return (
              <button key={bg.id} onClick={() => handleChangeBg(bg.id)}
                style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: sel ? "2.5px solid #a855f7" : "2px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "none", padding: 0, aspectRatio: "4/3" }}>
                <img src={bg.url} alt={bg.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: sel ? "rgba(168,85,247,0.3)" : "rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "6px 4px" }}>
                  <span style={{ fontSize: 16 }}>{bg.emoji}</span>
                  <span style={{ fontSize: 9, color: "white", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{bg.label}</span>
                </div>
                {sel && <div style={{ position: "absolute", top: 5, right: 5, width: 18, height: 18, borderRadius: "50%", background: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={10} color="white" />
                </div>}
              </button>
            );
          })}
        </div>
      </div>
    ),

    Voice: (
      <div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Voice Response</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "13px 16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
          <span style={{ color: "white", fontSize: 14, fontWeight: 500 }}>Voice enabled</span>
          <button onClick={() => setVoiceEnabled(v => !v)} style={{
            width: 48, height: 27, borderRadius: 999, border: "none", cursor: "pointer",
            background: voiceEnabled ? "#a855f7" : "rgba(255,255,255,0.12)", position: "relative", transition: "all 0.2s",
          }}>
            <div style={{
              position: "absolute", top: 3, left: voiceEnabled ? 24 : 3,
              width: 21, height: 21, borderRadius: "50%", background: "white", transition: "left 0.2s",
            }} />
          </button>
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Gender</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["male","female","neutral"].map(g => (
            <button key={g} onClick={() => setVoiceGender(g)} style={{
              flex: 1, padding: "11px 8px", borderRadius: 12,
              border: voiceGender === g ? "1.5px solid #a855f7" : "1.5px solid rgba(255,255,255,0.08)",
              background: voiceGender === g ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
              color: voiceGender === g ? "#e9d5ff" : "rgba(255,255,255,0.45)",
              fontSize: 13, fontWeight: voiceGender === g ? 700 : 500, cursor: "pointer", textTransform: "capitalize",
            }}>{g === "male" ? "♂ Male" : g === "female" ? "♀ Female" : "⚧ Neutral"}</button>
          ))}
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Style</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {VOICE_PERSONALITIES.map(vp => (
            <button key={vp.id} onClick={() => setVoicePersonality(vp.id)} style={{
              padding: "12px 10px", borderRadius: 12, textAlign: "left",
              border: voicePersonality === vp.id ? "1.5px solid #a855f7" : "1.5px solid rgba(255,255,255,0.08)",
              background: voicePersonality === vp.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{vp.emoji}</div>
              <div style={{ color: voicePersonality === vp.id ? "#e9d5ff" : "white", fontSize: 13, fontWeight: 700 }}>{vp.label}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{vp.desc}</div>
            </button>
          ))}
        </div>

        <button onClick={handleSaveVoice} style={{
          width: "100%", padding: "13px", borderRadius: 14, border: "none",
          background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}>Save Voice Settings</button>
      </div>
    ),

    Personality: (
      <div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Vibe</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {PERSONALITY_VIBES.map(v => (
            <Chip key={v.id} active={pVibe === v.id} onClick={() => setPVibe(v.id)}>{v.emoji} {v.label}</Chip>
          ))}
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Style</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {PERSONALITY_STYLES.map(s => (
            <Chip key={s.id} active={pStyle === s.id} onClick={() => setPStyle(s.id)}>{s.emoji} {s.label}</Chip>
          ))}
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Humor</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["none","subtle","moderate","high"].map(h => (
            <Chip key={h} active={pHumor === h} onClick={() => setPHumor(h)}>{h.charAt(0).toUpperCase()+h.slice(1)}</Chip>
          ))}
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Empathy</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          {["minimal","balanced","high"].map(e => (
            <Chip key={e} active={pEmpathy === e} onClick={() => setPEmpathy(e)}>{e.charAt(0).toUpperCase()+e.slice(1)}</Chip>
          ))}
        </div>

        <button onClick={handleSavePersonality} disabled={saving} style={{
          width: "100%", padding: "13px", borderRadius: 14, border: "none",
          background: saving ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#7c3aed,#db2777)",
          color: "white", fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
        }}>{saving ? "Saving..." : "Save Personality"}</button>
      </div>
    ),

    Mode: (
      <div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Relationship Dynamic</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 16 }}>How your companion relates to you</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "friend",   emoji: "👋", label: "Friend",  desc: "Warm, casual, real with you" },
            { id: "coach",    emoji: "🎯", label: "Coach",   desc: "Motivating, direct, goal-focused" },
            { id: "romantic", emoji: "💜", label: "Romantic", desc: "Caring, affectionate, devoted" },
          ].map(m => {
            const sel = relMode === m.id;
            return (
              <button key={m.id} onClick={() => {
                setRelMode(m.id);
                localStorage.setItem("unfiltr_relationship_mode", m.id);
                if (onRelationshipChange) onRelationshipChange(m.id);
              }} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 14, border: "none", cursor: "pointer",
                background: sel ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                outline: sel ? "1.5px solid rgba(168,85,247,0.6)" : "1px solid rgba(255,255,255,0.07)",
                textAlign: "left",
              }}>
                <span style={{ fontSize: 24 }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: sel ? "#c084fc" : "white", fontWeight: 700, fontSize: 15 }}>{m.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{m.desc}</div>
                </div>
                {sel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a855f7", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>
    ),
  };

  return (
    <>
      {/* Trigger — icon mode (default) or name mode (used in header center) */}
      {triggerMode === "name" ? (
        <button onClick={() => setOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "2px 8px" }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 15, letterSpacing: "-0.2px" }}>{companionName}</span>
          <span style={{ color: "rgba(168,85,247,0.8)", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>Tap to customize ✦</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: open ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.12)",
            border: open ? "1.5px solid rgba(168,85,247,0.6)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            transition: "all 0.2s",
          }}
          title="Customize"
        >
          <SlidersHorizontal size={15} color={open ? "#c084fc" : "white"} />
        </button>
      )}

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 90, backdropFilter: "blur(4px)" }}
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0,
              zIndex: 91, borderRadius: "24px 24px 0 0",
              background: "linear-gradient(180deg,#0e0720 0%,#06020f 100%)",
              border: "1px solid rgba(168,85,247,0.18)",
              borderBottom: "none",
              maxHeight: "82vh", display: "flex", flexDirection: "column",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.7)",
            }}
          >
            {/* Handle + header */}
            <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)", margin: "0 auto 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ color: "white", fontWeight: 800, fontSize: 18, margin: 0 }}>Customize</h2>
                <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={16} color="rgba(255,255,255,0.6)" />
                </button>
              </div>

              {/* Tab bar */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: "7px 14px", borderRadius: 999, border: "none", flexShrink: 0,
                    background: tab === t ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.06)",
                    color: tab === t ? "#c084fc" : "rgba(255,255,255,0.45)",
                    fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: "pointer",
                    borderBottom: tab === t ? "2px solid #a855f7" : "2px solid transparent",
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Tab body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px", scrollbarWidth: "none" }}>
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {tabContent[tab]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


