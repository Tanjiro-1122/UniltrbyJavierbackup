import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const REVIEWS = [
  { text: "Honestly feels like talking to a real friend. I open up way more than I thought I would.", name: "Mia K." },
  { text: "The voice chat feature is incredible — it's like having someone actually there with you.", name: "Jordan T." },
  { text: "Luna remembers things I told her weeks ago. That blew my mind.", name: "Alex R." },
];

export default function SocialProof() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      style={{ width: "100%", marginBottom: 20 }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: 10,
      }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={13} fill="#facc15" color="#facc15" />
        ))}
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginLeft: 4 }}>
          4.9 · Loved by thousands
        </span>
      </div>

      <div style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 4,
        scrollSnapType: "x mandatory",
      }}>
        {REVIEWS.map((r, i) => (
          <div key={i} style={{
            minWidth: 240,
            maxWidth: 260,
            flexShrink: 0,
            padding: "14px 16px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            scrollSnapAlign: "start",
          }}>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.5, margin: "0 0 8px", fontStyle: "italic" }}>
              "{r.text}"
            </p>
            <p style={{ color: "rgba(192,132,252,0.7)", fontSize: 11, fontWeight: 600, margin: 0 }}>
              — {r.name}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}