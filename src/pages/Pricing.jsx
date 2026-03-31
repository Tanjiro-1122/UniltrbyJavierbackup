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
      { icon: MessageCircle, text: '100 messages/day' },
      { icon: MessageCircle, text: 'Up to 3,000 msgs/month' },
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
  const [upgraded, setUpgraded]         = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const { products, loading, purchasing, error, statusMessage, purchase, restore } = useAppleSubscriptions();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  const meta    = PLANS.find(p => p.id === selectedPlan);
  const product = products.find(p =>
    selectedPlan === 'annual' ? p.productId?.includes('annual')
    : selectedPlan === 'pro'  ? p.productId?.includes('tier.pro')
    : p.productId?.includes('monthly')
  );

  const handleRestore = async () => {
    try {
      const r = await restore();
      if (r?.success) { setRestoreSuccess(true); setUpgraded(true); }
    } catch {}
  };

  React.useEffect(() => {
    if (searchParams.get('restore') === 'true') setTimeout(handleRestore, 500);
  }, []);

  const handleSubscribe = async () => {
    try {
      if (!product) return;
      const result = await purchase(product.productId);
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
    } catch (e) { console.error('[subscribe]', e); }
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
          {restoreSuccess ? 'Your access has been restored.' : 'Your companion is ready. Let\'s talk 💜'}
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
          <div style={{ fontSize:52, marginBottom:10, filter:'drop-shadow(0 0 20px rgba(168,85,247,0.6))' }}>✨</div>
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
              flex:1, padding:'11px 4px', borderRadius:14,
              border:`2px solid ${selectedPlan === p.id ? p.border : 'rgba(255,255,255,0.07)'}`,
              background: selectedPlan === p.id ? p.bg : 'rgba(255,255,255,0.02)',
              cursor:'pointer', transition:'all 0.18s', position:'relative',
            }}>
              {p.badge && (
                <div style={{
                  position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)',
                  background: BADGE_COLORS[p.badge], borderRadius:999, padding:'2px 8px', whiteSpace:'nowrap',
                  pointerEvents:'none',
                }}>
                  <span style={{ color:'white', fontWeight:800, fontSize:8 }}>{p.badge}</span>
                </div>
              )}
              <div style={{ fontSize:20 }}>{p.emoji}</div>
              <div style={{ color: selectedPlan === p.id ? 'white' : 'rgba(255,255,255,0.45)',
                            fontWeight:700, fontSize:12, marginTop:3 }}>{p.label}</div>
              <div style={{ color: selectedPlan === p.id ? p.color : 'rgba(255,255,255,0.3)',
                            fontWeight:800, fontSize:13 }}>{p.price}</div>
            </button>
          ))}
        </div>

        {/* ── Selected plan detail ── */}
        {meta && (
          <div style={{
            borderRadius:22, padding:'22px 18px', marginBottom:18,
            background: meta.bg,
            border:`2px solid ${meta.border}`,
            boxShadow:`0 8px 32px ${meta.glow}`,
            position:'relative',
          }}>
            {meta.badge && (
              <div style={{
                position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)',
                background: BADGE_COLORS[meta.badge], borderRadius:999, padding:'4px 16px', whiteSpace:'nowrap',
              }}>
                <span style={{ color:'white', fontWeight:800, fontSize:11 }}>{meta.badge} {meta.id === 'pro' ? '🔥' : '💎'}</span>
              </div>
            )}

            {/* Plan header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
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
          disabled={purchasing || loading}
          style={{
            width:'100%', padding:'18px', borderRadius:18,
            background: (purchasing || loading)
              ? 'rgba(255,255,255,0.08)'
              : `linear-gradient(135deg,${meta?.color || '#a855f7'} 0%,#db2777 100%)`,
            border:'none', cursor: purchasing ? 'wait' : 'pointer',
            color:'white', fontWeight:800, fontSize:16,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            marginBottom:10, transition:'all 0.2s',
            boxShadow: (purchasing || loading) ? 'none' : `0 6px 24px ${meta?.glow || 'rgba(168,85,247,0.4)'}`,
          }}
        >
          {purchasing
            ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Processing...</>
            : loading ? 'Loading plans...'
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

        {/* ── Legal ── */}
        <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:10 }}>
          <button onClick={() => navigate('/PrivacyPolicy')} style={{ background:'none', border:'none', color:'rgba(168,85,247,0.5)', fontSize:11, cursor:'pointer' }}>
            Privacy Policy
          </button>
          <button onClick={() => navigate('/TermsOfUse')} style={{ background:'none', border:'none', color:'rgba(168,85,247,0.5)', fontSize:11, cursor:'pointer' }}>
            Terms of Use
          </button>
        </div>
        <p style={{ color:'rgba(255,255,255,0.18)', fontSize:10, textAlign:'center', margin:0, lineHeight:1.6, paddingHorizontal:8 }}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing period.
          Manage or cancel anytime in your Apple ID Settings.
        </p>

      </div>
    </AppShell>
  );
}
