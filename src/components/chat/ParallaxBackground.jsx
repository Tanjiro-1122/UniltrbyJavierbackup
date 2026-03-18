import React, { useState, useEffect, useRef } from "react";

export default function ParallaxBackground({ imageUrl }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // Try device orientation first (mobile)
    let hasOrientation = false;

    const handleOrientation = (e) => {
      hasOrientation = true;
      const x = Math.max(-15, Math.min(15, (e.gamma || 0) * 0.4));
      const y = Math.max(-15, Math.min(15, (e.beta - 45 || 0) * 0.3));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setTilt({ x, y }));
    };

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      // Will be triggered on first user interaction
      const requestOnTouch = () => {
        DeviceOrientationEvent.requestPermission().then(state => {
          if (state === "granted") window.addEventListener("deviceorientation", handleOrientation);
        }).catch(() => {});
        window.removeEventListener("touchstart", requestOnTouch);
      };
      window.addEventListener("touchstart", requestOnTouch, { once: true });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    // Fallback: subtle auto-animation for desktop / no gyro
    const autoAnimate = () => {
      if (hasOrientation) return;
      const t = Date.now() / 3000;
      const x = Math.sin(t) * 3;
      const y = Math.cos(t * 0.7) * 2;
      setTilt({ x, y });
      rafRef.current = requestAnimationFrame(autoAnimate);
    };
    
    // Start auto-animation after a short delay to check for gyro
    const timeout = setTimeout(() => {
      if (!hasOrientation) autoAnimate();
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: "-20px",
        zIndex: 0,
        perspective: "800px",
        perspectiveOrigin: "center center",
        overflow: "hidden",
      }}
    >
      {/* Background layer — shifts opposite to tilt for parallax depth */}
      <div
        style={{
          position: "absolute",
          inset: "-30px",
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          transform: `translate3d(${tilt.x * -1.5}px, ${tilt.y * -1.5}px, -50px) scale(1.15)`,
          transition: "transform 0.15s ease-out",
          willChange: "transform",
        }}
      />

      {/* Midground atmospheric layer — shifts slightly for depth */}
      <div
        style={{
          position: "absolute",
          inset: "-10px",
          background: "radial-gradient(ellipse at 50% 60%, rgba(168,85,247,0.08) 0%, transparent 70%)",
          transform: `translate3d(${tilt.x * 0.5}px, ${tilt.y * 0.5}px, 20px)`,
          transition: "transform 0.1s ease-out",
          willChange: "transform",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}