import React from "react";

export default function Skeleton({ width = "100%", height = 16, borderRadius = 8, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 100%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

export function SkeletonText({ lines = 3, style = {} }) {
  const widths = ["100%", "85%", "70%", "90%", "60%"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={widths[i % widths.length]} height={12} />
      ))}
    </div>
  );
}
