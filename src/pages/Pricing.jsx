import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppleSubscriptions } from '@/components/hooks/useAppleSubscriptions';
import { base44 } from '@/api/base44Client';
import { Check, X, RotateCcw, Sparkles, MessageCircle, Mic, Zap, Loader2, ChevronLeft, Lock, BookOpen, Brain, Heart, Volume2, History } from 'lucide-react';
import AppShell from '@/components/shell/AppShell';

const FREE_FEATURES = [
  { icon: MessageCircle, label: '20 messages per day' },
  { icon: Sparkles,      label: 'Access to all 12 companions' },
  { icon: Heart,         label: '3 mood modes (Happy, Neutral, Sad)' },
  { icon: X,             label: 'No conversation history saved', locked: true },
  { icon: X,             label: 'No memory between sessions', locked: true },
  { icon: X,             label: 'No voice (TTS)', locked: true },
  { icon: X,             label: 'No journal access', locked: true },
];

const PREMIUM_FEATURES = [
  { icon: MessageCircle, label: 'Unlimited messages, every day' },
  { icon: Sparkles,      label: 'All 12 companions + all mood modes' },
  { icon: Brain,         label: 'Memory — companion remembers you' },
  { icon: History,       label: 'Full conversation history saved' },
  { icon: Volume2,       label: 'Voice (TTS) responses' },
  { icon: BookOpen,      label: 'Journal mode unlocked' },
  { icon: Zap,           label: 'Priority response speed' },
];

