import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, Pause, StopCircle } from "lucide-react";

const SOUNDS = [
  { id: "rain",    emoji: "🌧️", label: "Rain",       freq: 200, type: "rain" },
  { id: "forest",  emoji: "🌲", label: "Forest",     freq: 440, type: "forest" },
  { id: "ocean",   emoji: "🌊", label: "Ocean",      freq: 150, type: "ocean" },
  { id: "fire",    emoji: "🔥", label: "Fire",       freq: 100, type: "fire" },
  { id: "space",   emoji: "🌌", label: "Space",      freq: 80,  type: "space" },
  { id: "silence", emoji: "🤫", label: "Silence",    freq: 0,   type: "silence" },
];

const BREATHWORK = [
  { id: "478",    label: "4-7-8",         desc: "Inhale 4 · Hold 7 · Exhale 8",  pattern: [4,7,8],  phases: ["Inhale","Hold","Exhale"] },
  { id: "box",    label: "Box Breathing", desc: "In 4 · Hold 4 · Out 4 · Hold 4", pattern: [4,4,4,4], phases: ["Inhale","Hold","Exhale","Hold"] },
  { id: "simple", label: "4-4 Simple",    desc: "Inhale 4 · Exhale 4",           pattern: [4,4],    phases: ["Inhale","Exhale"] },
  { id: "none",   label: "Just Ambience", desc: "No breathing guide",            pattern: [],       phases: [] },
];

// ── Ambient sound engine (Web Audio API) ────────────────────────────────────
function createAmbientSound(type, audioCtx) {
  if (type === "silence" || type === "none") return null;

  const nodes = [];
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 2);
  masterGain.connect(audioCtx.destination);

  if (type === "rain") {
    const bufSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = audioCtx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 3000; filter.Q.value = 0.5;
    src.connect(filter); filter.connect(masterGain);
    src.start(); nodes.push(src);
  } else if (type === "ocean") {
    for (let w = 0; w < 3; w++) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = "sine"; osc.frequency.value = 0.08 + w * 0.03;
      g.gain.value = 0.04;
      const noise = audioCtx.createOscillator();
      noise.type = "sawtooth"; noise.frequency.value = 180 + w * 40;
      const nGain = audioCtx.createGain(); nGain.gain.value = 0.06;
      osc.connect(g); g.connect(masterGain);
      noise.connect(nGain); nGain.connect(masterGain);
      osc.start(); noise.start();
      nodes.push(osc, noise);
    }
  } else if (type === "forest") {
    const bufSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const src = audioCtx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 800;
    src.connect(filter); filter.connect(masterGain);
    src.start(); nodes.push(src);
    for (let b = 0; b < 2; b++) {
      const bird = audioCtx.createOscillator();
      const bGain = audioCtx.createGain();
      bird.type = "sine"; bird.frequency.value = 800 + b * 300;
      bGain.gain.value = 0; bird.connect(bGain); bGain.connect(masterGain);
      bird.start(); nodes.push(bird);
      const chirpInterval = setInterval(() => {
        const now = audioCtx.currentTime;
        bGain.gain.setValueAtTime(0, now);
        bGain.gain.linearRampToValueAtTime(0.04, now + 0.05);
        bGain.gain.linearRampToValueAtTime(0, now + 0.3);
      }, 3000 + b * 2000 + Math.random() * 1000);
      nodes._chirp = chirpInterval;
    }
  } else if (type === "fire") {
    const bufSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const src = audioCtx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 400;
    src.connect(filter); filter.connect(masterGain);
    src.start(); nodes.push(src);
  } else if (type === "space") {
    for (let i = 0; i < 2; i++) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = "sine"; osc.frequency.value = 60 + i * 7;
      g.gain.value = 0.06;
      osc.connect(g); g.connect(masterGain);
      osc.start(); nodes.push(osc);
    }
  }

  return { nodes, masterGain, stop: () => {
    if (nodes._chirp) clearInterval(nodes._chirp);
    masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    setTimeout(() => { try { nodes.forEach(n => n.stop && n.stop()); } catch {} }, 1600);
  }};
}

