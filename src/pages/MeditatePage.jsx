import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, StopCircle } from "lucide-react";

const SOUNDS = [
  { id: "rain",   emoji: "🌧️", label: "Rainy Day",     desc: "Rain + soft thunder" },
  { id: "fire",   emoji: "🔥", label: "Cabin Fire",     desc: "Warm crackling fireplace" },
  { id: "ocean",  emoji: "🌊", label: "Beach Waves",    desc: "Ocean shore & seabirds" },
  { id: "brown",  emoji: "🌫️", label: "Brown Noise",    desc: "Deep & grounding" },
  { id: "pink",   emoji: "🌸", label: "Pink Noise",     desc: "Best for sleep & anxiety" },
  { id: "silence",emoji: "🤫", label: "Silence",        desc: "Breath guide only" },
];

const BREATHWORK = [
  { id: "478",    label: "4-7-8",         desc: "Inhale 4 · Hold 7 · Exhale 8",   pattern: [4,7,8],   phases: ["Inhale","Hold","Exhale"] },
  { id: "box",    label: "Box Breathing", desc: "In 4 · Hold 4 · Out 4 · Hold 4", pattern: [4,4,4,4], phases: ["Inhale","Hold","Exhale","Hold"] },
  { id: "simple", label: "4-4 Simple",    desc: "Inhale 4 · Exhale 4",            pattern: [4,4],     phases: ["Inhale","Exhale"] },
  { id: "none",   label: "Just Ambience", desc: "No breathing guide",             pattern: [],        phases: [] },
];

// ─── Utility noise buffers ────────────────────────────────────────────────────
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

function playLoop(ctx, buf, dest, gain = 1) {
  const src = ctx.createBufferSource();
  const g   = ctx.createGain();
  src.buffer = buf; src.loop = true;
  g.gain.value = gain;
  src.connect(g); g.connect(dest);
  src.start();
  return src;
}

