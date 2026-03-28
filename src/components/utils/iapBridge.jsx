/**
 * iapBridge — lightweight wrappers called from ChatPage / Settings
 * for one-line subscribe / restore without importing the full hook.
 */

export const subscribeToPlan = async (plan = 'monthly') => {
  const productId = plan === 'annual'
    ? 'com.huertas.unfiltr.pro.annual'
    : 'com.huertas.unfiltr.pro.monthly';

  return new Promise((resolve) => {
    if (window.WTN?.inAppPurchase) {
      window.WTN.inAppPurchase({ productId }, resolve);
    } else if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: 'purchase', productId });
      resolve({ isSuccess: true, pendingNativeCallback: true });
    } else {
      // Web fallback — just resolve success so paywall can close in demo
      resolve({ isSuccess: true, isMock: true, productId });
    }
  });
};

export const restorePurchases = async () => {
  return new Promise((resolve) => {
    if (window.WTN?.restorePurchases) {
      window.WTN.restorePurchases(resolve);
    } else if (window.webkit?.messageHandlers?.storekit) {
      window.webkit.messageHandlers.storekit.postMessage({ action: 'restore' });
      resolve({ triggered: true });
    } else {
      resolve({ triggered: false });
    }
  });
};
