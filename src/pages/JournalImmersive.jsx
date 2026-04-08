import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, CheckCircle, Smile, Image, Settings } from "lucide-react";
import { COMPANIONS } from "../components/companionData";

function getTier() {
  if (localStorage.getItem("unfiltr_is_annual") === "true") return "annual";
  if (localStorage.getItem("unfiltr_is_pro") === "true") return "pro";
  if (localStorage.getItem("unfiltr_is_premium") === "true") return "plus";
  return "free";
}
async function saveJournalEntryToDB(entry) {
  try {
    const appleUserId = localStorage.getItem("unfiltr_apple_user_id");
    if (!appleUserId) return;
    await fetch("/api/utils", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveJournalEntry", appleUserId, entry, tier: getTier() }),
    });
  } catch {}
}

const WORLDS = [
  {
    id: "cozy_apartment",
    label: "Cozy Apartment", emoji: "🏠",
    bgImage: "https://media.base44.com/images/public/69b332a392004d139d4ba495/133f41f0f_generated_image.png",
    accentColor: "#ffb347",
    accentGlow: "rgba(255,140,40,0.5)",
    overlayStart: "rgba(0,0,0,0.45)",
    overlayEnd: "rgba(10,5,0,0.92)",
  },
  {
    id: "forest_cabin",
    label: "Forest Cabin", emoji: "🌲",
    bgImage: "https://media.base44.com/images/public/69b332a392004d139d4ba495/d7bb6e1b5_generated_image.png",
    accentColor: "#4ade80",
    accentGlow: "rgba(74,222,128,0.45)",
    overlayStart: "rgba(0,0,0,0.4)",
    overlayEnd: "rgba(0,10,3,0.92)",
  },
  {
    id: "late_night_cafe",
    label: "Late Night Café", emoji: "☕",
    bgImage: "https://media.base44.com/images/public/69b332a392004d139d4ba495/e0ccd0753_generated_image.png",
    accentColor: "#c462ff",
    accentGlow: "rgba(196,98,255,0.5)",
    overlayStart: "rgba(0,0,0,0.45)",
    overlayEnd: "rgba(8,2,20,0.92)",
  },
  {
    id: "space_station",
    label: "Space Station", emoji: "🌌",
    bgImage: "https://media.base44.com/images/public/69b332a392004d139d4ba495/2da8b6d3e_generated_image.png",
    accentColor: "#63b3ff",
    accentGlow: "rgba(99,179,255,0.45)",
    overlayStart: "rgba(0,0,0,0.35)",
    overlayEnd: "rgba(1,2,15,0.92)",
  },
  {
    id: "beach_house",
    label: "Beach House", emoji: "🏖️",
    bgImage: "https://media.base44.com/images/public/69b332a392004d139d4ba495/19c79bde2_generated_image.png",
    accentColor: "#fbbf24",
    accentGlow: "rgba(251,191,36,0.45)",
    overlayStart: "rgba(0,0,0,0.35)",
    overlayEnd: "rgba(10,6,0,0.92)",
  },
  {
    id: "rooftop",
    label: "Rooftop", emoji: "🌆",
    bgImage: "https://media.base44.com/images/public/69b332a392004d139d4ba495/6e20d0458_generated_image.png",
    accentColor: "#f472b6",
    accentGlow: "rgba(244,114,182,0.5)",
    overlayStart: "rgba(0,0,0,0.45)",
    overlayEnd: "rgba(8,2,18,0.92)",
  },
];

const PROMPTS = [
  "If you could say one thing out loud right now, what would it be?",
  "What's something you've been avoiding thinking about?",
  "Something good happened today, even if it was small...",
  "What do you wish someone understood about you?",
  "If today had a color, what would it be and why?",
  "What's one thing you're proud of this week?",
  "What are you holding onto that you could let go of?",
  "Describe how you're feeling without using emotions — use weather, colors, textures.",
];

const COMPANION_REPLIES = [
  "That really resonates... tell me more if you want. 🌜",
  "I'm here, listening to every word. ✨",
  "Thank you for trusting me with that. 💜",
  "You're doing something important by writing this down. 🌊",
  "I see you. Keep going. 💫",
  "That took courage to write. I'm proud of you. 🌸",
];

