/**
 * iOS Audio Unlock Utility
 * 
 * iOS Safari requires a direct user gesture to "unlock" audio playback.
 * This module listens for the first tap/click and plays a silent audio clip
 * + resumes the AudioContext, so all subsequent programmatic audio works.
 */

let unlocked = false;
let unlockPromiseResolve = null;

// Promise that resolves once audio is unlocked
export const audioReady = new Promise((resolve) => {
  unlockPromiseResolve = resolve;
  // If not iOS or already unlocked, resolve immediately
  if (typeof window === "undefined") { resolve(); return; }
  // Check if AudioContext is already running (desktop browsers)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "running") {
      unlocked = true;
      resolve();
      ctx.close();
      return;
    }
    ctx.close();
  } catch {}
});

export function isAudioUnlocked() {
  return unlocked;
}

function doUnlock() {
  if (unlocked) return;
  unlocked = true;

  // 1. Resume any existing AudioContext (for Web Audio API sounds)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    // Play a silent buffer to fully unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {}

  // 2. Play + pause a silent HTML Audio element (unlocks HTMLAudioElement.play())
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