import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, StopCircle } from "lucide-react";

// ─── ICON URLs ────────────────────────────────────────────────────────────────
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
};

// ─── AUDIO URLs ───────────────────────────────────────────────────────────────
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
};

// ─── SOUND DEFINITIONS ────────────────────────────────────────────────────────
const SOUNDS_CLASSIC = [
  { id: "rain",    label: "Rainy Day",    desc: "Rain + soft thunder",        icon: ICONS.rain },
  { id: "fire",    label: "Cabin Fire",   desc: "Warm crackling fireplace",   icon: ICONS.fire },
  { id: "ocean",   label: "Beach Waves",  desc: "Ocean shore & seabirds",     icon: ICONS.ocean },
  { id: "brown",   label: "Brown Noise",  desc: "Deep & grounding",           icon: ICONS.brown,   synth: true },
  { id: "pink",    label: "Pink Noise",   desc: "Best for sleep & anxiety",   icon: ICONS.pink,    synth: true },
  { id: "silence", label: "Silence",      desc: "Breath guide only",          icon: ICONS.silence, synth: true },
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

// ─── SYNTHESIZED NOISE (Brown / Pink) — AudioContext only ────────────────────
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

// ─── AUDIO ENGINE ─────────────────────────────────────────────────────────────
// Strategy:
//   MP3 sounds  → HTML5 <audio> element (survives screen lock on iOS + Android)
//   Brown/Pink  → AudioContext (synthesized, can't use <audio>)
//                 + visibilitychange listener to resume ctx when screen wakes
//   Silence     → nothing

function createAmbientSound(type, audioElRef, audioCtxRef) {
  if (type === "silence") return null;

  // ── Synthesized noise via AudioContext ──
  if (type === "brown" || type === "pink") {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 3);
    master.connect(ctx.destination);

    const buf = type === "brown" ? makeBrownBuf(ctx, 6) : makePinkBuf(ctx, 4);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    if (type === "brown") {
      const lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass"; lpf.frequency.value = 700;
      src.connect(lpf); lpf.connect(master);
    } else {
      src.connect(master);
    }
    src.start();

    // Resume AudioContext if screen wakes (visibility API)
    const onVisible = () => {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);

    return {
      stop: () => {
        document.removeEventListener("visibilitychange", onVisible);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        setTimeout(() => { try { src.stop(); ctx.close(); } catch {} }, 1600);
        audioCtxRef.current = null;
      }
    };
  }

  // ── MP3 sounds via HTML5 <audio> — survives screen lock ──
  const url = AUDIO_URLS[type];
  if (!url) return null;

  const audio = new Audio();
  audio.src = url;
  audio.loop = true;
  audio.volume = 0;
  audio.preload = "auto";
  // iOS WebView flags
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audioElRef.current = audio;

  // Fade in over 3s
  const fadeIn = () => {
    let v = 0;
    const step = setInterval(() => {
      v = Math.min(v + 0.03, 0.85);
      audio.volume = v;
      if (v >= 0.85) clearInterval(step);
    }, 100);
  };

  audio.play().then(fadeIn).catch(e => console.warn("Audio play failed:", e));

  return {
    stop: () => {
      // Fade out then pause
      let v = audio.volume;
      const step = setInterval(() => {
        v = Math.max(v - 0.05, 0);
        audio.volume = v;
        if (v <= 0) {
          clearInterval(step);
          audio.pause();
          audio.src = "";
          audioElRef.current = null;
        }
      }, 80);
    }
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MeditatePage() {
  const navigate = useNavigate();
  const [tab,            setTab]            = useState("classic"); // "classic" | "world"
  const [selectedSound,  setSelectedSound]  = useState("rain");
  const [selectedBreath, setSelectedBreath] = useState("478");
  const [phase,          setPhase]          = useState("setup");
  const [timer,          setTimer]          = useState(0);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCount,    setBreathCount]    = useState(0);
  const [breathScale,    setBreathScale]    = useState(1);
  const [loading,        setLoading]        = useState(false);

  const audioElRef  = useRef(null);   // HTML5 Audio element (MP3s)
  const audioCtxRef = useRef(null);   // AudioContext (synth only)
  const soundRef    = useRef(null);   // { stop() } handle
  const timerRef    = useRef(null);
  const breathRef   = useRef(null);
  const wakeLockRef = useRef(null);   // Screen Wake Lock API

  const breathwork = BREATHWORK.find(b => b.id === selectedBreath);
  const sound      = ALL_SOUNDS.find(s => s.id === selectedSound);

  // ── Wake Lock — keeps screen on during active session ──
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  };
  const releaseWakeLock = () => {
    try { if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; } } catch {}
  };

  const handleStart = () => {
    setLoading(true);
    requestWakeLock();
    try {
      soundRef.current = createAmbientSound(sound.id, audioElRef, audioCtxRef);
    } catch(e) { console.warn("Audio init:", e); }

    setTimeout(() => {
      setLoading(false);
      setPhase("active");
      setTimer(0); setBreathPhaseIdx(0); setBreathCount(0); setBreathScale(1);

      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

      if (breathwork.pattern.length > 0) {
        let pI = 0, cI = 0;
        breathRef.current = setInterval(() => {
          cI++;
          setBreathCount(cI);
          if (cI >= breathwork.pattern[pI]) {
            cI = 0; pI = (pI + 1) % breathwork.pattern.length;
            setBreathPhaseIdx(pI); setBreathCount(0);
          }
          const pName = breathwork.phases[pI]?.toLowerCase() || "";
          setBreathScale(pName === "inhale" ? 1.35 : 1);
        }, 1000);
      }
    }, 300);
  };

  const handleStop = () => {
    clearInterval(timerRef.current);
    clearInterval(breathRef.current);
    releaseWakeLock();
    try { if (soundRef.current) soundRef.current.stop(); } catch {}
    localStorage.setItem("unfiltr_just_meditated", JSON.stringify({
      timestamp: Date.now(), duration: timer,
      sound: sound.label, breathwork: breathwork.label,
    }));
    setPhase("done");
  };

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(breathRef.current);
    releaseWakeLock();
    try { if (soundRef.current) soundRef.current.stop(); } catch {}
  }, []);

  // Re-acquire wake lock if page regains visibility
  useEffect(() => {
    const onVisible = async () => {
      if (phase === "active" && document.visibilityState === "visible") {
        if (!wakeLockRef.current) await requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [phase]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const curPhaseName = breathwork.pattern.length > 0 ? breathwork.phases[breathPhaseIdx] || "Breathe" : "";
  const curPhaseDur  = breathwork.pattern[breathPhaseIdx] || 1;

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const mins = Math.floor(timer/60), secs = timer%60;
    return (
      <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 28px" }}>
        <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:"spring", damping:16 }}
          style={{ textAlign:"center", width:"100%", maxWidth:320 }}>
          <div style={{ fontSize:72, marginBottom:16 }}>🧘</div>
          <h2 style={{ color:"white", fontWeight:800, fontSize:26, margin:"0 0 8px" }}>Session complete</h2>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:15, margin:"0 0 6px" }}>
            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} · {sound.label} · {breathwork.label}
          </p>
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
      <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:"max(52px,env(safe-area-inset-top)) 24px 52px" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:4 }}>
            <img src={sound.icon} alt="" style={{ width:24, height:24, borderRadius:6, objectFit:"cover" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>{sound.label} · {breathwork.label}</p>
          </div>
          <p style={{ color:"rgba(255,255,255,0.12)", fontSize:44, fontWeight:200, margin:0, letterSpacing:6 }}>{fmt(timer)}</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
          <div style={{ position:"relative", width:220, height:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <motion.div
              animate={{ scale: breathwork.pattern.length > 0 ? [1, breathScale * 1.15, 1] : [1,1.22,1] }}
              transition={ breathwork.pattern.length > 0
                ? { duration: curPhaseDur * 1.1, ease:"easeInOut", repeat:0 }
                : { repeat:Infinity, duration:4.5, ease:"easeInOut" }
              }
              style={{ position:"absolute", width:210, height:210, borderRadius:"50%", border:"1px solid rgba(168,85,247,0.12)", pointerEvents:"none" }}
            />
            <motion.div
              animate={{ scale: breathwork.pattern.length > 0 ? [1, breathScale * 1.08, 1] : [1,1.13,1] }}
              transition={ breathwork.pattern.length > 0
                ? { duration: curPhaseDur, ease:"easeInOut", repeat:0 }
                : { repeat:Infinity, duration:4, ease:"easeInOut", delay:0.3 }
              }
              style={{ position:"absolute", width:196, height:196, borderRadius:"50%", border:"1.5px solid rgba(168,85,247,0.22)", pointerEvents:"none" }}
            />
            <motion.div
              animate={{ scale: breathwork.pattern.length > 0 ? breathScale : [1,1.1,1] }}
              transition={ breathwork.pattern.length > 0
                ? { duration: curPhaseDur, ease: curPhaseName.toLowerCase()==="inhale" ? "easeIn" : "easeOut" }
                : { repeat:Infinity, duration:4, ease:"easeInOut" }
              }
              style={{ width:180, height:180, borderRadius:"50%",
                background:"radial-gradient(circle at 40% 35%, rgba(168,85,247,0.65) 0%, rgba(219,39,119,0.3) 50%, rgba(6,2,15,0.2) 100%)",
                boxShadow:"0 0 60px rgba(168,85,247,0.45), 0 0 120px rgba(168,85,247,0.18)",
                display:"flex", alignItems:"center", justifyContent:"center", position:"relative", zIndex:2 }}
            >
              {breathwork.pattern.length > 0 && (
                <div style={{ textAlign:"center" }}>
                  <p style={{ color:"white", fontWeight:700, fontSize:18, margin:"0 0 2px" }}>{curPhaseName}</p>
                  <p style={{ color:"rgba(255,255,255,0.45)", fontSize:13, margin:0 }}>{curPhaseDur - breathCount}s</p>
                </div>
              )}
            </motion.div>
          </div>
          {breathwork.pattern.length > 0 && (
            <div style={{ display:"flex", gap:8 }}>
              {breathwork.phases.map((_,i) => (
                <div key={i} style={{ width:i===breathPhaseIdx?24:8, height:8, borderRadius:4,
                  background:i===breathPhaseIdx?"#a855f7":"rgba(255,255,255,0.1)", transition:"all 0.3s" }} />
              ))}
            </div>
          )}
        </div>

        <motion.button whileTap={{ scale:0.95 }} onClick={handleStop}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 32px",
            background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:50, color:"white", fontWeight:600, fontSize:15, cursor:"pointer" }}>
          <StopCircle size={18} color="rgba(255,255,255,0.6)" />
          End session
        </motion.button>
      </div>
    );
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  const currentSounds = tab === "classic" ? SOUNDS_CLASSIC : SOUNDS_WORLD;

  return (
    <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"max(14px,env(safe-area-inset-top)) 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
        <button onClick={() => navigate(-1)} style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color:"white", fontWeight:700, fontSize:20, margin:0, flex:1 }}>Meditate</h1>
        <span style={{ fontSize:24 }}>🧘</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 120px" }}>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:8, marginBottom:20, background:"rgba(255,255,255,0.05)", borderRadius:12, padding:4 }}>
          {["classic","world"].map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedSound(t === "classic" ? "rain" : "moonlit"); }}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
                background: tab === t ? "rgba(168,85,247,0.7)" : "transparent",
                color: tab === t ? "white" : "rgba(255,255,255,0.4)",
                transition:"all 0.2s"
              }}>
              {t === "classic" ? "🌿 Classic" : "🌍 World"}
            </button>
          ))}
        </div>

        {/* Sound grid */}
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Ambient Sound</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:28 }}>
          {currentSounds.map(s => (
            <button key={s.id} onClick={() => setSelectedSound(s.id)}
              style={{ padding:"12px 8px 10px", borderRadius:14,
                border: selectedSound===s.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                background: selectedSound===s.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
                cursor:"pointer", textAlign:"center" }}>
              <img src={s.icon} alt={s.label}
                style={{ width:48, height:48, borderRadius:10, objectFit:"cover", marginBottom:6, display:"block", margin:"0 auto 6px" }} />
              <span style={{ color:selectedSound===s.id?"white":"rgba(255,255,255,0.6)", fontWeight:selectedSound===s.id?700:500, fontSize:11, display:"block" }}>{s.label}</span>
              <span style={{ color:"rgba(255,255,255,0.25)", fontSize:9, display:"block", marginTop:2, lineHeight:1.3 }}>{s.desc}</span>
            </button>
          ))}
        </div>

        {/* Breathwork */}
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Breathing Technique</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32 }}>
          {BREATHWORK.map(b => (
            <button key={b.id} onClick={() => setSelectedBreath(b.id)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14,
                border: selectedBreath===b.id ? "2px solid #db2777" : "1px solid rgba(255,255,255,0.08)",
                background: selectedBreath===b.id ? "rgba(219,39,119,0.15)" : "rgba(255,255,255,0.04)",
                cursor:"pointer", textAlign:"left" }}>
              <div style={{ flex:1 }}>
                <p style={{ color:selectedBreath===b.id?"white":"rgba(255,255,255,0.7)", fontWeight:selectedBreath===b.id?700:500, fontSize:14, margin:"0 0 2px" }}>{b.label}</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, margin:0 }}>{b.desc}</p>
              </div>
              {selectedBreath===b.id && <div style={{ width:10, height:10, borderRadius:"50%", background:"#db2777", flexShrink:0 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 16px max(24px,env(safe-area-inset-bottom))", background:"linear-gradient(to top, #06020f 60%, transparent)", flexShrink:0 }}>
        <motion.button whileTap={{ scale:0.97 }} onClick={handleStart} disabled={loading}
          style={{ width:"100%", padding:"17px", background: loading ? "rgba(168,85,247,0.4)" : "linear-gradient(135deg,#7c3aed,#db2777)",
            border:"none", borderRadius:16, color:"white", fontWeight:700, fontSize:16, cursor: loading ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {loading ? "Starting…" : "Begin Session ✦"}
        </motion.button>
      </div>
    </div>
  );
}
