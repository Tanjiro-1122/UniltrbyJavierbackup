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
      if (result.isCancelled) { setStatusMessage(''); return { success: false, cancelled: true }; }
      if (!result.isSuccess) { setError(result.error || 'Purchase failed.'); setStatusMessage(''); return { success: false }; }
      // Update Base44 UserProfile
      try {
        const userId = localStorage.getItem('unfiltr_user_id');
        if (userId) {
          const { base44 } = await import('@/api/base44Client');
          const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
          if (profiles?.[0]?.id) {
            await base44.entities.UserProfile.update(profiles[0].id, {
              is_premium: true,
              annual_plan: productId.includes('annual'),
            });
          }
        }
      } catch (dbErr) { console.warn('[IAP] DB update failed (non-fatal):', dbErr); }
      setStatusMessage('\u{1F389} You are now Premium!');
      return { success: true };
    } catch (e) {
      setError('Something went wrong. Please try again.');
      return { success: false };
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    try {
      setStatusMessage('Restoring...');
      const result = await AppleStoreKitService.restorePurchases();
      if (result.isSuccess) {
        try {
          const userId = localStorage.getItem('unfiltr_user_id');
          if (userId) {
            const { base44 } = await import('@/api/base44Client');
            const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
            if (profiles?.[0]?.id) await base44.entities.UserProfile.update(profiles[0].id, { is_premium: true });
          }
        } catch (dbErr) { console.warn('[IAP] DB restore update failed:', dbErr); }
        setStatusMessage('\u2705 Restored!');
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: true };
      }
      setStatusMessage(result.message || 'No subscription found');
      setTimeout(() => setStatusMessage(''), 3000);
      return { success: false };
    } catch (e) {
      setStatusMessage('Restore failed');
      return { success: false };
    }
  };

  return { products, loading, purchasing, error, statusMessage, purchase, restore, isNative: AppleStoreKitService.isNative() };
}
