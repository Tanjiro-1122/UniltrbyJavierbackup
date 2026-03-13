import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purchaseToken, packageName, productId } = await req.json();

    // Verify with Google Play Billing Library
    // In production, you'd verify this with Google's API
    // For now, store the purchase token and mark user as premium
    
    await base44.auth.updateMe({
      premium: true,
      googlePlayPurchaseToken: purchaseToken,
      subscriptionProduct: productId,
      subscriptionStartDate: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      message: 'Premium subscription activated',
      premium: true 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});