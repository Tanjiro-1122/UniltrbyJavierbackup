// Lightweight sound effect utility using Web Audio API
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, volume = 0.08, type = "sine") {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function soundSend() {
  playTone(880, 0.1, 0.06);
}

export function soundReceive() {
  playTone(660, 0.08, 0.05);
  setTimeout(() => playTone(880, 0.12, 0.05), 80);
}

export function soundTap() {
  playTone(1200, 0.05, 0.03);
}