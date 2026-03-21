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

    // Check admin access: passcode or display name "Javier 1122"
    let isAdmin = false;

    if (body.passcode && body.passcode.toLowerCase() === ADMIN_PASSCODE.toLowerCase()) {
      isAdmin = true;
    }

    if (!isAdmin) {
      // Check UserProfile display_name
      try {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: user.email });
        const profile = profiles?.[0];
        if (profile?.display_name === 'Javier 1122') {
          isAdmin = true;
        }
      } catch (e) {
        // If profile check fails, continue
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

    // Count unique premium users (by created_by email, not duplicate profiles)
    const seenEmails = new Set();
    const uniqueProfiles = [];
    for (const p of allProfiles) {
      if (p.created_by && !seenEmails.has(p.created_by)) {
        seenEmails.add(p.created_by);
        uniqueProfiles.push(p);
      }
    }
    const premiumCount = uniqueProfiles.filter(p => p.premium || p.is_premium).length;
    const today = new Date().toISOString().split('T')[0];
    const todayMessages = recentMessages.filter(m => m.created_date?.startsWith(today));

    const recentUsers = [...users]
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 8)
      .map(u => ({ id: u.id, full_name: u.full_name, email: u.email, created_date: u.created_date }));

    return Response.json({
      totalUsers: users.length,
      totalProfiles: uniqueProfiles.length,
      premiumUsers: premiumCount,
      todayMessages: todayMessages.length,
      recentUsers,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});