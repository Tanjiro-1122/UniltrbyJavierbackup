import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppleSubscriptions } from '@/components/hooks/useAppleSubscriptions';
import { Brain, MessageCircle, Mic, Zap, BookOpen, RotateCcw, Loader2, ChevronLeft } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMidnightCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Plans ───────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'annual',
    productId: 'com.huertas.unfiltr.pro.annual',
    label: '$99.99 / year',
    sub: 'Ultimate Friend — only $8.33/mo · Memory · Continuity · Cancel anytime',
    badge: 'ULTIMATE FRIEND ⭐',
    badgeBg: 'linear-gradient(135deg,#7c3aed,#ec4899)',
    isAnnual: true,
    isPro: false,
    isUltimate: true,
  },
  {
    id: 'pro',
    productId: 'com.huertas.unfiltr.tier.pro',
    label: '$14.99 / month',
    sub: '200 msgs/day · Priority speed · Full journal access',
    badge: 'MOST POPULAR ⚡',
    badgeBg: 'linear-gradient(135deg,#f59e0b,#a855f7)',
    isAnnual: false,
    isPro: true,
  },
  {
    id: 'monthly',
    productId: 'com.huertas.unfiltr.pro.monthly',
    label: '$9.99 / month',
    sub: '100 msgs/day · Auto-renews monthly',
    badge: null,
    isAnnual: false,
    isPro: false,
  },
];

const PERKS = [
  { icon: Brain,         label: 'Deep memory — your companion truly knows you' },
  { icon: MessageCircle, label: 'Up to 200 msgs/day (vs 10 free)' },
  { icon: Mic,           label: 'Voice responses (TTS)' },
  { icon: BookOpen,      label: 'Full conversation history & journal' },
  { icon: Zap,           label: 'Priority responses' },
];

const ULTIMATE_PERKS = [
  { icon: Brain,         label: 'Persistent memory across every session' },
  { icon: MessageCircle, label: 'Unlimited messages — no daily cap' },
  { icon: Mic,           label: 'Voice responses (TTS)' },
  { icon: BookOpen,      label: 'Full conversation history & journal' },
  { icon: Zap,           label: 'Priority responses' },
  { icon: RotateCcw,     label: 'Relationship continuity — picks up where you left off' },
];

// ─── IAP Debug Panel ─────────────────────────────────────────────────────────

