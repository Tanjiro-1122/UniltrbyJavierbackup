import { useEffect, useState, useRef } from 'react';
import { AppleStoreKitService } from '@/components/api/appleStoreKitService';

export function useAppleSubscriptions() {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [purchasing, setPurchasing]       = useState(false);
  const [error, setError]                 = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const loadAttempted = useRef(false);

  useEffect(() => {
    // Wait up to 3s for the RNWV bridge to be injected before loading products
    let attempts = 0;
    const maxAttempts = 15; // 15 x 200ms = 3 seconds
    const interval = setInterval(() => {
      attempts++;
      const bridgeReady = typeof window !== 'undefined' && !!window.ReactNativeWebView;
      if (bridgeReady || attempts >= maxAttempts) {
        clearInterval(interval);
        if (!loadAttempted.current) {
          loadAttempted.current = true;
          loadProducts();
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await Promise.race([
        AppleStoreKitService.getProducts(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ]);
      setProducts(result && result.length > 0 ? result : MOCK_PRODUCTS);
    } catch (e) {
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

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
        // Web/browser mock — no real purchase
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

  return { products, loading, purchasing, error, statusMessage, purchase, restore };
}

const MOCK_PRODUCTS = [
  { productId: 'com.huertas.unfiltr.pro.monthly', title: 'Monthly Premium', price: '$9.99',  period: 'month' },
  { productId: 'com.huertas.unfiltr.tier.pro',    title: 'Pro Tier',        price: '$14.99', period: 'month' },
  { productId: 'com.huertas.unfiltr.pro.annual',  title: 'Annual Premium',  price: '$59.99', period: 'year' },
];
