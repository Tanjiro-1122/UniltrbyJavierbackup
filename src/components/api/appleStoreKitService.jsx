import { debugLog } from '@/components/DebugPanel';

const MOCK_PRODUCTS = [
  { productId: 'com.huertas.unfiltr.pro.monthly', title: 'Monthly Premium', price: '$9.99', period: 'month' },
  { productId: 'com.huertas.unfiltr.pro.annual',  title: 'Annual Premium',  price: '$59.99', period: 'year' },
];

function isReactNativeWebView() {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView;
}

function sendToNative(type, payload = {}) {
  return new Promise((resolve, reject) => {
    const bridgeReady = isReactNativeWebView();
    debugLog(`📡 sendToNative: ${type} | bridge: ${bridgeReady ? '✅ ready' : '❌ NOT FOUND'}`);

    if (!bridgeReady) {
      reject(new Error('Not in React Native WebView'));
      return;
    }

    let resolved = false;
    const timeoutMs = type === 'PURCHASE' ? 120000 : 30000;

    const handleResponse = (event) => {
      if (resolved) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const responseTypes = {
          'PURCHASE':          ['PURCHASE_SUCCESS', 'PURCHASE_ERROR'],
          'RESTORE':           ['RESTORE_RESULT'],
          'GET_OFFERINGS':     ['OFFERINGS_RESULT'],
          'GET_CUSTOMER_INFO': ['CUSTOMER_INFO_RESULT'],
        };
        const expected = responseTypes[type] || [];
        if (expected.includes(data.type)) {
          resolved = true;
          window.removeEventListener('message', handleResponse);
          debugLog(`📨 Response: ${data.type} ${data.type.includes('ERROR') ? '❌' : '✅'}`);
          if (data.type === 'PURCHASE_ERROR') {
            reject(new Error(data.error || 'Purchase failed'));
          } else {
            resolve(data.data);
          }
        }
      } catch (e) {
        debugLog(`⚠️ Parse error: ${e.message}`);
      }
    };

    window.addEventListener('message', handleResponse);

    try {
      const msg = JSON.stringify({ type, ...payload });
      debugLog(`📤 Posting to native: ${msg.substring(0, 80)}`);
      window.ReactNativeWebView.postMessage(msg);
    } catch (e) {
      window.removeEventListener('message', handleResponse);
      debugLog(`❌ postMessage failed: ${e.message}`);
      reject(new Error('Failed to send message'));
      return;
    }

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', handleResponse);
        debugLog(`❌ Timeout after ${timeoutMs / 1000}s — no response from native`);
        reject(new Error('Timeout'));
      }
    }, timeoutMs);
  });
}

export class AppleStoreKitService {
  static isNative() {
    const result = isReactNativeWebView();
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
    } catch (e) {
      debugLog(`❌ getProducts error: ${e.message}`);
      return MOCK_PRODUCTS;
    }
  }

  static async purchase(productId) {
    debugLog(`💳 purchase() called: ${productId}`);
    if (!this.isNative()) {
      debugLog('⚠️ Not native — would be mock purchase, blocking');
      return { isSuccess: false, error: 'Purchases only available in the iOS app.' };
    }
    try {
      const packageId = productId.includes('annual') ? '$rc_annual' : productId.includes('tier.pro') ? 'pro_tier' : '$rc_monthly';
      debugLog(`📦 Resolved packageId: ${packageId}`);
      const customerInfo = await sendToNative('PURCHASE', { packageId, productId });
      const activeEntitlements = customerInfo?.entitlements?.active || {};
      const entitlementKeys = Object.keys(activeEntitlements);
      debugLog(`🔑 Active entitlements: ${entitlementKeys.join(', ') || 'NONE'}`);
      const hasPremium = entitlementKeys.length > 0;
      if (hasPremium) {
        localStorage.setItem('unfiltr_is_premium', 'true');
        debugLog('✅ Premium granted! localStorage updated.');
        return { isSuccess: true, customerInfo };
      }
      debugLog('❌ Purchase completed but no entitlement found');
      return { isSuccess: false, error: 'Entitlement not found' };
    } catch (e) {
      if (e.message?.includes('cancel')) {
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
      const customerInfo = await sendToNative('RESTORE');
      const hasPremium = Object.keys(customerInfo?.entitlements?.active || {}).length > 0;
      if (hasPremium) {
        localStorage.setItem('unfiltr_is_premium', 'true');
        debugLog('✅ Restore successful — premium granted');
        return { isSuccess: true };
      }
      debugLog('⚠️ Restore: no active subscription found');
      return { isSuccess: false, message: 'No subscription found' };
    } catch (e) {
      debugLog(`❌ restore error: ${e.message}`);
      return { isSuccess: false, error: e.message };
    }
  }
}
