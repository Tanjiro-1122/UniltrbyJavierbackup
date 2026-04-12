import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

const PRODUCT_MAPPING = {
  'com.huertas.unfiltr.pro.monthly':  'premium_monthly',
  'com.huertas.unfiltr.tier.pro':     'premium_pro',
  'com.huertas.unfiltr.pro.annual':   'premium_annual',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receipt, productId, appleUserId } = body;

    if (!receipt) {
      return Response.json({ error: 'No receipt provided' }, { status: 400 });
    }
    if (!appleUserId) {
      return Response.json({ error: 'appleUserId is required' }, { status: 400 });
    }

    const validationResult = await validateReceipt(receipt);

    if (!validationResult.success) {
      return Response.json({ error: 'Receipt validation failed', details: validationResult.error }, { status: 400 });
    }

    const subscriptionType = PRODUCT_MAPPING[validationResult.productId];
    if (!subscriptionType) {
      return Response.json({ error: 'Unknown product ID', productId: validationResult.productId }, { status: 400 });
    }

    // Lookup by apple_user_id (the device's Apple Sign-In ID set during onboarding)
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ apple_user_id: appleUserId });
    if (profiles.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
        is_premium: true,
        annual_plan: subscriptionType === 'premium_annual',
        pro_plan: subscriptionType === 'premium_pro',
      });
    } else {
      console.warn('[handleAppleIAP] No UserProfile found for apple_user_id:', appleUserId);
    }

    return Response.json({
      success: true,
      subscriptionType,
      expiresDate: validationResult.expiresDate,
    });

  } catch (error) {
    console.error('Apple IAP Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function validateReceipt(receiptData) {
  try {
    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');

    if (!sharedSecret) {
      return { success: false, error: 'APPLE_SHARED_SECRET not configured' };
    }

    async function callApple(url) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          password: sharedSecret,
          'exclude-old-transactions': false,
        }),
      });
      return res.json();
    }

    let result = await callApple(PRODUCTION_URL);
    if (result.status === 21007) {
      result = await callApple(SANDBOX_URL);
    }

    if (result.status !== 0) {
      return { success: false, error: `Apple validation failed with status ${result.status}` };
    }

    const purchases = [...(result.latest_receipt_info || []), ...(result.receipt?.in_app || [])];
    if (!purchases.length) {
      return { success: false, error: 'No purchases found in receipt' };
    }

    purchases.sort((a, b) => {
      const aTime = parseInt(a.expires_date_ms || a.purchase_date_ms || '0', 10);
      const bTime = parseInt(b.expires_date_ms || b.purchase_date_ms || '0', 10);
      return bTime - aTime;
    });

    const matched = purchases[0];

    return {
      success: true,
      productId: matched.product_id,
      transactionId: matched.transaction_id,
      expiresDate: matched.expires_date_ms
        ? new Date(parseInt(matched.expires_date_ms, 10)).toISOString()
        : null,
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
