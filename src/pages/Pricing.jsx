import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppleSubscriptions } from '@/components/hooks/useAppleSubscriptions';
import { base44 } from '@/api/base44Client';
import { Check, X, RotateCcw, Sparkles, MessageCircle, ChevronLeft, Lock, BookOpen, Brain, Volume2, History, Zap, Loader2, Star } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';

const PLANS = [
  {
    id: 'plus',
    productId: 'com.huertas.unfiltr.pro.monthly',
    label: 'Plus',
    price: '$9.99',
    period: '/month',
    badge: null,
    color: '#a855f7',
    bg: 'rgba(124,58,237,0.15)',
    border: 'rgba(168,85,247,0.5)',
    emoji: '💜',
    bullets: [
      '50 messages/day',
      'Up to 1,500 msgs/month',
      'Memory — companion remembers you',
      'Full conversation history',
      'Voice (TTS) responses',
      'Journal mode — 30 entries/month',
      'All 12 companions + all moods',
    ],
  },
  {
    id: 'pro',
    productId: 'com.huertas.unfiltr.pro.pro',
    label: 'Pro',
    price: '$14.99',
    period: '/month',
    badge: 'MOST POPULAR 🔥',
    badgeColor: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.6)',
    emoji: '⚡',
    bullets: [
      '100 messages/day',
      'Up to 3,000 msgs/month',
      'Memory — companion remembers you',
      'Full conversation history',
      'Voice (TTS) responses',
      'Journal mode — 100 entries/month',
      'Priority response speed',
      'All 12 companions + all moods',
    ],
  },
  {
    id: 'annual',
    productId: 'com.huertas.unfiltr.pro.annual',
    label: 'Yearly',
    price: '$59.99',
    period: '/year',
    badge: 'BEST VALUE 💎',
    badgeColor: 'linear-gradient(135deg,#06b6d4,#6366f1)',
    color: '#22d3ee',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(34,211,238,0.5)',
    emoji: '🌟',
    bullets: [
      'Truly unlimited messages',
      'Unlimited journal entries',
      'Memory — companion remembers you',
      'Full conversation history',
      'Voice (TTS) responses',
      'Priority response speed',
      'All 12 companions + all moods',
      'Everything in Pro — forever',
    ],
    note: 'Only $5/mo — save 67%',
  },
];

