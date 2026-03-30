import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, StopCircle } from "lucide-react";

// ── Top 5 science-backed soothing sounds ─────────────────────────────────────
// 1. Rain       — most studied calming sound, bandpass filtered noise + drip pops
// 2. Brown Noise — deep rumble (12dB/oct rolloff), proven best for anxiety & focus
// 3. Pink Noise  — -3dB/oct, scientifically #1 for sleep quality (Noisehack algorithm)
// 4. Crackling Fire — warm low-freq pops, ASMR crackle algorithm
// 5. Forest      — soft wind + random bird chirps
const SOUNDS = [
  { id: "rain",   emoji: "🌧️", label: "Rain",        desc: "Calming, #1 most studied" },
  { id: "brown",  emoji: "🌊", label: "Brown Noise", desc: "Deep & grounding" },
  { id: "pink",   emoji: "🌸", label: "Pink Noise",  desc: "Best for sleep & anxiety" },
  { id: "fire",   emoji: "🔥", label: "Crackling Fire", desc: "Warm & cozy" },
  { id: "forest", emoji: "🌲", label: "Forest",      desc: "Birds & soft wind" },
  { id: "silence",emoji: "🤫", label: "Silence",     desc: "Breath only" },
];

const BREATHWORK = [
  { id: "478",    label: "4-7-8",          desc: "Inhale 4 · Hold 7 · Exhale 8",   pattern: [4,7,8],    phases: ["Inhale","Hold","Exhale"] },
  { id: "box",    label: "Box Breathing",  desc: "In 4 · Hold 4 · Out 4 · Hold 4", pattern: [4,4,4,4],  phases: ["Inhale","Hold","Exhale","Hold"] },
  { id: "simple", label: "4-4 Simple",     desc: "Inhale 4 · Exhale 4",            pattern: [4,4],      phases: ["Inhale","Exhale"] },
  { id: "none",   label: "Just Ambience",  desc: "No breathing guide",             pattern: [],         phases: [] },
];

