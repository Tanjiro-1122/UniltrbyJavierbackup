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

export const restorePurchases = async () => {
  return new Promise((resolve) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RESTORE' }));
      resolve({ triggered: true });
    } else if (window.WTN?.restorePurchases) {
      window.WTN.restorePurchases(resolve);
    } else if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: 'restore' });
      resolve({ triggered: true });
    } else {
      resolve({ triggered: false });
    }
  });
};