const FREE_BULLETS = [
  { text: '20 messages/day', ok: true },
  { text: 'Access to all 12 companions', ok: true },
  { text: 'All mood modes', ok: true },
  { text: 'No memory — resets each session', ok: false },
  { text: 'No conversation history', ok: false },
  { text: 'No voice responses', ok: false },
  { text: 'No journal access', ok: false },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [upgraded, setUpgraded] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const { products, loading, purchasing, error, statusMessage, purchase, restore } = useAppleSubscriptions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedMeta = PLANS.find(p => p.id === selectedPlan);
  const selectedProduct = products.find(p => p.productId?.includes(
    selectedPlan === 'annual' ? 'annual' : selectedPlan === 'pro' ? 'pro' : 'monthly'
  ));

  const handleRestore = async () => {
    try {
      const result = await restore();
      if (result?.success) { setRestoreSuccess(true); setUpgraded(true); }
    } catch (e) { console.error('[handleRestore]', e); }
  };

  React.useEffect(() => {
    if (searchParams.get('restore') === 'true') setTimeout(() => handleRestore(), 500);
  }, []);

  const handleSubscribe = async () => {
    try {
      if (!selectedProduct) return;
      const result = await purchase(selectedProduct.productId);
      if (result?.success) {
        const profileId = localStorage.getItem("userProfileId");
        if (profileId) {
          const isAnnual = selectedPlan === 'annual';
          const isPro    = selectedPlan === 'pro';
          await base44.entities.UserProfile.update(profileId, {
            is_premium: true,
            premium: true,
            annual_plan: isAnnual,
            pro_plan: isPro,
          });
          localStorage.setItem("unfiltr_is_premium", "true");
          localStorage.setItem("unfiltr_is_annual",  String(isAnnual));
          localStorage.setItem("unfiltr_is_pro",     String(isPro));
        }
        setUpgraded(true);
      }
    } catch (e) { console.error('[handleSubscribe]', e); }
  };

  if (upgraded) {
    return (
      <AppShell tabs={false} bg="radial-gradient(ellipse at center,#1a0533 0%,#0d0520 50%,#06020f 100%)">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:32, textAlign:'center' }}>
          <div style={{ fontSize:72, marginBottom:16 }}>{restoreSuccess ? '🔄' : selectedMeta?.emoji || '💜'}</div>
          <h2 style={{ color:'white', fontWeight:800, fontSize:26, margin:'0 0 12px' }}>
            {restoreSuccess ? 'Purchases Restored!' : `Welcome to ${selectedMeta?.label || 'Premium'}!`}
          </h2>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:15, margin:'0 0 32px', lineHeight:1.6 }}>
            {restoreSuccess
              ? 'Your premium access has been restored.'
              : 'You\'re all set. Your companion is ready 💜'}
          </p>
          <button onClick={() => navigate('/hub')} style={{
            background:'linear-gradient(135deg,#7c3aed,#db2777)',
            border:'none', borderRadius:16, padding:'16px 40px',
            color:'white', fontWeight:800, fontSize:16, cursor:'pointer',
          }}>
            Let's Go →
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell tabs={false} bg="radial-gradient(ellipse at center,#1a0533 0%,#0d0520 50%,#06020f 100%)">
      {/* Back */}
      <div style={{ flexShrink:0, padding:'max(16px,env(safe-area-inset-top)) 16px 0' }}>
        <button onClick={() => navigate(-1)} style={{
          display:'flex', alignItems:'center', gap:4,
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:12, padding:'8px 14px', cursor:'pointer', color:'white', fontSize:14, fontWeight:600,
        }}>
          <ChevronLeft size={18}/> Back
        </button>
      </div>

      <div className="scroll-area" style={{ padding:'16px 20px', paddingBottom:120 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>✨</div>
          <h1 style={{ color:'white', fontWeight:800, fontSize:26, margin:0 }}>Choose Your Plan</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginTop:8 }}>Start free — upgrade when you\'re ready.</p>
        </div>

        {/* Free card */}
        <div style={{
          borderRadius:16, padding:'16px 14px', marginBottom:12,
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ color:'white', fontWeight:700, fontSize:16 }}>🆓 Free</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>Always free</div>
            </div>
            <div style={{ color:'white', fontWeight:800, fontSize:22 }}>$0</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {FREE_BULLETS.map(({ text, ok }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{
                  width:16, height:16, borderRadius:'50%', flexShrink:0,
                  background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {ok ? <Check size={9} color="#22c55e"/> : <X size={9} color="#ef4444"/>}
                </div>
                <span style={{ color: ok ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontSize:12 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selector tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {PLANS.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
              flex:1, padding:'10px 4px', borderRadius:12, border:`2px solid ${selectedPlan === plan.id ? plan.border : 'rgba(255,255,255,0.08)'}`,
              background: selectedPlan === plan.id ? plan.bg : 'rgba(255,255,255,0.03)',
              cursor:'pointer', transition:'all 0.2s',
            }}>
              <div style={{ fontSize:18 }}>{plan.emoji}</div>
              <div style={{ color: selectedPlan === plan.id ? 'white' : 'rgba(255,255,255,0.5)', fontWeight:700, fontSize:12, marginTop:2 }}>{plan.label}</div>
              <div style={{ color: selectedPlan === plan.id ? plan.color : 'rgba(255,255,255,0.4)', fontWeight:800, fontSize:13 }}>{plan.price}</div>
            </button>
          ))}
        </div>

        {/* Selected plan detail card */}
        {selectedMeta && (
          <div style={{
            borderRadius:20, padding:'20px 18px', marginBottom:16,
            background: selectedMeta.bg,
            border:`2px solid ${selectedMeta.border}`,
            position:'relative',
          }}>
            {selectedMeta.badge && (
              <div style={{
                position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                background: selectedMeta.badgeColor, borderRadius:999, padding:'3px 14px', whiteSpace:'nowrap',
              }}>
                <span style={{ color:'white', fontWeight:800, fontSize:10 }}>{selectedMeta.badge}</span>
              </div>
            )}
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:36 }}>{selectedMeta.emoji}</div>
              <div style={{ color:'white', fontWeight:800, fontSize:20, marginTop:4 }}>{selectedMeta.label}</div>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:2, marginTop:4 }}>
                <span style={{ color: selectedMeta.color, fontWeight:800, fontSize:30 }}>{selectedMeta.price}</span>
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>{selectedMeta.period}</span>
              </div>
              {selectedMeta.note && (
                <div style={{ marginTop:6, background:'rgba(255,255,255,0.08)', borderRadius:999, padding:'3px 12px', display:'inline-block' }}>
                  <span style={{ color: selectedMeta.color, fontSize:12, fontWeight:700 }}>{selectedMeta.note}</span>
                </div>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {selectedMeta.bullets.map(text => (
                <div key={text} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{
                    width:18, height:18, borderRadius:'50%', flexShrink:0, marginTop:1,
                    background:`rgba(${selectedMeta.color === '#a855f7' ? '168,85,247' : selectedMeta.color === '#f59e0b' ? '245,158,11' : '34,211,238'},0.2)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Check size={10} color={selectedMeta.color}/>
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.85)', fontSize:13, lineHeight:1.4 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={purchasing || loading}
          style={{
            width:'100%', padding:'18px', borderRadius:18,
            background: purchasing || loading
              ? 'rgba(255,255,255,0.1)'
              : `linear-gradient(135deg,${selectedMeta?.color || '#a855f7'},#db2777)`,
            border:'none', cursor: purchasing ? 'wait' : 'pointer',
            color:'white', fontWeight:800, fontSize:16,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            marginBottom:12, transition:'all 0.2s',
            boxShadow: purchasing ? 'none' : `0 4px 20px rgba(${selectedMeta?.color === '#f59e0b' ? '245,158,11' : '168,85,247'},0.4)`,
          }}
        >
          {purchasing ? (
            <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Processing...</>
          ) : loading ? (
            'Loading...'
          ) : (
            `Start ${selectedMeta?.label} Plan →`
          )}
        </button>

        {statusMessage && (
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, textAlign:'center', margin:'0 0 12px' }}>{statusMessage}</p>
        )}
        {error && (
          <p style={{ color:'#f87171', fontSize:12, textAlign:'center', margin:'0 0 12px' }}>{error}</p>
        )}

        {/* Restore */}
        <button onClick={handleRestore} style={{
          width:'100%', padding:'12px', borderRadius:14,
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
          color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:20,
        }}>
          <RotateCcw size={14}/> Restore Purchases
        </button>

        {/* Legal */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:8 }}>
          <button onClick={() => navigate('/PrivacyPolicy')} style={{ background:'none', border:'none', color:'rgba(168,85,247,0.6)', fontSize:11, cursor:'pointer' }}>Privacy Policy</button>
          <button onClick={() => navigate('/TermsOfUse')} style={{ background:'none', border:'none', color:'rgba(168,85,247,0.6)', fontSize:11, cursor:'pointer' }}>Terms of Use</button>
        </div>
        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:10, textAlign:'center', margin:0, lineHeight:1.5 }}>
          Subscriptions auto-renew unless cancelled 24 hours before the end of the billing period.
          Manage or cancel in your App Store settings.
        </p>
      </div>
    </AppShell>
  );
}