// ── Audio Engine — proper algorithms from Noisehack & audio DSP research ─────
function createAmbientSound(type, ctx) {
  if (type === "silence") return null;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 2.5);
  master.connect(ctx.destination);

  const nodes = [];
  const intervals = [];

  if (type === "brown") {
    // Brownian noise: (lastOut + 0.02*white) / 1.02 — true brown noise algorithm
    const bufSize = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
      if (data[i] > 1) data[i] = 1;
      if (data[i] < -1) data[i] = -1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass"; lpf.frequency.value = 600;
    src.connect(lpf); lpf.connect(master);
    src.start(); nodes.push(src);
  }

  else if (type === "pink") {
    // Pink noise: Paul Kellet's refined method (-3dB/octave, #1 for sleep)
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179;
      b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520;
      b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522;
      b5 = -0.7616*b5 - w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.connect(master); src.start(); nodes.push(src);
  }

  else if (type === "rain") {
    // Rain: brown noise base + bandpass for rainfall texture + random drip pops
    const bufSize = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.8;
      if (data[i] > 1) data[i] = 1;
      if (data[i] < -1) data[i] = -1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    // Two bandpass filters layered: one for heavy rain body, one for light patter
    const bp1 = ctx.createBiquadFilter();
    bp1.type = "bandpass"; bp1.frequency.value = 1200; bp1.Q.value = 0.8;
    const bp2 = ctx.createBiquadFilter();
    bp2.type = "bandpass"; bp2.frequency.value = 3500; bp2.Q.value = 1.2;
    const g1 = ctx.createGain(); g1.gain.value = 0.7;
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    src.connect(bp1); bp1.connect(g1); g1.connect(master);
    src.connect(bp2); bp2.connect(g2); g2.connect(master);
    src.start(); nodes.push(src);
    // Random drip/drop pops for realism
    const scheduleDrops = () => {
      const drop = () => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
        g.gain.setValueAtTime(0.04 + Math.random() * 0.03, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
      };
      const iv = setInterval(() => {
        const count = 3 + Math.floor(Math.random() * 5);
        for (let d = 0; d < count; d++) {
          setTimeout(drop, Math.random() * 200);
        }
      }, 400 + Math.random() * 300);
      intervals.push(iv);
    };
    scheduleDrops();
  }

  else if (type === "fire") {
    // Crackling fire: warm brown noise base + random crackle pops (ASMR algorithm)
    const bufSize = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.5;
      if (data[i] > 1) data[i] = 1;
      if (data[i] < -1) data[i] = -1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass"; lpf.frequency.value = 350;
    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass"; hpf.frequency.value = 60;
    src.connect(hpf); hpf.connect(lpf); lpf.connect(master);
    src.start(); nodes.push(src);
    // Crackle pops: short random noise bursts — what makes fire sound like fire
    const crackle = () => {
      const crackleBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate);
      const cd = crackleBuf.getChannelData(0);
      for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * (1 - i / cd.length);
      const csrc = ctx.createBufferSource();
      csrc.buffer = crackleBuf;
      const cg = ctx.createGain();
      cg.gain.value = 0.15 + Math.random() * 0.25;
      csrc.connect(cg); cg.connect(master);
      csrc.start(ctx.currentTime);
    };
    // Schedule random crackles — some clusters, some singles (like real fire)
    const fireIv = setInterval(() => {
      const numCrackles = Math.random() < 0.3 ? Math.floor(Math.random() * 4) + 2 : 1;
      for (let c = 0; c < numCrackles; c++) {
        setTimeout(crackle, c * (20 + Math.random() * 60));
      }
    }, 80 + Math.random() * 150);
    intervals.push(fireIv);
  }

  else if (type === "forest") {
    // Forest: pink noise wind base (soft) + random bird oscillators
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179;
      b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520;
      b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522;
      b5 = -0.7616*b5 - w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.07; // quieter for wind
      b6 = w * 0.115926;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass"; lpf.frequency.value = 1800;
    src.connect(lpf); lpf.connect(master);
    src.start(); nodes.push(src);
    // Random bird chirps — two different species at different intervals
    const birdFreqs = [1200, 1800, 2400, 900, 1500];
    const chirp = (freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.setValueAtTime(freq * 1.3, ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
      osc.connect(g); g.connect(master);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    };
    const iv1 = setInterval(() => chirp(birdFreqs[Math.floor(Math.random() * birdFreqs.length)]), 2200 + Math.random() * 3000);
    const iv2 = setInterval(() => {
      if (Math.random() > 0.4) chirp(birdFreqs[Math.floor(Math.random() * birdFreqs.length)]);
    }, 1500 + Math.random() * 2000);
    intervals.push(iv1, iv2);
  }

  return {
    stop: () => {
      intervals.forEach(iv => clearInterval(iv));
      try {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch {} }), 1600);
      } catch {}
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MeditatePage() {
  const navigate = useNavigate();
  const [selectedSound, setSelectedSound]   = useState("rain");
  const [selectedBreath, setSelectedBreath] = useState("478");
  const [phase, setPhase]       = useState("setup");
  const [timer, setTimer]       = useState(0);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCount, setBreathCount]       = useState(0);
  const [breathScale, setBreathScale]       = useState(1);
  const audioCtxRef = useRef(null);
  const soundRef    = useRef(null);
  const timerRef    = useRef(null);
  const breathRef   = useRef(null);

  const breathwork = BREATHWORK.find(b => b.id === selectedBreath);
  const sound      = SOUNDS.find(s => s.id === selectedSound);

  const handleStart = () => {
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      soundRef.current = createAmbientSound(sound.id, audioCtxRef.current);
    } catch (e) { console.warn("Audio init failed:", e); }

    setPhase("active");
    setTimer(0);
    setBreathPhaseIdx(0);
    setBreathCount(0);
    setBreathScale(1);

    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

    if (breathwork.pattern.length > 0) {
      let phaseI = 0, countI = 0;
      breathRef.current = setInterval(() => {
        countI++;
        setBreathCount(countI);
        if (countI >= breathwork.pattern[phaseI]) {
          countI = 0;
          phaseI = (phaseI + 1) % breathwork.pattern.length;
          setBreathPhaseIdx(phaseI);
          setBreathCount(0);
        }
        const pName = breathwork.phases[phaseI]?.toLowerCase() || "";
        setBreathScale(pName === "inhale" ? 1.35 : 1);
      }, 1000);
    }
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

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const curPhaseName = breathwork.pattern.length > 0 ? breathwork.phases[breathPhaseIdx] || "Breathe" : "";
  const curPhaseDur  = breathwork.pattern[breathPhaseIdx] || 1;

  // ── DONE ─────────────────────────────────────────────────────────────────
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
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, margin:"0 0 2px" }}>{sound.emoji} {sound.label} · {breathwork.label}</p>
          <p style={{ color:"rgba(255,255,255,0.12)", fontSize:44, fontWeight:200, margin:0, letterSpacing:6 }}>{fmt(timer)}</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
          <motion.div
            animate={{ scale: breathwork.pattern.length > 0 ? breathScale : [1,1.1,1] }}
            transition={ breathwork.pattern.length > 0
              ? { duration: curPhaseDur, ease: curPhaseName.toLowerCase() === "inhale" ? "easeIn" : "easeOut" }
              : { repeat:Infinity, duration:4, ease:"easeInOut" }
            }
            style={{ width:180, height:180, borderRadius:"50%",
              background:"radial-gradient(circle at 40% 35%, rgba(168,85,247,0.65) 0%, rgba(219,39,119,0.3) 50%, rgba(6,2,15,0.2) 100%)",
              boxShadow:"0 0 60px rgba(168,85,247,0.45), 0 0 120px rgba(168,85,247,0.18)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            {breathwork.pattern.length > 0 && (
              <div style={{ textAlign:"center" }}>
                <p style={{ color:"white", fontWeight:700, fontSize:18, margin:"0 0 2px" }}>{curPhaseName}</p>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:13, margin:0 }}>{curPhaseDur - breathCount}s</p>
              </div>
            )}
          </motion.div>
          {breathwork.pattern.length > 0 && (
            <div style={{ display:"flex", gap:8 }}>
              {breathwork.phases.map((_, i) => (
                <div key={i} style={{ width:i===breathPhaseIdx?24:8, height:8, borderRadius:4, background:i===breathPhaseIdx?"#a855f7":"rgba(255,255,255,0.1)", transition:"all 0.3s" }} />
              ))}
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
              <div style={{ width:8, height:8, borderRadius:"50%", background:selectedBreath===b.id?"#db2777":"rgba(255,255,255,0.15)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ color:selectedBreath===b.id?"white":"rgba(255,255,255,0.7)", fontWeight:selectedBreath===b.id?700:500, fontSize:14, margin:"0 0 2px" }}>{b.label}</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, margin:0 }}>{b.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <motion.button whileTap={{ scale:0.97 }} onClick={handleStart}
          style={{ width:"100%", padding:"16px", background:"linear-gradient(135deg,#7c3aed,#db2777)", border:"none", borderRadius:16, color:"white", fontWeight:700, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 4px 24px rgba(124,58,237,0.4)" }}>
          <Play size={18} fill="white" />
          Begin Session
        </motion.button>
      </div>
    </div>
  );
}
