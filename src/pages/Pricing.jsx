import React from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import BottomTabs from "@/components/BottomTabs";

export default function Pricing() {
  const navigate = useNavigate();

  const handleSubscribe = (plan) => {
    const productId = plan === "annual"
      ? "com.huertas.unfiltr.premium.annual"
      : "com.huertas.unfiltr.premium.monthly";
    
    if (/android/i.test(navigator.userAgent) && window.webkit?.messageHandlers?.billing) {
      window.webkit.messageHandlers.billing.postMessage({ action: "subscribe", productId });
    } else if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: "subscribe", productId });
    } else {
      console.log("IAP fallback:", productId);
    }
  };

  const handleRestore = () => {
    if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: "restore" });
    }
  };

  return (
    <div className="screen" style={{ background: "#0a0a12" }}>
      <div className="scroll-area">
      {/* Header */}
      <div style={{ padding: "max(2rem, env(safe-area-inset-top, 2rem)) 20px 0", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 999,
            background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)"
          }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ color: "#c084fc", fontSize: 12, fontWeight: 700 }}>Go Premium</span>
          </div>
        </div>

        <h1 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 32, fontWeight: 900, color: "white" }}>
          Unlock Unfiltr <span style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>fully</span>
        </h1>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
          You've used your free messages for today. Upgrade to keep the conversation going — unlimited, always.
        </p>
      </div>

      {/* Free Plan Reminder */}
      <div style={{
        marginX: "auto", width: "calc(100% - 32px)", marginLeft: 16, marginRight: 16,
        marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: 16,
        background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div>
            <p style={{ color: "white", fontWeight: 700, margin: 0, fontSize: 13 }}>Free plan</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>Resets every day at midnight</p>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", borderRadius: 999, padding: "6px 12px" }}>
          <p style={{ color: "white", fontSize: 11, fontWeight: 800, margin: 0 }}>20 msgs/day</p>
        </div>
      </div>

      {/* Subscription Cards */}
      <div style={{ padding: "0 16px", marginBottom: 32 }}>
        {/* Monthly Card */}
        <div style={{
          padding: 20, marginBottom: 16, borderRadius: 20,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)"
        }}>
          <h3 style={{ color: "white", fontWeight: 800, fontSize: 20, margin: "0 0 4px" }}>Monthly</h3>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 16px" }}>Full access, billed monthly</p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "white", fontSize: 36, fontWeight: 900, margin: "0 0 4px" }}>$9.99</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>/month</p>
          </div>

          <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Unlimited messages",
              "All companions",
              "All mood modes",
              "Voice chat",
              "Memory & context"
            ].map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Check size={16} color="#8b5cf6" strokeWidth={3} />
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleSubscribe("monthly")}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "white", fontWeight: 700, fontSize: 15,
              cursor: "pointer"
            }}
          >
            Start Monthly Plan
          </button>
        </div>

        {/* Annual Card (Featured) */}
        <div style={{
          padding: 20, borderRadius: 20, position: "relative",
          background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(219,39,119,0.15))",
          border: "2px solid rgba(139,92,246,0.6)", boxShadow: "0 0 24px rgba(168,85,247,0.3)"
        }}>
          {/* BEST VALUE Badge */}
          <div style={{
            position: "absolute", top: 16, right: 16,
            background: "linear-gradient(135deg, #7c3aed, #db2777)", borderRadius: 999,
            padding: "6px 14px", display: "flex", alignItems: "center", gap: 4
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>BEST VALUE 🔥</span>
          </div>

          <h3 style={{ color: "white", fontWeight: 800, fontSize: 20, margin: "0 0 4px", paddingRight: 100 }}>Annual</h3>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 16px" }}>Everything in Monthly, billed yearly</p>

          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <p style={{ color: "white", fontSize: 36, fontWeight: 900, margin: 0 }}>$59.99</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>/year</p>
              <p style={{ color: "#a855f7", fontSize: 13, fontWeight: 700, margin: 0 }}>($5.00/mo)</p>
            </div>
          </div>

          <p style={{ color: "#22c55e", fontSize: 13, fontWeight: 700, margin: "0 0 16px" }}>🎉 Save 50% vs monthly</p>

          <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Unlimited messages",
              "All companions",
              "All mood modes",
              "Voice chat",
              "Memory & context",
              "Priority updates"
            ].map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Check size={16} color="#a855f7" strokeWidth={3} />
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleSubscribe("annual")}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              color: "white", fontWeight: 700, fontSize: 15,
              cursor: "pointer", boxShadow: "0 0 16px rgba(168,85,247,0.4)"
            }}
          >
            Start Annual Plan 🚀
          </button>
        </div>
      </div>

      {/* Trial & Cancel Info */}
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 32px", padding: "0 16px" }}>
        🔒 7-day free trial on all plans · Cancel anytime
      </p>

      {/* Footer Links */}
      <div style={{
        textAlign: "center", padding: "24px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
          <button
            onClick={() => window.open("https://unfiltrbyjavier.base44.com/PrivacyPolicy")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
          >
            Privacy Policy
          </button>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
          <button
            onClick={() => window.open("https://unfiltrbyjavier.base44.com/")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
          >
            Terms of Use
          </button>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
          <button
            onClick={handleRestore}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
          >
            Restore Purchases
          </button>
        </div>
      </div>
      </div>
      <BottomTabs />
    </div>
  );
}