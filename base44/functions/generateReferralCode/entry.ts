import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Skip server-side auth.me() check — causes false 401s on mobile.
    // base44.functions.invoke() on frontend already requires a logged-in user.

    const { profileId } = await req.json();
    const profile = await base44.asServiceRole.entities.UserProfile.get(profileId);

    // Return existing code if already generated
    if (profile?.referral_code) {
      return Response.json({
        code: profile.referral_code,
        referral_count: profile.referral_count || 0,
        bonus_messages: (profile.referral_count || 0) * 50,
      });
    }

    // Generate a new unique code
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `UNFILTR-${suffix}`;

    await base44.asServiceRole.entities.UserProfile.update(profileId, {
      referral_code: code,
      referral_count: 0,
    });

    return Response.json({ code, referral_count: 0, bonus_messages: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});