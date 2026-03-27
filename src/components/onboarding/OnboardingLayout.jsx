import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GRADIENT = "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)";

export default function OnboardingLayout({ step, totalSteps = 7, onBack, onNext, canAdvance, loading, nextLabel, children }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      maxWidth: "100%",
      paddingTop: "env(safe-area-inset-top, 44px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      overflowX: "hidden",
      background: GRADIENT,
      zIndex: 1,
    }}>
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
        padding: "12px 16px 6px",
        position: "relative",
        zIndex: 1,
      }}>
        <button onClick={onBack} style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}>
          <ChevronLeft size={26} color="white" />
        </button>
        <p style={{ color: "rgba(255,255,255,0.95)", fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: "0.3px" }}>Step {step} of {totalSteps}</p>
        <div style={{ width: 48 }} />
      </div>

      {/* Progress Bar only — no duplicate dots */}
      <div style={{ flexShrink: 0, padding: "8px 16px 12px", position: "relative", zIndex: 1 }}>
        <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.1)" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${step / totalSteps * 100}%`,
            background: "linear-gradient(90deg, #7c3aed, #db2777)",
            boxShadow: "0 0 12px rgba(168,85,247,0.8)",
            transition: "width 0.4s ease"
          }} />
        </div>
      </div>

      {/* Content + Next Button together — scroll area contains everything */}
      <div style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        position: "relative",
        zIndex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Scrollable content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>

        {/* Next Button — always at bottom of scroll, never hidden */}
        {onNext && (
          <div style={{
            flexShrink: 0,
            width: "100%",
            padding: "8px 24px",
            paddingBottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))",
            background: "linear-gradient(180deg, transparent 0%, rgba(13,2,32,0.95) 30%)",
            position: "sticky",
            bottom: 0,
            boxSizing: "border-box",
            zIndex: 10,
          }}>
            <button onClick={onNext} disabled={!canAdvance || loading} style={{
              width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
              color: "white", fontWeight: 900, fontSize: 17,
              cursor: canAdvance && !loading ? "pointer" : "default",
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
              boxShadow: "0 0 24px rgba(168,85,247,0.45), 0 4px 16px rgba(0,0,0,0.4)",
              transition: "opacity 0.2s",
              opacity: canAdvance && !loading ? 1 : 0.6,
            }}>
              {loading ? "…" : (nextLabel || <span>Next <ChevronRight size={16} style={{ display: "inline", verticalAlign: "middle" }} /></span>)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}