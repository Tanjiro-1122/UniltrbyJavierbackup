import { useState, useEffect, useRef } from 'react';

// Global floating debug panel — persists across all pages
// Activate: tap the 🔍 floating button (bottom-right, above nav)
// Also auto-shows when ?debug=1 is in the URL

const logs = [];
let setLogsExternal = null;
let setErrorCountExternal = null;
// Module-level ref so the window.__unfiltrDebug API can open/close the panel
// without needing a UI button.
let setVisibleExternal = null;

// Tracks how many error-level entries exist so the badge stays accurate
// even when the panel hasn't mounted yet.
let pendingErrorCount = 0;

function _push(entry, isError) {
  logs.unshift(entry);
  if (logs.length > 200) logs.pop();
  if (isError) {
    pendingErrorCount += 1;
    if (setErrorCountExternal) setErrorCountExternal(c => c + 1);
  }
  if (setLogsExternal) setLogsExternal([...logs]);
}

export function debugLog(msg) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const entry = `[${time}] ${msg}`;
  const isError = msg.startsWith('❌') || msg.startsWith('🔴');
  _push(entry, isError);
  console.log('[UNFILTR DEBUG]', msg);
}

// ── Patch console.error / console.warn once at module load ──────────────────
// Store originals so we can still forward to the real console and restore on cleanup.
const _origError = console.error.bind(console);
const _origWarn  = console.warn.bind(console);

function _patchConsole() {
  console.error = (...args) => {
    _origError(...args);
    const msg = args.map(a => (a instanceof Error ? `${a.message}` : String(a))).join(' ');
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    _push(`[${time}] ❌ ${msg}`, true);
  };
  console.warn = (...args) => {
    _origWarn(...args);
    const msg = args.map(a => String(a)).join(' ');
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    _push(`[${time}] ⚠️ ${msg}`, false);
  };
}

function _restoreConsole() {
  console.error = _origError;
  console.warn  = _origWarn;
}

// ── Patch global fetch to log failed API calls ───────────────────────────────
// Only track our own /api/* endpoints and same-origin calls — skip external
// base44 SDK calls (app.base44.com) because those are already caught and
// handled internally by the SDK, and logging them here would double-count errors.
const _origFetch = window.fetch.bind(window);
function _isOwnApiUrl(url) {
  if (!url || url === '?') return false;
  if (url.startsWith('/api/')) return true;
  try {
    const u = new URL(url, window.location.href);
    // Own origin but not external SDK calls
    return u.origin === window.location.origin;
  } catch { return false; }
}
function _patchFetch() {
  window.fetch = async function patchedFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '?';
    try {
      const res = await _origFetch(input, init);
      if (!res.ok && _isOwnApiUrl(url)) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        _push(`[${time}] ❌ fetch ${res.status} ${url}`, true);
      }
      return res;
    } catch (err) {
      if (_isOwnApiUrl(url)) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        _push(`[${time}] ❌ fetch ERR ${url} — ${err.message}`, true);
      }
      throw err;
    }
  };
}
function _restoreFetch() {
  window.fetch = _origFetch;
}

