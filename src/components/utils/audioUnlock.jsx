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
 * Returns a Promise that resolves when playback ends.
 * Retries once on failure (iOS sometimes needs a second attempt).
 */
export async function playAudioFromBase64(base64Audio) {
  const ctx = await resumeAudioContext();

  // Decode base64 → ArrayBuffer
  const binaryStr = atob(base64Audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const arrayBuffer = bytes.buffer;

  const tryPlay = async (buffer) => {
    // Stop any currently playing source
    if (currentSource) {
      try { currentSource.stop(); } catch {}
      currentSource = null;
    }

    const audioBuffer = await ctx.decodeAudioData(buffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    currentSource = source;

    return new Promise((resolve, reject) => {
      source.onended = () => { currentSource = null; resolve(); };
      try {
        source.start(0);
      } catch (e) {
        currentSource = null;
        reject(e);
      }
    });
  };

  // First attempt
  try {
    await tryPlay(arrayBuffer.slice(0));
  } catch (e) {
    console.warn("TTS playback failed, retrying:", e?.message);
    // Retry once — re-resume context and try again
    await ctx.resume();
    await new Promise(r => setTimeout(r, 100));
    try {
      await tryPlay(arrayBuffer.slice(0));
    } catch (e2) {
      console.warn("TTS retry also failed:", e2?.message);
      throw e2;
    }
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