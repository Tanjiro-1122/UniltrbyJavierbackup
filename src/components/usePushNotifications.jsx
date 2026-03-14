import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Requests push notification permission on first load after login.
 * Saves token + push_enabled=true to UserProfile if granted.
 */
export function usePushNotifications(profileId) {
  useEffect(() => {
    if (!profileId) return;

    // Don't re-request if already done this session
    if (sessionStorage.getItem("push_requested")) return;
    sessionStorage.setItem("push_requested", "1");

    const requestPush = async () => {
      // Native app bridge (iOS/Android)
      if (window.webkit?.messageHandlers?.push) {
        window.webkit.messageHandlers.push.postMessage({ action: "requestPermission" });

        // Listen for token from native bridge
        window.onPushToken = async (token) => {
          if (token && profileId) {
            await base44.entities.UserProfile.update(profileId, {
              push_token: token,
              push_enabled: true,
            }).catch(() => {});
          }
        };
        return;
      }

      // Web Push API fallback (PWA)
      if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
      if (Notification.permission === "granted" || Notification.permission === "denied") return;

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await base44.entities.UserProfile.update(profileId, {
          push_enabled: true,
        }).catch(() => {});
      }
    };

    // Small delay so it doesn't fire immediately on load
    const t = setTimeout(requestPush, 3000);
    return () => clearTimeout(t);
  }, [profileId]);
}