const STICKER_DEFS = [
  { id: "butterfly", emoji: "🦋", keyframes: `@keyframes bFlap{0%,100%{transform:scaleX(1) rotate(-3deg)}50%{transform:scaleX(0.4) rotate(3deg)}}`, style: { animation: "bFlap 1.8s ease-in-out infinite", display: "inline-block" } },
  { id: "heart", emoji: "💜", keyframes: `@keyframes hBeat{0%,100%{transform:scale(1)}15%{transform:scale(1.25)}45%{transform:scale(1.15)}}`, style: { animation: "hBeat 2s ease-in-out infinite", display: "inline-block" } },
  { id: "star", emoji: "⭐", keyframes: `@keyframes sSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`, style: { animation: "sSpin 3s linear infinite", display: "inline-block" } },
  { id: "sparkle", emoji: "✨", keyframes: `@keyframes spPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7) rotate(20deg)}}`, style: { animation: "spPulse 1.5s ease-in-out infinite", display: "inline-block" } },
  { id: "flower", emoji: "🌸", keyframes: `@keyframes flSway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}`, style: { animation: "flSway 2.5s ease-in-out infinite", display: "inline-block", transformOrigin: "bottom center" } },
  { id: "moon", emoji: "🌙", keyframes: `@keyframes mFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-6px)}}`, style: { animation: "mFloat 3s ease-in-out infinite", display: "inline-block" } },
  { id: "rainbow", emoji: "🌈", keyframes: `@keyframes rPop{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}`, style: { animation: "rPop 2s ease-in-out infinite", display: "inline-block" } },
  { id: "candle", emoji: "🕯️", keyframes: `@keyframes cFlicker{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.95)}}`, style: { animation: "cFlicker 1.2s ease-in-out infinite", display: "inline-block", transformOrigin: "bottom center" } },
];

