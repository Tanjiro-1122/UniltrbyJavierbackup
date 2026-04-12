import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const containerRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);

  const handleTouchStart = (e) => {
    const scrollElement = containerRef.current;
    if (scrollElement?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    const scrollElement = containerRef.current;
    if (scrollElement?.scrollTop !== 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;

    if (distance > 0) {
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-y-auto h-full -webkit-overflow-scrolling-touch"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-900 border-b border-gray-800"
          initial={{ height: 0 }}
          animate={{ height: Math.max(40, pullDistance) }}
          style={{ zIndex: 10 }}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: isRefreshing ? 0.6 : 0, repeat: isRefreshing ? Infinity : 0 }}
          >
            <RefreshCw className="w-5 h-5 text-purple-400" />
          </motion.div>
          <span className="ml-2 text-xs text-gray-400">
            {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
          </span>
        </motion.div>
      )}

      {/* Content */}
      <div style={{ paddingTop: pullDistance > 0 ? pullDistance : 0 }}>
        {children}
      </div>
    </div>
  );
}