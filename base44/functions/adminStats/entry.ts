import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ADMIN_DISPLAY_NAME = 'Javier 1122';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse the profileId from the request body
    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId;

    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 });
    }

    // Verify admin by checking the profile display name using service role
    const profile = await base44.asServiceRole.entities.UserProfile.get(profileId);
    if (!profile || profile.display_name !== ADMIN_DISPLAY_NAME) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all data in parallel using service role
    const [users, allProfiles, recentMessages, journalEntries, errorLogs] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.UserProfile.list(),
      base44.asServiceRole.entities.Message.list('-created_date', 50),
      base44.asServiceRole.entities.JournalEntry.list('-created_date', 50),
      base44.asServiceRole.entities.ErrorLog.list('-created_date', 20),
    ]);

    // Deduplicate profiles by email
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

    const recentErrors = errorLogs.map(e => ({
      id: e.id,
      type: e.error_type,
      severity: e.severity,
      source: e.function_name,
      message: e.error_message?.slice(0, 200),
      date: e.created_date,
    }));

    return Response.json({
      totalUsers: users.length,
      totalProfiles: uniqueProfiles.length,
      premiumUsers: premiumCount,
      todayMessages: todayMessages.length,
      totalJournalEntries: journalEntries.length,
      recentUsers,
      recentErrors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});