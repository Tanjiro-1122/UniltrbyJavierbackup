import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, StopCircle, X } from "lucide-react";

// ── Meditation avatar map ─────────────────────────────────────────────────────
const MEDITATION_AVATARS = {
  luna:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/77af5e6d3_luna_meditation.png",
  river:  "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/b1dcf6480_river_meditation.png",
  kai:    "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/94d7a11ba_kai_meditation.png",
  nova:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/745636f0e_nova_meditation.png",
  ash:    "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/7057e2cdc_ash_meditation.png",
  sakura: "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/54138a454_sakura_meditation.png",
  ryuu:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/9f5906b5a_ryuu_meditation.png",
  sage:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/66be0c212_sage_meditation.png",
  zara:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/126c7e0ac_zara_meditation.png",
  echo:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/a937dffb9_echo_meditation.png",
  soleil: "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/5841520c9_soleil_meditation.png",
  juan:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/609a3c0d7_juan_meditation.png",
};

const COMPANIONS = ["luna","kai","nova","river","ash","sakura","ryuu","sage","zara","echo","soleil","juan"];
const DEFAULT_ID = "luna";
const MEDITATE_COMPANION_KEY = "unfiltr_meditate_companion";

function getSavedCompanionId() {
  try {
    const med = localStorage.getItem(MEDITATE_COMPANION_KEY);
    if (med && MEDITATION_AVATARS[med]) return med;
    const raw = localStorage.getItem("unfiltr_companion");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id.toLowerCase().trim();
    }
    const id = localStorage.getItem("unfiltr_companion_id");
    if (id) return id.toLowerCase().trim();
    const cid = localStorage.getItem("companionId");
    if (cid) return cid.toLowerCase().trim();
  } catch {}
  return DEFAULT_ID;
}

const ICONS = {
  rain:           "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/d3ba5ab97_generated_image.png",
  fire:           "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/d4222ed71_generated_image.png",
  ocean:          "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/1e250678e_generated_image.png",
  brown:          "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/c5f2dc79e_generated_image.png",
  pink:           "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/99515dbf1_generated_image.png",
  silence:        "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/54e09f21c_generated_image.png",
  moonlit:        "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/3f3c3c05e_generated_image.png",
  smoothsilk:     "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/238aed294_generated_image.png",
  japanese:       "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/965c00b3c_generated_image.png",
  nativeflute:    "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/7cef8d781_generated_image.png",
  nativeflute2:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/c5882a86e_generated_image.png",
  omspirit:       "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/02107e7a6_generated_image.png",
  omdancing:      "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/bbcc2d8e7_generated_image.png",
  tibetanriver:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/515daf4b9_generated_image.png",
  tibetanhealing:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/97ed86f52_generated_image.png",
  tibetanpeace:   "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/f47c5b0f9_generated_image.png",
  earlymorning:   "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/949b0dc9a_rain5.mp3",
  aquarium:       "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/4a3361c60_creek_b.mp3",
};

const AUDIO_URLS = {
  rain:           "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/334bf1ba7_rain_v2.mp3",
  fire:           "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/9b687983d_fire_v2.mp3",
  ocean:          "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/07f3c59f3_ocean_v2.mp3",
  moonlit:        "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/d2a430923_moonlit_blossoms_chinese.mp3",
  smoothsilk:     "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/8a5fc8ff8_smooth_as_silk_chinese.mp3",
  japanese:       "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/6ce32ebd3_traditional_japanese.mp3",
  nativeflute:    "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/13b30c6ec_calm_native_flute.mp3",
  nativeflute2:   "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/b93871170_native_american_flute.mp3",
  omspirit:       "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/60f2526db_ancient_spirit_om.mp3",
  omdancing:      "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/1fb9009c9_ancient_dancing_om.mp3",
  tibetanriver:   "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/25d21e64a_tibetan_bowls_river.mp3",
  tibetanhealing: "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/92fe6cb4f_tibetan_bowl_healing.mp3",
  tibetanpeace:   "https://base44.app/api/apps/69c83ef77b8d9fdcb0a754f5/files/mp/public/69c83ef77b8d9fdcb0a754f5/c20f51587_tibetan_bowl_peace.mp3",
  earlymorning:   "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/226d0b352_early_morning.mp3",
  aquarium:       "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/b8be7b568_aquarium.mp3",
};

