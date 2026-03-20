/**
 * iOS Audio Unlock + Shared AudioContext
 * 
 * iOS WKWebView (TestFlight / native wrapper) has TWO audio issues:
 * 1. AudioContext starts suspended until a user gesture unlocks it.
 * 2. The hardware mute/silent switch silences Web Audio API because
 *    WKWebView defaults to AVAudioSessionCategoryAmbient.
 *
 * Fix for #2: Play a looping silent HTML5 <audio> element. This forces
 * WKWebView to switch to AVAudioSessionCategoryPlayback, which ignores
 * the mute switch. This is a well-known workaround (iOS 11–17+).
 */

let unlocked = false;
let unlockPromiseResolve = null;
let sharedAudioContext = null;
let currentSource = null;
let silentAudioElement = null;

// Minimal silent MP3 (~100ms, mono, 56kbps) — keeps audio session alive
const SILENT_MP3 = "data:audio/mp3;base64,//tAxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAESAAzMzMzMzMzMzMzMzMzMzMzMzMzZmZmZmZmZmZmZmZmZmZmZmZmZmaZmZmZmZmZmZmZmZmZmZmZmZmZmczMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////8AAAA5TEFNRTMuMTAwAZYAAAAAAAAAABQ4JAMGQgAAOAAABEhNIZS0AAAAAAD/+0DEAAPH3Yz0AAR8CPqyIEABp6AxjG/4x/XiInE4lfQDFwIIRE+uBgZoW4RL0OLMDFn6E5v+/u5ehf76bu7/6bu5+gAiIQGAABQIUJ0QolFghEn/9PhZQpcUTpXMjo0OGzRCZXyKxoIQzB2KhCtGobpT9TRVj/3Pmfp+f8X7Pu1B04sTnc3s0XhOlXoGVCMNo9X//9/r6a10TZEY5DsxqvO7mO5qFvpFCmKIjhpSItGsUYcRO//7QsQRgEiljQIAgLFJAbIhNBCa+JmorCbOi5q9nVd2dKnusTMQg4MFUlD6DQ4OFijwGAijRMfLbHG4nLVTjydyPlJTj8pfPflf9/5GD950A5e+jsrmNZSjSirjs1R7hnkia8vr//l/7Nb+crvr9Ok5ZJOylUKRxf/P9Zn0j2P4pJYXyKkeuy5wUYtdmOu6uobEtFqhIJViLEKIjGxchGev/L3Y0O3bwrIOszTBAZ7Ih28EUaSOZf/7QsQfg8fpjQIADN0JHbGgQBAZ8T//y//t/7d/2+f5m7MdCeo/9tdkMtGLbt1tqnabRroO1Qfvh20yEbei8nfDXP7btW7f9/uO9tbe5IvHQbLlxpf3DkAk0ojYcv///5/u3/7PTfGjPEPUvt5D6f+/3Lea4lz4tc4TnM/mFPrmalWbboeNiNyeyr+vufttZuvrVrt/WYv3T74JFo8qEDiJqJrmDTs///v99xDku2xG02jjunrICP/7QsQtA8kpkQAAgNMA/7FgQAGnobgfghgqA+uXwWQ3XFmGimSbe2X3ksY//KzK1a2k6cnNWOPJnPWUsYbKqkh8RJzrVf///P///////4vyhLKHLrCb5nIrYIUss4cthigL1lQ1wwNAc6C1pf1TIKRSkt+a//z+yLVcwlXKSqeSuCVQFLng2h4AFAFgTkH+Z/8jTX/zr//zsJV/5f//5UX/0ZNCNCCaf5lTCTRkaEdhNP//n/KUjf/7QsQ5AEhdiwAAjN7I6jGddBCO+WGTQ1mXrYatSAgaykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==";

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
 * Start the silent looping HTML5 Audio element.
 * This forces WKWebView audio session to AVAudioSessionCategoryPlayback,
 * which ignores the iOS hardware mute/silent switch.
 */
