/**
 * Unified IAP Service — ReactNativeWebView bridge (RevenueCat via iOS wrapper)
 * Product IDs: com.huertas.unfiltr.pro.monthly / .pro.annual
 * Package IDs: $rc_monthly / $rc_annual
 * Entitlement: "unfiltr by javier Pro"
 */

const MOCK_PRODUCTS = [
  {
    productId: 'com.huertas.unfiltr.pro.monthly',
    title: 'Monthly Premium',
    description: 'Unlimited access, billed monthly',
    price: '$9.99',
    priceAmount: 9.99,
    currency: 'USD',
    period: 'month',
  },
  {
    productId: 'com.huertas.unfiltr.pro.annual',
    title: 'Annual Premium',
    description: 'Unlimited access, billed yearly — save 50%',
    price: '$59.99',
    priceAmount: 59.99,
    currency: 'USD',
    period: 'year',
  },
];

function isReactNativeWebView() {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView;
}

function sendToNative(type, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!isReactNativeWebView()) {
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
          'PURCHASE': ['PURCHASE_SUCCESS', 'PURCHASE_ERROR'],
          'RESTORE': ['RESTORE_RESULT'],
          'GET_OFFERINGS': ['OFFERINGS_RESULT'],
          'GET_CUSTOMER_INFO': ['CUSTOMER_INFO_RESULT'],
        };
        const expected = responseTypes[type] || [];
        if (expected.includes(data.type)) {
          resolved = true;
          window.removeEventListener('message', handleResponse);
          if (data.type === 'PURCHASE_ERROR') {
            reject(new Error(data.error || 'Purchase failed'));
          } else {
            resolve(data.data);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleResponse);
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
    } catch (e) {
      window.removeEventListener('message', handleResponse);
      reject(new Error('Failed to send message to native'));
      return;
    }
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', handleResponse);
        reject(new Error('Timeout waiting for native response'));
      }
    }, timeoutMs);
  });
}

export class AppleStoreKitService {
  static isNative() {
    return isReactNativeWebView();
  }

  static async getProducts() {
    if (!this.isNative()) return MOCK_PRODUCTS;
    try {
      const offerings = await sendToNative('GET_OFFERINGS');
      if (offerings?.current?.availablePackages?.length > 0) {
        return offerings.current.availablePackages.map((pkg) => ({
          productId: pkg.product?.identifier || pkg.identifier,
          title: pkg.product?.title || 'Premium',
          description: pkg.product?.description || '',
          price: pkg.product?.priceString || '$9.99',
          priceAmount: pkg.product?.price || 9.99,
          currency: pkg.product?.currencyCode || 'USD',
          period: pkg.packageType === 'ANNUAL' ? 'year' : 'month',
          rcPackageId: pkg.identifier,
        }));
      }
      return MOCK_PRODUCTS;
    } catch (e) {
      return MOCK_PRODUCTS;
    }
  }

  static async purchase(productId) {
    if (!this.isNative()) {
      localStorage.setItem('unfiltr_is_premium', 'true');
      return { isSuccess: true, isMock: true };
    }
    try {
      const packageId = productId.includes('annual') ? '$rc_annual' : '$rc_monthly';
      const customerInfo = await sendToNative('PURCHASE', { packageId, productId });
      const hasPremium = Object.keys(customerInfo?.entitlements?.active || {}).length > 0;
      if (hasPremium) {
        localStorage.setItem('unfiltr_is_premium', 'true');
        return { isSuccess: true, customerInfo };
      }
      return { isSuccess: false, error: 'Entitlement not found after purchase' };
    } catch (e) {
      if (e.message?.toLowerCase().includes('cancel')) return { isSuccess: false, isCancelled: true };
      return { isSuccess: false, error: e.message };
    }
  }

  static async restorePurchases() {
    if (!this.isNative()) return { isSuccess: false, message: 'Web mode' };
    try {
      const customerInfo = await sendToNative('RESTORE');
      const hasPremium = Object.keys(customerInfo?.entitlements?.active || {}).length > 0;
      if (hasPremium) {
        localStorage.setItem('unfiltr_is_premium', 'true');
        return { isSuccess: true };
      }
      return { isSuccess: false, message: 'No active subscription found' };
    } catch (e) {
      return { isSuccess: false, error: e.message };
    }
  }
}
