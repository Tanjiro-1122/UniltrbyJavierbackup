import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AppShell from "@/components/shell/AppShell";

const GRADIENT = "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)";

export default function OnboardingLayout({ step, totalSteps = 4, onBack, onNext, canAdvance, loading, nextLabel, children }) {
  return (
    <AppShell tabs={false} bg={GRADIENT}>
      {/* Stars */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 60 }).map((_, i) =>
        <div key={i} style={{
          position: "absolute",
          width: Math.random() * 2 + 0.5,
          height: Math.random() * 2 + 0.5,
          borderRadius: "50%",
          background: "white",
          top: Math.random() * 100 + "%",
          left: Math.random() * 100 + "%",
          opacity: Math.random() * 0.6 + 0.1,
          animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
          animationDelay: Math.random() * 4 + "s"
        }} />
        )}
        <div style={{
          position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)"
        }} />
      </div>

      <style>{`@keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.9} }`}</style>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px 8px",
        position: "relative",
        zIndex: 1,
        background: "transparent"
      }}>
        <button onClick={onBack} style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer"
        }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Step {step} of {totalSteps}</p>
        <div style={{ width: 40 }} />
      </div>

      {/* Progress Bar */}
      <div style={{ flexShrink: 0, padding: "0 16px 16px", position: "relative", zIndex: 1 }}>
        <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${step / totalSteps * 100}%`,
            background: "linear-gradient(90deg, #7c3aed, #db2777)",
            boxShadow: "0 0 8px rgba(168,85,247,0.6)",
            transition: "width 0.4s ease"
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", paddingBottom: onNext ? "104px" : 0 }}>
        {children}
      </div>

      {/* Next Button */}
      {onNext &&
      <div style={{
        width: "100%",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, rgba(6,2,15,0.08) 0%, #06020f 28%)",
        position: "fixed",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 20
      }}>
          <button onClick={onNext} disabled={!canAdvance || loading} style={{
          width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
          color: "white", fontWeight: 900, fontSize: 17,
          cursor: canAdvance && !loading ? "pointer" : "default",
          opacity: 1,
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
          boxShadow: "0 0 24px rgba(168,85,247,0.45), 0 4px 16px rgba(0,0,0,0.4)",
          transition: "opacity 0.2s, box-shadow 0.2s"
        }}>
            {nextLabel || <span>Next <ChevronRight size={16} style={{ display: "inline", verticalAlign: "middle" }} /></span>}
          </button>
        </div>
      }
    </AppShell>);

}