const SOUNDS_CLASSIC = [
  { id: "rain",    label: "Rainy Day",    desc: "Rain + soft thunder",        icon: ICONS.rain },
  { id: "fire",    label: "Cabin Fire",   desc: "Warm crackling fireplace",   icon: ICONS.fire },
  { id: "ocean",   label: "Beach Waves",  desc: "Ocean shore & seabirds",     icon: ICONS.ocean },
  { id: "brown",   label: "Brown Noise",  desc: "Deep & grounding",           icon: ICONS.brown,   synth: true },
  { id: "pink",    label: "Pink Noise",   desc: "Best for sleep & anxiety",   icon: ICONS.pink,    synth: true },
  { id: "silence",      label: "Silence",        desc: "Breath guide only",          icon: ICONS.silence,      synth: true },
  { id: "earlymorning", label: "Early Morning",  desc: "Birdsong & soft dawn light",  icon: ICONS.earlymorning },
  { id: "aquarium",     label: "Aquarium",       desc: "Gentle bubbles & water life", icon: ICONS.aquarium },
];

const SOUNDS_WORLD = [
  { id: "moonlit",        label: "Moonlit Blossoms",  desc: "Traditional Chinese",      icon: ICONS.moonlit },
  { id: "smoothsilk",     label: "Smooth as Silk",    desc: "Full Chinese melody",      icon: ICONS.smoothsilk },
  { id: "japanese",       label: "Sakura Dreams",     desc: "Traditional Japanese",     icon: ICONS.japanese },
  { id: "nativeflute",    label: "Spirit Flute",      desc: "Calm Native American",     icon: ICONS.nativeflute },
  { id: "nativeflute2",   label: "Mountain Flute",    desc: "Native American plains",   icon: ICONS.nativeflute2 },
  { id: "omspirit",       label: "Ancient Spirit",    desc: "Om chanting echoes",       icon: ICONS.omspirit },
  { id: "omdancing",      label: "Sacred Dance",      desc: "Dancing Om chanting",      icon: ICONS.omdancing },
  { id: "tibetanriver",   label: "River Bowls",       desc: "Tibetan bowls + river",    icon: ICONS.tibetanriver },
  { id: "tibetanhealing", label: "Healing Bowls",     desc: "Tibetan sound healing",    icon: ICONS.tibetanhealing },
  { id: "tibetanpeace",   label: "Bowl Peace",        desc: "Ambient Tibetan peace",    icon: ICONS.tibetanpeace },
];

const ALL_SOUNDS = [...SOUNDS_CLASSIC, ...SOUNDS_WORLD];


const BREATHWORK = [
  { id: "478",    label: "4-7-8",         desc: "Inhale 4 · Hold 7 · Exhale 8",   pattern: [4,7,8],   phases: ["Inhale","Hold","Exhale"] },
  { id: "box",    label: "Box Breathing", desc: "In 4 · Hold 4 · Out 4 · Hold 4", pattern: [4,4,4,4], phases: ["Inhale","Hold","Exhale","Hold"] },
  { id: "simple", label: "4-4 Simple",    desc: "Inhale 4 · Exhale 4",            pattern: [4,4],     phases: ["Inhale","Exhale"] },
  { id: "none",   label: "Just Ambience", desc: "No breathing guide",             pattern: [],        phases: [] },
];

// ── Noise synthesis ───────────────────────────────────────────────────────────
function makeBrownBuf(ctx, secs = 4) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    d[i] = (last + 0.02 * w) / 1.02; last = d[i]; d[i] *= 3.5;
    if (d[i] > 1) d[i] = 1; if (d[i] < -1) d[i] = -1;
  }
  return buf;
}
function makePinkBuf(ctx, secs = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
    d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6 = w*0.115926;
  }
  return buf;
}



