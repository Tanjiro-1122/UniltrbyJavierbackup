import { useEffect, useState } from 'react';
import { AppleStoreKitService } from '@/components/api/appleStoreKitService';
import { base44 } from '@/api/base44Client';

export function useAppleSubscriptions() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await AppleStoreKitService.getProducts();
      setProducts(result);
    } catch (e) {
      console.error('Failed to load products:', e);
      setError('Could not load subscription options.');
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
        setStatusMessage('Purchase cancelled.');
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: false, cancelled: true };
      }

      if (!result.isSuccess) {
        setError(result.error || 'Purchase failed. Please try again.');
        return { success: false };
      }

      if (result.isMock) {
        setStatusMessage('✅ Purchase successful!');
        // In mock/web mode, mark as upgraded directly
        const profileId = localStorage.getItem("userProfileId");
        if (profileId) {
          try { await base44.entities.UserProfile.update(profileId, { is_premium: true, premium: true }); } catch {}
        }
        return { success: true, mock: true };
      }

      setStatusMessage('Verifying purchase...');
      const response = await base44.functions.invoke('handleAppleIAP', {
        receipt: result.receiptData,
        productId,
      });

      if (response?.data?.success) {
        setStatusMessage('🎉 You are now Premium!');
        return { success: true };
      } else {
        throw new Error(response?.data?.error || 'Verification failed');
      }

    } catch (e) {
      console.error('Purchase error:', e);
      setError('Something went wrong. Please contact support.');
      return { success: false };
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    try {
      setStatusMessage('Restoring purchases...');
      const result = await AppleStoreKitService.restorePurchases();

      if (result.isSuccess) {
        // Update DB so premium is actually unlocked
        const profileId = localStorage.getItem("userProfileId");
        if (profileId) {
          try {
            const isAnnual = result.productId?.includes('annual') ?? false;
            await base44.entities.UserProfile.update(profileId, {
              is_premium: true,
              premium: true,
              annual_plan: isAnnual,
            });
            localStorage.setItem("unfiltr_is_premium", "true");
          } catch (dbErr) {
            console.error('[Restore] DB update failed:', dbErr);
          }
        }
        setStatusMessage('✅ Purchases restored! Premium unlocked.');
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: true };
      } else {
        setStatusMessage('No previous purchases found.');
        setTimeout(() => setStatusMessage(''), 4000);
        return { success: false };
      }
    } catch (e) {
      console.error('[Restore] Error:', e);
      setStatusMessage('Restore failed. Please try again.');
      setTimeout(() => setStatusMessage(''), 4000);
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
  };
}