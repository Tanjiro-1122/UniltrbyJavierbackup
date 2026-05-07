/**
 * nativeBridge.js — single shared helper for iOS WebView ↔ Web messaging.
 */

export function isNativeApp() {
  return (
    typeof window !== 'undefined' &&
    (
      !!window.ReactNativeWebView ||
      !!(window.webkit?.messageHandlers?.ReactNativeWebView)
    )
  );
}

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

export function ensureBridgeInstalled() {
  if (typeof window === 'undefined') return;
  window._rnMessageHandlers = window._rnMessageHandlers || {};
  if (window.__rnBridgeInstalled) return;
  window.__rnBridgeInstalled = true;

  window.onMessageFromRN = function (jsonStr) {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const handlers = window._rnMessageHandlers[data.type] || [];
      handlers.forEach(fn => { try { fn(data); } catch (_) {} });
      if (typeof window.__nativeBus === 'function') {
        try { window.__nativeBus(data); } catch (_) {}
      }
      window.dispatchEvent(new MessageEvent('message', { data }));
    } catch (e) {
      console.warn('[nativeBridge] parse error:', e?.message);
    }
  };
}

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
      if (data.type === 'APPLE_SIGN_IN_WAITING') return;
      settled = true;
      cleanup();
      // ✅ FIX: PURCHASE_CANCELLED is a user action, not an error — resolve with cancel flag
      if (data.type === 'PURCHASE_CANCELLED') {
        resolve({ isCancelled: true });
      } else if (data.type?.includes('ERROR')) {
        reject(new Error(data.error || data.message || data.type));
      } else if (data.type?.includes('CANCELLED')) {
        // Other cancels (e.g. Apple Sign-In) still reject so callers can detect
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

export function sendNative(type, payload = {}, responseTypes, timeoutMs = 30000) {
  if (!isNativeApp()) {
    return Promise.reject(new Error('Not in native app'));
  }

  const RESPONSE_MAP = {
    // ✅ FIX: Added PURCHASE_CANCELLED to the response types for PURCHASE
    PURCHASE:           ['PURCHASE_SUCCESS', 'PURCHASE_ERROR', 'PURCHASE_CANCELLED'],
    RESTORE:            ['RESTORE_RESULT', 'RESTORE_SUCCESS', 'RESTORE_ERROR'],
    RESTORE_PURCHASES:  ['RESTORE_SUCCESS', 'RESTORE_ERROR'],
    GET_OFFERINGS:      ['OFFERINGS_RESULT'],
    GET_CUSTOMER_INFO:  ['CUSTOMER_INFO_RESULT'],
    SIGN_IN_WITH_APPLE: ['APPLE_SIGN_IN_SUCCESS', 'APPLE_SIGN_IN_CANCELLED', 'APPLE_SIGN_IN_ERROR', 'APPLE_SIGN_IN_WAITING'],
  };

  const waitTypes = responseTypes || RESPONSE_MAP[type] || [];
  const timeout = (type === 'PURCHASE' || type === 'SIGN_IN_WITH_APPLE') ? null : timeoutMs;
  const waiter = waitForNative(waitTypes, timeout);

  const sent = postToNative({ type, ...payload });
  if (!sent) {
    return Promise.reject(new Error('postToNative failed'));
  }

  return waiter;
}