// ─── AUDIO ENGINE ────────────────────────────────────────────────────────────
function createAmbientSound(type, ctx) {
  if (type === "silence") return null;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 3);
  master.connect(ctx.destination);

  // MP3 sources — fetch → decode → loop (works in iOS WKWebView)
  const url = AUDIO_URLS[type];
  if (url) {
    let sourceNode = null, stopped = false;
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(ab => ctx.decodeAudioData(ab))
      .then(decoded => {
        if (stopped) return;
        sourceNode = ctx.createBufferSource();
        sourceNode.buffer = decoded;
        sourceNode.loop = true;
        sourceNode.connect(master);
        sourceNode.start(0);
      })
      .catch(e => console.warn("Audio load failed:", e));
    return {
      stop: () => {
        stopped = true;
        try {
          master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
          setTimeout(() => {
            try { if (sourceNode) sourceNode.stop(); } catch {}
            try { ctx.close(); } catch {}
          }, 1600);
        } catch {}
      }
    };
  }

  // Synthesized noise
  if (type === "brown") {
    const buf = makeBrownBuf(ctx, 6), src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lpf = ctx.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.value = 700;
    src.connect(lpf); lpf.connect(master); src.start();
    return { stop: () => { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); setTimeout(() => { try { src.stop(); ctx.close(); } catch {} }, 1600); } };
  }
  if (type === "pink") {
    const buf = makePinkBuf(ctx, 4), src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true; src.connect(master); src.start();
    return { stop: () => { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); setTimeout(() => { try { src.stop(); ctx.close(); } catch {} }, 1600); } };
  }
  return null;
}