function IAPDebugPanel({ onClose }) {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString();
    setLog(prev => [...prev, { ts, msg, type }]);
  };

  const runDiag = async () => {
    setRunning(true);
    setLog([]);
    addLog('🚀 Starting IAP diagnostic...');
    const hasRNWV = !!window.ReactNativeWebView;
    const hasWTN  = !!window.webkit?.messageHandlers?.ReactNativeWebView;
    addLog('ReactNativeWebView: ' + (hasRNWV ? '✅ FOUND' : '❌ NOT FOUND'), hasRNWV ? 'ok' : 'error');
    addLog('webkit.messageHandlers: ' + (hasWTN ? '✅ FOUND' : '❌ NOT FOUND'), hasWTN ? 'ok' : 'error');

    addLog('--- localStorage ---');
    ['unfiltr_is_premium','unfiltr_user_id','userProfileId','unfiltr_display_name','unfiltr_onboarding_complete'].forEach(k => {
      const v = localStorage.getItem(k);
      addLog('  ' + k + ': ' + (v ?? '(null)'), v ? 'ok' : 'warn');
    });

    if (hasRNWV || hasWTN) {
      const send = (msg) => {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        else window.webkit.messageHandlers.ReactNativeWebView.postMessage(JSON.stringify(msg));
      };
      const waitFor = (types, timeout = 15000) => new Promise(resolve => {
        const t = setTimeout(() => resolve({ error: 'TIMEOUT after ' + (timeout / 1000) + 's' }), timeout);
        const h = (e) => {
          try {
            const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            if (types.includes(d.type)) { clearTimeout(t); window.removeEventListener('message', h); resolve(d); }
          } catch {}
        };
        window.addEventListener('message', h);
      });

      addLog('📡 Sending GET_OFFERINGS...');
      send({ type: 'GET_OFFERINGS' });
      const off = await waitFor(['OFFERINGS_RESULT', 'OFFERINGS_ERROR']);
      if (off.error) {
        addLog('❌ GET_OFFERINGS: ' + off.error, 'error');
      } else {
        const pkgs = off.data?.current?.availablePackages || [];
        addLog('✅ Offerings: ' + pkgs.length + ' packages', pkgs.length > 0 ? 'ok' : 'warn');
        pkgs.forEach(p => addLog('    📦 ' + p.identifier));
      }

      addLog('📡 Sending GET_CUSTOMER_INFO...');
      send({ type: 'GET_CUSTOMER_INFO' });
      const ci = await waitFor(['CUSTOMER_INFO_RESULT'], 10000);
      if (ci.error) {
        addLog('❌ GET_CUSTOMER_INFO: ' + ci.error, 'error');
      } else {
        const ents = Object.keys(ci.data?.entitlements?.active || {});
        addLog('✅ Entitlements: ' + (ents.length ? ents.join(', ') : 'NONE'), ents.length ? 'ok' : 'warn');
      }
    }
    addLog('✅ Done.');
    setRunning(false);
  };

  const colorFor = (t) => t === 'ok' ? '#4ade80' : t === 'error' ? '#f87171' : t === 'warn' ? '#fbbf24' : '#a78bfa';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', padding: 16,
      paddingTop: 'max(48px, env(safe-area-inset-top, 48px))',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16 }}>🔧 IAP Diagnostic</span>
        <button onClick={onClose} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Close</button>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 12 }}>
        <p style={{ color: '#a78bfa', fontWeight: 700, margin: '0 0 6px' }}>QUICK SNAPSHOT</p>
        {[
          ['User ID', localStorage.getItem('unfiltr_user_id')],
          ['Profile ID', localStorage.getItem('userProfileId')],
          ['Premium', localStorage.getItem('unfiltr_is_premium')],
          ['Display Name', localStorage.getItem('unfiltr_display_name')],
          ['Native Bridge', window.ReactNativeWebView ? '✅ YES' : '❌ NO'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
            <span style={{ color: v && v !== 'null' ? '#4ade80' : '#f87171' }}>{v || '—'}</span>
          </div>
        ))}
      </div>
      <button
        onClick={runDiag}
        disabled={running}
        style={{
          background: 'linear-gradient(135deg,#7c3aed,#db2777)', color: 'white',
          border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700,
          marginBottom: 12, cursor: 'pointer', opacity: running ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {running ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Running...</> : '▶ Run IAP Diagnostic'}
      </button>
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
        {log.map((l, i) => (
          <p key={i} style={{ margin: '2px 0', color: colorFor(l.type) }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 6 }}>{l.ts}</span>{l.msg}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({ onClose, navigate }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    try {
      const res = await fetch('/api/utils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verifySpecialCode', code }),
      });
      const data = await res.json();
      if (data.type === 'admin') {
        localStorage.setItem('unfiltr_admin_unlocked', 'true');
        sessionStorage.setItem('unfiltr_admin_token', code);
        onClose();
        navigate('/AdminDashboard');
      } else if (data.type === 'family') {
        const profileId = localStorage.getItem('userProfileId');
        if (profileId) {
          fetch('/api/syncProfile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', profileId, updateData: { is_premium: true, annual_plan: true, family_unlimited: true, ultimate_friend: true } }) }).catch(() => {});
        }
        const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        localStorage.setItem('unfiltr_family_unlimited', 'true');
        localStorage.setItem('unfiltr_family_unlimited_expires_at', oneYearFromNow);
        localStorage.setItem('unfiltr_is_premium', 'true');
        localStorage.setItem('unfiltr_is_annual', 'true');
        localStorage.setItem('unfiltr_family_unlock', 'true');
        localStorage.setItem('unfiltr_msg_limit_override', 'true');
        localStorage.setItem('unfiltr_bonus_messages', '99999');
        window.dispatchEvent(new Event('unfiltr_auth_updated'));
        onClose();
        alert('✅ Family access unlocked!');
      } else {
        setErr('Invalid code');
      }
    } catch {
      setErr('Could not verify code. Please try again.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1a0a35', borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, border: '1px solid rgba(168,85,247,0.3)' }}>
        <p style={{ color: 'white', fontWeight: 700, fontSize: 18, textAlign: 'center', marginBottom: 6 }}>🔐 Admin Access</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Enter the admin code to unlock.</p>
        <input
          type="password"
          value={code}
          onChange={e => { setCode(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter code..."
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(168,85,247,0.3)', color: 'white', fontSize: 15, marginBottom: 8, boxSizing: 'border-box' }}
        />
        {err && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{err}</p>}
        <button onClick={submit} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#db2777)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginBottom: 10 }}>Unlock</button>
        <button onClick={onClose} style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [planType, setPlanType]   = useState('annual');
  const [countdown, setCountdown] = useState(getMidnightCountdown());
  const [tab, setTab]             = useState('upgrade');
  const [showAdmin, setShowAdmin] = useState(false);
  const [tapCount, setTapCount]   = useState(0);
  const tapTimer                  = useRef(null);

  const { purchasing, error, statusMessage, purchase, restore, loadProducts } = useAppleSubscriptions();

  useEffect(() => {
    const t = setInterval(() => setCountdown(getMidnightCountdown()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadProducts();
    if (searchParams.get('restore') === 'true') setTimeout(handleRestore, 500);
  }, []);

  const selectedPlan = PLANS.find(p => p.id === planType) || PLANS[0];

  // 5 taps on ✨ → opens IAP debug panel
  const handleSparkTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (next >= 5) {
      setTapCount(0);
      setShowDebug(true);
    } else {
      tapTimer.current = setTimeout(() => setTapCount(0), 2000);
    }
  };

  const handleSubscribe = async () => {
    const result = await purchase(selectedPlan.productId);
    if (result?.success || result?.isSuccess) {
      const profileId = localStorage.getItem('userProfileId');
      const userId    = localStorage.getItem('unfiltr_apple_user_id') || localStorage.getItem('unfiltr_user_id');
      // Update localStorage immediately so chat page sees premium status
      localStorage.setItem('unfiltr_is_premium', 'true');
      localStorage.setItem('unfiltr_is_annual',  String(selectedPlan.isAnnual));
      localStorage.setItem('unfiltr_is_pro',     String(selectedPlan.isPro));
      // Notify rest of app
      window.dispatchEvent(new Event('unfiltr_premium_updated'));
      window.dispatchEvent(new Event('unfiltr_auth_updated'));
      // Save premium to DB — use profileId (record ID) if available, otherwise call API
      if (profileId) {
        try {
          await fetch('/api/syncProfile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', profileId, updateData: { is_premium: true, annual_plan: selectedPlan.isAnnual, pro_plan: selectedPlan.isPro || false } }) });
          console.log('[Pricing] ✅ Premium saved to DB via profileId');
        } catch(e) { console.warn('[Pricing] DB update non-fatal:', e); }
      } else if (userId) {
        // No profileId — call verifyPurchase which does apple_user_id field lookup
        try {
          await fetch('/api/verifyPurchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileId: userId,
              userId:    userId,
              productId: selectedPlan.productId,
            }),
          });
          console.log('[Pricing] ✅ Premium saved to DB via verifyPurchase fallback');
        } catch(e) { console.warn('[Pricing] verifyPurchase fallback non-fatal:', e); }
      }
      navigate("/hub");
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restore();
      if (result?.success || result?.isSuccess) {
        // useAppleSubscriptions.restorePurchases() already updated is_premium + is_annual/is_pro
        // via /api/verifyPurchase. Navigate immediately — localStorage is already correct.
        navigate("/hub");
      }
    } catch (e) {
      // Handled by useAppleSubscriptions error state; log for debug
      console.error('[Pricing] handleRestore error:', e.message);
    }
  };

  return (
    <AppShell hideNav>
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} navigate={navigate} />}

      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(180deg,#1a0a35 0%,#0d0520 100%)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
          <button
            onClick={() => navigate("/hub")}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          ><ChevronLeft size={18} color="white" /></button>

          {/* 5-tap secret: ✨ emoji */}
          <span onClick={handleSparkTap} style={{ fontSize: 22, cursor: 'pointer', userSelect: 'none' }}>✨</span>

          {/* Hidden admin button — tap to open admin panel */}
          <button onClick={() => setShowAdmin(true)} style={{ background: 'transparent', border: 'none', color: 'transparent', fontSize: 10, cursor: 'pointer', padding: '4px 8px', userSelect: 'none' }}>{"·"}</button>
        </div>

        <div style={{ padding: '0 20px', flex: 1 }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 4, borderRadius: 14, background: 'rgba(255,255,255,0.05)' }}>
            {[['upgrade','✨ Upgrade'],['wait','⏳ Wait']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14,
                background: tab === id ? (id === 'upgrade' ? 'linear-gradient(135deg,#7c3aed,#db2777)' : 'rgba(255,255,255,0.1)') : 'transparent',
                color: tab === id ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: tab === id && id === 'upgrade' ? '0 0 12px rgba(168,85,247,0.4)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          {tab === 'upgrade' && (
            <>
              {/* Hero */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>You've hit your limit</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>You've used all 10 free messages today. Upgrade to keep chatting — no limits, ever.</p>
              </div>

              {/* Perks */}
              <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PERKS.map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="#a78bfa" />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Plans */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => setPlanType(plan.id)} style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                    background: planType === plan.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${planType === plan.id ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer', position: 'relative',
                  }}>
                    {plan.badge && (
                      <div style={{ position: 'absolute', top: -10, right: 12, background: plan.badgeBg, borderRadius: 999, padding: '2px 10px' }}>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: 10 }}>{plan.badge}</span>
                      </div>
                    )}
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>{plan.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: '2px 0 0' }}>{plan.sub}</p>
                  </button>
                ))}
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{error}</p>}
              {statusMessage && <p style={{ color: '#a78bfa', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{statusMessage}</p>}

              {/* CTA */}
              <button
                onClick={handleSubscribe}
                disabled={purchasing}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 16,
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7,#db2777)',
                  boxShadow: '0 0 24px rgba(168,85,247,0.4)',
                  color: 'white', fontWeight: 700, fontSize: 17,
                  border: 'none', cursor: 'pointer', marginBottom: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: purchasing ? 0.6 : 1,
                }}
              >
                {purchasing
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                  : `Start ${planType === 'annual' ? 'Ultimate Friend' : planType === 'pro' ? 'Pro' : 'Plus'} — ${selectedPlan.label.split(' ')[0]}`}
              </button>

              <button onClick={handleRestore} style={{
                width: '100%', padding: '12px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                border: 'none', cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <RotateCcw size={14} /> Restore Previous Purchase
              </button>

              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
                Subscriptions auto-renew unless cancelled at least 24 hours before the end of the billing period.
              </p>
            </>
          )}

          {tab === 'wait' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 16 }}>
              <div style={{ fontSize: 48 }}>⏳</div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: 20, margin: 0 }}>Messages reset at midnight</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center' }}>
                Your free messages reset every day at midnight. Come back then or upgrade now for unlimited access.
              </p>
              <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: '20px 32px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 6px' }}>Time until reset</p>
                <p style={{ color: '#a78bfa', fontWeight: 800, fontSize: 36, fontFamily: 'monospace', margin: 0 }}>{countdown}</p>
              </div>
              <button onClick={() => setTab('upgrade')} style={{
                padding: '14px 32px', borderRadius: 14,
                background: 'linear-gradient(135deg,#7c3aed,#db2777)',
                color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 8,
              }}>✨ Upgrade Instead</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '16px 0 0' }}>
          <button onClick={() => navigate('/PrivacyPolicy')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer' }}>Privacy Policy</button>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer' }}>Terms of Use</button>
        </div>
      </div>
    </AppShell>
  );
}



