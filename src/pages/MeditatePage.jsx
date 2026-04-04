import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Play, StopCircle } from "lucide-react";

// Real recorded ambient audio — hosted on Base44 CDN
const AUDIO_URLS = {
  // 🌧️ Rain: Mixkit storm page ID 2404 — 1:39 stereo rain+thunder loop, 249kbps
  rain:  "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/334bf1ba7_rain_v2.mp3",
  // 🔥 Fire: Mixkit fire page ID 1330 — "Campfire crackles", 24s stereo 307kbps loop
  fire:  "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/9b687983d_fire_v2.mp3",
  // 🌊 Ocean: Mixkit beach page ID 1208 — 1:17 stereo beach waves loop, 246kbps
  ocean: "https://media.base44.com/files/public/69b22f8b58e45d23cafd78d2/07f3c59f3_ocean_v2.mp3",
};

const SOUNDS = [
  { id: "rain",    emoji: "🌧️", label: "Rainy Day",    desc: "Rain + soft thunder" },
  { id: "fire",    emoji: "🔥", label: "Cabin Fire",    desc: "Warm crackling fireplace" },
  { id: "ocean",   emoji: "🌊", label: "Beach Waves",   desc: "Ocean shore & seabirds" },
  { id: "brown",   emoji: "🌫️", label: "Brown Noise",   desc: "Deep & grounding" },
  { id: "pink",    emoji: "🌸", label: "Pink Noise",    desc: "Best for sleep & anxiety" },
  { id: "silence", emoji: "🤫", label: "Silence",       desc: "Breath guide only" },
];

const BREATHWORK = [
  { id: "478",    label: "4-7-8",         desc: "Inhale 4 · Hold 7 · Exhale 8",   pattern: [4,7,8],   phases: ["Inhale","Hold","Exhale"] },
  { id: "box",    label: "Box Breathing", desc: "In 4 · Hold 4 · Out 4 · Hold 4", pattern: [4,4,4,4], phases: ["Inhale","Hold","Exhale","Hold"] },
  { id: "simple", label: "4-4 Simple",    desc: "Inhale 4 · Exhale 4",            pattern: [4,4],     phases: ["Inhale","Exhale"] },
  { id: "none",   label: "Just Ambience", desc: "No breathing guide",             pattern: [],        phases: [] },
];

