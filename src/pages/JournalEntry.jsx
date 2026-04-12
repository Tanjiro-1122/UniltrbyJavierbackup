import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, CheckCircle, Image, Smile, X, Mic, MicOff, Settings } from "lucide-react";
import { COMPANIONS } from "@/components/companionData";
import SaveProgressModal, { getSavePreference, setSavePreference } from "@/components/chat/SaveProgressModal";
import { getTier as getEntitlementTier, JOURNAL_MONTHLY_LIMITS } from "@/lib/entitlements";

// ── Tier helpers ─────────────────────────────────────────────────────────────
async function saveJournalEntryToDB(entry) {
  try {
    const appleUserId = localStorage.getItem("unfiltr_apple_user_id");
    if (!appleUserId) return;
    const tier = getEntitlementTier();
    await fetch("/api/utils", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveJournalEntry", appleUserId, entry, tier }),
    });
  } catch {}
}

// Use the central JOURNAL_MONTHLY_LIMITS from entitlements as source of truth
const JOURNAL_LIMITS = JOURNAL_MONTHLY_LIMITS;
const JOURNAL_KEY = "unfiltr_journal_monthly";

function getMonthKey() { return new Date().toISOString().slice(0, 7); }

function getJournalUsage() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return 0;
    const { month, count } = JSON.parse(raw);
    return month === getMonthKey() ? count : 0;
  } catch { return 0; }
}

function incrementJournalUsage() {
  const count = getJournalUsage() + 1;
  localStorage.setItem(JOURNAL_KEY, JSON.stringify({ month: getMonthKey(), count }));
}

function getJournalLimit() {
  const tier = getEntitlementTier();
  return JOURNAL_LIMITS[tier] ?? JOURNAL_LIMITS.free;
}