function ImmersivePlacedSticker({ sticker, onRemove, constraintsRef }) {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const tapRef = React.useRef(0);
  const def = STICKER_DEFS.find(d => d.id === sticker.type);
  if (!def) return null;
  const handleTap = () => {
    if (showConfirm) return;
    const now = Date.now();
    if (now - tapRef.current < 400) { setShowConfirm(true); return; }
    tapRef.current = now;
  };
  return (
    <>
      {def.keyframes && <style>{def.keyframes}</style>}
      <motion.div drag dragConstraints={constraintsRef} dragMomentum={false}
        onTap={handleTap}
        style={{ position: "absolute", left: sticker.x, top: sticker.y, fontSize: 32, cursor: "grab", zIndex: 20, touchAction: "none", userSelect: "none" }}>
        <span style={def.style}>{def.emoji}</span>
        {showConfirm && (
          <button onClick={() => onRemove(sticker.id)}
            style={{ position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        )}
      </motion.div>
    </>
  );
}

export default function JournalImmersive() {
  const navigate = useNavigate();
  const [worldId, setWorldId] = useState("cozy_apartment");
  const [bgLoaded, setBgLoaded] = useState({});
  const [companion, setCompanion] = useState(null);
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prompt] = useState(() => {
    const mood = localStorage.getItem("unfiltr_mood") || "neutral";
    const moodPrompts = {
      happy:       ["You're glowing today — what's making you feel this good?", "Something great is happening. Write it all out.", "What's the best part of your day so far?"],
      sad:         ["What's weighing on you right now? This is your safe space.", "It's okay to not be okay. What happened?", "What do you wish someone understood about how you're feeling?"],
      fear:        ["What's making you anxious right now? Get it out of your head.", "What's the worst that could happen — and what's the most likely thing?", "What would make you feel just a little safer right now?"],
      anger:       ["What happened? Let it out — no judgment here.", "Who or what frustrated you today, and why?", "What do you wish you could say but haven't?"],
      disgust:     ["Something bothered you. What was it?", "What crossed a line for you today?", "What do you need to let go of?"],
      surprise:    ["Something unexpected happened — write it out.", "You didn't see that coming. How does it make you feel?", "What changed today that you weren't expecting?"],
      contentment: ["What's bringing you peace right now?", "You seem settled. What's grounding you today?", "What are you grateful for in this moment?"],
      fatigue:     ["You're tired. What's draining you?", "What do you need most right now — rest, clarity, or just to vent?", "What would help you feel a little lighter?"],
      neutral:     PROMPTS,
    };
    const pool = moodPrompts[mood] || PROMPTS;
    return pool[Math.floor(Math.random() * pool.length)];
  });
  const [companionReply, setCompanionReply] = useState(null);
  const [showReply, setShowReply] = useState(false);
  const bottomRef = useRef(null);
  const journalRef = useRef(null);
  const fileInputRef = useRef(null);
  const stickerIdRef = useRef(0);
  const [showStickers, setShowStickers] = React.useState(false);
  const [placedStickers, setPlacedStickers] = React.useState([]);
  const [uploadedImages, setUploadedImages] = React.useState([]);

  useEffect(() => {
    WORLDS.forEach(w => {
      const img = new window.Image();
      img.onload = () => setBgLoaded(prev => ({ ...prev, [w.id]: true }));
      img.src = w.bgImage;
    });
  }, []);

  useEffect(() => {
    const savedWorld = localStorage.getItem("unfiltr_journal_world");
    if (savedWorld) setWorldId(savedWorld);

    try {
      const savedComp = localStorage.getItem("unfiltr_companion");
      if (savedComp) {
        const parsed = JSON.parse(savedComp);
        const found = COMPANIONS.find(c => c.id === parsed.id || c.name === parsed.name);
        if (found) setCompanion(found);
        else if (COMPANIONS.length > 0) setCompanion(COMPANIONS[0]);
      } else if (COMPANIONS.length > 0) setCompanion(COMPANIONS[0]);
    } catch(e) { if (COMPANIONS.length > 0) setCompanion(COMPANIONS[0]); }

    const today = new Date().toDateString();
    const cached = localStorage.getItem("unfiltr_immersive_journal_" + today);
    if (cached) { try { setEntries(JSON.parse(cached)); } catch(e) {} }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  const handleSave = () => {
    if (!entry.trim() || saving) return;
    setSaving(true);
    const newEntry = {
      id: Date.now(), text: entry.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    const today = new Date().toDateString();
    localStorage.setItem("unfiltr_immersive_journal_" + today, JSON.stringify(updated));
    const fullEntry = {
      id: Date.now().toString(), title: entry.trim().slice(0, 50),
      content: entry.trim(), mood: localStorage.getItem("unfiltr_mood") || "neutral", world: worldId,
      created_date: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify([fullEntry, ...existing]));
    saveJournalEntryToDB(fullEntry);
    setEntry("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => {
      setCompanionReply(COMPANION_REPLIES[Math.floor(Math.random() * COMPANION_REPLIES.length)]);
      setShowReply(true);
      setTimeout(() => setShowReply(false), 4500);
    }, 500);
  };

  const placeSticker = (def) => {
    const x = 10 + Math.random() * 70;
    const y = 10 + Math.random() * 60;
    setPlacedStickers(prev => [...prev, { id: stickerIdRef.current++, type: def.id, x: `${x}%`, y: `${y}%` }]);
    setShowStickers(false);
  };
  const removeSticker = (id) => setPlacedStickers(prev => prev.filter(s => s.id !== id));
  const handleImageUpload = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImages(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const w = WORLDS.find(x => x.id === worldId) || WORLDS[0];
  const companionImg = companion?.poses?.neutral || companion?.poses?.happy || companion?.avatar || "";
  const companionDisplayName = companion?.displayName || companion?.name || "your companion";

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes floatComp { 0%,100%{transform:translateX(-50%) translateY(0px)} 50%{transform:translateX(-50%) translateY(-8px)} }
        .ji-textarea { background:transparent;border:none;outline:none;resize:none;width:100%;color:rgba(255,255,255,0.92);font-size:15px;line-height:1.75;font-family:inherit; }
        .ji-textarea::placeholder { color:rgba(255,255,255,0.3); }
      `}</style>

      <div style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none",zIndex:-1}}>
        {WORLDS.map(ww => <img key={ww.id} src={ww.bgImage} alt="" width="1" height="1" />)}
      </div>

      {WORLDS.map(ww => (
        <div
          key={ww.id}
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: ww.id === "cozy_apartment" ? "linear-gradient(160deg,#3d1f0a,#1a0a02)" :
                        ww.id === "forest_cabin" ? "linear-gradient(160deg,#0f3018,#061408)" :
                        ww.id === "late_night_cafe" ? "linear-gradient(160deg,#2a0d42,#0d0518)" :
                        ww.id === "space_station" ? "linear-gradient(160deg,#0a1535,#020510)" :
                        ww.id === "beach_house" ? "linear-gradient(160deg,#3d2a06,#1a1202)" :
                        "linear-gradient(160deg,#2a103a,#0d0518)",
            backgroundImage: bgLoaded[ww.id] ? `url(${ww.bgImage})` : "none",
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: ww.id === w.id ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />
      ))}

      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: `linear-gradient(to bottom, ${w.overlayStart} 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.55) 60%, ${w.overlayEnd} 100%)`,
      }} />

      {/* Top bar */}
      <div style={{
        flexShrink: 0, padding: "0 16px 10px",
        paddingTop: "max(1.2rem, env(safe-area-inset-top, 1.2rem))",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 10,
      }}>
        <button onClick={() => navigate("/journal/home")} style={{
          width: 38, height: 38, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ChevronLeft size={18} color="white" />
        </button>
        <button onClick={() => navigate("/settings")} style={{
          width: 38, height: 38, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <Settings size={16} color="rgba(255,255,255,0.6)" />
        </button>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)",
          border: "1px solid " + w.accentColor + "50", borderRadius: 20, padding: "5px 14px",
        }}>
          <span style={{ fontSize: 14 }}>{w.emoji}</span>
          <span style={{ color: w.accentColor, fontSize: 12, fontWeight: 700 }}>{w.label}</span>
        </div>
        {companion ? (
          <div style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid " + w.accentColor + "60", background: "rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <img src={companionImg} alt={companion.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : <div style={{ width: 38 }} />}
      </div>

      {/* Companion */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 5, height: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {companion && (
          <motion.img
            src={companionImg}
            alt={companionDisplayName}
            style={{
              position: "absolute", bottom: 0, left: "50%",
              height: 185, objectFit: "contain",
              filter: "drop-shadow(0 8px 32px " + w.accentGlow + ") drop-shadow(0 0 60px " + w.accentGlow + ")",
              animation: "floatComp 4s ease-in-out infinite",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          />
        )}
        <AnimatePresence>
          {showReply && companionReply && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              style={{
                position: "absolute", bottom: "105%", left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)",
                border: "1px solid " + w.accentColor + "40",
                borderRadius: 14, padding: "10px 14px",
                color: "rgba(255,255,255,0.9)", fontSize: 13, maxWidth: 220, textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 15,
              }}
            >
              {companionReply}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable journal area */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        WebkitOverflowScrolling: "touch", position: "relative", zIndex: 8,
        padding: "8px 16px 4px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)",
            border: "1px solid " + w.accentColor + "30",
            borderRadius: 16, padding: "12px 16px", marginBottom: 10,
          }}
        >
          <p style={{ color: w.accentColor, fontWeight: 800, fontSize: 10, letterSpacing: "0.15em", margin: "0 0 4px", textTransform: "uppercase" }}>
            TODAY'S PROMPT
          </p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
            {prompt}
          </p>
        </motion.div>

        {entries.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "12px 14px", marginBottom: 8,
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.65, margin: "0 0 4px", whiteSpace: "pre-wrap" }}>
              {e.text}
            </p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>{e.time}</p>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Placed stickers */}
      <div ref={journalRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15 }}>
        {placedStickers.map(s => (
          <ImmersivePlacedSticker key={s.id} sticker={s} onRemove={removeSticker} constraintsRef={journalRef} />
        ))}
      </div>

      {/* Uploaded images */}
      {uploadedImages.length > 0 && (
        <div style={{ position: "absolute", bottom: 80, left: 14, right: 14, zIndex: 16, display: "flex", gap: 8, overflowX: "auto" }}>
          {uploadedImages.map((src, i) => (
            <div key={i} style={{ position: "relative", flexShrink: 0 }}>
              <img src={src} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "2px solid rgba(255,255,255,0.2)" }} />
              <button onClick={() => setUploadedImages(prev => prev.filter((_,j) => j !== i))}
                style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", border: "none", color: "white", fontSize: 11, cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Sticker picker */}
      {showStickers && (
        <div style={{ position: "absolute", bottom: 80, left: 14, right: 14, zIndex: 30, background: "rgba(10,6,20,0.95)", backdropFilter: "blur(20px)", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Add a sticker</span>
            <button onClick={() => setShowStickers(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {STICKER_DEFS.map(def => (
              <button key={def.id} onClick={() => placeSticker(def)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 0", cursor: "pointer", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {def.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />

      {/* Input bar */}
      <div style={{
        flexShrink: 0, position: "relative", zIndex: 10,
        padding: "8px 14px",
        paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 10px))",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 4 }}>
          <button onClick={() => setShowStickers(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Smile size={20} color={showStickers ? w.accentColor : "rgba(255,255,255,0.4)"} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Image size={20} color="rgba(255,255,255,0.4)" />
          </button>
        </div>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: "10px 14px",
        }}>
          <textarea
            className="ji-textarea"
            rows={1}
            value={entry}
            onChange={e => setEntry(e.target.value)}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
            placeholder={"Write anything... " + companionDisplayName + " is listening 🌙"}
            style={{ minHeight: 22 }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            disabled={!entry.trim() || saving}
            style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: "50%", border: "none",
              background: entry.trim() ? ("linear-gradient(135deg, " + w.accentColor + ", " + w.accentColor + "88)") : "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: entry.trim() ? "pointer" : "default",
              boxShadow: entry.trim() ? ("0 0 16px " + w.accentGlow) : "none",
              transition: "all 0.2s",
            }}
          >
            {saved ? <CheckCircle size={16} color="white" /> : <Save size={16} color={entry.trim() ? "white" : "rgba(255,255,255,0.3)"} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
