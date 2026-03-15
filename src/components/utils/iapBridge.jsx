/**
 * IAP Bridge — sends purchase messages to the native iOS/Android layer
 * and handles receipt submission back to the server for verification.
 */

import { base44 } from "@/api/base44Client";

/** Low-level: send a payload to whichever native bridge is available */
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

/**
 * Trigger a native IAP purchase and invoke a callback when the native
 * layer responds with purchase_success or purchase_error.
 *
 * @param {string} productId  - e.g. "com.huertas.unfiltr.premium.monthly"
 * @param {function} callback - called with (error, { platform, receiptData, productId, purchaseToken })
 * @returns {function} unsubscribe — call to remove the listener early
 */
export function callNativeIAPWithCallback(productId, callback) {
  const handler = async (event) => {
    try {
      const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (data.action === "purchase_success") {
        cleanup();
        callback(null, data);
      } else if (data.action === "purchase_error") {
        cleanup();
        callback(new Error(data.error || "Purchase failed"), null);
      }
    } catch {
      // ignore unrelated messages
    }
  };

  const cleanup = () => window.removeEventListener("message", handler);
  window.addEventListener("message", handler);

  // Fire the native purchase request
  sendIAPMessage({ action: "subscribe", productId });

  return cleanup; // caller can use this to cancel listening
}

/**
 * Submit a receipt/token to the server for verification and, on success,
 * update the user's profile to premium.
 *
 * @param {{ platform, receiptData, productId, purchaseToken }} purchaseData
 * @param {string} profileId - UserProfile ID to update on success
 * @returns {Promise<{ valid: boolean, plan: string }>}
 */
export async function submitReceiptToServer(purchaseData, profileId) {
  const res = await base44.functions.invoke("verifyPurchase", purchaseData);
  const result = res.data;

  if (result?.valid && profileId) {
    await base44.entities.UserProfile.update(profileId, {
      is_premium: true,
      annual_plan: result.plan === "annual",
    });
  }

  return result;
}

/** Convenience: subscribe to a plan by name ("monthly" | "annual") */
export function subscribeToPlan(plan) {
  const productId =
    plan === "annual"
      ? "com.huertas.unfiltr.premium.annual"
      : "com.huertas.unfiltr.premium.monthly";
  sendIAPMessage({ action: "subscribe", productId });
}

/** Convenience: restore previous purchases */
export function restorePurchases() {
  sendIAPMessage({ action: "restore" });
}