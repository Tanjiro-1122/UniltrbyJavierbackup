import { debugLog } from '@/components/DebugPanel';

const MOCK_PRODUCTS = [
  { productId: 'com.huertas.unfiltr.pro.monthly', title: 'Monthly Premium', price: '$9.99', period: 'month' },
  { productId: 'com.huertas.unfiltr.pro.annual',  title: 'Annual Premium',  price: '$59.99', period: 'year' },
  { productId: 'com.huertas.unfiltr.tier.pro',    title: 'Pro Tier',        price: '$14.99', period: 'month' },
];

function isReactNativeWebView() {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView;
}

// ── Listen for native messages via BOTH channels ─────────────────────────────
// Channel 1: window.onMessageFromRN (direct injection from native sendToWeb)
// Channel 2: window message event (dispatchEvent fallback)
// Channel 3: window.__nativeBus (App.jsx bus, if present)
if (typeof window !== 'undefined') {
  window._rnMessageHandlers = window._rnMessageHandlers || {};

  const _dispatchToHandlers = (msg) => {
    if (!msg?.type) return;
    const handlers = window._rnMessageHandlers[msg.type] || [];
    handlers.forEach(fn => { try { fn(msg); } catch(e) {} });
  };

  // Hook into __nativeBus if available
  const _hookNativeBus = () => {
    if (!window.__nativeBus) return;
    const origEmit = window.__nativeBus.emit.bind(window.__nativeBus);
    window.__nativeBus.emit = (msg) => {
      origEmit(msg);
      debugLog(`📨 [RN→WEB via bus] ${msg.type}`);
      _dispatchToHandlers(msg);
    };
  };
  if (window.__nativeBus) {
    _hookNativeBus();
  } else {
    setTimeout(_hookNativeBus, 0);
  }

  // Hook into onMessageFromRN — this is the primary delivery channel now
  const _origOnMessage = window.onMessageFromRN;
  window.onMessageFromRN = (jsonStr) => {
    try {
      const msg = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      debugLog(`📨 [RN→WEB via onMessageFromRN] ${msg.type}`);
      _dispatchToHandlers(msg);
    } catch(e) {}
    if (typeof _origOnMessage === 'function') _origOnMessage(jsonStr);
  };

  // Also listen on window 'message' events (dispatchEvent fallback)
  window.addEventListener('message', (e) => {
    try {
      const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (msg?.type) {
        debugLog(`📨 [RN→WEB via window.message] ${msg.type}`);
        _dispatchToHandlers(msg);
      }
    } catch(e) {}
  });
}

function onceFromNative(types, timeoutMs) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const typeArray = Array.isArray(types) ? types : [types];

    const cleanup = () => {
      typeArray.forEach(t => {
        if (window._rnMessageHandlers[t]) {
          window._rnMessageHandlers[t] = window._rnMessageHandlers[t].filter(f => f !== handler);
        }
      });
    };

    const handler = (data) => {
      if (resolved) return;
      if (data.type === 'APPLE_SIGN_IN_WAITING') {
        debugLog('🍎 Apple overlay shown — waiting for user tap...');
        return;
      }
      resolved = true;
      cleanup();
      if (data.type?.includes('ERROR')) {
        reject(new Error(data.error || data.type));
      } else {
        resolve(data);
      }
    };

    typeArray.forEach(t => {
      window._rnMessageHandlers[t] = window._rnMessageHandlers[t] || [];
      window._rnMessageHandlers[t].push(handler);
    });

    if (timeoutMs) {
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          debugLog(`❌ Timeout after ${timeoutMs / 1000}s — no response from native`);
          reject(new Error('Timeout'));
        }
      }, timeoutMs);
    }
  });
}

function sendToNative(type, payload = {}) {
  const bridgeReady = isReactNativeWebView();
  debugLog(`📡 sendToNative: ${type} | bridge: ${bridgeReady ? '✅ ready' : '❌ NOT FOUND'}`);

  if (!bridgeReady) {
    return Promise.reject(new Error('Not in React Native WebView'));
  }

  const responseTypes = {
    'PURCHASE':          ['PURCHASE_SUCCESS', 'PURCHASE_ERROR'],
    'RESTORE':           ['RESTORE_RESULT'],
    'GET_OFFERINGS':     ['OFFERINGS_RESULT'],
    'GET_CUSTOMER_INFO': ['CUSTOMER_INFO_RESULT'],
    'SIGN_IN_WITH_APPLE': ['APPLE_SIGN_IN_SUCCESS', 'APPLE_SIGN_IN_CANCELLED', 'APPLE_SIGN_IN_ERROR', 'APPLE_SIGN_IN_WAITING'],
  };

  const timeoutMs = (type === 'PURCHASE' || type === 'SIGN_IN_WITH_APPLE') ? null : 30000;
  const waitFor = onceFromNative(responseTypes[type] || [], timeoutMs);

  try {
    const msg = JSON.stringify({ type, ...payload });
    debugLog(`📤 Posting to native: ${msg.substring(0, 80)}`);
    window.ReactNativeWebView.postMessage(msg);
  } catch(e) {
    debugLog(`❌ postMessage failed: ${e.message}`);
    return Promise.reject(new Error('Failed to send message'));
  }

  return waitFor.then(data => data.data !== undefined ? data.data : data);
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

      const customerInfo = await sendToNative('PURCHASE', { packageId, productId });
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
      const customerInfo = await sendToNative('RESTORE');
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
    debugLog('🍎 signInWithApple called, bridge=' + isReactNativeWebView());
    if (!this.isNative()) {
      return Promise.reject(new Error('Apple Sign-In only available in the iOS app'));
    }
    const result = await sendToNative('SIGN_IN_WITH_APPLE');
    return result;
  }
}
