import { useState, useCallback } from 'react';
import { debugLog } from '@/components/DebugPanel';
import { isNativeApp, sendNative, ensureBridgeInstalled } from '@/lib/nativeBridge';

const MOCK_PRODUCTS = [
  { productId: 'com.huertas.unfiltr.pro.monthly', title: 'Monthly Premium', price: '$9.99', period: 'month' },
  { productId: 'com.huertas.unfiltr.pro.annual',  title: 'Annual Premium',  price: '$99.99', period: 'year' },
  { productId: 'com.huertas.unfiltr.tier.pro',    title: 'Pro Tier',        price: '$14.99', period: 'month' },
];

// Ensure the shared bridge dispatcher is installed when this module loads.
ensureBridgeInstalled();


function getStoredPremiumSnapshot(productId = '') {
  const isAnnualProduct = productId.includes('annual');
  const isProProduct = productId.includes('tier.pro');
  const isPremium = localStorage.getItem('unfiltr_is_premium') === 'true';
  const isAnnual = localStorage.getItem('unfiltr_is_annual') === 'true' || isAnnualProduct;
  const isPro = localStorage.getItem('unfiltr_is_pro') === 'true' || isProProduct;
  const isUltimate = localStorage.getItem('unfiltr_ultimate_friend') === 'true' || isAnnualProduct;
  return { isPremium, isAnnual, isPro, isUltimate };
}

function applyPlanFlags({ isAnnual = false, isPro = false, isUltimate = false } = {}) {
  localStorage.setItem('unfiltr_is_premium', 'true');
  localStorage.setItem('unfiltr_is_annual', String(!!isAnnual));
  localStorage.setItem('unfiltr_is_pro', String(!!isPro));
  localStorage.setItem('unfiltr_ultimate_friend', String(!!isUltimate));
  window.dispatchEvent(new Event('unfiltr_auth_updated'));
  window.dispatchEvent(new Event('unfiltr_premium_updated'));
}

function isUserCancelledError(e) {
  const msg = String(e?.message || e?.error || '').toLowerCase();
  return msg.includes('cancel') || msg.includes('user cancelled') || msg.includes('purchase_cancelled') || msg.includes('payment cancelled');
}

function sendToNative(type, payload = {}) {
  debugLog(`📡 sendToNative: ${type} | bridge: ${isNativeApp() ? '✅ ready' : '❌ NOT FOUND'}`);
  return sendNative(type, payload).then(data => {
    debugLog(`📨 [RN→WEB] response for ${type}`);
    return data;
  }).catch(e => {
    debugLog(`❌ sendNative(${type}) error: ${e.message}`);
    throw e;
  });
}

export class AppleStoreKitService {
  static isNative() {
    const result = isNativeApp();
    debugLog(`🔍 isNative: ${result ? '✅ YES (iOS wrapper)' : '⚠️ NO (browser/web)'}`);
    return result;
  }

  static async getProducts() {
    debugLog('🛒 getProducts() called');
    if (!this.isNative()) {
      debugLog('⚠️ Not native — returning mock products');
      return MOCK_PRODUCTS;
    }
    try {
      const offerings = await sendToNative('GET_OFFERINGS');
      if (offerings?.current?.availablePackages?.length > 0) {
        debugLog(`✅ Got ${offerings.current.availablePackages.length} packages from RevenueCat`);
        return offerings.current.availablePackages.map((pkg) => ({
          productId:   pkg.product?.identifier || pkg.identifier,
          title:       pkg.product?.title || 'Premium',
          price:       pkg.product?.priceString || '$9.99',
          period:      pkg.packageType === 'ANNUAL' ? 'year' : 'month',
          rcPackageId: pkg.identifier,
        }));
      }
      debugLog('⚠️ No packages in offerings — falling back to mock');
      return MOCK_PRODUCTS;
    } catch(e) {
      debugLog(`❌ getProducts error: ${e.message}`);
      return MOCK_PRODUCTS;
    }
  }

