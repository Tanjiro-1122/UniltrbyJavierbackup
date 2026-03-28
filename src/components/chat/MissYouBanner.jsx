import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

/**
 * MissYouBanner — shows a "companion misses you" banner when user returns
 * after 2+ days. Reads pending_notification from UserProfile, clears it
 * after showing so it only appears once.
 */
export default function MissYouBanner() {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = async () => {
      const profileId = localStorage.getItem("userProfileId");
      if (!profileId) return;
      try {
        const profile = await base44.entities.UserProfile.get(profileId);
        if (!profile?.pending_notification) return;
        const notif = JSON.parse(profile.pending_notification);
        if (!notif?.title) return;

        // Only show if notification is recent (within 72h)
        const age = Date.now() - new Date(notif.timestamp).getTime();
        if (age > 72 * 60 * 60 * 1000) {
          // Stale — clear silently
          base44.entities.UserProfile.update(profileId, { pending_notification: null }).catch(() => {});
          return;
        }

        setNotification(notif);
        setTimeout(() => setVisible(true), 1200);

        // Clear it immediately so it only shows once
        base44.entities.UserProfile.update(profileId, { pending_notification: null }).catch(() => {});
      } catch {}
    };
    check();
  }, []);

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          transition={{ type: "spring", damping: 20, stiffness: 260 }}
          onClick={() => setVisible(false)}
          style={{
            margin: "8px 16px 0",
            padding: "13px 16px",
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(219,39,119,0.15), rgba(124,58,237,0.12))",
            border: "1px solid rgba(219,39,119,0.25)",
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 26, flexShrink: 0 }}>💜</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>{notification.title}</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "2px 0 0" }}>{notification.body}</p>
          </div>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }}>×</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
