import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ADMIN_PASSCODE = 'unfiltr1122';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Check admin by role, display name, or passcode
    let isAdmin = user.role === 'admin';

    if (!isAdmin && body.passcode === ADMIN_PASSCODE) {
      isAdmin = true;
    }

    if (!isAdmin) {
      // Check UserProfile display_name as fallback
      try {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: user.email });
        const profile = profiles?.[0];
        if (profile?.display_name === 'Javier 1122') {
          isAdmin = true;
        }
      } catch (e) {
        // If profile check fails, continue with other checks
      }
    }

    if (!isAdmin) {
      return Response.json({ error: 'Forbidden', needsPasscode: true }, { status: 403 });
    }

    // Use service role to access User entity (requires admin privileges)
    const [users, allProfiles, recentMessages] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.UserProfile.list(),
      base44.asServiceRole.entities.Message.list('-created_date', 50),
    ]);

    const premiumCount = allProfiles.filter(p => p.premium || p.is_premium).length;
    const today = new Date().toISOString().split('T')[0];
    const todayMessages = recentMessages.filter(m => m.created_date?.startsWith(today));

    const recentUsers = [...users]
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 8)
      .map(u => ({ id: u.id, full_name: u.full_name, email: u.email, created_date: u.created_date }));

    return Response.json({
      totalUsers: users.length,
      totalProfiles: allProfiles.length,
      premiumUsers: premiumCount,
      todayMessages: todayMessages.length,
      recentUsers,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});