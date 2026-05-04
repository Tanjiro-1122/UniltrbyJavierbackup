import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

// ── Audio URLs — all hosted on Base44 CDN ─────────────────────────────────────
const AUDIO_URLS = {
  rain:          "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/334bf1ba7_rain_v2.mp3",
  fire:          "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/9b687983d_fire_v2.mp3",
  ocean:         "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/07f3c59f3_ocean_v2.mp3",
  forest:        "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/e3b94965a_forest_v2.mp3",
  earlymorning:  "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/226d0b352_early_morning.mp3",
  creek:         "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/54a09f5d8_creek.mp3",
  aquarium:      "https://media.base44.com/files/public/69c83ef77b8d9fdcb0a754f5/b8be7b568_aquarium.mp3",
};

// ── Sound definitions with rich icon art ─────────────────────────────────────
const SOUNDS_AMBIENT = [
  {
    id: "rain",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M36 20c0-6.627-5.373-12-12-12S12 13.373 12 20c-3.866 0-7 3.134-7 7s3.134 7 7 7h24c3.866 0 7-3.134 7-7s-3.134-7-7-7z" fill="#7dd3fc" opacity=".9"/>
        <line x1="16" y1="38" x2="14" y2="44" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="22" y1="38" x2="20" y2="44" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="28" y1="38" x2="26" y2="44" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="34" y1="38" x2="32" y2="44" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
    label: "Rainy Day",
    desc: "Rain + soft thunder",
    color: "#1e3a5f",
    accent: "#7dd3fc",
  },
  {
    id: "fire",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M24 6c0 0-2 6-6 9-2 1.5-3 4-3 6 0 5.523 4.03 10 9 10s9-4.477 9-10c0-4-3-7-3-7s-1 5-3 6c0 0 2-7-3-14z" fill="#fb923c"/>
        <path d="M24 22c0 0-1 3-3 4.5-.8.6-1 2-1 3 0 2.21 1.79 4 4 4s4-1.79 4-4c0-1.5-1-3-1-3s-.5 2-1.5 2.5C25.5 29 26 25 24 22z" fill="#fef08a"/>
      </svg>
    ),
    label: "Cabin Fire",
    desc: "Warm crackling fireplace",
    color: "#3b1a0a",
    accent: "#fb923c",
  },
  {
    id: "ocean",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M6 28c3 0 3-4 6-4s3 4 6 4 3-4 6-4 3 4 6 4 3-4 6-4" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M6 34c3 0 3-4 6-4s3 4 6 4 3-4 6-4 3 4 6 4 3-4 6-4" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
        <path d="M6 22c3 0 3-4 6-4s3 4 6 4 3-4 6-4 3 4 6 4 3-4 6-4" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
        <circle cx="34" cy="12" r="5" fill="#fde68a" opacity=".9"/>
      </svg>
    ),
    label: "Beach Waves",
    desc: "Ocean shore & seabirds",
    color: "#0c2a3b",
    accent: "#38bdf8",
  },
  {
    id: "forest",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <polygon points="24,8 34,26 14,26" fill="#4ade80" opacity=".9"/>
        <polygon points="24,16 36,36 12,36" fill="#22c55e"/>
        <rect x="21" y="36" width="6" height="7" rx="1" fill="#92400e"/>
      </svg>
    ),
    label: "Deep Forest",
    desc: "Birds & rustling trees",
    color: "#0a2213",
    accent: "#4ade80",
  },
  {
    id: "earlymorning",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M8 28c8-8 12-16 16-20 4 4 8 12 16 20" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".4"/>
        <circle cx="24" cy="18" r="7" fill="#fde68a"/>
        <path d="M24 8V5M24 31v-3M14 18h-3M37 18h-3M17 11l-2-2M33 11l2-2" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 38c7 0 7-5 14-5s7 5 14 5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" opacity=".5"/>
      </svg>
    ),
    label: "Early Morning",
    desc: "Birdsong at dawn",
    color: "#2a1f00",
    accent: "#fbbf24",
  },
  {
    id: "creek",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M6 32c4-2 6-6 10-6s6 4 10 4 6-4 10-4 6 2 6 2" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M6 38c4-2 6-5 10-5s6 3 10 3 6-3 10-3 6 2 6 2" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".6"/>
        <ellipse cx="12" cy="18" rx="4" ry="8" fill="#4ade80" opacity=".6" transform="rotate(-15 12 18)"/>
        <ellipse cx="36" cy="16" rx="3" ry="7" fill="#4ade80" opacity=".5" transform="rotate(10 36 16)"/>
        <circle cx="22" cy="28" r="1.5" fill="#a5f3fc" opacity=".8"/>
        <circle cx="30" cy="31" r="1" fill="#a5f3fc" opacity=".6"/>
      </svg>
    ),
    label: "Babbling Creek",
    desc: "Flowing stream & stones",
    color: "#0a2a2a",
    accent: "#67e8f9",
  },
  {
    id: "aquarium",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <rect x="6" y="10" width="36" height="28" rx="4" stroke="#38bdf8" strokeWidth="2" fill="#0c4a6e" opacity=".6"/>
        <path d="M14 28c2-4 4-2 6 0s4 2 6 0 4-2 6 0" stroke="#38bdf8" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="18" cy="24" rx="4" ry="2.5" fill="#fb923c" opacity=".9" transform="rotate(-5 18 24)"/>
        <line x1="16" y1="21" x2="20" y2="21" stroke="#ffffff" strokeWidth=".8" opacity=".5"/>
        <circle cx="15.5" cy="23" r="1" fill="#1c1917"/>
        <ellipse cx="32" cy="20" rx="3" ry="2" fill="#a3e635" opacity=".8" transform="rotate(10 32 20)"/>
        <circle cx="29.5" cy="19" r=".8" fill="#1c1917"/>
        <circle cx="24" cy="32" r="1.5" fill="#67e8f9" opacity=".5"/>
        <circle cx="30" cy="30" r="1" fill="#67e8f9" opacity=".4"/>
        <circle cx="16" cy="33" r="1.2" fill="#67e8f9" opacity=".3"/>
      </svg>
    ),
    label: "Aquarium",
    desc: "Gentle bubbles & fish",
    color: "#03192b",
    accent: "#38bdf8",
  },
  {
    id: "brown",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M6 24 Q10 18 14 24 Q18 30 22 24 Q26 18 30 24 Q34 30 38 24 Q42 18 46 24" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M6 30 Q10 24 14 30 Q18 36 22 30 Q26 24 30 30 Q34 36 38 30 Q42 24 46 30" stroke="#b45309" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".5"/>
        <path d="M6 18 Q10 14 14 18 Q18 22 22 18 Q26 14 30 18 Q34 22 38 18 Q42 14 46 18" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".3"/>
      </svg>
    ),
    label: "Brown Noise",
    desc: "Deep & grounding",
    color: "#1c0f00",
    accent: "#d97706",
  },
  {
    id: "pink",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M6 24 Q8 20 10 24 Q12 28 14 22 Q16 16 18 24 Q20 32 22 24 Q24 16 26 22 Q28 28 30 24 Q32 20 34 26 Q36 32 38 24 Q40 16 42 24" stroke="#f9a8d4" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M6 30 Q9 26 12 30 Q15 34 18 30 Q21 26 24 30 Q27 34 30 30 Q33 26 36 30 Q39 34 42 30" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".4"/>
      </svg>
    ),
    label: "Pink Noise",
    desc: "Best for sleep & anxiety",
    color: "#2a0a1a",
    accent: "#f9a8d4",
  },
  {
    id: "silence",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <circle cx="24" cy="24" r="16" stroke="#a78bfa" strokeWidth="2" opacity=".5"/>
        <circle cx="24" cy="24" r="10" stroke="#a78bfa" strokeWidth="1.5" opacity=".3"/>
        <circle cx="24" cy="24" r="4" fill="#a78bfa" opacity=".8"/>
        <path d="M16 16l16 16M32 16L16 32" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" opacity=".0"/>
      </svg>
    ),
    label: "Silence",
    desc: "Breath guide only",
    color: "#120a2a",
    accent: "#a78bfa",
  },
];

