/**
 * IAP Bridge — sends purchase messages to the native iOS/Android layer.
 * Tries bridges in order: storekit → billing → ReactNativeWebView → parent postMessage
 */

export function sendIAPMessage(payload) {
  if (window.webkit?.messageHandlers?.storekit) {
    window.webkit.messageHandlers.storekit.postMessage(payload);
  } else if (window.webkit?.messageHandlers?.billing) {
    window.webkit.messageHandlers.billing.postMessage(payload);
  } else if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  } else {
    window.parent?.postMessage(payload, "*");
  }
}

export function subscribeToPlan(plan) {
  const productId = plan === "annual"
    ? "com.huertas.unfiltr.premium.annual"
    : "com.huertas.unfiltr.premium.monthly";
  sendIAPMessage({ action: "subscribe", productId });
}

export function restorePurchases() {
  sendIAPMessage({ action: "restore" });
}