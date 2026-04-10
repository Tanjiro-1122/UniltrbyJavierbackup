import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonJournalEntry() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16, padding: "16px",
    }}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Skeleton width={32} height={32} borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>
      <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
      <Skeleton width="80%" height={12} />
    </div>
  );
}

export function SkeletonJournalList({ count = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonJournalEntry key={i} />
      ))}
    </div>
  );
}
