import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageCircle, Mic, Zap, RotateCcw, Clock, Loader2, Brain, BookOpen, Shield } from "lucide-react";
import { useAppleSubscriptions } from "@/components/hooks/useAppleSubscriptions";
import { base44 } from "@/api/base44Client";

const PERKS = [
  { icon: Brain,         label: "Memory — your companion finally knows you" },
  { icon: MessageCircle, label: "Unlimited messages, every day" },
  { icon: Mic,           label: "Voice responses (TTS)" },
  { icon: BookOpen,      label: "Full conversation history" },
  { icon: Zap,           label: "Priority responses" },
];

function getMidnightCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// All 3 plans with their correct product IDs
const PAYWALL_PLANS = [
  {
    id: "annual",
    productId: "com.huertas.unfiltr.pro.annual",
    label: "$59.99 / year",
    sub: "Save 50% — only $5/mo · Cancel anytime",
    badge: "BEST VALUE 🔥",
    badgeBg: "linear-gradient(135deg,#f59e0b,#ef4444)",
    isAnnual: true,
    isPro: false,
  },
  {
    id: "pro",
    productId: "com.huertas.unfiltr.tier.pro",
    label: "$14.99 / month",
    sub: "250 msgs/day · Priority speed · 100 journal entries",
    badge: "MOST POPULAR ⚡",
    badgeBg: "linear-gradient(135deg,#f59e0b,#a855f7)",
    isAnnual: false,
    isPro: true,
  },
  {
    id: "monthly",
    productId: "com.huertas.unfiltr.pro.monthly",
    label: "$9.99 / month",
    sub: "100 msgs/day · Auto-renews monthly",
    badge: null,
    isAnnual: false,
    isPro: false,
  },
];

export default function PaywallModal({ visible, onClose, onSubscribe, onRestore, isLoading: externalLoading, isAndroid }) {
  const [tab, setTab] = useState("upgrade");
  const [countdown, setCountdown] = useState(getMidnightCountdown());
  const [planType, setPlanType] = useState("annual");
  const { products, loading: productsLoading, purchasing, error, statusMessage, purchase, restore, loadProducts } = useAppleSubscriptions();

  useEffect(() => {
    loadProducts();
    if (!visible) return;
    setTab("upgrade");
    const timer = setInterval(() => setCountdown(getMidnightCountdown()), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const isLoading = externalLoading || purchasing;

  const selectedPlan = PAYWALL_PLANS.find(p => p.id === planType) || PAYWALL_PLANS[0];

  const handleSubscribe = async () => {
    const productId = selectedPlan.productId;
    console.log("[PaywallModal] purchasing:", productId, "plan:", planType);
    const result = await purchase(productId);
    if (result?.success) {
      const profileId = localStorage.getItem("userProfileId");
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, {
          is_premium:  true,
          annual_plan: selectedPlan.isAnnual,
          pro_plan:    selectedPlan.isPro,
        });
        localStorage.setItem("unfiltr_is_premium", "true");
        localStorage.setItem("unfiltr_is_annual",  String(selectedPlan.isAnnual));
        localStorage.setItem("unfiltr_is_pro",     String(selectedPlan.isPro));
        // Notify mounted pages (ChatPage) to refresh premium state immediately
        window.dispatchEvent(new Event("unfiltr_auth_updated"));
      }
      if (onSubscribe) onSubscribe();
      onClose();
    }
  };

  const handleRestore = async () => {
    await restore();
    const profileId = localStorage.getItem("userProfileId");
    if (profileId) {
      const profile = await base44.entities.UserProfile.get(profileId);
      if (profile?.is_premium || profile?.premium) {
        if (onRestore) onRestore();
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="w-full border border-white/10 rounded-t-3xl px-6 pt-6"
            onClick={e => e.stopPropagation()}
            style={{
              background: "linear-gradient(180deg, #1a0a35 0%, #0d0520 100%)",
              paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
              maxHeight: "85dvh",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Handle + close */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <div />
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ml-auto">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Tab toggle */}
            <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setTab("upgrade")}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: tab === "upgrade" ? "linear-gradient(135deg, #7c3aed, #db2777)" : "transparent",
                  color: tab === "upgrade" ? "#fff" : "rgba(255,255,255,0.4)",
                  boxShadow: tab === "upgrade" ? "0 0 12px rgba(168,85,247,0.4)" : "none",
                }}
              >✨ Upgrade</button>
              <button
                onClick={() => setTab("wait")}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: tab === "wait" ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === "wait" ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >⏳ Wait</button>
            </div>

            {tab === "upgrade" && (
              <>
                {/* Hero */}
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">✨</div>
                  <h2 className="text-white font-bold text-xl mb-1">You've hit your limit</h2>
                  <p className="text-white/50 text-sm">You've used all 20 free messages today. Upgrade to keep chatting — no limits, ever.</p>
                </div>

                {/* Perks */}
                <div className="space-y-3 mb-5">
                  {PERKS.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(139,92,246,0.2)" }}>
                        <Icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-white/80 text-sm">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Plan selector — all 3 plans */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {PAYWALL_PLANS.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setPlanType(plan.id)}
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 14, textAlign: "left",
                        background: planType === plan.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                        border: `2px solid ${planType === plan.id ? "rgba(124,58,237,0.7)" : "rgba(255,255,255,0.08)"}`,
                        cursor: "pointer", position: "relative",
                      }}
                    >
                      {plan.badge && (
                        <div style={{ position: "absolute", top: -10, right: 12, background: plan.badgeBg, borderRadius: 999, padding: "2px 10px" }}>
                          <span style={{ color: "white", fontWeight: 800, fontSize: 10 }}>{plan.badge}</span>
                        </div>
                      )}
                      <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>{plan.label}</p>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "2px 0 0" }}>{plan.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Status / Error */}
                {error && <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", marginBottom: 8 }}>{error}</p>}
                {statusMessage && <p style={{ color: "#a78bfa", fontSize: 13, textAlign: "center", marginBottom: 8 }}>{statusMessage}</p>}

                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-4 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all disabled:opacity-50 mb-3"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
                    boxShadow: "0 0 24px rgba(168,85,247,0.4)",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                      Processing...
                    </span>
                  ) : `Subscribe — ${selectedPlan.label.split(" / ")[0]}/mo`}
                </button>

                <button onClick={handleRestore} className="w-full py-2 text-white/30 text-sm flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Restore Purchase
                </button>

                <button onClick={onClose} className="w-full py-3 text-white/20 text-xs mt-1">
                  Maybe later
                </button>

                <p className="text-white/15 text-center text-xs mt-3 leading-relaxed">
                  Subscriptions auto-renew unless cancelled 24 hours before renewal. Manage in Apple ID Settings.
                </p>
              </>
            )}

            {tab === "wait" && (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">⏳</div>
                <h3 className="text-white font-bold text-lg mb-2">Messages reset at midnight</h3>
                <p className="text-white/40 text-sm mb-6">Your free messages refill every day at midnight.</p>
                <div className="text-4xl font-mono font-black text-purple-400 mb-6">{countdown}</div>
                <button onClick={onClose} className="w-full py-3 rounded-2xl text-white/50 text-sm border border-white/10">
                  I'll wait
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

