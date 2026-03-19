/**
 * Unified IAP Service — supports iOS StoreKit, Android Google Play Billing, and web mock
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

  // ── Platform detection ──────────────────────────────────────────────
  static getPlatform() {
    if (typeof window !== 'undefined') {
      if (
        (window.WTN && typeof window.WTN.inAppPurchase === 'function') ||
        window.webkit?.messageHandlers?.storekit ||
        window.webkit?.messageHandlers?.iap
      ) {
        return 'ios';
      }
      if (window.Android || window.AndroidIAP || window.PlayBilling) {
        return 'android';
      }
    }
    return 'web';
  }

  static isNative() {
    return this.getPlatform() !== 'web';
  }

  // ── Products ────────────────────────────────────────────────────────
  static async getProducts() {
    const platform = this.getPlatform();

    if (platform === 'ios') {
      return this._getProductsIOS();
    }
    if (platform === 'android') {
      return this._getProductsAndroid();
    }
    console.log('[IAP] Web mode — returning mock products');
    return MOCK_PRODUCTS;
  }

  static _getProductsIOS() {
    return new Promise((resolve) => {
      try {
        if (window.WTN && typeof window.WTN.getProducts === 'function') {
          window.WTN.getProducts({ productIds: PRODUCT_IDS }, (result) => {
            if (result?.products?.length > 0) {
              resolve(result.products);
            } else {
              console.warn('[IAP/iOS] No products returned, using mock');
              resolve(MOCK_PRODUCTS);
            }
          });
        } else {
          resolve(MOCK_PRODUCTS);
        }
      } catch (e) {
        console.error('[IAP/iOS] getProducts error:', e);
        resolve(MOCK_PRODUCTS);
      }
    });
  }

  static async _getProductsAndroid() {
    try {
      if (window.Android?.getProducts) {
        const result = window.Android.getProducts(JSON.stringify(PRODUCT_IDS));
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (window.PlayBilling?.getProducts) {
        const result = await window.PlayBilling.getProducts(PRODUCT_IDS);
        if (Array.isArray(result) && result.length > 0) return result;
      }
    } catch (e) {
      console.error('[IAP/Android] getProducts error:', e);
    }
    console.warn('[IAP/Android] No products returned, using mock');
    return MOCK_PRODUCTS;
  }

  // ── Purchase ────────────────────────────────────────────────────────
  static async purchase(productId) {
    const platform = this.getPlatform();

    if (platform === 'ios') {
      return this._purchaseIOS(productId);
    }
    if (platform === 'android') {
      return this._purchaseAndroid(productId);
    }

    // Web mock
    console.log('[IAP] Web mode — simulating purchase for:', productId);
    return { isSuccess: true, productId, receiptData: 'MOCK_RECEIPT_DATA', isMock: true };
  }

  static _purchaseIOS(productId) {
    return new Promise((resolve) => {
      try {
        if (window.WTN && typeof window.WTN.inAppPurchase === 'function') {
          window.WTN.inAppPurchase({ productId }, (result) => {
            console.log('[IAP/iOS] Purchase result:', JSON.stringify(result));

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
        } else if (window.webkit?.messageHandlers?.storekit) {
          console.log('[IAP/iOS] Using webkit storekit handler for:', productId);
          window.webkit.messageHandlers.storekit.postMessage({ action: 'purchase', productId });
          resolve({ isSuccess: true, productId, pendingNativeCallback: true });
        } else if (window.webkit?.messageHandlers?.iap) {
          console.log('[IAP/iOS] Using webkit iap handler for:', productId);
          window.webkit.messageHandlers.iap.postMessage({ action: 'purchase', productId });
          resolve({ isSuccess: true, productId, pendingNativeCallback: true });
        } else {
          resolve({ isSuccess: false, error: 'No iOS purchase handler available' });
        }
      } catch (e) {
        console.error('[IAP/iOS] purchase error:', e);
        resolve({ isSuccess: false, error: e.message });
      }
    });
  }

  static async _purchaseAndroid(productId) {
    try {
      if (window.Android?.launchBillingFlow) {
        console.log('[IAP/Android] Using Android.launchBillingFlow for:', productId);
        const result = window.Android.launchBillingFlow(productId);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed || { isSuccess: false, error: 'No response from Android billing' };
      }
      if (window.PlayBilling?.purchase) {
        console.log('[IAP/Android] Using PlayBilling.purchase for:', productId);
        const result = await window.PlayBilling.purchase(productId);
        return result || { isSuccess: false, error: 'No response from PlayBilling' };
      }
      if (window.AndroidIAP?.purchase) {
        console.log('[IAP/Android] Using AndroidIAP.purchase for:', productId);
        const result = await window.AndroidIAP.purchase(productId);
        return result || { isSuccess: false, error: 'No response from AndroidIAP' };
      }
    } catch (e) {
      console.error('[IAP/Android] purchase error:', e);
      return { isSuccess: false, error: e.message };
    }
    return { isSuccess: false, error: 'Android billing not available' };
  }

  // ── Restore ─────────────────────────────────────────────────────────
  static async restorePurchases() {
    const platform = this.getPlatform();

    if (platform === 'ios') {
      return this._restoreIOS();
    }
    if (platform === 'android') {
      return this._restoreAndroid();
    }

    console.log('[IAP] Web mode — mock restore');
    return { isSuccess: false, message: 'No purchases to restore (web mode)' };
  }

  static _restoreIOS() {
    return new Promise((resolve) => {
      try {
        if (window.WTN && typeof window.WTN.restorePurchases === 'function') {
          window.WTN.restorePurchases((result) => resolve(result));
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

  static async _restoreAndroid() {
    try {
      if (window.Android?.restorePurchases) {
        const result = window.Android.restorePurchases();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed || { isSuccess: false, message: 'No response from Android restore' };
      }
      if (window.PlayBilling?.restore) {
        return await window.PlayBilling.restore();
      }
      if (window.AndroidIAP?.restore) {
        return await window.AndroidIAP.restore();
      }
    } catch (e) {
      console.error('[IAP/Android] restore error:', e);
      return { isSuccess: false, error: e.message };
    }
    return { isSuccess: false, message: 'Android restore not available' };
  }
}