export function DebugPanel() {
  const [visible, setVisible]         = useState(false);
  const [logLines, setLogLines]       = useState([...logs]);
  const [minimized, setMinimized]     = useState(false);
  const [errorCount, setErrorCount]   = useState(pendingErrorCount);
  const [copied, setCopied]           = useState(false);
  // Bumped whenever auth state changes so QUICK SNAPSHOT re-reads localStorage
  const [snapshotVersion, setSnapshotVersion] = useState(0);

  useEffect(() => {
    setLogsExternal      = setLogLines;
    setErrorCountExternal = setErrorCount;
    setVisibleExternal    = setVisible;
    // Sync any logs that were captured before this component mounted
    setLogLines([...logs]);
    setErrorCount(pendingErrorCount);

    // Apply patches on mount
    _patchConsole();
    _patchFetch();

    // Auto-show if ?debug=1 in URL
    if (window.location.search.includes('debug=1')) setVisible(true);

    // ── Expose programmatic API for external agent monitoring ────────────────
    // Access from any WebView / browser devtools / injected JS:
    //   window.__unfiltrDebug.logs          → live array of log strings
    //   window.__unfiltrDebug.errorCount    → number of captured errors
    //   window.__unfiltrDebug.snapshot()    → full debug snapshot string (same as "Copy")
    //   window.__unfiltrDebug.open()        → show the debug panel
    //   window.__unfiltrDebug.close()       → hide the debug panel
    //   window.__unfiltrDebug.clear()       → clear all logs
    window.__unfiltrDebug = {
      get logs()       { return [...logs]; },
      get errorCount() { return pendingErrorCount; },
      snapshot() {
        const subTier = localStorage.getItem('unfiltr_is_annual') === 'true' ? 'Annual'
          : localStorage.getItem('unfiltr_is_pro') === 'true' ? 'Pro'
          : localStorage.getItem('unfiltr_is_premium') === 'true' ? 'Premium'
          : 'Free';
        return [
          `=== UNFILTR DEBUG SNAPSHOT ${new Date().toISOString()} ===`,
          `User ID:      ${localStorage.getItem('unfiltr_user_id') || '—'}`,
          `Apple ID:     ${localStorage.getItem('unfiltr_apple_user_id') || '—'}`,
          `Profile ID:   ${localStorage.getItem('userProfileId') || '—'}`,
          `Device ID:    ${localStorage.getItem('unfiltr_device_id') || '—'}`,
          `Sub Tier:     ${subTier}`,
          `Display Name: ${localStorage.getItem('unfiltr_display_name') || '—'}`,
          `Native Bridge: ${window.ReactNativeWebView ? 'YES' : 'NO'}`,
          `UA: ${navigator.userAgent}`,
          '',
          '=== LOGS ===',
          ...logs,
        ].join('\n');
      },
      open()  { if (setVisibleExternal) { setVisibleExternal(true);  pendingErrorCount = 0; if (setErrorCountExternal) setErrorCountExternal(0); } },
      close() { if (setVisibleExternal) setVisibleExternal(false); },
      clear() {
        logs.length = 0;
        pendingErrorCount = 0;
        if (setLogsExternal)       setLogsExternal([]);
        if (setErrorCountExternal) setErrorCountExternal(0);
      },
    };

    // Refresh QUICK SNAPSHOT when auth state changes (sign-in, sign-out, storage update)
    const bumpSnapshot = () => setSnapshotVersion(v => v + 1);

    // Listen for native debug messages
    const handleNativeDebug = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'NATIVE_DEBUG')         debugLog(`🍎 ${data.message}`);
        if (data?.type === 'APPLE_SIGN_IN_SUCCESS') { debugLog(`✅ APPLE_SIGN_IN_SUCCESS: ${JSON.stringify(data.data)}`); bumpSnapshot(); }
        if (data?.type === 'APPLE_SIGN_IN_CANCELLED') debugLog(`🚫 APPLE_SIGN_IN_CANCELLED`);
        if (data?.type === 'APPLE_SIGN_IN_ERROR')   debugLog(`❌ APPLE_SIGN_IN_ERROR: ${data.error}`);
      } catch (e) {}
    };

    // Catch uncaught JS errors
    const handleWindowError = (event) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      _push(`[${time}] ❌ Uncaught: ${event.message} (${event.filename}:${event.lineno})`, true);
    };

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      _push(`[${time}] ❌ UnhandledRejection: ${reason}`, true);
    };

    window.addEventListener('message', handleNativeDebug);
    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('unfiltr_auth_updated', bumpSnapshot);
    window.addEventListener('storage', bumpSnapshot);

    return () => {
      setLogsExternal       = null;
      setErrorCountExternal = null;
      setVisibleExternal    = null;
      delete window.__unfiltrDebug;
      _restoreConsole();
      _restoreFetch();
      window.removeEventListener('message', handleNativeDebug);
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('unfiltr_auth_updated', bumpSnapshot);
      window.removeEventListener('storage', bumpSnapshot);
    };
  }, []);

  const handleClear = () => {
    logs.length = 0;
    pendingErrorCount = 0;
    setLogLines([]);
    setErrorCount(0);
  };

  const handleCopy = () => {
    const subTier = localStorage.getItem('unfiltr_is_annual') === 'true' ? 'Annual'
      : localStorage.getItem('unfiltr_is_pro') === 'true' ? 'Pro'
      : localStorage.getItem('unfiltr_is_premium') === 'true' ? 'Premium'
      : 'Free';
    const snapshot = [
      `=== UNFILTR DEBUG SNAPSHOT ${new Date().toISOString()} ===`,
      `User ID:      ${localStorage.getItem('unfiltr_user_id') || '—'}`,
      `Apple ID:     ${localStorage.getItem('unfiltr_apple_user_id') || '—'}`,
      `Profile ID:   ${localStorage.getItem('userProfileId') || '—'}`,
      `Device ID:    ${localStorage.getItem('unfiltr_device_id') || '—'}`,
      `Sub Tier:     ${subTier}`,
      `Display Name: ${localStorage.getItem('unfiltr_display_name') || '—'}`,
      `Native Bridge: ${window.ReactNativeWebView ? 'YES' : 'NO'}`,
      `UA: ${navigator.userAgent}`,
      '',
      '=== LOGS ===',
      ...logs,
    ].join('\n');
    navigator.clipboard?.writeText(snapshot).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lineColor = (line) => {
    if (line.includes('❌') || line.includes('🔴')) return '#f87171';
    if (line.includes('⚠️'))  return '#fbbf24';
    if (line.includes('✅'))  return '#4ade80';
    if (line.includes('🚫'))  return '#f97316';
    if (line.includes('🍎'))  return '#60a5fa';
    return '#e2e8f0';
  };

  return (
    <>
      {/* Floating toggle button — hidden from UI; use ?debug=1 or window.__unfiltrDebug.open() */}
      <div
        onClick={() => setVisible(v => {
          // Clear the error badge when opening the panel
          if (!v) { setErrorCount(0); pendingErrorCount = 0; }
          return !v;
        })}
        style={{
          display: 'none',
        }}
      />

      {/* Debug panel — floating overlay */}
      {visible && (
        <div style={{
          position: 'fixed',
          bottom: 134,
          left: 8,
          right: 8,
          backgroundColor: 'rgba(6,2,15,0.97)',
          border: '1px solid #a855f7',
          borderRadius: 14,
          zIndex: 99998,
          maxHeight: minimized ? 44 : 360,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          fontSize: 11,
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(168,85,247,0.3)',
          transition: 'max-height 0.2s',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px',
            borderBottom: minimized ? 'none' : '1px solid rgba(168,85,247,0.2)',
            color: '#a855f7',
            fontWeight: 'bold',
            fontSize: 12,
            flexShrink: 0,
          }}>
            <span>🔍 Debug Panel {errorCount > 0 && <span style={{ color: '#f87171' }}>({errorCount} error{errorCount !== 1 ? 's' : ''})</span>}</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span onClick={handleCopy} style={{ color: copied ? '#4ade80' : '#888', cursor: 'pointer' }}>{copied ? '✓ Copied' : 'Copy'}</span>
              <span onClick={handleClear} style={{ color: '#888', cursor: 'pointer' }}>Clear</span>
              <span onClick={() => setMinimized(m => !m)} style={{ color: '#a855f7', cursor: 'pointer' }}>{minimized ? '▲' : '▼'}</span>
              <span onClick={() => setVisible(false)} style={{ color: '#f43f5e', cursor: 'pointer' }}>✕</span>
            </div>
          </div>

          {/* Logs */}
          {!minimized && (
            <div style={{ overflowY: 'auto', padding: '6px 10px', flex: 1, color: '#e2e8f0' }}>
                {/* Quick snapshot — snapshotVersion forces re-read of localStorage when auth changes */}
              <div key={snapshotVersion} style={{ marginBottom: 8, padding: '6px 8px', background: 'rgba(168,85,247,0.08)', borderRadius: 8, fontSize: 10 }}>
                <div style={{ color: '#a855f7', fontWeight: 'bold', marginBottom: 4 }}>QUICK SNAPSHOT</div>
                {(() => {
                  const tier = localStorage.getItem('unfiltr_is_annual') === 'true' ? 'Annual'
                    : localStorage.getItem('unfiltr_is_pro') === 'true' ? 'Pro'
                    : localStorage.getItem('unfiltr_is_premium') === 'true' ? 'Premium'
                    : 'Free';
                  return [
                    ['User ID',       localStorage.getItem('unfiltr_user_id') || '—'],
                    ['Apple ID',      localStorage.getItem('unfiltr_apple_user_id') || '—'],
                    ['Profile ID',    localStorage.getItem('userProfileId') || '—'],
                    ['Device ID',     localStorage.getItem('unfiltr_device_id') || '—'],
                    ['Sub Tier',      tier],
                    ['Display Name',  localStorage.getItem('unfiltr_display_name') || '—'],
                    ['Native Bridge', window.ReactNativeWebView ? '✅ YES' : '❌ NO'],
                  ];
                })().map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                    <span style={{ color: v === '—' ? '#f43f5e' : v.includes('✅') ? '#4ade80' : '#e2e8f0', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Log lines */}
              {logLines.length === 0
                ? <div style={{ color: '#555' }}>Waiting for events...</div>
                : logLines.map((line, i) => (
                  <div key={i} style={{
                    padding: '2px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    color: lineColor(line),
                    wordBreak: 'break-all',
                  }}>
                    {line}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </>
  );
}
