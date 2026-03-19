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
  console.log('[TTS] playAudioFromBase64 called, base64 length:', base64Audio?.length);
  
  if (!base64Audio || base64Audio.length === 0) {
    console.error('[TTS] No base64 audio data provided');
    return;
  }

  // Decode base64 → ArrayBuffer
  console.log('[TTS] Decoding base64 to ArrayBuffer...');
  const binaryStr = atob(base64Audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const audioBuffer = bytes.buffer;
  console.log('[TTS] ArrayBuffer created, size:', audioBuffer.byteLength, 'bytes');

  // Stop any currently playing source
  if (currentSource) {
    console.log('[TTS] Stopping previous audio source');
    try { currentSource.stop(); } catch {}
    currentSource = null;
  }

  try {
    const ctx = getAudioContext();
    console.log('[TTS] AudioContext state before resume:', ctx.state);
    await ctx.resume();
    console.log('[TTS] AudioContext state after resume:', ctx.state);

    console.log('[TTS] Calling decodeAudioData...');
    const buffer = await ctx.decodeAudioData(audioBuffer.slice(0));
    console.log('[TTS] decodeAudioData success — duration:', buffer.duration, 's, channels:', buffer.numberOfChannels, ', sampleRate:', buffer.sampleRate);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    currentSource = source;
    
    console.log('[TTS] Starting Web Audio playback...');
    source.start(0);
    console.log('[TTS] Web Audio source.start(0) called successfully');

    await new Promise((resolve) => {
      source.onended = () => {
        console.log('[TTS] Web Audio playback ended normally');
        currentSource = null;
        resolve();
      };
    });
  } catch (error) {
    console.error('[TTS] Web Audio API failed:', error?.message || error);
    console.log('[TTS] Falling back to HTML5 Audio...');
    currentSource = null;

    try {
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      console.log('[TTS] HTML5 Audio blob URL created:', url);
      
      const audio = new Audio(url);
      audio.playsInline = true;
      audio.setAttribute('playsinline', '');
      
      console.log('[TTS] Calling HTML5 audio.play()...');
      await audio.play();
      console.log('[TTS] HTML5 Audio playing');

      await new Promise((resolve) => {
        audio.onended = () => {
          console.log('[TTS] HTML5 Audio playback ended');
          URL.revokeObjectURL(url);
          resolve();
        };
      });
    } catch (fallbackError) {
      console.error('[TTS] HTML5 Audio fallback also failed:', fallbackError?.message || fallbackError);
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