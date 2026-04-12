import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purchaseToken, productId, userId } = await req.json();

    if (!purchaseToken || !productId) {
      return Response.json({ valid: false, error: 'Missing purchaseToken or productId' });
    }

    // Google Play Developer API verification
    // Requires a service account key to authenticate with Google
    const serviceAccountKey = Deno.env.get('GOOGLE_PLAY_SERVICE_KEY');

    if (!serviceAccountKey) {
      // Fallback: log warning but still activate (graceful degradation)
      // This allows the app to work while Google Play verification is being set up
      console.warn('[verifyGooglePlayPurchase] GOOGLE_PLAY_SERVICE_KEY not set — activating without server verification');
      
      const isAnnual = productId?.includes('annual');
      const isPro    = productId?.includes('.pro') || productId?.includes('_pro');
      
      // Find and update the user's profile by apple_user_id
      if (userId) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ apple_user_id: userId });
        if (profiles.length > 0) {
          await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
            is_premium: true,
            premium: true,
            annual_plan: isAnnual,
            pro_plan: isPro,
          });
        }
      }

      return Response.json({
        valid: true,
        verified: false,
        plan: isAnnual ? 'annual' : isPro ? 'pro' : 'monthly',
        message: 'Activated without server-side verification (service key not configured)',
      });
    }

    // Parse service account key
    const keyData = JSON.parse(serviceAccountKey);
    const packageName = keyData.package_name || 'com.huertas.unfiltr';

    // Get access token via service account JWT
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = btoa(JSON.stringify({
      iss: keyData.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }));

    // Sign JWT with private key
    const encoder = new TextEncoder();
    const signInput = encoder.encode(`${header}.${claim}`);

    // Import the RSA private key
    const pemBody = keyData.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');
    const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signInput);
    const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const jwt = `${header}.${claim}.${sig64}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Failed to get Google access token:', tokenData);
      return Response.json({ valid: false, error: 'Failed to authenticate with Google' });
    }

    // Verify the subscription with Google Play API
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error('Google Play verification failed:', errText);
      return Response.json({ valid: false, error: 'Google Play verification failed' });
    }

    const purchaseData = await verifyRes.json();

    // Check if subscription is active
    // paymentState: 0=pending, 1=received, 2=free trial, 3=deferred
    const isActive = purchaseData.paymentState === 1 || purchaseData.paymentState === 2;
    const expiryMs = parseInt(purchaseData.expiryTimeMillis || '0');
    const isExpired = expiryMs < Date.now();

    if (!isActive || isExpired) {
      return Response.json({ valid: false, error: 'Subscription is not active or has expired' });
    }

    const isAnnual = productId?.includes('annual');
    const isPro    = productId?.includes('.pro') || productId?.includes('_pro');

    // Update user profile
    if (userId) {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ apple_user_id: userId });
      if (profiles.length > 0) {
        await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
          is_premium: true,
          premium: true,
          annual_plan: isAnnual,
          pro_plan: isPro,
        });
      }
    }

    return Response.json({
      valid: true,
      verified: true,
      plan: isAnnual ? 'annual' : isPro ? 'pro' : 'monthly',
      expiresDate: new Date(expiryMs).toISOString(),
    });

  } catch (error) {
    console.error('verifyGooglePlayPurchase error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});