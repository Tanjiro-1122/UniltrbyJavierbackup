import { base44 } from "@/api/base44Client";

export const callNativeIAPWithCallback = async (iapConfig, callback) => {
  console.log('Initiating native IAP with config:', JSON.stringify(iapConfig));
  
  if (!window.WTN) {
    console.error('window.WTN is not available');
    callback({ isSuccess: false, error: 'Native bridge not available' });
    return;
  }
  
  if (typeof window.WTN.inAppPurchase !== 'function') {
    console.error('window.WTN.inAppPurchase is not a function.');
    callback({ isSuccess: false, error: 'IAP not available' });
    return;
  }

  try {
    let callbackCalled = false;
    
    window.WTN.inAppPurchase(iapConfig, (result) => {
      if (callbackCalled) return;
      callbackCalled = true;
      console.log('Native IAP callback received:', JSON.stringify(result));
      
      if (!result.isSuccess && !result.receiptData && !result.purchaseToken) {
        const errorStr = (result.error || '').toLowerCase();
        const isCancelled = 
          result.isCancelled === true ||
          result.status === 'cancelled' ||
          errorStr.includes('cancel') ||
          errorStr.includes('user') ||
          errorStr === '' ||
          result.error === undefined;
        
        if (isCancelled) {
          callback({ isSuccess: false, error: 'user_cancelled', isCancelled: true });
          return;
        }
      }
      
      callback(result);
    });
    
  } catch (error) {
    console.error('Error calling native inAppPurchase function:', error);
    callback({ isSuccess: false, error: error.message || 'Native call failed' });
  }
};

export const submitReceiptToServer = async (receiptData) => {
  console.log('Submitting receipt to server:', receiptData);
  try {
    const response = await base44.functions.invoke('handleAppleIAP', {
      receipt: receiptData.receipt,
      productId: receiptData.productId,
    });

    if (response.data.success) {
      console.log('Receipt validated successfully.');
    } else {
      throw new Error(response.data.error || 'Receipt validation failed.');
    }

  } catch (error) {
    console.error('Failed to submit receipt to server:', error);
    alert('There was a problem verifying your purchase. Please contact support if the issue persists.');
  }
};