// ── Avatar thumbnail ──────────────────────────────────────────────────────────
function AvatarThumb({ id, isSelected, onClick, size = 52 }) {
  return (
    <button onClick={onClick}
      style={{
        background: isSelected ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.04)",
        border: isSelected ? "2px solid #a855f7" : "2px solid transparent",
        borderRadius: 12, padding: "6px 4px", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}>
      <div style={{ width: size, height: size, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={MEDITATION_AVATARS[id]}
          alt={id}
          style={{
            width: "100%", height: "100%",
            objectFit: "contain",
            objectPosition: "center bottom",
            filter: isSelected ? "drop-shadow(0 0 6px rgba(168,85,247,0.8))" : "none",
          }}
          onError={e => { e.target.style.opacity = "0.3"; }}
        />
      </div>
      <span style={{ color: isSelected ? "white" : "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: isSelected ? 700 : 500, textTransform: "capitalize" }}>
        {id}
      </span>
    </button>
  );
}


export default function MeditatePage() {
  const navigate = useNavigate();
  const [tab,            setTab]            = useState("classic");
  const [selectedSound,  setSelectedSound]  = useState("rain");
  const [selectedBreath, setSelectedBreath] = useState("478");
  const [phase,          setPhase]          = useState("setup");
  const [timer,          setTimer]          = useState(0);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCount,    setBreathCount]    = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [companionId,    setCompanionId]    = useState(DEFAULT_ID);
  const [pickerOpen,     setPickerOpen]     = useState(false);

  const audioCtxRef = useRef(null);
  const soundRef    = useRef(null);
  const timerRef    = useRef(null);
  const breathRef   = useRef(null);

  useEffect(() => {
    const id = getSavedCompanionId();
    setCompanionId(MEDITATION_AVATARS[id] ? id : DEFAULT_ID);
  }, []);

  const avatarUrl  = MEDITATION_AVATARS[companionId] || MEDITATION_AVATARS[DEFAULT_ID];
  const breathwork = BREATHWORK.find(b => b.id === selectedBreath);
  const sound      = ALL_SOUNDS.find(s => s.id === selectedSound);

  const handleTabChange = (t) => {
    setTab(t);
    setSelectedSound(t === "classic" ? "rain" : "moonlit");
  };

  const handlePickCompanion = (id) => {
    setCompanionId(id);
    localStorage.setItem(MEDITATE_COMPANION_KEY, id);
    setPickerOpen(false);
  };

  const handleStart = () => {
    setLoading(true); setPickerOpen(false);
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      soundRef.current    = createAmbientSound(sound.id, audioCtxRef.current);
    } catch(e) { console.warn("Audio init:", e); }
    setTimeout(() => {
      setLoading(false); setPhase("active");
      setTimer(0); setBreathPhaseIdx(0); setBreathCount(0);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
      if (breathwork.pattern.length > 0) {
        let pI = 0, cI = 0;
        breathRef.current = setInterval(() => {
          cI++; setBreathCount(cI);
          if (cI >= breathwork.pattern[pI]) {
            cI = 0; pI = (pI + 1) % breathwork.pattern.length;
            setBreathPhaseIdx(pI); setBreathCount(0);
          }
        }, 1000);
      }
    }, 300);
  };

  const handleStop = () => {
    clearInterval(timerRef.current); clearInterval(breathRef.current);
    try { if (soundRef.current) soundRef.current.stop(); } catch {}
    localStorage.setItem("unfiltr_just_meditated", JSON.stringify({
      timestamp: Date.now(), duration: timer, sound: sound.label, breathwork: breathwork.label,
    }));
    setPhase("done");
  };

  useEffect(() => () => {
    clearInterval(timerRef.current); clearInterval(breathRef.current);
    try { if (soundRef.current) soundRef.current.stop(); } catch {}
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const curPhaseName = breathwork.pattern.length > 0 ? breathwork.phases[breathPhaseIdx] || "Breathe" : "";
  const curPhaseDur  = breathwork.pattern[breathPhaseIdx] || 1;

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const mins = Math.floor(timer/60), secs = timer%60;
    return (
      <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 28px" }}>
        <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:"spring", damping:16 }}
          style={{ textAlign:"center", width:"100%", maxWidth:320 }}>
          <motion.div animate={{ y:[0,-10,0] }} transition={{ repeat:Infinity, duration:3.5, ease:"easeInOut" }}
            style={{ position:"relative", display:"flex", justifyContent:"center", marginBottom:20 }}>
            <motion.div animate={{ scale:[1,1.3,1], opacity:[0.15,0.45,0.15] }} transition={{ repeat:Infinity, duration:3.5, ease:"easeInOut" }}
              style={{ position:"absolute", inset:-28, borderRadius:"50%", background:"radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)", pointerEvents:"none" }} />
            <div style={{ width:160, height:160, position:"relative", zIndex:1 }}>
              <img src={avatarUrl} alt="companion" style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center", filter:"drop-shadow(0 0 20px rgba(168,85,247,0.5))" }} />
            </div>
          </motion.div>
          <h2 style={{ color:"white", fontWeight:800, fontSize:26, margin:"0 0 8px" }}>Session complete</h2>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:15, margin:"0 0 6px" }}>{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} · {sound.emoji} {sound.label} · {breathwork.label}</p>
          <p style={{ color:"rgba(168,85,247,0.8)", fontSize:13, margin:"0 0 32px" }}>Your companion will check in when you chat 💜</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => navigate("/hub")}
              style={{ padding:"15px", background:"linear-gradient(135deg,#7c3aed,#db2777)", border:"none", borderRadius:14, color:"white", fontWeight:700, fontSize:15, cursor:"pointer" }}>
              Choose Something Else ✦
            </motion.button>
            <button onClick={() => navigate(-1)}
              style={{ padding:"13px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, color:"rgba(255,255,255,0.5)", fontWeight:600, fontSize:14, cursor:"pointer" }}>
              ← Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", alignItems:"center", padding:"max(52px,env(safe-area-inset-top)) 24px 52px", gap:16 }}>
        <div style={{ textAlign:"center" }}>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, margin:"0 0 2px" }}>{sound.emoji} {sound.label} · {breathwork.label}</p>
          <p style={{ color:"rgba(255,255,255,0.12)", fontSize:44, fontWeight:200, margin:0, letterSpacing:6 }}>{fmt(timer)}</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, flex:1, width:"100%", justifyContent:"center" }}>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", width:"100%", flex:1, maxHeight:"60vh" }}>
            <motion.div animate={{ scale:[1,1.35,1], opacity:[0.06,0.22,0.06] }} transition={{ repeat:Infinity, duration:4, ease:"easeInOut" }}
              style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 68%)", pointerEvents:"none" }} />
            <motion.div animate={{ scale:[1,1.2,1], opacity:[0.1,0.38,0.1] }} transition={{ repeat:Infinity, duration:4, ease:"easeInOut", delay:0.5 }}
              style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:"radial-gradient(circle, rgba(219,39,119,0.28) 0%, transparent 68%)", pointerEvents:"none" }} />
            <motion.div animate={{ scale:[1,1.1,1], opacity:[0.18,0.55,0.18] }} transition={{ repeat:Infinity, duration:4, ease:"easeInOut", delay:1 }}
              style={{ position:"absolute", inset:"20%", borderRadius:"50%", background:"radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 68%)", pointerEvents:"none" }} />
            <motion.img
              src={avatarUrl}
              alt="companion meditating"
              animate={{ y:[0,-18,0] }}
              transition={{ repeat:Infinity, duration:4, ease:"easeInOut" }}
              style={{ position:"relative", zIndex:2, width:"90%", height:"100%", objectFit:"contain", objectPosition:"center", filter:"drop-shadow(0 0 40px rgba(168,85,247,0.7))" }}
            />
          </div>

          {breathwork.pattern.length > 0 && (
            <div style={{ textAlign:"center" }}>
              <p style={{ color:"white", fontWeight:700, fontSize:20, margin:"0 0 4px" }}>{curPhaseName}</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, margin:"0 0 12px" }}>{curPhaseDur - breathCount}s</p>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                {breathwork.phases.map((_,i) => (
                  <div key={i} style={{ width:i===breathPhaseIdx?24:8, height:8, borderRadius:4, background:i===breathPhaseIdx?"#a855f7":"rgba(255,255,255,0.1)", transition:"all 0.3s" }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <motion.button whileTap={{ scale:0.95 }} onClick={handleStop}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 32px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:50, color:"white", fontWeight:600, fontSize:15, cursor:"pointer" }}>
          <StopCircle size={18} color="rgba(255,255,255,0.6)" />
          End session
        </motion.button>
      </div>
    );
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"max(14px,env(safe-area-inset-top)) 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0, position:"relative", zIndex:200 }}>
        <button onClick={() => navigate(-1)} style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color:"white", fontWeight:700, fontSize:20, margin:0, flex:1 }}>Meditate</h1>

        <button onClick={() => setPickerOpen(o => !o)}
          style={{ background:"none", border: pickerOpen ? "2px solid rgba(168,85,247,0.6)" : "2px solid transparent", borderRadius:"50%", padding:2, cursor:"pointer", width:50, height:50, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src={avatarUrl} alt="companion" style={{ width:42, height:42, objectFit:"contain", objectPosition:"center", filter:"drop-shadow(0 0 8px rgba(168,85,247,0.5))", display:"block" }} />
        </button>

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity:0, y:-8, scale:0.95 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-8, scale:0.95 }}
              transition={{ duration:0.15 }}
              style={{ position:"absolute", top:"calc(100% + 6px)", right:12, zIndex:300, background:"rgba(18,8,38,0.98)", border:"1px solid rgba(168,85,247,0.3)", borderRadius:20, padding:"14px 12px", boxShadow:"0 12px 40px rgba(0,0,0,0.7)", width:272 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div>
                  <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>Choose Companion</span>
                  <p style={{ color:"rgba(168,85,247,0.6)", fontSize:10, margin:"2px 0 0", fontStyle:"italic" }}>For this session only</p>
                </div>
                <button onClick={() => setPickerOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <X size={16} color="rgba(255,255,255,0.4)" />
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {COMPANIONS.map(id => (
                  <AvatarThumb key={id} id={id} isSelected={companionId===id} onClick={() => handlePickCompanion(id)} size={52} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 120px" }}>

        {/* Companion preview */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
          <motion.div animate={{ y:[0,-8,0] }} transition={{ repeat:Infinity, duration:3, ease:"easeInOut" }}
            style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <motion.div animate={{ scale:[1,1.2,1], opacity:[0.12,0.42,0.12] }} transition={{ repeat:Infinity, duration:3, ease:"easeInOut" }}
              style={{ position:"absolute", width:170, height:170, borderRadius:"50%", background:"radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)", pointerEvents:"none" }} />
            <div style={{ width:140, height:155, position:"relative", zIndex:1 }}>
              <img src={avatarUrl} alt="companion" style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center", filter:"drop-shadow(0 0 18px rgba(168,85,247,0.55))" }} />
            </div>
          </motion.div>
        </div>

        {/* Classic / World tab */}
        <div style={{ display:"flex", gap:8, marginBottom:16, background:"rgba(255,255,255,0.05)", borderRadius:12, padding:4 }}>
          {["classic","world"].map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
                background: tab === t ? "rgba(168,85,247,0.7)" : "transparent",
                color: tab === t ? "white" : "rgba(255,255,255,0.4)", transition:"all 0.2s" }}>
              {t === "classic" ? "🌿 Classic" : "🌍 World"}
            </button>
          ))}
        </div>

        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Ambient Sound</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:28 }}>
          {(tab === "classic" ? SOUNDS_CLASSIC : SOUNDS_WORLD).map(s => (
            <button key={s.id} onClick={() => setSelectedSound(s.id)}
              style={{ padding:"12px 8px 10px", borderRadius:14,
                border: selectedSound===s.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                background: selectedSound===s.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
                cursor:"pointer", textAlign:"center" }}>
              {s.icon
                ? <img src={s.icon} alt={s.label} style={{ width:44, height:44, borderRadius:10, objectFit:"cover", display:"block", margin:"0 auto 6px" }} />
                : <span style={{ fontSize:26, display:"block", marginBottom:6 }}>{s.emoji}</span>
              }
              <span style={{ color:selectedSound===s.id?"white":"rgba(255,255,255,0.6)", fontWeight:selectedSound===s.id?700:500, fontSize:11, display:"block" }}>{s.label}</span>
              <span style={{ color:"rgba(255,255,255,0.25)", fontSize:9, display:"block", marginTop:2, lineHeight:1.3 }}>{s.desc}</span>
            </button>
          ))}
        </div>

        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Breathing Technique</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32 }}>
          {BREATHWORK.map(b => (
            <button key={b.id} onClick={() => setSelectedBreath(b.id)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14, border: selectedBreath===b.id ? "2px solid #db2777" : "1px solid rgba(255,255,255,0.08)", background: selectedBreath===b.id ? "rgba(219,39,119,0.12)" : "rgba(255,255,255,0.04)", cursor:"pointer", textAlign:"left" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:selectedBreath===b.id?"#db2877":"rgba(255,255,255,0.15)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ color:selectedBreath===b.id?"white":"rgba(255,255,255,0.7)", fontWeight:selectedBreath===b.id?700:500, fontSize:14, margin:"0 0 2px" }}>{b.label}</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, margin:0 }}>{b.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <motion.button whileTap={{ scale:0.97 }} onClick={handleStart} disabled={loading}
          style={{ width:"100%", padding:"16px", background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#db2777)", border:"none", borderRadius:16, color:"white", fontWeight:700, fontSize:16, cursor: loading ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 4px 24px rgba(124,58,237,0.4)", opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <><div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", animation:"spin 0.8s linear infinite" }} />Loading...</>
          ) : (
            <><Play size={18} fill="white" /> Begin Session</>
          )}
        </motion.button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
