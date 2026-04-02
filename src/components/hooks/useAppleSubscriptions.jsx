import { useState, useRef, useCallback } from 'react';
import { AppleStoreKitService } from '@/components/api/appleStoreKitService';

// ✅ Global singleton — persists across ALL component mounts/unmounts
// This means no matter how many times Pricing or PaywallModal mounts,
// getProducts() only ever fires ONCE per app session
let globalLoadAttempted = false;
let globalProducts = null;

export function useAppleSubscriptions() {
  const [products, setProducts]           = useState(globalProducts || []);
  const [loading, setLoading]             = useState(false);
  const [purchasing, setPurchasing]       = useState(false);
  const [error, setError]                 = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Called manually when the paywall or pricing page actually opens
  const loadProducts = useCallback(async () => {
    // Already loaded this session — don't fire again
    if (globalLoadAttempted) {
      if (globalProducts) setProducts(globalProducts);
      return;
    }
    globalLoadAttempted = true;

    try {
      setLoading(true);
      const result = await Promise.race([
        AppleStoreKitService.getProducts(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
      const finalProducts = result && result.length > 0 ? result : MOCK_PRODUCTS;
      globalProducts = finalProducts;
      setProducts(finalProducts);
    } catch (e) {
      globalProducts = MOCK_PRODUCTS;
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  const purchase = async (productId) => {
    try {
      setPurchasing(true);
      setError(null);
      setStatusMessage('Opening App Store...');
      const result = await AppleStoreKitService.purchase(productId);
      if (result.isCancelled) {
        setStatusMessage('');
        return { success: false, cancelled: true };
      }
      if (result.isMock) {
        setStatusMessage('');
        setError('Purchases only available in the iOS app.');
        return { success: false };
      }
      if (!result.isSuccess) {
        setError(result.error || 'Purchase failed');
        return { success: false };
      }
      setStatusMessage('🎉 You are now Premium!');
      return { success: true };
    } catch (e) {
      setError('Something went wrong');
      return { success: false };
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    try {
      setStatusMessage('Restoring...');
      const result = await AppleStoreKitService.restorePurchases();
      setStatusMessage(result.isSuccess ? '✅ Restored!' : 'Nothing to restore');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e) {
      setStatusMessage('Restore failed');
    }
  };

  return { products, loading, purchasing, error, statusMessage, purchase, restore, loadProducts };
}

const MOCK_PRODUCTS = [
  { productId: 'com.huertas.unfiltr.pro.monthly', title: 'Monthly Premium', price: '$9.99',  period: 'month' },
  { productId: 'com.huertas.unfiltr.tier.pro',    title: 'Pro Tier',        price: '$14.99', period: 'month' },
  { productId: 'com.huertas.unfiltr.pro.annual',  title: 'Annual Premium',  price: '$59.99', period: 'year' },
];
