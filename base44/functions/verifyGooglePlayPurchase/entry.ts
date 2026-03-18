import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purchaseToken, productId } = await req.json();

    if (!purchaseToken || !productId) {
      return Response.json({ valid: false, error: 'Missing purchaseToken or productId' });
    }

    // Google Play Developer API verification
    // Uses service account credentials to validate the purchase server-side
    const packageName = 'com.huertas.unfiltr';

    // Get access token via service account (if configured)
    const googleClientEmail = Deno.env.get('GOOGLE_PLAY_CLIENT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_PLAY_PRIVATE_KEY');

    if (!googleClientEmail || !googlePrivateKey) {
      // Fallback: trust the client purchase for now but log warning
      console.warn('Google Play service account not configured — trusting client purchase');

      const profileId = localStorage?.getItem?.('userProfileId');
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        const isAnnual = productId?.includes('annual');
        await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
          is_premium: true,
          annual_plan: isAnnual,
        });
      }

      return Response.json({
        valid: true,
        plan: productId?.includes('annual') ? 'annual' : 'monthly',
        productId,
        verified_server_side: false,
      });
    }

    // Build JWT for Google API authentication
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      iss: googleClientEmail,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }));

    // Sign with private key
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(googlePrivateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(`${header}.${payload}`)
    );
    const jwt = `${header}.${payload}.${arrayBufferToBase64Url(signature)}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Failed to get Google access token:', tokenData);
      return Response.json({ valid: false, error: 'Failed to authenticate with Google Play' });
    }

    // Verify subscription with Google Play Developer API
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.error) {
      console.error('Google Play verification failed:', verifyData);
      return Response.json({ valid: false, error: 'Subscription verification failed' });
    }

    // Check if subscription is active
    const expiryTimeMs = parseInt(verifyData.expiryTimeMillis, 10);
    const isActive = expiryTimeMs > Date.now();

    if (!isActive) {
      return Response.json({ valid: false, error: 'Subscription expired' });
    }

    // Update user profile
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: user.email });
    if (profiles.length > 0) {
      const isAnnual = productId?.includes('annual');
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
        is_premium: true,
        annual_plan: isAnnual,
      });
    }

    return Response.json({
      valid: true,
      plan: productId?.includes('annual') ? 'annual' : 'monthly',
      productId,
      expiresDate: new Date(expiryTimeMs).toISOString(),
      verified_server_side: true,
    });

  } catch (error) {
    console.error('Google Play verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN.*?-----/g, '').replace(/-----END.*?-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}