// ─── Main ambient sound factory ───────────────────────────────────────────────
function createAmbientSound(type, ctx) {
  if (type === "silence") return null;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 3);
  master.connect(ctx.destination);

  const nodes = [];
  const ivs   = [];

  // ── helper: schedule recurring callbacks ──
  const every = (fn, baseMs, jitterMs = 0) => {
    const tick = () => {
      fn();
      const delay = baseMs + Math.random() * jitterMs;
      const h = setTimeout(tick, delay);
      ivs.push(h);
    };
    const h = setTimeout(tick, baseMs * Math.random());
    ivs.push(h);
  };

  // ── helper: one-shot tone burst ──
  const tone = (freq, freqEnd, durSec, vol, type = "sine", destNode = master) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + durSec);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durSec);
    osc.connect(g); g.connect(destNode);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + durSec + 0.01);
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (type === "brown") {
    const src = playLoop(ctx, makeBrownBuf(ctx), master, 1);
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass"; lpf.frequency.value = 700;
    // reconnect through lpf
    src.disconnect(); src.connect(lpf); lpf.connect(master);
    nodes.push(src);
  }

  // ─────────────────────────────────────────────────────────────────────────
  else if (type === "pink") {
    nodes.push(playLoop(ctx, makePinkBuf(ctx), master, 1));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RAIN — layered bandpass noise + pitter-patter drops + distant rumbling thunder
  else if (type === "rain") {
    const brownBuf = makeBrownBuf(ctx, 5);

    // Layer 1: heavy rain body — low-mid bandpass
    const body = ctx.createBufferSource();
    body.buffer = brownBuf; body.loop = true;
    const bp1 = ctx.createBiquadFilter(); bp1.type="bandpass"; bp1.frequency.value=900; bp1.Q.value=0.6;
    const g1  = ctx.createGain(); g1.gain.value = 0.75;
    body.connect(bp1); bp1.connect(g1); g1.connect(master);
    body.start(); nodes.push(body);

    // Layer 2: high-freq patter (upper frequencies of rain)
    const patter = ctx.createBufferSource();
    patter.buffer = brownBuf; patter.loop = true;
    const bp2 = ctx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=3200; bp2.Q.value=1.4;
    const g2  = ctx.createGain(); g2.gain.value = 0.35;
    patter.connect(bp2); bp2.connect(g2); g2.connect(master);
    patter.start(); nodes.push(patter);

    // Layer 3: window-pane resonance — a very soft low rumble
    const rumble = ctx.createBufferSource();
    rumble.buffer = brownBuf; rumble.loop = true;
    const lpf = ctx.createBiquadFilter(); lpf.type="lowpass"; lpf.frequency.value=180;
    const g3  = ctx.createGain(); g3.gain.value = 0.18;
    rumble.connect(lpf); lpf.connect(g3); g3.connect(master);
    rumble.start(); nodes.push(rumble);

    // Individual rain drop pops
    const drop = () => {
      const f = 600 + Math.random() * 600;
      const v = 0.025 + Math.random() * 0.03;
      tone(f, f * 0.25, 0.06 + Math.random()*0.04, v);
    };
    every(() => {
      const n = 2 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) {
        const h = setTimeout(drop, Math.random() * 300);
        ivs.push(h);
      }
    }, 300, 200);

    // ── Thunder: distant rolling rumble every 25-55 seconds ──────────────────
    const thunder = () => {
      // Thunder = slow low-freq oscillator swept down + noise burst
      const dur = 3.5 + Math.random() * 2.5;
      const vol = 0.06 + Math.random() * 0.06;

      // Noise burst
      const tbuf = makeBrownBuf(ctx, Math.ceil(dur));
      const tsrc = ctx.createBufferSource();
      tsrc.buffer = tbuf; tsrc.loop = false;
      const tlpf = ctx.createBiquadFilter(); tlpf.type="lowpass"; tlpf.frequency.value=120;
      const tg   = ctx.createGain();
      // Shape: soft attack, long decay — thunder rolls
      tg.gain.setValueAtTime(0, ctx.currentTime);
      tg.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.3);
      tg.gain.setValueAtTime(vol * 0.8, ctx.currentTime + 0.8);
      tg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      tsrc.connect(tlpf); tlpf.connect(tg); tg.connect(master);
      tsrc.start(ctx.currentTime); tsrc.stop(ctx.currentTime + dur + 0.1);

      // Sub rumble sine
      const sub = ctx.createOscillator();
      const sg  = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(55 + Math.random()*20, ctx.currentTime);
      sub.frequency.linearRampToValueAtTime(28, ctx.currentTime + dur);
      sg.gain.setValueAtTime(0, ctx.currentTime);
      sg.gain.linearRampToValueAtTime(vol * 0.5, ctx.currentTime + 0.4);
      sg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      sub.connect(sg); sg.connect(master);
      sub.start(ctx.currentTime); sub.stop(ctx.currentTime + dur + 0.1);
    };
    every(thunder, 28000, 27000); // every 28-55s
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CABIN FIRE — deep warm base + layered crackle textures + occasional POP
  else if (type === "fire") {
    const brownBuf = makeBrownBuf(ctx, 4);

    // Layer 1: deep warm base (the "body" of fire — low freq rumble)
    const base = ctx.createBufferSource();
    base.buffer = brownBuf; base.loop = true;
    const baseLpf = ctx.createBiquadFilter(); baseLpf.type="lowpass"; baseLpf.frequency.value=280;
    const baseHpf = ctx.createBiquadFilter(); baseHpf.type="highpass"; baseHpf.frequency.value=55;
    const baseG = ctx.createGain(); baseG.gain.value = 0.85;
    base.connect(baseHpf); baseHpf.connect(baseLpf); baseLpf.connect(baseG); baseG.connect(master);
    base.start(); nodes.push(base);

    // Layer 2: mid crackle texture (the sizzle of fire)
    const sizzle = ctx.createBufferSource();
    sizzle.buffer = brownBuf; sizzle.loop = true;
    const sBp = ctx.createBiquadFilter(); sBp.type="bandpass"; sBp.frequency.value=1800; sBp.Q.value=0.7;
    const sG  = ctx.createGain(); sG.gain.value = 0.22;
    sizzle.connect(sBp); sBp.connect(sG); sG.connect(master);
    sizzle.start(); nodes.push(sizzle);

    // Layer 3: breathe — slow LFO on the base volume (fire "breathes")
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.type = "sine"; lfo.frequency.value = 0.18; // very slow — one breath ~5.5s
    lfoG.gain.value = 0.12;
    lfo.connect(lfoG); lfoG.connect(baseG.gain);
    lfo.start(); nodes.push(lfo);

    // Individual crackle pops — short noise bursts at random intervals
    const crackle = () => {
      const len = Math.floor(ctx.sampleRate * (0.008 + Math.random() * 0.018));
      const cbuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const cd   = cbuf.getChannelData(0);
      for (let i = 0; i < len; i++) cd[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 1.5);
      const csrc = ctx.createBufferSource();
      csrc.buffer = cbuf;
      const clpf = ctx.createBiquadFilter(); clpf.type="lowpass"; clpf.frequency.value=2200;
      const cg   = ctx.createGain(); cg.gain.value = 0.18 + Math.random()*0.28;
      csrc.connect(clpf); clpf.connect(cg); cg.connect(master);
      csrc.start(ctx.currentTime);
    };
    // Rapid small crackles (the constant sizzle)
    every(crackle, 55, 80);
    // Occasional cluster (when a log pops)
    every(() => {
      const n = 3 + Math.floor(Math.random()*5);
      for (let i = 0; i < n; i++) {
        const h = setTimeout(crackle, i * (15 + Math.random()*40));
        ivs.push(h);
      }
    }, 1800, 2200);

    // ── Occasional big POP (log shifting in the fire) ──────────────────────
    const bigPop = () => {
      // Thump
      tone(180, 55, 0.12, 0.18 + Math.random()*0.1, "sine");
      // Sharp crack on top
      const len = Math.floor(ctx.sampleRate * 0.025);
      const pbuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const pd   = pbuf.getChannelData(0);
      for (let i = 0; i < len; i++) pd[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2);
      const psrc = ctx.createBufferSource();
      psrc.buffer = pbuf;
      const pg   = ctx.createGain(); pg.gain.value = 0.35 + Math.random()*0.2;
      psrc.connect(pg); pg.connect(master);
      psrc.start(ctx.currentTime);
      // Follow-up crackle burst
      for (let i = 0; i < 6; i++) {
        const h = setTimeout(crackle, 30 + i * (20 + Math.random()*30));
        ivs.push(h);
      }
    };
    every(bigPop, 6000, 9000); // big pop every 6-15s
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OCEAN — slow swelling wave noise + surf crash + seagull calls
  else if (type === "ocean") {
    const pinkBuf = makePinkBuf(ctx, 3);
    const brownBuf = makeBrownBuf(ctx, 3);

    // Low ocean roar base (constant background)
    const roar = ctx.createBufferSource();
    roar.buffer = brownBuf; roar.loop = true;
    const roarLpf = ctx.createBiquadFilter(); roarLpf.type="lowpass"; roarLpf.frequency.value=350;
    const roarG = ctx.createGain(); roarG.gain.value = 0.55;
    roar.connect(roarLpf); roarLpf.connect(roarG); roarG.connect(master);
    roar.start(); nodes.push(roar);

    // Mid surf texture — bandpassed pink noise
    const surf = ctx.createBufferSource();
    surf.buffer = pinkBuf; surf.loop = true;
    const sBp  = ctx.createBiquadFilter(); sBp.type="bandpass"; sBp.frequency.value=700; sBp.Q.value=0.5;
    const surfG = ctx.createGain(); surfG.gain.value = 0.4;
    surf.connect(sBp); sBp.connect(surfG); surfG.connect(master);
    surf.start(); nodes.push(surf);

    // ── Wave swell — LFO shapes the surf volume in/out (swell & recede) ──────
    // Wave cycle: ~8-12 seconds in, then rush/recede over ~4s
    let waveRunning = true;
    const doWave = () => {
      if (!waveRunning) return;
      const period = 8000 + Math.random() * 5000;
      const riseT  = period * 0.55;
      const crashT = period * 0.15;
      const recedeT= period * 0.30;
      const vol    = 0.35 + Math.random() * 0.3;

      // Swell up
      surfG.gain.linearRampToValueAtTime(vol, ctx.currentTime + riseT/1000);
      // Crash peak — briefly boost brown noise too for the crash sound
      const h1 = setTimeout(() => {
        surfG.gain.linearRampToValueAtTime(vol * 1.4, ctx.currentTime + crashT/1000);
        roarG.gain.linearRampToValueAtTime(0.7, ctx.currentTime + crashT/1000);
        // high freq splash
        const spBuf = makePinkBuf(ctx, 0.8);
        const sp    = ctx.createBufferSource(); sp.buffer = spBuf;
        const spHpf = ctx.createBiquadFilter(); spHpf.type="highpass"; spHpf.frequency.value=2000;
        const spG   = ctx.createGain();
        spG.gain.setValueAtTime(0.22, ctx.currentTime);
        spG.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
        sp.connect(spHpf); spHpf.connect(spG); spG.connect(master);
        sp.start(ctx.currentTime);
      }, riseT);
      ivs.push(h1);
      // Recede
      const h2 = setTimeout(() => {
        surfG.gain.linearRampToValueAtTime(0.1, ctx.currentTime + recedeT/1000);
        roarG.gain.linearRampToValueAtTime(0.35, ctx.currentTime + recedeT/1000);
        // foam hiss on recede
        const hiBuf = makePinkBuf(ctx, recedeT/1200);
        const hi    = ctx.createBufferSource(); hi.buffer = hiBuf;
        const hiBp  = ctx.createBiquadFilter(); hiBp.type="highpass"; hiBp.frequency.value=3000;
        const hiG   = ctx.createGain();
        hiG.gain.setValueAtTime(0.12, ctx.currentTime);
        hiG.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + recedeT/1000);
        hi.connect(hiBp); hiBp.connect(hiG); hiG.connect(master);
        hi.start(ctx.currentTime);
        const h3 = setTimeout(() => { if(waveRunning) doWave(); }, recedeT + 400);
        ivs.push(h3);
      }, riseT + crashT);
      ivs.push(h2);
    };
    doWave();

    // ── Seagull cries — distant, occasional ─────────────────────────────────
    const seagull = () => {
      // Seagull: descending cry, like "eeeeh-yah"
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = "sawtooth";
      const f = 900 + Math.random()*300;
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.frequency.setValueAtTime(f*0.7, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(f*0.85, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(f*0.5, ctx.currentTime + 0.55);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.025, ctx.currentTime + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      // Low-pass to make it distant / not harsh
      const lpf = ctx.createBiquadFilter(); lpf.type="lowpass"; lpf.frequency.value=1400;
      osc.connect(lpf); lpf.connect(g); g.connect(master);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.65);
      // Sometimes a second cry follows
      if (Math.random() > 0.5) {
        const h = setTimeout(seagull, 700 + Math.random()*600);
        ivs.push(h);
      }
    };
    every(seagull, 14000, 20000);
    // cleanup helper
    nodes.push({ stop: () => { waveRunning = false; } });
  }

  return {
    stop: () => {
      ivs.forEach(h => clearTimeout(h));
      try {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
        setTimeout(() => {
          nodes.forEach(n => { try { if(n.stop) n.stop(); } catch {} });
          try { ctx.close(); } catch {}
        }, 2000);
      } catch {}
    }
  };
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
  const audioCtxRef = useRef(null);
  const soundRef    = useRef(null);
  const timerRef    = useRef(null);
  const breathRef   = useRef(null);

  const breathwork = BREATHWORK.find(b => b.id === selectedBreath);
  const sound      = SOUNDS.find(s => s.id === selectedSound);

  const handleStart = () => {
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      soundRef.current    = createAmbientSound(sound.id, audioCtxRef.current);
    } catch(e) { console.warn("Audio init:", e); }

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
              ? { duration: curPhaseDur, ease: curPhaseName.toLowerCase()==="inhale" ? "easeIn" : "easeOut" }
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
