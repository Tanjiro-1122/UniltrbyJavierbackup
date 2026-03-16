import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GRADIENT = "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)";

export default function OnboardingLayout({ step, totalSteps = 4, onBack, onNext, canAdvance, loading, nextLabel, children }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      height: "100dvh",
      paddingTop: "env(safe-area-inset-top, 44px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
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
        padding: "12px 16px 8px",
        position: "relative",
        zIndex: 1,
      }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
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

      {/* Content — scrollable, takes remaining space */}
      <div className="scroll-area" style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        position: "relative",
        zIndex: 1,
      }}>
        {children}
      </div>

      {/* Next Button */}
      {onNext && (
        <div style={{
          flexShrink: 0,
          width: "100%",
          padding: "12px 16px 16px",
          background: "linear-gradient(180deg, rgba(6,2,15,0.0) 0%, #06020f 30%)",
          position: "relative",
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
  );
}