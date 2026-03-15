import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageCircle, Mic, Zap, RotateCcw, Clock } from "lucide-react";

const PERKS = [
  { icon: MessageCircle, label: "Unlimited messages, every day" },
  { icon: Mic, label: "Unlimited voice conversations" },
  { icon: Zap, label: "Priority responses" },
  { icon: Sparkles, label: "All vibes & companions" },
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

export default function PaywallModal({ visible, onClose, onSubscribe, onRestore, isLoading, isAndroid }) {
  const [tab, setTab] = useState("upgrade");
  const [countdown, setCountdown] = useState(getMidnightCountdown());
  const [planType, setPlanType] = useState("annual");

  useEffect(() => {
    if (!visible) return;
    setTab("upgrade");
    const timer = setInterval(() => setCountdown(getMidnightCountdown()), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const handleSubscribe = async () => {
    const productId = planType === "annual"
      ? "com.huertas.unfiltr.premium.annual"
      : "com.huertas.unfiltr.premium.monthly";
    if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: "subscribe", productId });
    } else if (window.webkit?.messageHandlers?.billing) {
      window.webkit.messageHandlers.billing.postMessage({ action: "subscribe", productId });
    } else if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: "subscribe", productId }));
    } else {
      window.parent?.postMessage({ action: "subscribe", productId }, "*");
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
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="w-full max-w-[430px] border border-white/10 rounded-t-3xl px-6 pt-6"
            style={{
              background: "linear-gradient(180deg, #1a0a35 0%, #0d0520 100%)",
              paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
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
              >
                ✨ Upgrade
              </button>
              <button
                onClick={() => setTab("wait")}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: tab === "wait" ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === "wait" ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                ⏳ Wait
              </button>
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

                {/* Plan selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {/* Annual */}
                  <button
                    onClick={() => setPlanType("annual")}
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: 14, textAlign: "left",
                      background: planType === "annual" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                      border: `2px solid ${planType === "annual" ? "rgba(124,58,237,0.7)" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer", position: "relative",
                    }}
                  >
                    <div style={{ position: "absolute", top: -10, right: 12, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 999, padding: "2px 10px" }}>
                      <span style={{ color: "white", fontWeight: 800, fontSize: 10 }}>BEST VALUE 🔥</span>
                    </div>
                    <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>$59.99 / year</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "2px 0 0" }}>Save 50% — only $5/mo · Cancel anytime</p>
                  </button>

                  {/* Monthly */}
                  <button
                    onClick={() => setPlanType("monthly")}
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: 14, textAlign: "left",
                      background: planType === "monthly" ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
                      border: `2px solid ${planType === "monthly" ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ color: "white", fontWeight: 600, fontSize: 15, margin: 0 }}>$9.99 / month</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "2px 0 0" }}>Auto-renews monthly</p>
                  </button>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-4 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all disabled:opacity-50 mb-3"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
                    boxShadow: "0 0 24px rgba(168,85,247,0.4)",
                  }}
                >
                  {isLoading ? "Loading..." : "Subscribe Now →"}
                </button>

                <button onClick={onRestore} className="w-full py-2 text-white/30 text-sm flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Restore Purchase
                </button>
              </>
            )}

            {tab === "wait" && (
              <div className="flex flex-col items-center text-center py-4">
                <div className="text-5xl mb-4">🌙</div>
                <h2 className="text-white font-bold text-xl mb-2">Come back tomorrow</h2>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">
                  Your 20 free messages reset at midnight. Your companion will be right here waiting for you.
                </p>

                {/* Countdown clock */}
                <div className="rounded-2xl px-8 py-5 mb-6 w-full"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    boxShadow: "0 0 20px rgba(139,92,246,0.1)",
                  }}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <p className="text-purple-300/70 text-xs font-medium uppercase tracking-widest">Resets in</p>
                  </div>
                  <p className="text-white font-black text-4xl tracking-widest"
                    style={{ textShadow: "0 0 20px rgba(168,85,247,0.8)", fontVariantNumeric: "tabular-nums" }}>
                    {countdown}
                  </p>
                </div>

                <p className="text-white/30 text-xs mb-5">Or upgrade for unlimited access — no waiting, ever.</p>

                <button
                  onClick={() => setTab("upgrade")}
                  className="w-full py-3 rounded-2xl text-white font-bold text-sm active:scale-95 transition-all mb-3"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", boxShadow: "0 0 16px rgba(168,85,247,0.3)" }}
                >
                  Upgrade instead ✨
                </button>

                <button onClick={onClose} className="w-full py-3 rounded-2xl text-white/40 text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}