const BREATHWORK = [
  { id: "478",    label: "4-7-8",         desc: "Inhale 4 · Hold 7 · Exhale 8",   pattern: [4,7,8],   phases: ["Inhale","Hold","Exhale"] },
  { id: "box",    label: "Box Breathing", desc: "In 4 · Hold 4 · Out 4 · Hold 4", pattern: [4,4,4,4], phases: ["Inhale","Hold","Exhale","Hold"] },
  { id: "simple", label: "4-4 Simple",    desc: "Inhale 4 · Exhale 4",            pattern: [4,4],     phases: ["Inhale","Exhale"] },
  { id: "none",   label: "Just Ambience", desc: "No breathing guide",             pattern: [],        phases: [] },
];

// ── Synthesized noise ─────────────────────────────────────────────────────────
function makeBrownBuf(ctx, secs = 4) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    d[i] = (last + 0.02 * w) / 1.02;
    last = d[i];
    d[i] *= 3.5;
    if (d[i] > 1) d[i] = 1;
    if (d[i] < -1) d[i] = -1;
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
    d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
    b6 = w*0.115926;
  }
  return buf;
}

// ── Audio engine ──────────────────────────────────────────────────────────────
function createAmbientSound(type, ctx) {
  if (type === "silence") return null;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 3);
  master.connect(ctx.destination);

  if (AUDIO_URLS[type]) {
    let sourceNode = null;
    let stopped = false;
    fetch(AUDIO_URLS[type])
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

  if (type === "brown") {
    const buf = makeBrownBuf(ctx, 6);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass"; lpf.frequency.value = 700;
    src.connect(lpf); lpf.connect(master);
    src.start();
    return { stop: () => { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); setTimeout(() => { try { src.stop(); ctx.close(); } catch {} }, 1600); }};
  }
  if (type === "pink") {
    const buf = makePinkBuf(ctx, 4);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.connect(master); src.start();
    return { stop: () => { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); setTimeout(() => { try { src.stop(); ctx.close(); } catch {} }, 1600); }};
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MeditatePage() {
  const navigate = useNavigate();
  const [selectedSound,  setSelectedSound]  = useState("rain");
  const [selectedBreath, setSelectedBreath] = useState("478");
  const [phase,          setPhase]          = useState("setup");
  const [timer,          setTimer]          = useState(0);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCount,    setBreathCount]    = useState(0);
  const [breathScale,    setBreathScale]    = useState(1);
  const [loading,        setLoading]        = useState(false);
  const audioCtxRef = useRef(null);
  const soundRef    = useRef(null);
  const timerRef    = useRef(null);
  const breathRef   = useRef(null);

  const breathwork = BREATHWORK.find(b => b.id === selectedBreath);
  const sound      = SOUNDS_AMBIENT.find(s => s.id === selectedSound);

  const handleStart = () => {
    setLoading(true);
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      soundRef.current    = createAmbientSound(sound.id, audioCtxRef.current);
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
    try { if (soundRef.current) soundRef.current.stop(); } catch {}
    localStorage.setItem("unfiltr_just_meditated", JSON.stringify({
      timestamp: Date.now(), duration: timer,
      sound: sound.label, breathwork: breathwork.label,
    }));
    setPhase("done");
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(breathRef.current);
    try { if (soundRef.current) soundRef.current.stop(); } catch {}
  }, []);

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
          <h2 style={{ color:"white", fontWeight:800, fontSize:26, margin:"0 0 8px" }}>Session Complete</h2>
          <p style={{ color:"#a78bfa", fontSize:16, margin:"0 0 28px" }}>
            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} of {sound?.label}
          </p>
          <button onClick={() => navigate(-1)} style={{ background:"#7c3aed", color:"white", border:"none", borderRadius:14, padding:"14px 36px", fontSize:16, fontWeight:700, cursor:"pointer", width:"100%" }}>
            Done
          </button>
          <button onClick={() => { setPhase("setup"); setTimer(0); }} style={{ background:"transparent", color:"#a78bfa", border:"none", fontSize:14, marginTop:14, cursor:"pointer" }}>
            Go again
          </button>
        </motion.div>
      </div>
    );
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  if (phase === "active") {
    const companion = JSON.parse(localStorage.getItem("unfiltr_companion") || "null");
    const avatarUrl = companion?.avatar || null;
    return (
      <div style={{ position:"fixed", inset:0, background: sound?.color || "#06020f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {avatarUrl && (
          <motion.img src={avatarUrl} alt="companion" animate={{ scale: breathScale }} transition={{ duration: curPhaseDur * 0.9, ease:"easeInOut" }}
            style={{ width:140, height:140, borderRadius:"50%", objectFit:"cover", marginBottom:24, boxShadow:`0 0 40px ${sound?.accent || "#a78bfa"}66` }} />
        )}
        {!avatarUrl && (
          <motion.div animate={{ scale: breathScale }} transition={{ duration: curPhaseDur * 0.9, ease:"easeInOut" }}
            style={{ width:130, height:130, borderRadius:"50%", background:`radial-gradient(circle, ${sound?.accent || "#a78bfa"}55, ${sound?.color || "#06020f"})`,
              boxShadow:`0 0 60px ${sound?.accent || "#a78bfa"}77`, marginBottom:24, border:`2px solid ${sound?.accent || "#a78bfa"}44` }} />
        )}
        {curPhaseName && (
          <>
            <p style={{ color:"white", fontSize:22, fontWeight:700, margin:"0 0 4px", letterSpacing:1 }}>{curPhaseName}</p>
            <p style={{ color: sound?.accent || "#a78bfa", fontSize:38, fontWeight:800, margin:"0 0 20px", fontVariantNumeric:"tabular-nums" }}>
              {breathCount}
            </p>
          </>
        )}
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:22, fontVariantNumeric:"tabular-nums", margin:"0 0 36px" }}>{fmt(timer)}</p>
        <button onClick={handleStop} style={{ background:"rgba(255,255,255,0.12)", color:"white", border:`1.5px solid ${sound?.accent || "#a78bfa"}66`, borderRadius:40, padding:"13px 40px", fontSize:15, fontWeight:600, cursor:"pointer", backdropFilter:"blur(10px)" }}>
          End Session
        </button>
      </div>
    );
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, background:"#06020f", overflowY:"auto" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", padding:"52px 20px 8px", gap:8 }}>
        <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", color:"#a78bfa", cursor:"pointer", padding:4, display:"flex" }}>
          <ChevronLeft size={22} />
        </button>
        <h1 style={{ color:"white", fontWeight:800, fontSize:20, margin:0 }}>Meditate</h1>
      </div>

      <div style={{ padding:"0 20px 120px" }}>

        {/* ── Sound Grid ───────────────────────────────────────────────── */}
        <h2 style={{ color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", margin:"24px 0 12px" }}>
          Ambient Sound
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10 }}>
          {SOUNDS_AMBIENT.map(s => {
            const active = selectedSound === s.id;
            return (
              <motion.button key={s.id} whileTap={{ scale: 0.96 }} onClick={() => setSelectedSound(s.id)}
                style={{
                  background: active ? s.color : "rgba(255,255,255,0.04)",
                  border: active ? `1.5px solid ${s.accent}` : "1.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "14px 12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: active ? `0 0 18px ${s.accent}33` : "none",
                }}>
                <div style={{ background: active ? `${s.accent}22` : "rgba(255,255,255,0.06)", borderRadius: 10, padding: 8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ color: active ? "white" : "rgba(255,255,255,0.7)", fontWeight:700, fontSize:13, margin:0, lineHeight:1.3 }}>{s.label}</p>
                  <p style={{ color: active ? s.accent : "rgba(255,255,255,0.35)", fontWeight:400, fontSize:11, margin:"3px 0 0", lineHeight:1.4 }}>{s.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ── Breathwork ───────────────────────────────────────────────── */}
        <h2 style={{ color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", margin:"28px 0 12px" }}>
          Breathing Pattern
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {BREATHWORK.map(b => {
            const active = selectedBreath === b.id;
            return (
              <motion.button key={b.id} whileTap={{ scale:0.98 }} onClick={() => setSelectedBreath(b.id)}
                style={{ background: active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)", border: active ? "1.5px solid #7c3aed" : "1.5px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", flexDirection:"column", textAlign:"left", gap:2 }}>
                <span style={{ color: active ? "white" : "rgba(255,255,255,0.7)", fontWeight:700, fontSize:14 }}>{b.label}</span>
                <span style={{ color: active ? "#a78bfa" : "rgba(255,255,255,0.35)", fontSize:12 }}>{b.desc}</span>
              </motion.button>
            );
          })}
        </div>

        {/* ── Start button ─────────────────────────────────────────────── */}
        <motion.button whileTap={{ scale:0.97 }} onClick={handleStart} disabled={loading}
          style={{ width:"100%", marginTop:28, background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #6d28d9)", color:"white", border:"none", borderRadius:16, padding:"18px 0", fontSize:17, fontWeight:800, cursor: loading ? "default" : "pointer", boxShadow:"0 4px 24px rgba(124,58,237,0.4)" }}>
          {loading ? "Loading audio…" : "Begin Session"}
        </motion.button>
      </div>
    </div>
  );
}