  static async purchase(productId) {
    debugLog(`💳 purchase() called: ${productId}`);
    if (!this.isNative()) {
      debugLog('⚠️ Not native — purchases only available in the iOS app.');
      return { isSuccess: false, error: 'Purchases only available in the iOS app.' };
    }
    try {
      const packageId = productId.includes('annual')   ? '$rc_annual'
                      : productId.includes('tier.pro') ? 'pro_tier'
                      : '$rc_monthly';
      debugLog(`📦 Resolved packageId: ${packageId}`);

      const appleUserId = localStorage.getItem('unfiltr_apple_user_id') || localStorage.getItem('unfiltr_user_id') || undefined;
      // Send both names during the transition: older wrapper builds read userId,
      // newer ones also accept appleUserId. Both must point to the same RevenueCat app_user_id.
      const customerInfo = await sendToNative('PURCHASE', { packageId, productId, userId: appleUserId, appleUserId });
      const activeEntitlements = customerInfo?.entitlements?.active || {};
      const entitlementKeys = Object.keys(activeEntitlements);
      debugLog(`🔑 Active entitlements: ${entitlementKeys.join(', ') || 'NONE'}`);
      const hasPremium = entitlementKeys.length > 0;

      if (hasPremium) {
        const isAnnual = productId?.includes('annual');
        const isPro    = productId?.includes('tier.pro');
        applyPlanFlags({ isAnnual, isPro, isUltimate: isAnnual });
        debugLog('✅ Premium granted! localStorage updated.');
        try {
          const profileId = localStorage.getItem('userProfileId');
          const userId    = localStorage.getItem('unfiltr_user_id');
          if (profileId || userId) {
            const resp = await fetch('/api/verifyPurchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileId: profileId || userId, userId, platform: 'ios', productId }),
            });
            // Use server-confirmed plan flags if available, then re-notify listeners
            if (resp.ok) {
              const respData = await resp.json();
              const plan = respData?.data?.plan;
              if (plan) {
                const isServerAnnual = plan === 'annual' || plan === 'ultimate_friend';
                applyPlanFlags({ isAnnual: isServerAnnual, isPro: plan === 'pro', isUltimate: plan === 'ultimate_friend' });
              }
            }
            debugLog('✅ UserProfile updated in database');
          }
        } catch(e) {
          debugLog(`⚠️ DB update failed (non-fatal): ${e.message}`);
        }
        return { isSuccess: true, customerInfo };
      }
      // In TestFlight, StoreKit can return from a sheet without an active entitlement when
      // the user backs out, picks Manage, or does not finish side-button confirmation.
      // That is not a real app error, and showing "Entitlement not found" scares users.
      const stored = getStoredPremiumSnapshot(productId);
      if (stored.isPremium) {
        debugLog('ℹ️ No entitlement returned, but local premium already exists — treating as already subscribed.');
        applyPlanFlags(stored);
        return { isSuccess: true, alreadySubscribed: true, customerInfo };
      }
      debugLog('ℹ️ Purchase flow ended without an active entitlement — treating as cancelled/not completed.');
      return { isSuccess: false, isCancelled: true };
    } catch(e) {
      if (isUserCancelledError(e)) {
        debugLog('ℹ️ User cancelled purchase');
        return { isSuccess: false, isCancelled: true };
      }
      debugLog(`❌ purchase error: ${e.message}`);
      return { isSuccess: false, error: e.message };
    }
  }

  static async restorePurchases() {
    debugLog('🔄 restorePurchases() called');
    if (!this.isNative()) return { isSuccess: false, message: 'Web mode' };
    try {
      const appleUserId = localStorage.getItem('unfiltr_apple_user_id') || localStorage.getItem('unfiltr_user_id') || undefined;
      const customerInfo = await sendToNative('RESTORE', { userId: appleUserId, appleUserId });
      const hasPremium = Object.keys(customerInfo?.entitlements?.active || {}).length > 0;
      if (hasPremium) {
        debugLog('✅ Restore successful — premium granted');
        const activeSubs = Object.values(customerInfo?.entitlements?.active || {});
        const restoredProductId = activeSubs[0]?.productIdentifier || '';
        applyPlanFlags({
          isAnnual: restoredProductId.includes('annual'),
          isPro: restoredProductId.includes('tier.pro'),
          isUltimate: restoredProductId.includes('annual'),
        });
        try {
          const profileId = localStorage.getItem('userProfileId');
          const userId    = localStorage.getItem('unfiltr_user_id');
          if (profileId || userId) {
            const resp = await fetch('/api/verifyPurchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileId: profileId || userId, userId, platform: 'ios', action: 'restore' }),
            });
            // Use server-confirmed plan flags to update annual/pro localStorage keys
            if (resp.ok) {
              const respData = await resp.json();
              const plan = respData?.data?.plan;
              if (plan) {
                const isServerAnnual = plan === 'annual' || plan === 'ultimate_friend';
                applyPlanFlags({ isAnnual: isServerAnnual, isPro: plan === 'pro', isUltimate: plan === 'ultimate_friend' });
              }
            }
            debugLog('✅ UserProfile restore updated in database');
          }
        } catch(e) {
          debugLog(`⚠️ DB restore update failed (non-fatal): ${e.message}`);
        }
        window.dispatchEvent(new Event('unfiltr_auth_updated'));
        return { isSuccess: true };
      }
      debugLog('⚠️ Restore: no active subscription found');
      return { isSuccess: false, message: 'No subscription found' };
    } catch(e) {
      debugLog(`❌ restore error: ${e.message}`);
      return { isSuccess: false, error: e.message };
    }
  }

  static async signInWithApple() {
    debugLog('🍎 signInWithApple called, bridge=' + isNativeApp());
    if (!this.isNative()) {
      return Promise.reject(new Error('Apple Sign-In only available in the iOS app'));
    }
    const result = await sendToNative('SIGN_IN_WITH_APPLE');
    return result;
  }
}


// ─── React hook wrapper for Pricing.jsx ──────────────────────────────────────
// Provides { purchasing, error, statusMessage, purchase, restore, loadProducts }


export function useAppleSubscriptions() {
  const [purchasing,     setPurchasing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [statusMessage,  setStatusMessage]  = useState('');

  const loadProducts = useCallback(async () => {
    try {
      await AppleStoreKitService.getProducts();
    } catch (e) {
      // non-fatal
    }
  }, []);

  const purchase = useCallback(async (productId) => {
    setPurchasing(true);
    setError(null);
    setStatusMessage('Processing…');
    try {
      const result = await AppleStoreKitService.purchase(productId);
      if (result?.isSuccess) {
        setStatusMessage('Purchase successful!');
      } else if (result?.isCancelled) {
        setStatusMessage('');
      } else {
        setError(result?.error || 'Purchase failed');
        setStatusMessage('');
      }
      return result;
    } catch (e) {
      setError(e.message);
      setStatusMessage('');
      return { isSuccess: false, error: e.message };
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setPurchasing(true);
    setError(null);
    setStatusMessage('Restoring purchases…');
    try {
      const result = await AppleStoreKitService.restorePurchases();
      if (result?.isSuccess) {
        setStatusMessage('Restored successfully!');
      } else {
        setError(result?.message || result?.error || 'No subscription found');
        setStatusMessage('');
      }
      return result;
    } catch (e) {
      setError(e.message);
      setStatusMessage('');
      return { isSuccess: false, error: e.message };
    } finally {
      setPurchasing(false);
    }
  }, []);

  return { purchasing, error, statusMessage, purchase, restore, loadProducts };
}

