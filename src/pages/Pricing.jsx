import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppleSubscriptions } from '@/components/hooks/useAppleSubscriptions';
import { base44 } from '@/api/base44Client';
import { Check, RotateCcw, Sparkles, MessageCircle, Mic, Zap, Loader2 } from 'lucide-react';

const PERKS = [
  { icon: MessageCircle, label: 'Unlimited messages, every day' },
  { icon: Mic,           label: 'Unlimited voice conversations' },
  { icon: Zap,           label: 'Priority responses' },
  { icon: Sparkles,      label: 'All vibes & companions' },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const { products, loading, purchasing, error, statusMessage, purchase, restore } = useAppleSubscriptions();

  const annualProduct  = products.find(p => p.productId?.includes('annual'));
  const monthlyProduct = products.find(p => p.productId?.includes('monthly'));
  const selectedProduct = selectedPlan === 'annual' ? annualProduct : monthlyProduct;

  const navigate = useNavigate();
  const [upgraded, setUpgraded] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedProduct) return;
    const result = await purchase(selectedProduct.productId);
    if (result?.success) {
      // Update profile in DB
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
  };

  return (
    <div className="screen" style={{
      background: 'radial-gradient(ellipse at center, #1a0533 0%, #0d0520 50%, #06020f 100%)',
    }}>
      <div className="scroll-area" style={{ padding: '24px 20px', paddingBottom: 100 }}>
        <div style={{ width: '100%', maxWidth: 430, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 26, margin: 0 }}>
            Go Premium
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>
            Unlimited access to your AI companion — no limits, ever.
          </p>
        </div>

        {/* Perks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {PERKS.map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} color="#a855f7" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>{label}</p>
            </div>
          ))}
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
                <span style={{ color: 'white', fontWeight: 800, fontSize: 10 }}>BEST VALUE 🔥</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {annualProduct?.price || '$59.99'}
                    <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}> /year</span>
                    <span style={{ fontSize: 13, color: '#a78bfa', marginLeft: 8 }}>($5.00/mo)</span>
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '3px 0 0' }}>
                    🎉 Save 50% vs monthly · Cancel anytime
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
                    Auto-renews monthly
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

        {/* Error */}
        {error && (
          <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>
        )}

        {/* Status */}
        {statusMessage ? (
          <p style={{ color: '#a78bfa', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{statusMessage}</p>
        ) : null}

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          disabled={purchasing || loading}
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
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Processing...
            </>
          ) : (
            selectedPlan === 'annual' ? 'Start Annual Plan 🚀' : 'Start Monthly Plan'
          )}
        </button>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
          🔒 7-day free trial · Cancel anytime
        </p>

        {/* Upgraded success */}
        {upgraded && (
          <button
            onClick={() => navigate('/chat')}
            style={{
              width: '100%', padding: '14px',
              background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: 16, color: 'white', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', marginBottom: 12,
            }}
          >
            🎉 You're Premium! Start Chatting →
          </button>
        )}

        {/* Restore */}
        <button
          onClick={async () => {
            await restore();
            // After restore, check if profile should be upgraded
            const profileId = localStorage.getItem("userProfileId");
            if (profileId) {
              const profile = await base44.entities.UserProfile.get(profileId);
              if (profile?.is_premium || profile?.premium) {
                setUpgraded(true);
              }
            }
          }}
          style={{
            width: '100%', padding: '12px',
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={13} />
          Restore Purchase
        </button>

        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}