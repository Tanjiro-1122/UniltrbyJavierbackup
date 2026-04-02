import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppleSubscriptions } from '@/components/hooks/useAppleSubscriptions';
import { base44 } from '@/api/base44Client';
import { Check, X, RotateCcw, ChevronLeft, Loader2, MessageCircle, Brain, BookOpen, Volume2, History, Zap, Shield } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';

const PLANS = [
  {
    id: 'plus',
    productId: 'com.huertas.unfiltr.pro.monthly',
    label: 'Plus',
    price: '$9.99',
    period: 'per month',
    badge: null,
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.3)',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(168,85,247,0.45)',
    emoji: '💜',
    tagline: 'Perfect for regular connection',
    bullets: [
      { icon: MessageCircle, text: '100 messages/day' },
      { icon: MessageCircle, text: 'Up to 3,000 msgs/month' },
      { icon: Brain,         text: 'Memory — companion remembers you' },
      { icon: History,       text: 'Full conversation history' },
      { icon: Volume2,       text: 'Voice responses (TTS)' },
      { icon: BookOpen,      text: 'Journal mode — 30 entries/month' },
    ],
  },
  {
    id: 'pro',
    productId: 'com.huertas.unfiltr.tier.pro',
    label: 'Pro',
    price: '$14.99',
    period: 'per month',
    badge: 'MOST POPULAR',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.55)',
    emoji: '⚡',
    tagline: 'For those who need more',
    bullets: [
      { icon: MessageCircle, text: '250 messages/day' },
      { icon: MessageCircle, text: 'Up to 7,500 msgs/month' },
      { icon: Brain,         text: 'Memory — companion remembers you' },
      { icon: History,       text: 'Full conversation history' },
      { icon: Volume2,       text: 'Voice responses (TTS)' },
      { icon: BookOpen,      text: 'Journal mode — 100 entries/month' },
      { icon: Zap,           text: 'Priority response speed' },
    ],
  },
  {
    id: 'annual',
    productId: 'com.huertas.unfiltr.pro.annual',
    label: 'Yearly',
    price: '$59.99',
    period: 'per year',
    badge: 'BEST VALUE',
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.3)',
    bg: 'rgba(6,182,212,0.10)',
    border: 'rgba(34,211,238,0.45)',
    emoji: '🌟',
    tagline: 'Only $5/mo — save 67%',
    bullets: [
      { icon: MessageCircle, text: 'Truly unlimited messages' },
      { icon: BookOpen,      text: 'Unlimited journal entries' },
      { icon: Brain,         text: 'Memory — companion remembers everything' },
      { icon: History,       text: 'Full conversation history' },
      { icon: Volume2,       text: 'Voice responses (TTS)' },
      { icon: Zap,           text: 'Priority response speed' },
      { icon: Shield,        text: 'Everything in Pro — forever' },
    ],
  },
];

const FREE_FEATURES = [
  { text: '20 messages/day', ok: true },
  { text: 'All 12 companions', ok: true },
  { text: 'All mood modes', ok: true },
  { text: 'Memory (resets each session)', ok: false },
  { text: 'Conversation history', ok: false },
  { text: 'Voice responses', ok: false },
  { text: 'Journal mode', ok: false },
];

