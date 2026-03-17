/**
 * Service to communicate with Apple StoreKit for subscriptions
 * Works when app is wrapped in native iOS container
 * Falls back to mock data when running as web
 */

const PRODUCT_IDS = [
  'com.huertas.unfiltr.premium.monthly',
  'com.huertas.unfiltr.premium.annual',
];

const MOCK_PRODUCTS = [
  {
    productId: 'com.huertas.unfiltr.premium.monthly',
    title: 'Monthly Premium',
    description: 'Unlimited access, billed monthly',
    price: '$9.99',
    priceAmount: 9.99,
    currency: 'USD',
    period: 'month',
  },
  {
    productId: 'com.huertas.unfiltr.premium.annual',
    title: 'Annual Premium',
    description: 'Unlimited access, billed yearly — save 50%',
    price: '$59.99',
    priceAmount: 59.99,
    currency: 'USD',
    period: 'year',
  },
];

export class AppleStoreKitService {
  static isNative() {
    return (
      typeof window !== 'undefined' && (
        (window.WTN && typeof window.WTN.inAppPurchase === 'function') ||
        (window.webkit?.messageHandlers?.storekit) ||
        (window.webkit?.messageHandlers?.iap)
      )
    );
  }

  static async getProducts() {
    if (!this.isNative()) {
      console.log('[StoreKit] Running in web mode — returning mock products');
      return MOCK_PRODUCTS;
    }
    return new Promise((resolve) => {
      try {
        if (typeof window.WTN.getProducts === 'function') {
          window.WTN.getProducts({ productIds: PRODUCT_IDS }, (result) => {
            if (result && result.products && result.products.length > 0) {
              resolve(result.products);
            } else {
              console.warn('[StoreKit] No products returned, using mock');
              resolve(MOCK_PRODUCTS);
            }
          });
        } else {
          resolve(MOCK_PRODUCTS);
        }
      } catch (e) {
        console.error('[StoreKit] getProducts error:', e);
        resolve(MOCK_PRODUCTS);
      }
    });
  }

  static async purchase(productId) {
    if (!this.isNative()) {
      console.log('[StoreKit] Web mode — simulating purchase for:', productId);
      return {
        isSuccess: true,
        productId,
        receiptData: 'MOCK_RECEIPT_DATA',
        isMock: true,
      };
    }

    return new Promise((resolve) => {
      try {
        // Primary: WTN bridge
        if (window.WTN && typeof window.WTN.inAppPurchase === 'function') {
          window.WTN.inAppPurchase({ productId }, (result) => {
            console.log('[StoreKit] Purchase result:', JSON.stringify(result));

            if (!result.isSuccess && !result.receiptData) {
              const errorStr = (result.error || '').toLowerCase();
              const isCancelled =
                result.isCancelled === true ||
                result.status === 'cancelled' ||
                errorStr.includes('cancel') ||
                errorStr.includes('user') ||
                errorStr === '' ||
                result.error === undefined;

              if (isCancelled) {
                resolve({ isSuccess: false, isCancelled: true });
                return;
              }
            }

            resolve(result);
          });
        }
        // Fallback: webkit message handlers
        else if (window.webkit?.messageHandlers?.storekit) {
          console.log('[StoreKit] Using webkit storekit handler for:', productId);
          window.webkit.messageHandlers.storekit.postMessage({ action: 'purchase', productId });
          // Webkit handlers are fire-and-forget; native side should call back via global
          resolve({ isSuccess: true, productId, pendingNativeCallback: true });
        } else if (window.webkit?.messageHandlers?.iap) {
          console.log('[StoreKit] Using webkit iap handler for:', productId);
          window.webkit.messageHandlers.iap.postMessage({ action: 'purchase', productId });
          resolve({ isSuccess: true, productId, pendingNativeCallback: true });
        } else {
          resolve({ isSuccess: false, error: 'No native purchase handler available' });
        }
      } catch (e) {
        console.error('[StoreKit] purchase error:', e);
        resolve({ isSuccess: false, error: e.message });
      }
    });
  }

  static async restorePurchases() {
    if (!this.isNative()) {
      console.log('[StoreKit] Web mode — mock restore');
      return { isSuccess: false, message: 'No purchases to restore (web mode)' };
    }

    return new Promise((resolve) => {
      try {
        if (typeof window.WTN.restorePurchases === 'function') {
          window.WTN.restorePurchases((result) => {
            resolve(result);
          });
        } else if (window.webkit?.messageHandlers?.storekit) {
          window.webkit.messageHandlers.storekit.postMessage({ action: 'restore' });
          resolve({ isSuccess: true, message: 'Restore triggered' });
        } else {
          resolve({ isSuccess: false, message: 'Restore not available' });
        }
      } catch (e) {
        resolve({ isSuccess: false, error: e.message });
      }
    });
  }
}