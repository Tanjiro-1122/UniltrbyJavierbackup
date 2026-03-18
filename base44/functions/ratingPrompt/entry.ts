import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json();

    // Only prompt once — check a flag in UserProfile
    const profile = await base44.asServiceRole.entities.UserProfile.get(profileId);
    if (profile?.rating_prompted) {
      return Response.json({ should_prompt: false });
    }

    // Mark as prompted
    await base44.asServiceRole.entities.UserProfile.update(profileId, { rating_prompted: true });

    return Response.json({ should_prompt: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});