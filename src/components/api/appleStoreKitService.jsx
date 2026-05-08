import { debugLog } from '@/components/DebugPanel';
import { isNativeApp, sendNative, ensureBridgeInstalled } from '@/lib/nativeBridge';

const MOCK_PRODUCTS = [
  { productId: 'com.huertas.unfiltr.pro.monthly', title: 'Monthly Premium', price: '$9.99', period: 'month' },
  { productId: 'com.huertas.unfiltr.pro.annual',  title: 'Annual Premium',  price: '$59.99', period: 'year' },
  { productId: 'com.huertas.unfiltr.tier.pro',    title: 'Pro Tier',        price: '$14.99', period: 'month' },
];

// Ensure the shared bridge dispatcher is installed when this module loads
ensureBridgeInstalled();

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
      const customerInfo = await sendToNative('PURCHASE', { packageId, productId, userId: appleUserId, appleUserId });
      const activeEntitlements = customerInfo?.entitlements?.active || {};
      const entitlementKeys = Object.keys(activeEntitlements);
      debugLog(`🔑 Active entitlements: ${entitlementKeys.join(', ') || 'NONE'}`);
      const hasPremium = entitlementKeys.length > 0;

      if (hasPremium) {
        localStorage.setItem('unfiltr_is_premium', 'true');
        debugLog('✅ Premium granted! localStorage updated.');
        try {
          const profileId = localStorage.getItem('userProfileId');
          const userId    = localStorage.getItem('unfiltr_user_id');
          const isAnnual  = productId?.includes('annual');
          const isPro     = productId?.includes('tier.pro');
          if (profileId || userId) {
            await fetch('/api/verifyPurchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileId: profileId || userId, userId, platform: 'ios', productId }),
            });
            localStorage.setItem('unfiltr_is_annual', String(isAnnual));
            localStorage.setItem('unfiltr_is_pro',    String(isPro));
            debugLog('✅ UserProfile updated in database');
          }
        } catch(e) {
          debugLog(`⚠️ DB update failed (non-fatal): ${e.message}`);
        }
        return { isSuccess: true, customerInfo };
      }
      debugLog('❌ Purchase completed but no entitlement found');
      return { isSuccess: false, error: 'Entitlement not found after purchase' };
    } catch(e) {
      if (e.message?.toLowerCase().includes('cancel')) {
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
        localStorage.setItem('unfiltr_is_premium', 'true');
        debugLog('✅ Restore successful — premium granted');
        try {
          const profileId = localStorage.getItem('userProfileId');
          const userId    = localStorage.getItem('unfiltr_user_id');
          if (profileId || userId) {
            await fetch('/api/verifyPurchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileId: profileId || userId, userId, platform: 'ios' }),
            });
            debugLog('✅ UserProfile restore updated in database');
          }
        } catch(e) {
          debugLog(`⚠️ DB restore update failed (non-fatal): ${e.message}`);
        }
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