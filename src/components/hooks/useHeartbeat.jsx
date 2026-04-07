// useHeartbeat.jsx
// Drop this in src/components/hooks/
// Pings the server every 60 seconds to update last_seen on UserProfile
// Add <Heartbeat /> anywhere inside your logged-in layout (e.g. Layout.jsx or App.jsx)

import { useEffect } from "react";
import { entities } from "@/api/base44Client";
const { UserProfile } = entities;

const PING_INTERVAL_MS = 60 * 1000; // 60 seconds

export function useHeartbeat(isLoggedIn) {
  useEffect(() => {
    if (!isLoggedIn) return;

    const ping = async () => {
      try {
        const profiles = await UserProfile.list();
        if (profiles && profiles.length > 0) {
          await UserProfile.update(profiles[0].id, {
            last_seen: new Date().toISOString(),
          });
        }
      } catch (e) {
        // Silent fail — heartbeat is non-critical
      }
    };

    ping(); // ping immediately on mount
    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLoggedIn]);
}
