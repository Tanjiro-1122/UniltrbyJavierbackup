/**
 * iapBridge — lightweight wrappers called from ChatPage / Settings
 * for one-line subscribe / restore without importing the full hook.
 *
 * Uses nativeBridge helpers so bridge detection and safe-send logic
 * lives in exactly one place.
 */
import { isNativeApp, postToNative, waitForNative } from '@/lib/nativeBridge';

export const subscribeToPlan = async (plan = 'monthly') => {
  // ✅ All 3 plans mapped correctly
  const productId =
    plan === 'annual'   ? 'com.huertas.unfiltr.pro.annual'  :
    plan === 'pro'      ? 'com.huertas.unfiltr.tier.pro'    :
    /* monthly default */ 'com.huertas.unfiltr.pro.monthly';

  if (!isNativeApp()) {
    // Web mode — purchases only available in the iOS app
    return { isSuccess: false, webMode: true, productId };
  }

  const sent = postToNative({ type: 'PURCHASE', productId });
  if (!sent) return { isSuccess: false, error: 'Bridge unavailable', productId };
  // PURCHASE is user-driven — caller handles result via PURCHASE_SUCCESS event
  return { isSuccess: true, pendingNativeCallback: true, productId };
};

/**
 * Restore purchases via the native bridge.
 * Awaits RESTORE_RESULT (up to 30 s) so callers always get a result
 * and the UI never gets stuck on a blank/black screen.
 */
export const restorePurchases = async () => {
  if (!isNativeApp()) {
    // Web mode — gracefully indicate restore is not available here
    return { triggered: false, webMode: true };
  }

  try {
    // Register listener before posting so we never miss the response
    const waiter = waitForNative(['RESTORE_RESULT'], 30000);
    const sent = postToNative({ type: 'RESTORE' });
    if (!sent) return { isSuccess: false, triggered: false, error: 'Bridge unavailable' };

    const data = await waiter;
    const payload = data?.data !== undefined ? data.data : data;
    const hasPremium = Object.keys(payload?.entitlements?.active || {}).length > 0;
    if (hasPremium) {
      localStorage.setItem('unfiltr_is_premium', 'true');
    }
    return { isSuccess: hasPremium, customerInfo: payload, triggered: true };
  } catch (e) {
    // Timeout or bridge error — resolve gracefully so UI never stays in loading state
    const timedOut = e?.message === 'Bridge timeout';
    return { isSuccess: false, triggered: true, timedOut, error: timedOut ? undefined : e?.message };
  }
};
