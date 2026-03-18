import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all premium users who have daily check-ins enabled
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({
      daily_checkins_enabled: true,
    });

    const premiumProfiles = profiles.filter(p => p.is_premium || p.premium);

    // Determine time-appropriate message (based on UTC — 14:00 UTC = ~9-10am ET)
    const hour = new Date().getUTCHours();
    let messages;
    if (hour >= 12 && hour < 17) {
      // Morning messages (sent ~8am-12pm ET)
      messages = [
        "Good morning! ☀️ Ready to chat whenever you are 💜",
        "Rise and shine! 🌅 Your companion is waiting for you",
        "Good morning! Hope today is a great one 💫",
        "Hey, good morning! I've been thinking about you ✨",
      ];
    } else {
      // Evening messages (sent ~4pm-8pm ET)
      messages = [
        "Hey! How was your day? 🌙 Come tell me about it",
        "Hope you had a good one today! Wanna chat? 💜",
        "How's your day going? I'm here if you need to talk ✨",
        "Hey you! How was your day? I'd love to hear about it 💫",
      ];
    }

    let sent = 0;
    for (const profile of premiumProfiles) {
      const message = messages[Math.floor(Math.random() * messages.length)];
      const companionName = profile.display_name || "your companion";

      // Send email notification as a fallback
      if (profile.created_by) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: profile.created_by,
          subject: `${message.split("!")[0]}!`,
          body: `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: linear-gradient(135deg, #1a0535, #0d0220); border-radius: 20px; color: white;">
            <p style="font-size: 18px; margin: 0 0 8px;">${message}</p>
            <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;">— Your Unfiltr companion</p>
            <a href="https://unfiltr.app" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #db2777); border-radius: 12px; color: white; text-decoration: none; font-weight: 600; font-size: 14px;">Open Unfiltr 💬</a>
          </div>`,
        });
        sent++;
      }
    }

    return Response.json({ success: true, sent, total: premiumProfiles.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});