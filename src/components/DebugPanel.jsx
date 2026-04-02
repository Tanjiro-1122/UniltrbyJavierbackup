import { useState, useEffect, useRef } from 'react';

// Global floating debug panel — persists across all pages
// Activate: tap the 🔍 floating button (bottom-right, above nav)

const logs = [];
let setLogsExternal = null;

export function debugLog(msg) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const entry = `[${time}] ${msg}`;
  logs.unshift(entry);
  if (logs.length > 100) logs.pop();
  if (setLogsExternal) setLogsExternal([...logs]);
  console.log('[UNFILTR DEBUG]', msg);
}

export function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [logLines, setLogLines] = useState([]);
  const [minimized, setMinimized] = useState(false);
  const tapCount = useRef(0);
  const lastTap = useRef(0);

  useEffect(() => {
    setLogsExternal = setLogLines;

    // Auto-show if ?debug=1 in URL
    if (window.location.search.includes('debug=1')) setVisible(true);

    // Listen for native debug messages
    const handleNativeDebug = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'NATIVE_DEBUG') debugLog(`🍎 ${data.message}`);
        // Also capture Apple sign-in responses
        if (data?.type === 'APPLE_SIGN_IN_SUCCESS') debugLog(`✅ APPLE_SIGN_IN_SUCCESS: ${JSON.stringify(data.data)}`);
        if (data?.type === 'APPLE_SIGN_IN_CANCELLED') debugLog(`🚫 APPLE_SIGN_IN_CANCELLED`);
        if (data?.type === 'APPLE_SIGN_IN_ERROR') debugLog(`❌ APPLE_SIGN_IN_ERROR: ${data.error}`);
      } catch (e) {}
    };
    window.addEventListener('message', handleNativeDebug);
    return () => {
      setLogsExternal = null;
      window.removeEventListener('message', handleNativeDebug);
    };
  }, []);

  // Secret 5-tap on the floating button to toggle
  const handleTriggerTap = () => {
    const now = Date.now();
    tapCount.current = (now - lastTap.current < 2000) ? tapCount.current + 1 : 1;
    lastTap.current = now;
    if (tapCount.current >= 5) {
      setVisible(v => !v);
      tapCount.current = 0;
    }
  };

  const isNative = !!window.ReactNativeWebView;
  if (!isNative && !window.location.search.includes('debug=1')) return null;

  return (
    <>
      {/* Floating toggle button — always on top, always accessible */}
      <div
        onClick={handleTriggerTap}
        style={{
          position: 'fixed',
          bottom: 90,
          right: 12,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: visible ? '#a855f7' : 'rgba(168,85,247,0.25)',
          border: '1px solid rgba(168,85,247,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          zIndex: 99999,
          cursor: 'pointer',
          boxShadow: visible ? '0 0 12px rgba(168,85,247,0.6)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        🔍
      </div>

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
          maxHeight: minimized ? 44 : 320,
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
            <span>🔍 Debug Panel</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span onClick={() => { logs.length = 0; setLogLines([]); }} style={{ color: '#888', cursor: 'pointer' }}>Clear</span>
              <span onClick={() => setMinimized(m => !m)} style={{ color: '#a855f7', cursor: 'pointer' }}>{minimized ? '▲' : '▼'}</span>
              <span onClick={() => setVisible(false)} style={{ color: '#f43f5e', cursor: 'pointer' }}>✕</span>
            </div>
          </div>

          {/* Logs */}
          {!minimized && (
            <div style={{ overflowY: 'auto', padding: '6px 10px', flex: 1, color: '#e2e8f0' }}>
              {/* Quick snapshot */}
              <div style={{ marginBottom: 8, padding: '6px 8px', background: 'rgba(168,85,247,0.08)', borderRadius: 8, fontSize: 10 }}>
                <div style={{ color: '#a855f7', fontWeight: 'bold', marginBottom: 4 }}>QUICK SNAPSHOT</div>
                {[
                  ['User ID', localStorage.getItem('unfiltr_user_id') || '—'],
                  ['Apple ID', localStorage.getItem('unfiltr_apple_user_id') || '—'],
                  ['Premium', localStorage.getItem('unfiltr_is_premium') || '—'],
                  ['Display Name', localStorage.getItem('unfiltr_display_name') || '—'],
                  ['Native Bridge', window.ReactNativeWebView ? '✅ YES' : '❌ NO'],
                ].map(([k, v]) => (
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
                    color: line.includes('✅') ? '#4ade80'
                         : line.includes('❌') ? '#f87171'
                         : line.includes('⚠️') ? '#fbbf24'
                         : line.includes('🚫') ? '#f97316'
                         : line.includes('🍎') ? '#60a5fa'
                         : '#e2e8f0',
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
