import { useState, useEffect } from 'react';

// Debug panel — only shows in iOS wrapper or when ?debug=1 in URL
// Tap trigger moved to bottom-RIGHT corner (away from Settings logo tap zone)

const logs = [];
let setLogsExternal = null;

export function debugLog(msg) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const entry = `[${time}] ${msg}`;
  logs.unshift(entry);
  if (logs.length > 50) logs.pop();
  if (setLogsExternal) setLogsExternal([...logs]);
  console.log('[UNFILTR DEBUG]', msg);
}

export function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [logLines, setLogLines] = useState([]);
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    setLogsExternal = setLogLines;
    // Auto-show if ?debug=1 in URL
    if (window.location.search.includes('debug=1')) setVisible(true);

    // Listen for native debug messages
    const handleNativeDebug = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'NATIVE_DEBUG') {
          debugLog(`🍎 ${data.message}`);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleNativeDebug);

    return () => {
      setLogsExternal = null;
      window.removeEventListener('message', handleNativeDebug);
    };
  }, []);

  // Secret: tap 5x within 3 seconds to show/hide
  // Tap target is bottom-RIGHT corner to avoid conflict with Settings logo (bottom-left)
  const handleTriggerTap = () => {
    const now = Date.now();
    // Reset count if more than 3 seconds since last tap
    const newCount = (now - lastTap < 3000) ? tapCount + 1 : 1;
    setLastTap(now);
    setTapCount(newCount);
    if (newCount >= 5) {
      setVisible(v => !v);
      setTapCount(0);
    }
  };

  return (
    <>
      {/* Invisible tap target — bottom RIGHT corner (avoids Settings logo conflict) */}
      <div
        onClick={handleTriggerTap}
        style={{
          position: 'fixed', bottom: 80, right: 0,
          width: 44, height: 44, zIndex: 9998,
          opacity: 0, cursor: 'pointer',
        }}
      />

      {visible && (
        <div style={{
          position: 'fixed', bottom: 80, left: 8, right: 8,
          backgroundColor: 'rgba(0,0,0,0.92)',
          border: '1px solid #a855f7',
          borderRadius: 12,
          zIndex: 9999,
          maxHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          fontSize: 11,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 10px',
            borderBottom: '1px solid #a855f730',
            color: '#a855f7',
            fontWeight: 'bold',
            fontSize: 12,
          }}>
            <span>🔍 Purchase Debug</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span
                onClick={() => { logs.length = 0; setLogLines([]); }}
                style={{ color: '#888', cursor: 'pointer', fontSize: 11 }}
              >Clear</span>
              <span
                onClick={() => setVisible(false)}
                style={{ color: '#f43f5e', cursor: 'pointer', fontSize: 13 }}
              >✕</span>
            </div>
          </div>
          <div style={{
            overflowY: 'auto',
            padding: '6px 10px',
            flex: 1,
            color: '#e2e8f0',
          }}>
            {logLines.length === 0
              ? <div style={{ color: '#555' }}>Waiting for events...</div>
              : logLines.map((line, i) => (
                <div key={i} style={{
                  padding: '2px 0',
                  borderBottom: '1px solid #ffffff08',
                  color: line.includes('✅') ? '#4ade80'
                       : line.includes('❌') ? '#f87171'
                       : line.includes('⚠️') ? '#fbbf24'
                       : line.includes('🍎') ? '#60a5fa'
                       : '#e2e8f0'
                }}>
                  {line}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </>
  );
}