const STICKER_DEFS = [
  {
    id: "butterfly", emoji: "🦋", label: "Butterfly",
    keyframes: `@keyframes butterflyFlap { 0%,100%{transform:scaleX(1) rotate(-3deg)} 25%{transform:scaleX(0.4) rotate(0deg)} 50%{transform:scaleX(1) rotate(3deg)} 75%{transform:scaleX(0.4) rotate(0deg)} }`,
    style: { animation: "butterflyFlap 1.8s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "heart", emoji: "💜", label: "Heart",
    keyframes: `@keyframes heartBeat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.25)} 30%{transform:scale(1)} 45%{transform:scale(1.15)} 60%{transform:scale(1)} }`,
    style: { animation: "heartBeat 2s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "star", emoji: "⭐", label: "Star",
    keyframes: `@keyframes starSpin { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.2)} 100%{transform:rotate(360deg) scale(1)} }`,
    style: { animation: "starSpin 3s linear infinite", display: "inline-block" },
  },
  {
    id: "sparkle", emoji: "✨", label: "Sparkle",
    keyframes: `@keyframes sparklePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7) rotate(20deg)} }`,
    style: { animation: "sparklePulse 1.5s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "flower", emoji: "🌸", label: "Flower",
    keyframes: `@keyframes flowerSway { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }`,
    style: { animation: "flowerSway 2.5s ease-in-out infinite", display: "inline-block", transformOrigin: "bottom center" },
  },
  {
    id: "moon", emoji: "🌙", label: "Moon",
    keyframes: `@keyframes moonFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }`,
    style: { animation: "moonFloat 3s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "dove", emoji: "🕊️", label: "Dove",
    keyframes: `@keyframes doveFloat { 0%,100%{transform:translateY(0px) rotate(-5deg)} 50%{transform:translateY(-8px) rotate(5deg)} }`,
    style: { animation: "doveFloat 2.2s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "rainbow", emoji: "🌈", label: "Rainbow",
    keyframes: `@keyframes rainbowPop { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.15);filter:brightness(1.3)} }`,
    style: { animation: "rainbowPop 2s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "leaf", emoji: "🍃", label: "Leaf",
    keyframes: `@keyframes leafDrift { 0%,100%{transform:rotate(-10deg) translateX(0px)} 50%{transform:rotate(10deg) translateX(4px)} }`,
    style: { animation: "leafDrift 2.8s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "candle", emoji: "🕯️", label: "Candle",
    keyframes: `@keyframes candleFlicker { 0%,100%{transform:scaleY(1) rotate(0deg);opacity:1} 25%{transform:scaleY(1.08) rotate(-2deg);opacity:0.85} 50%{transform:scaleY(0.95) rotate(1deg);opacity:1} 75%{transform:scaleY(1.05) rotate(-1deg);opacity:0.9} }`,
    style: { animation: "candleFlicker 1.2s ease-in-out infinite", display: "inline-block", transformOrigin: "bottom center" },
  },
  {
    id: "music", emoji: "🎵", label: "Music",
    keyframes: `@keyframes musicBounce { 0%,100%{transform:translateY(0px) rotate(-5deg)} 50%{transform:translateY(-5px) rotate(5deg)} }`,
    style: { animation: "musicBounce 1.6s ease-in-out infinite", display: "inline-block" },
  },
  {
    id: "gem", emoji: "💎", label: "Gem",
    keyframes: `@keyframes gemShine { 0%,100%{filter:brightness(1) drop-shadow(0 0 0px #a855f7)} 50%{filter:brightness(1.4) drop-shadow(0 0 8px #a855f7)} }`,
    style: { animation: "gemShine 2s ease-in-out infinite", display: "inline-block" },
  },
];

const AI_SUGGESTIONS = [
  { at: 20,  key: "20",  msg: "You're off to a great start. What feeling is strongest right now?" },
  { at: 50,  key: "50",  msg: "Keep going — what do you wish someone understood about this?" },
  { at: 100, key: "100", msg: "You're really opening up 💜. What would feel like relief right now?" },
  { at: 150, key: "150", msg: "What do you want to remember about today, a year from now?" },
  { at: 200, key: "200", msg: "Amazing depth. Is there anything you haven't written yet that still needs to come out?" },
];

function PlacedSticker({ sticker, onRemove, constraintsRef }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const tapRef = useRef(0);
  const def = STICKER_DEFS.find((d) => d.id === sticker.type);
  if (!def) return null;

  const handleTap = () => {
    if (showConfirm) return;
    const now = Date.now();
    if (now - tapRef.current < 400) {
      setShowConfirm(true);
    }
    tapRef.current = now;
  };

  return (
    <>
      <style>{def.keyframes}</style>
      <motion.div
        drag dragConstraints={constraintsRef} dragElastic={0.05} dragMomentum={false}
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        style={{ position: "absolute", left: sticker.x, top: sticker.y, zIndex: showConfirm ? 50 : 10, cursor: "grab", userSelect: "none", touchAction: "none" }}
        onClick={handleTap}
      >
        <span style={{ fontSize: 36, ...def.style }}>{def.emoji}</span>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 whitespace-nowrap"
          >
            <button
              onPointerDown={(e) => { e.stopPropagation(); onRemove(sticker.id); }}
              className="px-2.5 py-1 rounded-lg bg-red-600/90 text-white text-xs font-semibold active:scale-95"
            >Remove</button>
            <button
              onPointerDown={(e) => { e.stopPropagation(); setShowConfirm(false); }}
              className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-semibold active:scale-95"
            >Keep</button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

export default function JournalEntry() {
  const navigate = useNavigate();
  const [entry, setEntry] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [today, setToday] = useState("");
  const [currentMood, setCurrentMood] = useState("neutral");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [companionData, setCompanionData] = useState(null);
  const [companionMoodUrl, setCompanionMoodUrl] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [placedStickers, setPlacedStickers] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showChatContext, setShowChatContext] = useState(false);
  const [chatContext, setChatContext] = useState("");
  const journalRef = useRef(null);
  const fileInputRef = useRef(null);
  const stickerIdRef = useRef(0);
  const aiSuggestionShownRef = useRef(new Set());
  const [showJournalSavePrompt, setShowJournalSavePrompt] = useState(false);
  const journalWordCountRef = useRef(0); // tracks words typed since last prompt

  useEffect(() => {
    const now = new Date();
    setToday(now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    // Load mood set from MoodPicker
    const savedMood = localStorage.getItem("unfiltr_mood") || "neutral";
    setCurrentMood(savedMood);
    // Load companion with matching mood pose
    try {
      const raw = localStorage.getItem("unfiltr_companion");
      if (raw) {
        const c = JSON.parse(raw);
        const found = COMPANIONS.find(x => x.id === c.id);
        if (found) {
          setCompanionData(found);
          setCompanionMoodUrl(found.poses[savedMood] || found.poses.neutral || found.avatar);
        }
      }
    } catch {}
    // Load chat context if coming from chat
    try {
      const ctx = localStorage.getItem("unfiltr_journal_context");
      if (ctx) {
        setChatContext(ctx);
        setShowChatContext(true);
        localStorage.removeItem("unfiltr_journal_context");
      }
    } catch {}
  }, []);

  // ── AI suggestion triggers based on word count ─────────────────────────
  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const companionName = companionData?.name || "your companion";
    for (const s of AI_SUGGESTIONS) {
      if (wordCount >= s.at && !aiSuggestionShownRef.current.has(s.key)) {
        aiSuggestionShownRef.current.add(s.key);
        setAiSuggestion({ key: s.key, msg: s.msg, name: companionName });
        const suggestionDismissTimer = setTimeout(() => setAiSuggestion(null), 8000);
        return () => clearTimeout(suggestionDismissTimer);
      }
    }
  }, [wordCount, companionData]);

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported on this device."); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = true;
    r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => { setIsListening(false); recognitionRef.current = null; };
    r.onerror = () => { setIsListening(false); recognitionRef.current = null; };
    r.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setEntry(prev => prev ? prev + ' ' + transcript : transcript);
    };
    r.start();
  };

  const handleSave = () => {
    if (!entry.trim() || saving) return;
    // Enforce monthly journal entry limit
    const limit = getJournalLimit();
    const used  = getJournalUsage();
    if (used >= limit) {
      alert(limit === JOURNAL_LIMITS.free
        ? `You've used all ${limit} free journal entries this month. Upgrade to write more 💜`
        : `You've reached your ${limit} journal entries for this month.`
      );
      return;
    }
    setSaving(true);
    const newEntry = {
      id: Date.now().toString(),
      title: entry.trim().slice(0, 50),
      content: entry.trim(),
      mood: currentMood,
      images: uploadedImages,
      stickers: placedStickers,
      created_date: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify([newEntry, ...existing]));
    incrementJournalUsage();
    // ── Auto-save to DB (tiered) ──────────────────────────────────────────────
    saveJournalEntryToDB(newEntry);

    // ── Journal → Memory bridge (premium+, fire-and-forget) ──────────────────
    try {
      const profileId = localStorage.getItem("userProfileId");
      const isPremium = localStorage.getItem("unfiltr_is_premium") === "true";
      const isPro = localStorage.getItem("unfiltr_pro") === "true";
      const isAnnual = localStorage.getItem("unfiltr_annual") === "true";
      if (profileId && (isPremium || isPro || isAnnual) && entry.trim().split(/\s+/).length >= 20) {
        fetch("/api/journalMemoryBridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            journalContent: entry.trim(),
            journalTitle: title?.trim() || "",
            isPremium, isPro, isAnnual,
          }),
        }).catch(() => {}); // fire-and-forget — never blocks the user
      }
    } catch(e) { /* non-fatal */ }
    // ── Auto-save vibe + relationship mode for paid users ─────────────────────
    const tier = getTier();
    if (tier !== "free") {
      try {
        const appleUserId = localStorage.getItem("unfiltr_apple_user_id");
        if (appleUserId) {
          fetch("/api/syncProfile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update",
              appleUserId,
              vibe: localStorage.getItem("unfiltr_vibe") || "",
              relationship_mode: localStorage.getItem("unfiltr_relationship_mode") || "friend",
            }),
          }).catch(() => {});
        }
      } catch {}
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate("/journal/list"); }, 1500);
  };

  const placeSticker = (def) => {
    const x = 10 + Math.random() * 70;
    const y = 10 + Math.random() * 60;
    setPlacedStickers((prev) => [...prev, { id: stickerIdRef.current++, type: def.id, x: `${x}%`, y: `${y}%` }]);
    setShowStickers(false);
  };

  const removeSticker = (id) => setPlacedStickers((prev) => prev.filter((s) => s.id !== id));

  const handleImageUpload = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImages((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0d0520 0%, #1a0a35 60%, #0a1020 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 shrink-0"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button onClick={() => navigate("/journal/home")}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate("/settings")}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <Settings className="w-4 h-4 text-white/60" />
        </button>
        <p className="text-white/50 text-sm font-medium tracking-wide">New Entry</p>
        <button onClick={handleSave} disabled={!entry.trim() || saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${entry.trim() ? "bg-purple-600/80 text-white active:scale-95" : "bg-white/10 text-white/30 cursor-not-allowed"}`}>
          {saved ? (<><CheckCircle className="w-4 h-4 text-emerald-300" /><span className="text-emerald-300">Saved!</span></>) : (<><Save className="w-4 h-4" />{saving ? "Saving..." : "Save"}</>)}
        </button>
      </div>

      {/* Chat context banner — shown when navigating from chat */}
      <AnimatePresence>
        {showChatContext && chatContext && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="mx-4 mb-2 rounded-2xl p-3 shrink-0"
            style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-purple-300 text-xs font-semibold mb-1">✨ From your chat — use as inspiration</p>
                <p className="text-white/40 text-xs leading-relaxed line-clamp-3">{chatContext.slice(0, 180)}{chatContext.length > 180 ? "..." : ""}</p>
              </div>
              <button onClick={() => setShowChatContext(false)} className="shrink-0 mt-0.5">
                <X className="w-3.5 h-3.5 text-white/30" />
              </button>
            </div>
            <button onClick={() => { setEntry(prev => prev ? prev + "\n\n" + chatContext : chatContext); setShowChatContext(false); }}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white active:scale-95 transition-all"
              style={{ background:"rgba(124,58,237,0.5)" }}>
              Add to entry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal card */}
      <div className="flex-1 px-4 pb-2 overflow-hidden flex flex-col min-h-0">
        <motion.div ref={journalRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 rounded-2xl flex flex-col min-h-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 60px rgba(120,80,200,0.12)", position: "relative", overflow: "clip" }}>

          {placedStickers.map((s) => (
            <PlacedSticker key={s.id} sticker={s} onRemove={removeSticker} constraintsRef={journalRef} />
          ))}

          {/* AI suggestion floating prompt */}
          <AnimatePresence>
            {aiSuggestion && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                style={{ position:"absolute", bottom:48, left:12, right:12, zIndex:20,
                  background:"rgba(20,8,50,0.96)", border:"1px solid rgba(168,85,247,0.35)",
                  borderRadius:14, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:10,
                  boxShadow:"0 8px 24px rgba(0,0,0,0.5)", backdropFilter:"blur(10px)" }}>
                {companionMoodUrl && (
                  <img src={companionMoodUrl} alt={companionData?.name}
                    style={{ width:30, height:30, objectFit:"contain", flexShrink:0, filter:"drop-shadow(0 0 6px rgba(168,85,247,0.5))", marginTop:2 }} />
                )}
                <div style={{ flex:1 }}>
                  <p style={{ color:"rgba(168,85,247,0.9)", fontSize:11, fontWeight:700, margin:"0 0 3px" }}>{aiSuggestion.name} suggests</p>
                  <p style={{ color:"rgba(255,255,255,0.75)", fontSize:12, margin:0, lineHeight:1.5 }}>{aiSuggestion.msg}</p>
                </div>
                <button onClick={() => setAiSuggestion(null)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0, marginTop:2 }}>
                  <X style={{ width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-5 pt-4 pb-3 border-b border-white/10 shrink-0 flex items-center gap-3">
            {companionMoodUrl && (
              <motion.img
                src={companionMoodUrl}
                alt={companionData?.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ width: 44, height: 44, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(168,85,247,0.5))", flexShrink: 0 }}
              />
            )}
            <p className="text-purple-400/80 text-xs uppercase tracking-widest font-medium">{today}</p>
          </div>

          {uploadedImages.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2 shrink-0">
              {uploadedImages.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setUploadedImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 relative overflow-hidden min-h-0">
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.04) 31px, rgba(255,255,255,0.04) 32px)", backgroundPositionY: "48px" }} />
            <textarea value={entry} onChange={(e) => {
                setEntry(e.target.value);
                // After ~80 words written, prompt to save (roughly 8 sentences)
                const wordCount = e.target.value.trim().split(/\s+/).filter(Boolean).length;
                if (wordCount >= 80 && journalWordCountRef.current < 80 && getSavePreference() !== "auto") {
                  setShowJournalSavePrompt(true);
                }
                journalWordCountRef.current = wordCount;
              }}
              placeholder={(() => {
                const m = currentMood || "neutral";
                const prompts = {
                  happy:      "You're in a good place today — what's making you smile? ✨",
                  sad:        "It's okay to let it out. What's weighing on you today? 💜",
                  anxious:    "Take a breath. What's your mind racing about right now?",
                  frustrated: "What happened? Get it all out — this is your space 🔥",
                  motivated:  "You're fired up — what are you going after today? 🚀",
                  calm:       "Peaceful day. What do you want to remember about this moment? 🌿",
                  loved:      "You're feeling the love — who or what is behind that today? 💕",
                  neutral:    "What's on your mind today...",
                };
                return prompts[m] || prompts.neutral;
              })()}
              className="w-full h-full resize-none bg-transparent text-white/90 placeholder-white/20 text-base px-5 pt-4 pb-5 focus:outline-none overflow-y-auto"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", lineHeight: "32px", position: "relative", zIndex: 1 }}
              autoFocus />
          </div>

          <div className="px-5 py-2 border-t border-white/10 shrink-0 flex justify-end">
            <p className="text-white/20 text-xs">{wordCount} {wordCount === 1 ? "word" : "words"}</p>
          </div>
        </motion.div>
      </div>

      {/* Sticker tray */}
      <AnimatePresence>
        {showStickers && (
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            className="mx-4 mb-2 rounded-2xl p-4 shrink-0"
            style={{ background: "rgba(20,8,50,0.97)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-xs uppercase tracking-widest">Tap to place · Double-tap placed sticker to remove</p>
              <button onClick={() => setShowStickers(false)}><X className="w-4 h-4 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {STICKER_DEFS.map((def) => (
                <React.Fragment key={def.id}>
                  <style>{def.keyframes}</style>
                  <button onClick={() => placeSticker(def)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                    <span style={{ fontSize: 32, ...def.style }}>{def.emoji}</span>
                    <span className="text-white/30 text-[10px]">{def.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="px-4 pt-2 shrink-0"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm font-medium active:scale-95 transition-all">
            <Image className="w-4 h-4" /><span>Photo</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          <button onClick={() => setShowStickers((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-all ${showStickers ? "bg-purple-600/60 text-white" : "bg-white/10 text-white/60"}`}>
            <Smile className="w-4 h-4" /><span>Stickers</span>
          </button>
          <button onClick={handleMic}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-all ${isListening ? "bg-pink-600/60 text-white animate-pulse" : "bg-white/10 text-white/60"}`}>
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? "Stop" : "Mic"}</span>
          </button>
          <div className="flex-1" />
          <p className="text-white/20 text-xs">Write freely 🌙</p>
        </div>
      </div>

      {/* ── Save progress prompt (after ~80 words written) ── */}
      {(() => {
        const dismissJournalSavePrompt = () => { setShowJournalSavePrompt(false); journalWordCountRef.current = 0; };
        return (
          <SaveProgressModal
            visible={showJournalSavePrompt}
            context="journal"
            companionName=""
            onSave={() => { dismissJournalSavePrompt(); handleSave(); }}
            onAutoSave={() => { setSavePreference("auto"); dismissJournalSavePrompt(); handleSave(); }}
            onAlwaysAsk={() => { setSavePreference("ask"); dismissJournalSavePrompt(); }}
            onDismiss={dismissJournalSavePrompt}
          />
        );
      })()}
    </div>
  );
}
