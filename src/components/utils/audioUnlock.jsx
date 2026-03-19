/**
 * iOS Audio Unlock + Shared AudioContext
 * 
 * iOS Safari requires a direct user gesture to "unlock" audio playback.
 * This module manages a SINGLE shared AudioContext for the entire app
 * (iOS limits how many can exist) and provides playback via Web Audio API
 * using ArrayBuffers (not blob URLs, which are unreliable on iOS).
 */

let unlocked = false;
let unlockPromiseResolve = null;
let sharedAudioContext = null;
let currentSource = null;

// Promise that resolves once audio is unlocked
export const audioReady = new Promise((resolve) => {
  unlockPromiseResolve = resolve;
  if (typeof window === "undefined") { resolve(); return; }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "running") {
      unlocked = true;
      sharedAudioContext = ctx;
      resolve();
      return;
    }
    ctx.close();
  } catch {}
});

export function isAudioUnlocked() {
  return unlocked;
}

/**
 * Get or create the single shared AudioContext.
 * MUST be called during a user gesture the first time.
 */
export function getAudioContext() {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioContext;
}

/**
 * Resume the shared AudioContext — call this on every user tap/gesture
 * to ensure iOS doesn't suspend it.
 */
export async function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  if (!unlocked) {
    unlocked = true;
    if (unlockPromiseResolve) unlockPromiseResolve();
  }
  return ctx;
}

/**
 * Play MP3 audio from a base64 string using Web Audio API (ArrayBuffer path).
 * Falls back to HTML5 Audio if Web Audio API fails (iOS compatibility).
 */
export async function playAudioFromBase64(base64Audio) {
  // Decode base64 → ArrayBuffer
  const binaryStr = atob(base64Audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const audioBuffer = bytes.buffer;

  try {
    const ctx = getAudioContext();
    await ctx.resume();

    // Stop any currently playing source
    if (currentSource) {
      try { currentSource.stop(); } catch {}
      currentSource = null;
    }

    const buffer = await ctx.decodeAudioData(audioBuffer.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    currentSource = source;
    source.start(0);

    await new Promise((resolve) => {
      source.onended = () => { currentSource = null; resolve(); };
    });
  } catch (error) {
    console.error('Audio playback failed, falling back to HTML5 Audio:', error);
    currentSource = null;
    // Fallback to HTML5 audio
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    await audio.play();
    await new Promise((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    });
  }
}

/**
 * Stop any currently playing audio.
 */
export function stopCurrentAudio() {
  if (currentSource) {
    try { currentSource.stop(); } catch {}
    currentSource = null;
  }
}

function doUnlock() {
  if (unlocked) return;
  unlocked = true;

  // Create + resume the shared AudioContext on first gesture
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    // Play a silent buffer to fully unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {}

  // Also unlock HTML Audio (for any non-Web Audio usage)
  try {
    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
    silentAudio.volume = 0;
    silentAudio.play().then(() => silentAudio.pause()).catch(() => {});
  } catch {}

  if (unlockPromiseResolve) unlockPromiseResolve();
}

// Auto-attach listeners on import
if (typeof window !== "undefined") {
  const events = ["touchstart", "touchend", "click", "keydown"];
  const handler = () => {
    doUnlock();
    events.forEach(e => document.removeEventListener(e, handler, true));
  };
  events.forEach(e => document.addEventListener(e, handler, { capture: true, passive: true }));
}