export default function MeditatePage() {
  const navigate = useNavigate();
  const [selectedSound, setSelectedSound] = useState("rain");
  const [selectedBreath, setSelectedBreath] = useState("478");
  const [phase, setPhase] = useState("setup"); // setup | active | done
  const [timer, setTimer] = useState(0);          // total seconds elapsed
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCount, setBreathCount]       = useState(0);  // seconds in current phase
  const [breathScale, setBreathScale]       = useState(1);
  const audioCtxRef  = useRef(null);
  const soundRef     = useRef(null);
  const timerRef     = useRef(null);
  const breathRef    = useRef(null);

  const breathwork = BREATHWORK.find(b => b.id === selectedBreath);
  const sound      = SOUNDS.find(s => s.id === selectedSound);

  // ── Start session ─────────────────────────────────────────────────────────
  const handleStart = () => {
    // Init audio
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    soundRef.current = createAmbientSound(sound.type, audioCtxRef.current);

    setPhase("active");
    setTimer(0);
    setBreathPhaseIdx(0);
    setBreathCount(0);

    // Main timer
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

    // Breathing tick
    if (breathwork.pattern.length > 0) {
      let phaseI = 0;
      let countI = 0;
      const totalPhases = breathwork.pattern.length;
      breathRef.current = setInterval(() => {
        countI++;
        setBreathCount(countI);
        if (countI >= breathwork.pattern[phaseI]) {
          countI = 0;
          phaseI = (phaseI + 1) % totalPhases;
          setBreathPhaseIdx(phaseI);
          setBreathCount(0);
        }
        // Scale: inhale = grow, exhale/hold = shrink
        const phaseName = breathwork.phases[phaseI]?.toLowerCase() || "";
        setBreathScale(phaseName === "inhale" ? 1.35 : phaseName === "hold" ? 1.35 : 1);
      }, 1000);
    }
  };

  // ── End session ──────────────────────────────────────────────────────────
  const handleStop = () => {
    clearInterval(timerRef.current);
    clearInterval(breathRef.current);
    if (soundRef.current) soundRef.current.stop();

    // Save meditation record so companion can ask about it
    localStorage.setItem("unfiltr_just_meditated", JSON.stringify({
      timestamp: Date.now(),
      duration: timer,
      sound: sound.label,
      breathwork: breathwork.label,
    }));

    setPhase("done");
  };

  // cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(breathRef.current);
    try { if (soundRef.current) soundRef.current.stop(); } catch {}
  }, []);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const currentPhaseName = breathwork.pattern.length > 0
    ? breathwork.phases[breathPhaseIdx] || "Breathe"
    : "";
  const currentPhaseDur  = breathwork.pattern[breathPhaseIdx] || 1;
  const phaseProgress    = breathwork.pattern.length > 0 ? breathCount / currentPhaseDur : 0;

  // ── DONE SCREEN ──────────────────────────────────────────────────────────
  if (phase === "done") {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return (
      <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 28px" }}>
        <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:"spring", damping:18 }}
          style={{ textAlign:"center" }}>
          <div style={{ fontSize:72, marginBottom:16 }}>🧘</div>
          <h2 style={{ color:"white", fontWeight:800, fontSize:26, margin:"0 0 8px" }}>Session complete</h2>
          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:15, margin:"0 0 6px" }}>
            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} · {sound.emoji} {sound.label} · {breathwork.label}
          </p>
          <p style={{ color:"rgba(168,85,247,0.8)", fontSize:13, margin:"0 0 32px" }}>
            Your companion will check in when you chat 💜
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280 }}>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => navigate("/hub")}
              style={{ padding:"15px", background:"linear-gradient(135deg,#7c3aed,#db2777)", border:"none", borderRadius:14, color:"white", fontWeight:700, fontSize:15, cursor:"pointer" }}>
              Go to Chat 💬
            </motion.button>
            <button onClick={() => setPhase("setup")}
              style={{ padding:"13px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, color:"rgba(255,255,255,0.5)", fontWeight:600, fontSize:14, cursor:"pointer" }}>
              Meditate again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── ACTIVE SESSION ───────────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:"max(48px,env(safe-area-inset-top)) 24px 48px" }}>

        {/* Timer + sound */}
        <div style={{ textAlign:"center" }}>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, margin:"0 0 4px" }}>{sound.emoji} {sound.label} · {breathwork.label}</p>
          <p style={{ color:"rgba(255,255,255,0.15)", fontSize:42, fontWeight:300, margin:0, letterSpacing:4 }}>{formatTime(timer)}</p>
        </div>

        {/* Breathing orb */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
          <motion.div
            animate={{ scale: breathwork.pattern.length > 0 ? breathScale : [1, 1.08, 1] }}
            transition={ breathwork.pattern.length > 0
              ? { duration: currentPhaseDur, ease: currentPhaseName.toLowerCase() === "inhale" ? "easeIn" : "easeOut" }
              : { repeat: Infinity, duration: 4, ease: "easeInOut" }
            }
            style={{
              width: 180, height: 180, borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, rgba(168,85,247,0.6) 0%, rgba(219,39,119,0.3) 50%, rgba(6,2,15,0.2) 100%)",
              boxShadow: "0 0 60px rgba(168,85,247,0.4), 0 0 120px rgba(168,85,247,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {breathwork.pattern.length > 0 && (
              <div style={{ textAlign:"center" }}>
                <p style={{ color:"white", fontWeight:700, fontSize:18, margin:"0 0 2px" }}>{currentPhaseName}</p>
                <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>{currentPhaseDur - breathCount}s</p>
              </div>
            )}
          </motion.div>

          {/* Phase progress dots */}
          {breathwork.pattern.length > 0 && (
            <div style={{ display:"flex", gap:8 }}>
              {breathwork.phases.map((ph, i) => (
                <div key={i} style={{ width: i === breathPhaseIdx ? 24 : 8, height:8, borderRadius:4, background: i === breathPhaseIdx ? "#a855f7" : "rgba(255,255,255,0.1)", transition:"all 0.3s" }} />
              ))}
            </div>
          )}
        </div>

        {/* Stop button */}
        <motion.button whileTap={{ scale:0.95 }} onClick={handleStop}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 32px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:50, color:"white", fontWeight:600, fontSize:15, cursor:"pointer" }}>
          <StopCircle size={18} color="rgba(255,255,255,0.6)" />
          End session
        </motion.button>
      </div>
    );
  }

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────
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

      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 100px" }}>

        {/* Ambient sound */}
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Ambient Sound</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:28 }}>
          {SOUNDS.map(s => (
            <button key={s.id} onClick={() => setSelectedSound(s.id)}
              style={{ padding:"14px 8px", borderRadius:14, border: selectedSound === s.id ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.08)", background: selectedSound === s.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)", cursor:"pointer", textAlign:"center" }}>
              <span style={{ fontSize:24, display:"block", marginBottom:4 }}>{s.emoji}</span>
              <span style={{ color: selectedSound === s.id ? "white" : "rgba(255,255,255,0.5)", fontWeight: selectedSound === s.id ? 700 : 500, fontSize:12 }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Breathwork */}
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Breathing Technique</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32 }}>
          {BREATHWORK.map(b => (
            <button key={b.id} onClick={() => setSelectedBreath(b.id)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14, border: selectedBreath === b.id ? "2px solid #db2777" : "1px solid rgba(255,255,255,0.08)", background: selectedBreath === b.id ? "rgba(219,39,119,0.12)" : "rgba(255,255,255,0.04)", cursor:"pointer", textAlign:"left" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background: selectedBreath === b.id ? "#db2777" : "rgba(255,255,255,0.15)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ color: selectedBreath === b.id ? "white" : "rgba(255,255,255,0.7)", fontWeight: selectedBreath === b.id ? 700 : 500, fontSize:14, margin:"0 0 2px" }}>{b.label}</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, margin:0 }}>{b.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Start button */}
        <motion.button whileTap={{ scale:0.97 }} onClick={handleStart}
          style={{ width:"100%", padding:"16px", background:"linear-gradient(135deg,#7c3aed,#db2777)", border:"none", borderRadius:16, color:"white", fontWeight:700, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 4px 24px rgba(124,58,237,0.4)" }}>
          <Play size={18} fill="white" />
          Begin Session
        </motion.button>
      </div>
    </div>
  );
}
