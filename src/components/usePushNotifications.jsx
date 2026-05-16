import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

function normalizeNativeMessage(eventOrMessage) {
  const raw = eventOrMessage?.data ?? eventOrMessage;
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return typeof raw === "object" ? raw : null;
}

async function savePushToken(profileId, token) {
  if (!profileId || !token || !String(token).startsWith("ExponentPushToken")) return;
  try {
    await base44.entities.UserProfile.update(profileId, {
      push_token: token,
      push_enabled: true,
      daily_checkins_enabled: true,
    });
    localStorage.setItem("unfiltr_push_token", token);
    localStorage.setItem("unfiltr_push_enabled", "true");
  } catch (error) {
    console.warn("[push] Failed to save token", error);
  }
}

/**
 * Registers mobile push notifications and stores the Expo token on UserProfile.
 * Native sends PUSH_TOKEN through the shared React Native WebView bridge.
 */
export function usePushNotifications(profileId) {
  useEffect(() => {
    if (!profileId) return;

    let cancelled = false;
    const previousBus = window.__nativeBus;

    const handleNativeMessage = async (eventOrMessage) => {
      const msg = normalizeNativeMessage(eventOrMessage);
      if (!msg || cancelled) return;
      if (msg.type === "PUSH_TOKEN") {
        await savePushToken(profileId, msg.token || msg.pushToken);
      }
      if (msg.type === "PUSH_PERMISSION_DENIED") {
        localStorage.setItem("unfiltr_push_enabled", "false");
      }
    };

    const nativeBusHandler = (msg) => {
      if (typeof previousBus === "function") {
        try { previousBus(msg); } catch (_) {}
      }
      void handleNativeMessage(msg);
    };

    window.__nativeBus = nativeBusHandler;
    window.addEventListener("message", handleNativeMessage);
    window.onPushToken = (token) => void savePushToken(profileId, token);

    const requestPush = () => {
      try {
        const cachedToken = localStorage.getItem("unfiltr_push_token");
        if (cachedToken?.startsWith("ExponentPushToken")) {
          void savePushToken(profileId, cachedToken);
        }

        // React Native WebView bridge used by the iOS wrapper.
        if (window.ReactNativeWebView?.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "REQUEST_PUSH_TOKEN" }));
          return;
        }

        // Legacy WKWebView bridge fallback for old/native experiments.
        if (window.webkit?.messageHandlers?.push) {
          window.webkit.messageHandlers.push.postMessage({ action: "requestPermission" });
          return;
        }

        // Browser/PWA fallback: this can enable preference only; it cannot create
        // the Expo mobile token that native push delivery needs.
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              localStorage.setItem("unfiltr_push_enabled", "true");
              base44.entities.UserProfile.update(profileId, {
                push_enabled: true,
                daily_checkins_enabled: true,
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      } catch (error) {
        console.warn("[push] request failed", error);
      }
    };

    const timer = setTimeout(requestPush, 1800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("message", handleNativeMessage);
      if (window.__nativeBus === nativeBusHandler) {
        window.__nativeBus = previousBus;
      }
    };
  }, [profileId]);
}
