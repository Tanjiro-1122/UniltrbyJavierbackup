import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonChatMessage({ isUser = false }) {
  return (
    <div style={{
      display: "flex", flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-end", gap: 10, padding: "6px 16px",
    }}>
      {!isUser && <Skeleton width={36} height={36} borderRadius="50%" style={{ flexShrink: 0 }} />}
      <div style={{
        maxWidth: "70%", display: "flex", flexDirection: "column", gap: 4,
        alignItems: isUser ? "flex-end" : "flex-start",
      }}>
        <Skeleton width={Math.random() > 0.5 ? 200 : 150} height={44} borderRadius={18} />
      </div>
    </div>
  );
}

export function SkeletonChatMessageList({ count = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 0" }}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChatMessage key={i} isUser={i % 3 === 2} />
      ))}
    </div>
  );
}