const BADGE_COLORS = {
  'MOST POPULAR': 'linear-gradient(135deg,#f59e0b,#ef4444)',
  'BEST VALUE':   'linear-gradient(135deg,#06b6d4,#6366f1)',
};

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [appleSignInPending, setAppleSignInPending] = useState(false);
  const [appleSignInDone, setAppleSignInDone] = useState(
    !!localStorage.getItem('unfiltr_apple_user_id')
  );
  const [upgraded, setUpgraded]         = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [showDebug, setShowDebug]   = useState(false);
  const [headerTaps, setHeaderTaps] = useState(0);
  const handleHeaderTap = () => {
    setHeaderTaps(n => {
      const next = n + 1;
      if (next >= 5) { setShowDebug(true); return 0; }
      return next;
    });
  };
  const [debugLog, setDebugLog]     = useState([]);
  const [iapTesting, setIapTesting] = useState(false);

  const addLog = (msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, { ts, msg, type }]);
    console.log('[UNFILTR IAP]', ts, msg);
  };

  const runIapDiagnostic = async () => {
    setIapTesting(true);
    setDebugLog([]);
    addLog('🚀 Starting IAP diagnostic...');

    const hasRNWV = !!(window.ReactNativeWebView);
    const hasWTN  = !!(window.webkit?.messageHandlers?.ReactNativeWebView);
    addLog('ReactNativeWebView: ' + (hasRNWV ? '✅ FOUND' : '❌ NOT FOUND'), hasRNWV ? 'ok' : 'error');
    addLog('webkit.messageHandlers: ' + (hasWTN ? '✅ FOUND' : '❌ NOT FOUND'), hasWTN ? 'ok' : 'error');
    if (!hasRNWV && !hasWTN) addLog('⚠️ No native bridge — running in web browser, not iOS wrapper', 'warn');

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
        const t = setTimeout(() => resolve({ error: 'TIMEOUT after ' + (timeout/1000) + 's' }), timeout);
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
        addLog('✅ Offerings received — type: ' + off.type, 'ok');
        const pkgs = off.data?.current?.availablePackages || [];
        addLog('  packages: ' + pkgs.length, pkgs.length > 0 ? 'ok' : 'error');
        pkgs.forEach(p => addLog('    📦 ' + p.identifier + ' → ' + (p.product?.productIdentifier || '?')));
        if (pkgs.length === 0) addLog('⚠️ No packages — check RevenueCat dashboard', 'warn');
      }

      addLog('📡 Sending GET_CUSTOMER_INFO...');
      send({ type: 'GET_CUSTOMER_INFO' });
      const ci = await waitFor(['CUSTOMER_INFO_RESULT', 'CUSTOMER_INFO_ERROR'], 10000);
      if (ci.error) {
        addLog('❌ GET_CUSTOMER_INFO: ' + ci.error, 'error');
      } else {
        addLog('✅ Customer info received', 'ok');
        const ents = ci.data?.entitlements?.active || {};
        const keys = Object.keys(ents);
        addLog('  Active entitlements: ' + (keys.length ? keys.join(', ') : 'NONE'), keys.length ? 'ok' : 'warn');
        const hasPro = !!ents['unfiltr by javier Pro'];
        addLog('  "unfiltr by javier Pro": ' + (hasPro ? '✅ ACTIVE' : '❌ NOT ACTIVE'), hasPro ? 'ok' : 'error');
      }
    }
    addLog('✅ Done.');
    setIapTesting(false);
  };
  const { products, loading, purchasing, error, statusMessage, purchase, restore, loadProducts } = useAppleSubscriptions();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  const meta = PLANS.find(p => p.id === selectedPlan);

  // ✅ Always resolve productId — first try live RevenueCat products, fall back to hardcoded PLANS productId
  const resolvedProductId = (() => {
    if (products && products.length > 0) {
      const match = products.find(p =>
        selectedPlan === 'annual'  ? p.productId?.includes('annual')
        : selectedPlan === 'pro'  ? p.productId?.includes('tier.pro')
        : p.productId?.includes('monthly')
      );
      if (match) return match.productId;
    }
    // Fallback: use the hardcoded productId from PLANS — never blocks the purchase
    return meta?.productId || null;
  })();

  const handleRestore = async () => {
    try {
      const r = await restore();
      if (r?.success) { setRestoreSuccess(true); setUpgraded(true); }
    } catch {}
  };

  React.useEffect(() => {
    if (searchParams.get('restore') === 'true') setTimeout(handleRestore, 500);
    loadProducts(); // only fetch when pricing page opens
  }, []);

  // Sign in with Apple — requests native bridge, waits for response
  const requestAppleSignIn = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Apple sign-in timeout')), 60000);

      const handler = async (e) => {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (msg.type === 'APPLE_SIGN_IN_SUCCESS') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          try {
            // Call backend to find/create profile
            const res = await fetch('/api/appleAuth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appleUserId: msg.data.appleUserId,
                email: msg.data.email,
                fullName: msg.data.fullName,
                displayName: localStorage.getItem('unfiltr_display_name'),
              }),
            });
            const result = await res.json();
            if (result.ok) {
              localStorage.setItem('unfiltr_apple_user_id', msg.data.appleUserId);
              localStorage.setItem('userProfileId', result.profileId);
              localStorage.setItem('unfiltr_user_id', result.profileId);
              localStorage.setItem('unfiltr_auth_token', result.profileId);
              if (result.displayName) localStorage.setItem('unfiltr_display_name', result.displayName);
              window.dispatchEvent(new Event('unfiltr_auth_updated'));
              resolve(result);
            } else {
              reject(new Error(result.error || 'Auth failed'));
            }
          } catch (err) { reject(err); }
        }
        if (msg.type === 'APPLE_SIGN_IN_CANCELLED') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          reject(new Error('cancelled'));
        }
        if (msg.type === 'APPLE_SIGN_IN_ERROR') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          reject(new Error(msg.error || 'Apple sign-in failed'));
        }
      };

      window.addEventListener('message', handler);

      // Send to native bridge
      const bridgeMsg = JSON.stringify({ type: 'SIGN_IN_WITH_APPLE' });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(bridgeMsg);
      else if (window.webkit?.messageHandlers?.ReactNativeWebView)
        window.webkit.messageHandlers.ReactNativeWebView.postMessage(bridgeMsg);
      else {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        reject(new Error('no_bridge'));
      }
    });
  };

  const handleSubscribe = async () => {
    try {
      if (!resolvedProductId) {
        console.error('[subscribe] No productId resolved for plan:', selectedPlan);
        return;
      }

      // Step 1: Require Sign in with Apple before purchase if not already done
      const hasAppleId = !!localStorage.getItem('unfiltr_apple_user_id');
      if (!hasAppleId) {
        setAppleSignInPending(true);
        try {
          await requestAppleSignIn();
          setAppleSignInDone(true);
        } catch (err) {
          setAppleSignInPending(false);
          if (err.message === 'cancelled') return; // user cancelled — do nothing
          if (err.message === 'no_bridge') {
            // Web browser / simulator — skip Apple sign-in, proceed anyway
            console.warn('[subscribe] No native bridge — skipping Apple sign-in');
          } else {
            console.error('[subscribe] Apple sign-in failed:', err.message);
            return;
          }
        }
        setAppleSignInPending(false);
      }

      console.log('[subscribe] Purchasing productId:', resolvedProductId, 'for plan:', selectedPlan);
      const result = await purchase(resolvedProductId);
      if (result?.success) {
        const pid = localStorage.getItem('userProfileId');
        if (pid) {
          const isAnnual = selectedPlan === 'annual';
          const isPro    = selectedPlan === 'pro';
          await base44.entities.UserProfile.update(pid, {
            is_premium: true, premium: true,
            annual_plan: isAnnual, pro_plan: isPro,
          });
          localStorage.setItem('unfiltr_is_premium', 'true');
          localStorage.setItem('unfiltr_is_annual',  String(isAnnual));
          localStorage.setItem('unfiltr_is_pro',     String(isPro));
        }
        setUpgraded(true);
      }
    } catch (e) {
      console.error('[subscribe]', e);
    } finally {
      setAppleSignInPending(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (upgraded) return (
    <AppShell tabs={false} bg="radial-gradient(ellipse at center,#1a0533 0%,#0d0520 60%,#06020f 100%)">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    height:'100%', padding:32, textAlign:'center' }}>
        <div style={{ fontSize:80, marginBottom:20 }}>{restoreSuccess ? '🔄' : meta?.emoji || '💜'}</div>
        <h2 style={{ color:'white', fontWeight:800, fontSize:28, margin:'0 0 12px' }}>
          {restoreSuccess ? 'Purchases Restored!' : `You're on ${meta?.label}!`}
        </h2>
        <p style={{ color:'rgba(255,255,255,0.55)', fontSize:15, margin:'0 0 36px', lineHeight:1.6 }}>
          {restoreSuccess ? 'Your access has been restored.' : "Your companion is ready. Let's talk 💜"}
        </p>
        <button onClick={() => navigate('/hub')} style={{
          background:'linear-gradient(135deg,#7c3aed,#db2777)',
          border:'none', borderRadius:18, padding:'16px 44px',
          color:'white', fontWeight:800, fontSize:17, cursor:'pointer',
          boxShadow:'0 6px 24px rgba(124,58,237,0.5)',
        }}>Let's Go →</button>
      </div>
    </AppShell>
  );

  /* ── Main page ──────────────────────────────────────────────────────────── */
  return (
    <AppShell tabs={false} bg="radial-gradient(ellipse at center,#1a0533 0%,#0d0520 60%,#06020f 100%)">

      {/* Back */}
      <div style={{ flexShrink:0, padding:'max(16px,env(safe-area-inset-top)) 16px 0' }}>
        <button onClick={() => navigate(-1)} style={{
          display:'flex', alignItems:'center', gap:4,
          background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:12, padding:'8px 14px', cursor:'pointer', color:'white', fontSize:14, fontWeight:600,
        }}>
          <ChevronLeft size={16}/> Back
        </button>
      </div>

      <div className="scroll-area" style={{ padding:'20px 18px', paddingBottom:100 }}>

        {/* ── Header ── */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div onClick={handleHeaderTap} style={{ fontSize:52, marginBottom:10, filter:'drop-shadow(0 0 20px rgba(168,85,247,0.6))', cursor:'default', userSelect:'none' }}>✨</div>
          <h1 style={{ color:'white', fontWeight:900, fontSize:28, margin:'0 0 8px', letterSpacing:-0.5 }}>
            Upgrade Unfiltr
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, margin:0, lineHeight:1.5 }}>
            Deeper connection. Real memory. No limits.
          </p>
        </div>

        {/* ── Free tier ── */}
        <div style={{
          borderRadius:18, padding:'16px 16px', marginBottom:16,
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <div style={{ color:'rgba(255,255,255,0.9)', fontWeight:700, fontSize:17 }}>🆓 Free</div>
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12, marginTop:2 }}>Always free, always here</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'white', fontWeight:900, fontSize:24 }}>$0</div>
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>forever</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {FREE_FEATURES.map(({ text, ok }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{
                  width:17, height:17, borderRadius:'50%', flexShrink:0,
                  background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {ok ? <Check size={9} color="#22c55e"/> : <X size={9} color="#ef4444"/>}
                </div>
                <span style={{ fontSize:12.5, color: ok ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.28)', lineHeight:1.3 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Plan tab selector ── */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setSelectedPlan(p.id)} style={{
              flex:1, padding:'11px 4px', paddingTop: p.badge ? 18 : 11, borderRadius:14,
              border:`2px solid ${selectedPlan === p.id ? p.border : 'rgba(255,255,255,0.07)'}`,
              background: selectedPlan === p.id ? p.bg : 'rgba(255,255,255,0.02)',
              cursor:'pointer', transition:'all 0.18s', position:'relative',
              marginTop: p.badge ? 8 : 0,
            }}>
              {p.badge && (
                <div style={{
                  position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)',
                  background: BADGE_COLORS[p.badge], borderRadius:6, padding:'2px 7px',
                  fontSize:8, fontWeight:800, color:'white', whiteSpace:'nowrap', letterSpacing:0.3,
                }}>
                  {p.badge}
                </div>
              )}
              <div style={{ color: selectedPlan === p.id ? 'white' : 'rgba(255,255,255,0.4)', fontWeight:700, fontSize:12 }}>{p.label}</div>
              <div style={{ color: selectedPlan === p.id ? p.color : 'rgba(255,255,255,0.25)', fontWeight:800, fontSize:14, marginTop:2 }}>{p.price}</div>
            </button>
          ))}
        </div>

        {/* ── Plan detail card ── */}
        {meta && (
          <div style={{
            borderRadius:20, padding:'20px 18px', marginBottom:20,
            background: meta.bg, border:`1.5px solid ${meta.border}`,
            boxShadow:`0 0 32px ${meta.glow}`, position:'relative', overflow:'hidden',
          }}>
            {meta.badge && (
              <div style={{
                position:'absolute', top:14, right:14,
                background: BADGE_COLORS[meta.badge], borderRadius:8, padding:'4px 10px',
                fontSize:10, fontWeight:800, color:'white', letterSpacing:0.4,
              }}>
                <span style={{ color:'white', fontWeight:800, fontSize:11 }}>{meta.badge} {meta.id === 'pro' ? '🔥' : '💎'}</span>
              </div>
            )}

            {/* Plan header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, marginTop: meta.badge ? 28 : 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:38 }}>{meta.emoji}</div>
                <div>
                  <div style={{ color:'white', fontWeight:800, fontSize:20 }}>{meta.label}</div>
                  <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12, marginTop:2 }}>{meta.tagline}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color: meta.color, fontWeight:900, fontSize:28, lineHeight:1 }}>{meta.price}</div>
                <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:3 }}>{meta.period}</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'rgba(255,255,255,0.08)', marginBottom:16 }}/>

            {/* Feature list */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {meta.bullets.map(({ icon: Icon, text }) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{
                    width:28, height:28, borderRadius:8, flexShrink:0,
                    background:`rgba(${meta.color === '#a855f7' ? '168,85,247' : meta.color === '#f59e0b' ? '245,158,11' : '34,211,238'},0.15)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Icon size={13} color={meta.color}/>
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.88)', fontSize:13.5, lineHeight:1.3 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA button ── */}
        <button
          onClick={handleSubscribe}
          disabled={purchasing || appleSignInPending}
          style={{
            width:'100%', padding:'18px', borderRadius:18,
            background: (purchasing || appleSignInPending)
              ? 'rgba(255,255,255,0.08)'
              : `linear-gradient(135deg,${meta?.color || '#a855f7'} 0%,#db2777 100%)`,
            border:'none', cursor: (purchasing || appleSignInPending) ? 'wait' : 'pointer',
            color:'white', fontWeight:800, fontSize:16,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            marginBottom:10, transition:'all 0.2s',
            boxShadow: purchasing ? 'none' : `0 6px 24px ${meta?.glow || 'rgba(168,85,247,0.4)'}`,
          }}
        >
          {purchasing
            ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Processing...</>
            : `Start ${meta?.label} — ${meta?.price} ${meta?.id === 'annual' ? '/yr' : '/mo'}`
          }
        </button>

        {statusMessage && (
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, textAlign:'center', margin:'0 0 10px' }}>{statusMessage}</p>
        )}
        {error && (
          <p style={{ color:'#f87171', fontSize:12, textAlign:'center', margin:'0 0 10px' }}>{error}</p>
        )}

        {/* ── Restore ── */}
        <button onClick={handleRestore} style={{
          width:'100%', padding:'13px', borderRadius:14,
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
          color:'rgba(255,255,255,0.45)', fontSize:13, cursor:'pointer', fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:24,
        }}>
          <RotateCcw size={14}/> Restore Previous Purchase
        </button>

        {/* ── Debug Panel — hidden, unlock by tapping ✨ 5x ── */}
        <div style={{ marginBottom: 16 }}>
          {showDebug && (
            <div style={{ background:'rgba(0,0,0,0.7)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:12, marginTop:6, padding:14, fontFamily:'monospace' }}>
              <div style={{ marginBottom:10, display:'flex', gap:8 }}>
                <button onClick={runIapDiagnostic} disabled={iapTesting}
                  style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'none', background: iapTesting ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.8)', color:'white', fontSize:12, fontWeight:700, cursor: iapTesting ? 'not-allowed' : 'pointer' }}>
                  {iapTesting ? '⏳ Running...' : '▶ Run IAP Diagnostic'}
                </button>
                <button onClick={() => setDebugLog([])} style={{ padding:'9px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer' }}>Clear</button>
              </div>
              <div style={{ marginBottom:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, margin:'0 0 4px', fontWeight:700 }}>QUICK SNAPSHOT</p>
                {[
                  ['User ID',      localStorage.getItem('unfiltr_user_id')],
                  ['Profile ID',   localStorage.getItem('userProfileId')],
                  ['Premium',      localStorage.getItem('unfiltr_is_premium')],
                  ['Display Name', localStorage.getItem('unfiltr_display_name')],
                  ['Native Bridge',window.ReactNativeWebView ? '✅ YES' : '❌ NO'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>{k}</span>
                    <span style={{ color: v && v !== 'null' ? '#a855f7' : '#f87171', fontSize:11, maxWidth:'55%', textAlign:'right', wordBreak:'break-all' }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
              <div style={{ maxHeight:240, overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
                {debugLog.length === 0 && <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11, textAlign:'center', margin:'8px 0' }}>Tap "Run IAP Diagnostic" to start</p>}
                {debugLog.map((e,i) => (
                  <div key={i} style={{ fontSize:11, lineHeight:1.5, color: e.type==='error'?'#f87171':e.type==='warn'?'#fbbf24':e.type==='ok'?'#4ade80':'rgba(255,255,255,0.55)' }}>
                    <span style={{ color:'rgba(255,255,255,0.2)', marginRight:6 }}>{e.ts}</span>{e.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Legal ── */}
        <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:10 }}>
          <button onClick={() => navigate('/PrivacyPolicy')} style={{ background:'none', border:'none', color:'rgba(168,85,247,0.5)', fontSize:11, cursor:'pointer' }}>
            Privacy Policy
          </button>
          <button onClick={() => navigate('/TermsOfUse')} style={{ background:'none', border:'none', color:'rgba(168,85,247,0.5)', fontSize:11, cursor:'pointer' }}>
            Terms of Use
          </button>
        </div>
        <p style={{ color:'rgba(255,255,255,0.18)', fontSize:10, textAlign:'center', margin:0, lineHeight:1.6 }}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing period.
          Manage or cancel anytime in your Apple ID Settings.
        </p>

      </div>
    </AppShell>
  );
}




