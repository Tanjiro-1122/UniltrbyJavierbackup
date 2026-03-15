import React, { useEffect, useRef } from "react";

export default function SplashScreen() {
  const particlesRef = useRef(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("div");
      p.style.cssText = `
        position: absolute;
        border-radius: 50%;
        width: ${1 + Math.random() * 3}px;
        height: ${1 + Math.random() * 3}px;
        left: ${Math.random() * 100}vw;
        background: ${Math.random() > 0.5 ? "rgba(168,85,247,0.7)" : "rgba(219,39,119,0.5)"};
        animation: floatUp ${4 + Math.random() * 8}s linear ${Math.random() * 8}s infinite;
      `;
      container.appendChild(p);
    }
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "radial-gradient(ellipse at center, #1a0533 0%, #0d0520 50%, #06020f 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      overflow: "hidden",
    }}>

      <div ref={particlesRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(100vh) scale(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        @keyframes spin360 {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
        @keyframes shineSwipe {
          0%   { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes loadFill {
          0%   { width: 0%; }
          70%  { width: 100%; }
          100% { width: 100%; }
        }
      `}</style>

      <div style={{
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(139,92,246,0.25) 0%, transparent 70%)",
        animation: "pulseGlow 2.5s ease-in-out infinite",
        zIndex: 1,
      }} />

      <div style={{
        position: "relative",
        width: 220,
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "spin360 4s linear infinite",
        filter: "drop-shadow(0 0 30px rgba(168,85,247,0.8)) drop-shadow(0 0 60px rgba(139,92,246,0.5))",
        zIndex: 2,
      }}>
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b22f8b58e45d23cafd78d2/df8a8b3a0_newappicon.png"
          alt="Unfiltr"
          style={{ width: 200, height: 200, borderRadius: 36, objectFit: "cover" }}
        />
        <div style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "60%",
          height: "100%",
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
          animation: "shineSwipe 4s linear infinite",
          borderRadius: 36,
          pointerEvents: "none",
        }} />
      </div>

      <div style={{
        marginTop: 40,
        width: 160,
        height: 3,
        background: "rgba(255,255,255,0.1)",
        borderRadius: 999,
        overflow: "hidden",
        zIndex: 2,
      }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #db2777)",
          borderRadius: 999,
          animation: "loadFill 2.5s ease-in-out infinite",
        }} />
      </div>

    </div>
  );
}