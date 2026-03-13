import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageCircle, Mic, Zap, RotateCcw } from "lucide-react";

const PERKS = [
  { icon: MessageCircle, label: "Unlimited messages, every day" },
  { icon: Mic, label: "Unlimited voice conversations" },
  { icon: Zap, label: "Priority responses" },
  { icon: Sparkles, label: "All vibes & companions" },
];

export default function PaywallModal({ visible, onClose, onSubscribe, onRestore, isLoading, isAndroid }) {
  const handleSubscribe = async () => {
    if (isAndroid && window.webkit?.messageHandlers?.billing) {
      // Android - use Google Play Billing
      window.webkit.messageHandlers.billing.postMessage({
        action: "subscribe",
        productId: "com.unfiltr.premium.monthly",
        price: "$9.99/month"
      });
    } else {
      // Fallback to provided handler
      onSubscribe();
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
            className="w-full max-w-[430px] bg-gradient-to-b from-[#1a0a35] to-[#0d0520] border border-white/10 rounded-t-3xl px-6 pt-6"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
          >
            {/* Handle + close */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <div />
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ml-auto">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Hero */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">✨</div>
              <h2 className="text-white font-bold text-2xl mb-1">You've hit your limit</h2>
              <p className="text-white/50 text-sm">You've used all 20 free messages today. Upgrade to keep chatting.</p>
            </div>

            {/* Perks */}
            <div className="space-y-3 mb-6">
              {PERKS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-white/80 text-sm">{label}</p>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 text-center">
              <p className="text-white font-bold text-3xl">$9.99<span className="text-white/40 text-base font-normal">/month</span></p>
              <p className="text-white/40 text-xs mt-1">Cancel anytime • Auto-renews monthly</p>
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-purple-500/30 active:scale-95 transition-all disabled:opacity-50 mb-3"
            >
              {isLoading ? "Loading..." : "Subscribe Now →"}
            </button>

            {/* Restore */}
            <button
              onClick={onRestore}
              className="w-full py-2 text-white/30 text-sm flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Restore Purchase
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}