function startSilentAudioLoop() {
  if (silentAudioElement) return; // already running
  try {
    const audio = document.createElement("audio");
    audio.setAttribute("x-webkit-airplay", "deny"); // hide from AirPlay/control center
    audio.preload = "auto";
    audio.loop = true;
    audio.src = SILENT_MP3;
    audio.volume = 0.01; // near-silent but nonzero to keep session active
    audio.play().catch(() => {}); // may fail if not in gesture — that's fine, we retry
    silentAudioElement = audio;
    console.log("[Audio] Silent loop started for mute-switch bypass");
  } catch (e) {
    console.warn("[Audio] Failed to start silent loop:", e?.message);
  }
}

/**
 * Resume the shared AudioContext + silent loop.
 * Call this on every user tap/gesture to ensure iOS doesn't suspend it.
 */
export async function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  // (Re)start the silent loop on every gesture — iOS may have killed it
  startSilentAudioLoop();
  if (silentAudioElement && silentAudioElement.paused) {
    silentAudioElement.play().catch(() => {});
  }
  if (!unlocked) {
    unlocked = true;
    if (unlockPromiseResolve) unlockPromiseResolve();
  }
  return ctx;
}

/**
 * Play MP3 audio from a base64 string using Web Audio API (ArrayBuffer path).
 * Falls back to HTML5 Audio data URI if Web Audio API fails.
 */
export async function playAudioFromBase64(base64Audio) {
  console.log('[TTS] playAudioFromBase64 called, base64 length:', base64Audio?.length);
  
  if (!base64Audio || base64Audio.length === 0) {
    console.error('[TTS] No base64 audio data provided');
    return;
  }

  // Decode base64 → ArrayBuffer
  const binaryStr = atob(base64Audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const audioBuffer = bytes.buffer;
  console.log('[TTS] ArrayBuffer created, size:', audioBuffer.byteLength, 'bytes');

  // Stop any currently playing source
  stopCurrentAudio();

  try {
    const ctx = getAudioContext();
    console.log('[TTS] AudioContext state before resume:', ctx.state);
    if (ctx.state === "suspended") await ctx.resume();
    console.log('[TTS] AudioContext state after resume:', ctx.state);

    // decodeAudioData needs a COPY of the ArrayBuffer (it detaches the original)
    const buffer = await ctx.decodeAudioData(audioBuffer.slice(0));
    console.log('[TTS] decodeAudioData success — duration:', buffer.duration, 's');

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    currentSource = source;
    
    source.start(0);
    console.log('[TTS] Web Audio playback started');

    await new Promise((resolve) => {
      // Safety timeout: if onended never fires, resolve after duration + 2s
      const safetyMs = (buffer.duration * 1000) + 2000;
      const timeout = setTimeout(() => {
        console.warn('[TTS] Safety timeout — onended did not fire');
        currentSource = null;
        resolve();
      }, safetyMs);

      source.onended = () => {
        clearTimeout(timeout);
        console.log('[TTS] Web Audio playback ended normally');
        currentSource = null;
        resolve();
      };
    });
  } catch (error) {
    console.error('[TTS] Web Audio API failed:', error?.message || error);
    console.log('[TTS] Falling back to HTML5 Audio data URI...');
    currentSource = null;

    // Fallback: HTML5 Audio with data URI (more reliable than Blob URLs on iOS)
    try {
      const dataUri = "data:audio/mpeg;base64," + base64Audio;
      const audio = new Audio(dataUri);
      audio.playsInline = true;
      audio.setAttribute('playsinline', '');
      
      console.log('[TTS] HTML5 Audio data URI playing...');
      await audio.play();

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[TTS] HTML5 safety timeout');
          resolve();
        }, 60000); // max 60s

        audio.onended = () => {
          clearTimeout(timeout);
          console.log('[TTS] HTML5 Audio playback ended');
          resolve();
        };
        audio.onerror = () => {
          clearTimeout(timeout);
          console.error('[TTS] HTML5 Audio error');
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

// ── First-gesture unlock ──
function doUnlock() {
  if (unlocked) return;
  unlocked = true;

  // Create + resume the shared AudioContext
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    // Play a silent buffer to fully unlock Web Audio API
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {}

  // Start the silent HTML5 loop for mute-switch bypass
  startSilentAudioLoop();

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