// ── Synthesized noise (brown / pink) ─────────────────────────────────────────
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

  // Real recordings — load via fetch → AudioBuffer → loop
  if (type === "rain" || type === "fire" || type === "ocean") {
    const url = AUDIO_URLS[type];
    let sourceNode = null;
    let stopped = false;

    fetch(url)
      .then(r => r.arrayBuffer())
      .then(ab => ctx.decodeAudioData(ab))
      .then(decoded => {
        if (stopped) return;
        sourceNode = ctx.createBufferSource();
        sourceNode.buffer = decoded;
        sourceNode.loop = true;
        sourceNode.loopStart = 0;
        sourceNode.loopEnd = decoded.duration;
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

  // Synthesized: brown noise
  if (type === "brown") {
    const buf = makeBrownBuf(ctx, 6);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass"; lpf.frequency.value = 700;
    src.connect(lpf); lpf.connect(master);
    src.start();
    return {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        setTimeout(() => { try { src.stop(); ctx.close(); } catch {} }, 1600);
      }
    };
  }

  // Synthesized: pink noise
  if (type === "pink") {
    const buf = makePinkBuf(ctx, 4);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.connect(master);
    src.start();
    return {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        setTimeout(() => { try { src.stop(); ctx.close(); } catch {} }, 1600);
      }
    };
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
  const sound      = SOUNDS.find(s => s.id === selectedSound);

  const handleStart = () => {
    setLoading(true);
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      soundRef.current    = createAmbientSound(sound.id, audioCtxRef.current);
    } catch(e) { console.warn("Audio init:", e); }

    // Small delay so iOS AudioContext unlocks properly
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
          <h2 style={{ color:"white", fontWeight:800, fontSize:26, margin:"0 0 8px" }}>Session complete</h2>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:15, margin:"0 0 6px" }}>
            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} · {sound.emoji} {sound.label} · {breathwork.label}
          </p>
          <p style={{ color:"rgba(168,85,247,0.8)", fontSize:13, margin:"0 0 32px" }}>Your companion will check in when you chat 💜</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => { const hasChatSession = localStorage.getItem("unfiltr_chat_history"); navigate(hasChatSession ? "/chat" : "/hub"); }}
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
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, margin:"0 0 2px" }}>{sound.emoji} {sound.label} · {breathwork.label}</p>
          <p style={{ color:"rgba(255,255,255,0.12)", fontSize:44, fontWeight:200, margin:0, letterSpacing:6 }}>{fmt(timer)}</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
          {/* Outer pulse rings */}
          <div style={{ position:"relative", width:220, height:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {/* Ring 3 — outermost ambient pulse */}
            <motion.div
              animate={{ scale: breathwork.pattern.length > 0 ? [1, breathScale * 1.15, 1] : [1,1.22,1] }}
              transition={ breathwork.pattern.length > 0
                ? { duration: curPhaseDur * 1.1, ease:"easeInOut", repeat:0 }
                : { repeat:Infinity, duration:4.5, ease:"easeInOut" }
              }
              style={{ position:"absolute", width:210, height:210, borderRadius:"50%",
                border:"1px solid rgba(168,85,247,0.12)", pointerEvents:"none" }}
            />
            {/* Ring 2 — middle ring */}
            <motion.div
              animate={{ scale: breathwork.pattern.length > 0 ? [1, breathScale * 1.08, 1] : [1,1.13,1] }}
              transition={ breathwork.pattern.length > 0
                ? { duration: curPhaseDur, ease:"easeInOut", repeat:0 }
                : { repeat:Infinity, duration:4, ease:"easeInOut", delay:0.3 }
              }
              style={{ position:"absolute", width:196, height:196, borderRadius:"50%",
                border:"1.5px solid rgba(168,85,247,0.22)", pointerEvents:"none" }}
            />
            {/* Core breathing orb */}
            <motion.div
              animate={{ scale: breathwork.pattern.length > 0 ? breathScale : [1,1.1,1] }}
              transition={ breathwork.pattern.length > 0
                ? { duration: curPhaseDur, ease: curPhaseName.toLowerCase()==="inhale" ? "easeIn" : "easeOut" }
                : { repeat:Infinity, duration:4, ease:"easeInOut" }
              }
              style={{ width:180, height:180, borderRadius:"50%",
                background:"radial-gradient(circle at 40% 35%, rgba(168,85,247,0.65) 0%, rgba(219,39,119,0.3) 50%, rgba(6,2,15,0.2) 100%)",
                boxShadow:"0 0 60px rgba(168,85,247,0.45), 0 0 120px rgba(168,85,247,0.18)",
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative", zIndex:2,
              }}
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
  return (
    <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"max(14px,env(safe-area-inset-top)) 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
        <button onClick={() => navigate(-1)} style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color:"white", fontWeight:700, fontSize:20, margin:0, flex:1 }}>Meditate</h1>
        <span style={{ fontSize:24 }}>🧘</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 120px" }}>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Ambient Sound</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:28 }}>
          {SOUNDS.map(s => (
            <button key={s.id} onClick={() => setSelectedSound(s.id)}
              style={{ padding:"14px 8px", borderRadius:14,
                border: selectedSound===s.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                background: selectedSound===s.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
                cursor:"pointer", textAlign:"center" }}>
              <span style={{ fontSize:24, display:"block", marginBottom:4 }}>{s.emoji}</span>
              <span style={{ color:selectedSound===s.id?"white":"rgba(255,255,255,0.5)", fontWeight:selectedSound===s.id?700:500, fontSize:11, display:"block" }}>{s.label}</span>
              <span style={{ color:"rgba(255,255,255,0.25)", fontSize:10, display:"block", marginTop:2 }}>{s.desc}</span>
            </button>
          ))}
        </div>

        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Breathing Technique</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32 }}>
          {BREATHWORK.map(b => (
            <button key={b.id} onClick={() => setSelectedBreath(b.id)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14,
                border: selectedBreath===b.id ? "2px solid #db2777" : "1px solid rgba(255,255,255,0.08)",
                background: selectedBreath===b.id ? "rgba(219,39,119,0.12)" : "rgba(255,255,255,0.04)",
                cursor:"pointer", textAlign:"left" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:selectedBreath===b.id?"#db2877":"rgba(255,255,255,0.15)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ color:selectedBreath===b.id?"white":"rgba(255,255,255,0.7)", fontWeight:selectedBreath===b.id?700:500, fontSize:14, margin:"0 0 2px" }}>{b.label}</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, margin:0 }}>{b.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale:0.97 }}
          onClick={handleStart}
          disabled={loading}
          style={{ width:"100%", padding:"16px", background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#db2777)", border:"none", borderRadius:16, color:"white", fontWeight:700, fontSize:16, cursor: loading ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 4px 24px rgba(124,58,237,0.4)", opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <>
              <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", animation:"spin 0.8s linear infinite" }} />
              Loading...
            </>
          ) : (
            <><Play size={18} fill="white" /> Begin Session</>
          )}
        </motion.button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

