// useHeartbeat.jsx — pings last_seen every 60s so admin can see who's online
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

const PING_MS = 60 * 1000;

export function useHeartbeat() {
  useEffect(() => {
    const profileId = localStorage.getItem("userProfileId");
    if (!profileId) return;

    const ping = async () => {
      try {
        await base44.entities.UserProfile.update(profileId, {
          last_seen: new Date().toISOString(),
        });
      } catch (e) {
        // silent — heartbeat is non-critical
      }
    };

    ping();
    const iv = setInterval(ping, PING_MS);
    return () => clearInterval(iv);
  }, []);
}