const COMPARISON = [
  { feature: 'Daily messages',        free: '20/day',     premium: 'Unlimited' },
  { feature: 'Companions',            free: 'All 12',     premium: 'All 12' },
  { feature: 'Mood modes',            free: '3 basic',    premium: 'All modes' },
  { feature: 'Conversation history',  free: false,        premium: true },
  { feature: 'Memory between sessions', free: false,      premium: true },
  { feature: 'Voice responses (TTS)', free: false,        premium: true },
  { feature: 'Journal mode',          free: false,        premium: true },
  { feature: 'Priority responses',    free: false,        premium: true },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [showComparison, setShowComparison] = useState(false);
  const { products, loading, purchasing, error, statusMessage, purchase, restore } = useAppleSubscriptions();

  const annualProduct  = products.find(p => p.productId?.includes('annual'));
  const monthlyProduct = products.find(p => p.productId?.includes('monthly'));
  const selectedProduct = selectedPlan === 'annual' ? annualProduct : monthlyProduct;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [upgraded, setUpgraded] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleRestore = async () => {
    try {
    const result = await restore();
    if (result?.success) {
      setRestoreSuccess(true);
      setUpgraded(true);
    }
    } catch (e) { console.error('[handleRestore]', e); }
  };

  // Auto-trigger restore if coming from Support page (defined after handleRestore to avoid stale closure)
  React.useEffect(() => {
    if (searchParams.get('restore') === 'true') {
      setTimeout(() => handleRestore(), 500);
    }
  }, []);

  const handleSubscribe = async () => {
    try {
    if (!selectedProduct) return;
    const result = await purchase(selectedProduct.productId);
    if (result?.success) {
      const profileId = localStorage.getItem("userProfileId");
      if (profileId) {
        const isAnnual = selectedPlan === 'annual';
        await base44.entities.UserProfile.update(profileId, {
          is_premium: true,
          premium: true,
          annual_plan: isAnnual,
        });
      }
      setUpgraded(true);
    }
    } catch (e) { console.error('[handleSubscribe]', e); }
  };

  return (
    <AppShell tabs={false} bg="radial-gradient(ellipse at center, #1a0533 0%, #0d0520 50%, #06020f 100%)">
      {/* Back button */}
      <div style={{ flexShrink: 0, padding: 'max(16px, env(safe-area-inset-top)) 16px 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer', color: 'white', fontSize: 14, fontWeight: 600,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      <div className="scroll-area" style={{ padding: '16px 20px', paddingBottom: 120 }}>
        <div style={{ width: '100%' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: 26, margin: 0 }}>
              Choose Your Plan
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>
              Start free — upgrade when you're ready.
            </p>
          </div>

          {/* Free vs Premium cards side by side */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {/* Free Card */}
            <div style={{
              flex: 1, borderRadius: 16, padding: '16px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 24 }}>🆓</div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '4px 0 0' }}>Free</p>
                <p style={{ color: '#a78bfa', fontWeight: 800, fontSize: 22, margin: '2px 0 0' }}>$0</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>forever</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FREE_FEATURES.map(({ icon: Icon, label, locked }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: locked ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {locked
                        ? <X size={10} color="#ef4444" />
                        : <Check size={10} color="#22c55e" />
                      }
                    </div>
                    <p style={{
                      color: locked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
                      fontSize: 11, margin: 0, lineHeight: 1.4,
                    }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Card */}
            <div style={{
              flex: 1, borderRadius: 16, padding: '16px 14px',
              background: 'rgba(124,58,237,0.15)',
              border: '2px solid rgba(168,85,247,0.5)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                borderRadius: 999, padding: '3px 12px', whiteSpace: 'nowrap',
              }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 10 }}>BEST VALUE 🔥</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 24 }}>💜</div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '4px 0 0' }}>Premium</p>
                <p style={{ color: '#a855f7', fontWeight: 800, fontSize: 22, margin: '2px 0 0' }}>$9.99</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>per month</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: 'rgba(168,85,247,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} color="#a855f7" />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, margin: 0, lineHeight: 1.4 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plan selector */}
          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 20 }}>
              Loading plans...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {/* Annual */}
              <button
                onClick={() => setSelectedPlan('annual')}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, textAlign: 'left',
                  background: selectedPlan === 'annual' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${selectedPlan === 'annual' ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer', position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', top: -10, right: 12,
                  background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                  borderRadius: 999, padding: '2px 10px',
                }}>
                  <span style={{ color: 'white', fontWeight: 800, fontSize: 10 }}>SAVE 50% 🔥</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>
                      {annualProduct?.price || '$59.99'}
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}> /year</span>
                      <span style={{ fontSize: 13, color: '#a78bfa', marginLeft: 8 }}>($5.00/mo)</span>
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '3px 0 0' }}>
                      🎉 2 months free vs monthly · Cancel anytime
                    </p>
                  </div>
                  {selectedPlan === 'annual' && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={13} color="white" />
                    </div>
                  )}
                </div>
              </button>

              {/* Monthly */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, textAlign: 'left',
                  background: selectedPlan === 'monthly' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${selectedPlan === 'monthly' ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 16, margin: 0 }}>
                      {monthlyProduct?.price || '$9.99'}
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}> /month</span>
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '3px 0 0' }}>
                      Full access · Auto-renews monthly
                    </p>
                  </div>
                  {selectedPlan === 'monthly' && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={13} color="white" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Error / Status */}
          {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>}
          {statusMessage && <p style={{ color: '#a78bfa', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{statusMessage}</p>}

          {/* Subscribe button */}
          <button
            onClick={handleSubscribe}
            disabled={purchasing}
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #db2777)',
              border: 'none', borderRadius: 18,
              color: 'white', fontWeight: 800, fontSize: 17,
              boxShadow: '0 0 28px rgba(168,85,247,0.45)',
              cursor: purchasing || loading ? 'not-allowed' : 'pointer',
              opacity: purchasing || loading ? 0.7 : 1,
              marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {purchasing ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
            ) : (
              selectedPlan === 'annual' ? 'Start Annual Plan 🚀' : 'Start Monthly Plan'
            )}
          </button>

          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>
            🔒 7-day free trial · Cancel anytime · No commitment
          </p>

          {/* Upgraded / Restored success */}
          {upgraded && (
            <div style={{
              background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)',
              borderRadius: 18, padding: '20px', marginBottom: 12, textAlign: 'center',
            }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>🎉</p>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 18, margin: '0 0 4px' }}>
                {restoreSuccess ? 'Purchases Restored!' : "You're Premium!"}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px' }}>
                {restoreSuccess ? 'Your premium access has been restored and unlocked.' : 'Welcome to Unfiltr Premium 💜'}
              </p>
              <button
                onClick={() => navigate('/chat')}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  border: 'none', borderRadius: 14,
                  color: 'white', fontWeight: 800, fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                Start Chatting →
              </button>
            </div>
          )}

          {/* Feature Comparison Toggle */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #db2777, #a855f7)',
              border: 'none', borderRadius: 14,
              color: 'white', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', marginBottom: 16,
            }}
          >
            {showComparison ? 'Hide' : '📊 Feature Comparison'}
          </button>

          {showComparison && (
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 20,
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                padding: '12px 16px', gap: 8,
                background: 'rgba(124,58,237,0.3)',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, margin: 0 }}>Feature</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, margin: 0, textAlign: 'center', width: 56 }}>Free</p>
                <p style={{ color: '#a855f7', fontSize: 12, fontWeight: 700, margin: 0, textAlign: 'center', width: 70 }}>Premium</p>
              </div>
              {COMPARISON.map((row, i) => (
                <div
                  key={row.feature}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    padding: '11px 16px', gap: 8,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'center',
                  }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: 0 }}>{row.feature}</p>
                  <div style={{ width: 56, textAlign: 'center' }}>
                    {typeof row.free === 'boolean'
                      ? row.free
                        ? <Check size={14} color="#22c55e" />
                        : <X size={14} color="#ef4444" />
                      : <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{row.free}</span>
                    }
                  </div>
                  <div style={{ width: 70, textAlign: 'center' }}>
                    {typeof row.premium === 'boolean'
                      ? row.premium
                        ? <Check size={14} color="#a855f7" />
                        : <X size={14} color="#ef4444" />
                      : <span style={{ color: '#a855f7', fontSize: 11, fontWeight: 700 }}>{row.premium}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restore purchases */}
          <button
            onClick={handleRestore}
            style={{
              width: '100%', padding: '13px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, color: 'rgba(255,255,255,0.5)', fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginBottom: 16,
            }}
          >
            <RotateCcw size={14} /> Restore Purchases
          </button>

          {/* Gift */}
          <button
            onClick={async () => {
              const text = "🎁 Gift a friend Unfiltr Premium!\n\nGive someone you love unlimited access to their personal AI companion 💜\n\nunfiltrbyjavier2.vercel.app";
              if (navigator.share) {
                await navigator.share({ title: "Gift Unfiltr Premium", text });
              } else {
                await navigator.clipboard.writeText(text);
                alert("Gift link copied to clipboard! 🎁");
              }
            }}
            style={{
              width: '100%', padding: '13px',
              background: 'rgba(219,39,119,0.1)', border: '1px solid rgba(219,39,119,0.25)',
              borderRadius: 14, color: 'rgba(255,255,255,0.6)', fontSize: 13,
              cursor: 'pointer', marginBottom: 24,
            }}
          >
            🎁 Gift a Subscription
          </button>

          {/* Legal footer */}
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: '0 0 8px' }}>
              Subscription auto-renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your App Store account settings.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => navigate('/PrivacyPolicy')} style={{ background: 'none', border: 'none', color: 'rgba(168,85,247,0.6)', fontSize: 12, cursor: 'pointer' }}>Privacy Policy</button>
              <button onClick={() => navigate('/TermsOfUse')} style={{ background: 'none', border: 'none', color: 'rgba(168,85,247,0.6)', fontSize: 12, cursor: 'pointer' }}>Terms of Use</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, margin: '8px 0 0' }}>© 2026 Unfiltr. All rights reserved.</p>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
