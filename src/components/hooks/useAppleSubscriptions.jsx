import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

const PRODUCT_IDS = [
  'com.huertas.unfiltr.premium.monthly',
  'com.huertas.unfiltr.premium.annual',
];

const MOCK_PRODUCTS = [
  {
    productId:   'com.huertas.unfiltr.premium.monthly',
    title:       'Monthly Premium',
    description: 'Unlimited access, billed monthly',
    price:       '$9.99',
    priceAmount: 9.99,
    currency:    'USD',
    period:      'month',
  },
  {
    productId:   'com.huertas.unfiltr.premium.annual',
    title:       'Annual Premium',
    description: 'Unlimited access, billed yearly — save 50%',
    price:       '$59.99',
    priceAmount: 59.99,
    currency:    'USD',
    period:      'year',
  },
];

// ── Native bridge detection ──────────────────────────────────────────
function getNativeBridge() {
  if (window.WTN?.inAppPurchase)                       return 'WTN';
  if (window.webkit?.messageHandlers?.storekit)        return 'webkit_storekit';
  if (window.webkit?.messageHandlers?.iap)             return 'webkit_iap';
  return null;
}

function isIOSDevice() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// ── Trigger native StoreKit purchase ────────────────────────────────
function triggerNativePurchase(productId) {
  return new Promise((resolve) => {
    const bridge = getNativeBridge();

    if (bridge === 'WTN') {
      window.WTN.inAppPurchase({ productId }, (result) => {
        const errorStr = (result?.error || '').toLowerCase();
        const cancelled =
          result?.isCancelled === true ||
          result?.status === 'cancelled' ||
          errorStr.includes('cancel') ||
          (!result?.isSuccess && !result?.receiptData);
        if (cancelled) return resolve({ isSuccess: false, isCancelled: true });
        resolve(result);
      });
      return;
    }

    if (bridge === 'webkit_storekit') {
      window.webkit.messageHandlers.storekit.postMessage({ action: 'purchase', productId });
      return resolve({ isSuccess: true, pendingNativeCallback: true, productId });
    }

    if (bridge === 'webkit_iap') {
      window.webkit.messageHandlers.iap.postMessage({ action: 'purchase', productId });
      return resolve({ isSuccess: true, pendingNativeCallback: true, productId });
    }

    // Web / no bridge — mock only
    console.log('[IAP] No native bridge — mock purchase');
    resolve({ isSuccess: true, isMock: true, productId, receiptData: 'MOCK_RECEIPT' });
  });
}

// ── Trigger native restore ───────────────────────────────────────────
function triggerNativeRestore() {
  return new Promise((resolve) => {
    const bridge = getNativeBridge();

    if (bridge === 'WTN' && window.WTN?.restorePurchases) {
      window.WTN.restorePurchases((result) => resolve(result));
      return;
    }

    if (bridge === 'webkit_storekit') {
      window.webkit.messageHandlers.storekit.postMessage({ action: 'restore' });
      return resolve({ triggered: true });
    }

    resolve({ triggered: false });
  });
}

// ── Call Vercel backend ──────────────────────────────────────────────
async function callAPI(endpoint, body) {
  const res = await fetch(`/api/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `API error ${res.status}`);
  return json;
}

// ── Hook ─────────────────────────────────────────────────────────────
export function useAppleSubscriptions() {
  const [products, setProducts]       = useState(MOCK_PRODUCTS);
  const [loading, setLoading]         = useState(false);
  const [purchasing, setPurchasing]   = useState(false);
  const [error, setError]             = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const getProfileId = useCallback(async () => {
    // Try localStorage first (fast path)
    const cached = localStorage.getItem('userProfileId');
    if (cached) return cached;
    // Fall back to Supabase session user ID
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }, []);

  const setStatus = (msg, clearAfter = 0) => {
    setStatusMessage(msg);
    if (clearAfter > 0) setTimeout(() => setStatusMessage(''), clearAfter);
  };

  // Load real prices from native bridge if available
  useEffect(() => {
    const bridge = getNativeBridge();
    if (bridge === 'WTN' && window.WTN?.getProducts) {
      setLoading(true);
      window.WTN.getProducts({ productIds: PRODUCT_IDS }, (result) => {
        if (result?.products?.length > 0) setProducts(result.products);
        setLoading(false);
      });
    }
  }, []);

  const purchase = async (productId) => {
    try {
      setPurchasing(true);
      setError(null);
      setStatus('Opening App Store...');

      const nativeResult = await triggerNativePurchase(productId);

      if (nativeResult.isCancelled) {
        setStatus('Purchase cancelled.', 3000);
        return { success: false, cancelled: true };
      }

      if (!nativeResult.isSuccess) {
        setError(nativeResult.error || 'Purchase failed. Please try again.');
        return { success: false };
      }

      // Mock/web mode — call backend to mark as premium directly
      if (nativeResult.isMock) {
        const profileId = await getProfileId();
        if (profileId) {
          await callAPI('handleAppleIAP', {
            receipt:   'MOCK_RECEIPT',
            productId,
            profileId,
          }).catch(() => {});
          localStorage.setItem('unfiltr_is_premium', 'true');
        }
        setStatus('✅ Purchase successful!', 4000);
        return { success: true, mock: true };
      }

      // Real receipt — validate via RevenueCat through our backend
      if (nativeResult.pendingNativeCallback) {
        // Bridge will call window.onIAPComplete when done
        setStatus('Waiting for App Store confirmation...', 0);
        return { success: true, pending: true };
      }

      setStatus('Verifying with App Store...');
      const profileId = await getProfileId();
      const response = await callAPI('handleAppleIAP', {
        receipt:   nativeResult.receiptData,
        productId: nativeResult.productId || productId,
        profileId,
      });

      if (response?.data?.success) {
        localStorage.setItem('unfiltr_is_premium', 'true');
        setStatus('🎉 You are now Premium!', 5000);
        return { success: true, plan: response.data.plan };
      } else {
        throw new Error(response?.data?.error || 'Verification failed');
      }

    } catch (e) {
      console.error('[IAP] purchase error:', e);
      setError('Something went wrong. Please try again or contact support.');
      return { success: false };
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    try {
      setStatus('Restoring purchases...');
      const profileId = await getProfileId();

      // Trigger native restore (sends receipts back to StoreKit)
      await triggerNativeRestore();

      // Check RevenueCat for active entitlement
      if (profileId) {
        const response = await callAPI('restorePurchases', { profileId });
        if (response?.data?.isPremium) {
          localStorage.setItem('unfiltr_is_premium', 'true');
          setStatus('✅ ' + (response.data.message || 'Purchases restored!'), 4000);
          return { success: true, plan: response.data.plan };
        } else {
          setStatus(response?.data?.message || 'No previous purchases found.', 4000);
          return { success: false };
        }
      }

      setStatus('No purchases found.', 4000);
      return { success: false };

    } catch (e) {
      console.error('[IAP] restore error:', e);
      setStatus('Restore failed. Please try again.', 4000);
      return { success: false };
    }
  };

  return {
    products,
    loading,
    purchasing,
    error,
    statusMessage,
    purchase,
    restore,
    isNative: !!getNativeBridge(),
    isIOSDevice: isIOSDevice(),
  };
}
