import { useEffect, useState } from 'react';
import { AppleStoreKitService } from '@/components/api/appleStoreKitService';

export function useAppleSubscriptions() {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [purchasing, setPurchasing]       = useState(false);
  const [error, setError]                 = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await AppleStoreKitService.getProducts();
      setProducts(result);
    } catch (e) {
      setError('Could not load products');
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
