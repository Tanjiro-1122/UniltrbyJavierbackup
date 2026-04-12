/**
 * iapBridge — lightweight wrappers called from ChatPage / Settings
 * for one-line subscribe / restore without importing the full hook.
 */

export const subscribeToPlan = async (plan = 'monthly') => {
  // ✅ All 3 plans mapped correctly
  const productId =
    plan === 'annual'   ? 'com.huertas.unfiltr.pro.annual'  :
    plan === 'pro'      ? 'com.huertas.unfiltr.tier.pro'    :
    /* monthly default */ 'com.huertas.unfiltr.pro.monthly';

  return new Promise((resolve) => {
    if (window.ReactNativeWebView) {
      // Primary bridge — RNWV (iOS wrapper)
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PURCHASE', productId }));
      resolve({ isSuccess: true, pendingNativeCallback: true, productId });
    } else if (window.WTN?.inAppPurchase) {
      window.WTN.inAppPurchase({ productId }, resolve);
    } else if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: 'purchase', productId });
      resolve({ isSuccess: true, pendingNativeCallback: true });
    } else {
      // Web fallback — mock so UI doesn't freeze
      resolve({ isSuccess: true, isMock: true, productId });
    }
  });
};

/**
 * Restore purchases via the native bridge.
 * Properly awaits RESTORE_RESULT (up to 30 s) instead of fire-and-forget,
 * so callers always get a meaningful result and UI never gets stuck.
 */
export const restorePurchases = async () => {
  if (window.ReactNativeWebView) {
    return new Promise((resolve) => {
      let settled = false;
      const TIMEOUT_MS = 30000;

      const cleanup = () => {
        if (window._rnMessageHandlers?.['RESTORE_RESULT']) {
          window._rnMessageHandlers['RESTORE_RESULT'] =
            window._rnMessageHandlers['RESTORE_RESULT'].filter(f => f !== handler);
        }
      };

      const settle = (result) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };

      const handler = (data) => {
        const payload = data.data !== undefined ? data.data : data;
        const hasPremium = Object.keys(payload?.entitlements?.active || {}).length > 0;
        if (hasPremium) {
          localStorage.setItem('unfiltr_is_premium', 'true');
        }
        settle({ isSuccess: hasPremium, customerInfo: payload, triggered: true });
      };

      // Register handler before sending so we never miss the response
      window._rnMessageHandlers = window._rnMessageHandlers || {};
      window._rnMessageHandlers['RESTORE_RESULT'] = window._rnMessageHandlers['RESTORE_RESULT'] || [];
      window._rnMessageHandlers['RESTORE_RESULT'].push(handler);

      // Safety timeout — resolve gracefully so UI never stays in loading state
      setTimeout(() => settle({ isSuccess: false, triggered: true, timedOut: true }), TIMEOUT_MS);

      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RESTORE' }));
      } catch (e) {
        settle({ isSuccess: false, triggered: false, error: e.message });
      }
    });
  } else if (window.WTN?.restorePurchases) {
    return new Promise((resolve) => {
      window.WTN.restorePurchases(resolve);
    });
  } else if (window.webkit?.messageHandlers?.storekit) {
    window.webkit.messageHandlers.storekit.postMessage({ action: 'restore' });
    return { triggered: true };
  } else {
    return { triggered: false };
  }
};
