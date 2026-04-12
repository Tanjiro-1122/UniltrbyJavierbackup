import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { platform, receiptData, productId, purchaseToken } = await req.json();

    if (platform === 'ios') {
      const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');

      // Try production first, then sandbox
      let appleRes = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'receipt-data': receiptData, password: sharedSecret, 'exclude-old-transactions': true }),
      });
      let appleData = await appleRes.json();

      // Status 21007 means sandbox receipt sent to production — retry with sandbox
      if (appleData.status === 21007) {
        appleRes = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 'receipt-data': receiptData, password: sharedSecret, 'exclude-old-transactions': true }),
        });
        appleData = await appleRes.json();
      }

      if (appleData.status !== 0) {
        return Response.json({ valid: false, error: `Apple status: ${appleData.status}` });
      }

      const latestReceipts = appleData.latest_receipt_info || [];
      const activeReceipt = latestReceipts.find(r => {
        const expiresMs = parseInt(r.expires_date_ms);
        return expiresMs > Date.now();
      });

      if (!activeReceipt) {
        return Response.json({ valid: false, error: 'No active subscription found' });
      }

      const pid = activeReceipt.product_id || '';
      const isAnnual = pid.includes('annual');
      const isPro    = pid.includes('.pro') || pid.includes('_pro');
      const plan = isAnnual ? 'annual' : isPro ? 'pro' : 'monthly';
      return Response.json({ valid: true, plan, productId: pid });

    } else if (platform === 'android') {
      // Android: delegate to Google Play verification function
      const res = await base44.functions.invoke('verifyGooglePlayPurchase', { purchaseToken, productId });
      return Response.json(res.data);
    }

    return Response.json({ valid: false, error: 'Unknown platform' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});