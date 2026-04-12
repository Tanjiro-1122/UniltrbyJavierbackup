/**
 * nativeBridge.js — single shared helper for iOS WebView ↔ Web messaging.
 *
 * Provides:
 *   isNativeApp()         — true when running inside the iOS wrapper
 *   postToNative(msg)     — safe postMessage (never throws)
 *   waitForNative(types, timeoutMs) — Promise that resolves on first matching response
 *   sendNative(type, payload, timeoutMs?) — post + wait, rejects in web mode
 *
 * All functions are safe to call in web/browser mode; they degrade gracefully
 * without throwing uncaught exceptions.
 */

/** Detect the iOS React Native WebView bridge. */
export function isNativeApp() {
  return (
    typeof window !== 'undefined' &&
    (
      !!window.ReactNativeWebView ||
      !!(window.webkit?.messageHandlers?.ReactNativeWebView)
    )
  );
}

/**
 * Post a message to the native wrapper without throwing.
 * Returns true if the message was sent, false otherwise.
 */
export function postToNative(payload) {
  try {
    if (typeof window === 'undefined') return false;
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(str);
      return true;
    }
    if (window.webkit?.messageHandlers?.ReactNativeWebView) {
      window.webkit.messageHandlers.ReactNativeWebView.postMessage(str);
      return true;
    }
  } catch (e) {
    console.warn('[nativeBridge] postToNative failed:', e?.message);
  }
  return false;
}

/**
 * Ensure the global fan-out bridge is installed exactly once.
 * Native wrapper calls: window.onMessageFromRN(jsonString)
 * This dispatcher routes to all registered _rnMessageHandlers and __nativeBus.
 */
export function ensureBridgeInstalled() {
  if (typeof window === 'undefined') return;
  window._rnMessageHandlers = window._rnMessageHandlers || {};
  if (window.__rnBridgeInstalled) return;
  window.__rnBridgeInstalled = true;

  window.onMessageFromRN = function (jsonStr) {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      // 1. Route to named handlers (IAP / subscriptions)
      const handlers = window._rnMessageHandlers[data.type] || [];
      handlers.forEach(fn => { try { fn(data); } catch (_) {} });
      // 2. Route to legacy __nativeBus (HomeScreen / auth)
      if (typeof window.__nativeBus === 'function') {
        try { window.__nativeBus(data); } catch (_) {}
      }
      // 3. Broadcast as window event for any remaining listeners
      window.dispatchEvent(new MessageEvent('message', { data }));
    } catch (e) {
      console.warn('[nativeBridge] parse error:', e?.message);
    }
  };
}

/**
 * Return a Promise that resolves when one of `types` arrives from native,
 * or rejects after `timeoutMs` (pass null for no timeout).
 *
 * APPLE_SIGN_IN_WAITING is treated as an ack and does NOT settle the promise.
 */
export function waitForNative(types, timeoutMs = 30000) {
  ensureBridgeInstalled();
  return new Promise((resolve, reject) => {
    let settled = false;
    const typeArray = Array.isArray(types) ? types : [types];

    const cleanup = () => {
      typeArray.forEach(t => {
        if (window._rnMessageHandlers?.[t]) {
          window._rnMessageHandlers[t] = window._rnMessageHandlers[t].filter(f => f !== handler);
        }
      });
    };

    const handler = (data) => {
      if (settled) return;
      if (data.type === 'APPLE_SIGN_IN_WAITING') return; // ack only, keep waiting
      settled = true;
      cleanup();
      if (data.type?.includes('ERROR') || data.type?.includes('CANCELLED')) {
        reject(new Error(data.error || data.message || data.type));
      } else {
        resolve(data.data !== undefined ? data.data : data);
      }
    };

    typeArray.forEach(t => {
      window._rnMessageHandlers = window._rnMessageHandlers || {};
      window._rnMessageHandlers[t] = window._rnMessageHandlers[t] || [];
      window._rnMessageHandlers[t].push(handler);
    });

    if (timeoutMs != null) {
      setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('Bridge timeout'));
        }
      }, timeoutMs);
    }
  });
}

/**
 * High-level helper: detect bridge, post message, and wait for response.
 * Rejects immediately if not in native mode.
 *
 * @param {string} type        Message type (e.g. 'RESTORE', 'PURCHASE')
 * @param {object} payload     Additional fields merged into the message
 * @param {string[]} responseTypes  Event types to await from native
 * @param {number|null} timeoutMs  Timeout in ms (null = no timeout)
 */
export function sendNative(type, payload = {}, responseTypes, timeoutMs = 30000) {
  if (!isNativeApp()) {
    return Promise.reject(new Error('Not in native app'));
  }

  const RESPONSE_MAP = {
    PURCHASE:          ['PURCHASE_SUCCESS', 'PURCHASE_ERROR'],
    RESTORE:           ['RESTORE_RESULT'],
    GET_OFFERINGS:     ['OFFERINGS_RESULT'],
    GET_CUSTOMER_INFO: ['CUSTOMER_INFO_RESULT'],
    SIGN_IN_WITH_APPLE: ['APPLE_SIGN_IN_SUCCESS', 'APPLE_SIGN_IN_CANCELLED', 'APPLE_SIGN_IN_ERROR', 'APPLE_SIGN_IN_WAITING'],
  };

  const waitTypes = responseTypes || RESPONSE_MAP[type] || [];
  // User-driven flows have no timeout
  const timeout = (type === 'PURCHASE' || type === 'SIGN_IN_WITH_APPLE') ? null : timeoutMs;
  const waiter = waitForNative(waitTypes, timeout);

  const sent = postToNative({ type, ...payload });
  if (!sent) {
    return Promise.reject(new Error('postToNative failed'));
  }

  return waiter;
}
