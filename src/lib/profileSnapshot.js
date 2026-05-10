import { getTier } from '@/lib/entitlements';

const SNAPSHOT_VERSION = 1;
const DEFAULT_INTERVAL_MS = 45 * 1000;
let lastSnapshotJson = '';
let lastSavedAt = 0;
let inFlight = false;

function safeJsonParse(raw, fallback = null) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function readDailyUsage() {
  const raw = safeJsonParse(localStorage.getItem('unfiltr_daily_usage'), null);
  if (raw && typeof raw === 'object') {
    const now = Date.now();
    if (Array.isArray(raw.events)) {
      const events = raw.events.map(Number).filter(ts => Number.isFinite(ts) && now - ts < 24 * 60 * 60 * 1000);
      return {
        ...raw,
        events,
        count: events.length,
        resetAt: events[0] ? new Date(events[0] + 24 * 60 * 60 * 1000).toISOString() : null,
      };
    }
    return raw;
  }
  return {
    version: 2,
    windowMs: 24 * 60 * 60 * 1000,
    events: [],
    count: Number(localStorage.getItem('unfiltr_message_count_today') || 0) || 0,
    resetAt: null,
  };
}

function compact(value, maxLen = 20000) {
  if (value == null) return value;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return str.length > maxLen ? str.slice(0, maxLen) : value;
}

export function buildProfileSnapshot() {
  const tier = getTier();
  const chatAppearance = safeJsonParse(localStorage.getItem('unfiltr_chat_appearance'), {});
  const companion = safeJsonParse(localStorage.getItem('unfiltr_companion'), null);
  const env = safeJsonParse(localStorage.getItem('unfiltr_env'), null);
  const dailyUsage = readDailyUsage();

  return {
    version: SNAPSHOT_VERSION,
    saved_at: new Date().toISOString(),
    identity: {
      userProfileId: localStorage.getItem('userProfileId') || '',
      appleUserId: localStorage.getItem('unfiltr_apple_user_id') || localStorage.getItem('unfiltr_user_id') || '',
      googleUserId: localStorage.getItem('unfiltr_google_user_id') || '',
      email: localStorage.getItem('unfiltr_user_email') || localStorage.getItem('unfiltr_apple_email') || '',
      displayName: localStorage.getItem('unfiltr_display_name') || '',
      onboardingComplete: localStorage.getItem('unfiltr_onboarding_complete') === 'true',
      ageVerified: localStorage.getItem('unfiltr_age_verified') === 'true',
    },
    subscription: {
      tier,
      isPremium: localStorage.getItem('unfiltr_is_premium') === 'true',
      isAnnual: localStorage.getItem('unfiltr_is_annual') === 'true',
      isPro: localStorage.getItem('unfiltr_is_pro') === 'true',
      ultimateFriend: localStorage.getItem('unfiltr_ultimate_friend') === 'true',
      familyUnlimited: localStorage.getItem('unfiltr_family_unlimited') === 'true',
      familyUnlimitedExpiresAt: localStorage.getItem('unfiltr_family_unlimited_expires_at') || '',
    },
    usage: {
      dailyUsage,
      messageCount: Math.max(Number(localStorage.getItem('unfiltr_message_count') || 0) || 0, Number(localStorage.getItem('unfiltr_msg_total') || 0) || 0),
      bonusMessages: Number(localStorage.getItem('unfiltr_bonus_messages') || 0) || 0,
      photoUsage: safeJsonParse(localStorage.getItem('unfiltr_photo_usage'), null),
      journalUsage: safeJsonParse(localStorage.getItem('unfiltr_journal_usage'), null),
    },
    companion: {
      selectedCompanionId: localStorage.getItem('unfiltr_selected_companion_id') || localStorage.getItem('unfiltr_companion_id') || localStorage.getItem('companionId') || '',
      quizCompanionId: localStorage.getItem('unfiltr_quiz_companion_id') || '',
      nickname: localStorage.getItem('unfiltr_companion_nickname') || '',
      companion: compact(companion, 12000),
      background: localStorage.getItem('unfiltr_background') || '',
      env: compact(env, 8000),
      voiceGender: localStorage.getItem('unfiltr_voice_gender') || '',
      voicePersonality: localStorage.getItem('unfiltr_voice_personality') || '',
      relationshipMode: localStorage.getItem('unfiltr_relationship_mode') || '',
      personality: {
        vibe: localStorage.getItem('unfiltr_personality_vibe') || '',
        empathy: localStorage.getItem('unfiltr_personality_empathy') || '',
        style: localStorage.getItem('unfiltr_personality_style') || '',
        humor: localStorage.getItem('unfiltr_personality_humor') || '',
        curiosity: localStorage.getItem('unfiltr_personality_curiosity') || '',
      },
    },
    appearance: {
      chatAppearance: compact(chatAppearance, 10000),
      privacyTimeAwareness: localStorage.getItem('unfiltr_privacy_time_awareness') !== 'false',
    },
    memory: tier === 'free' ? {
      // Free users only get basic local recovery; rich memory remains a paid experience.
      userFacts: null,
      memorySummary: '',
    } : {
      userFacts: compact(safeJsonParse(localStorage.getItem('unfiltr_user_facts'), null), 20000),
      memorySummary: compact(localStorage.getItem('unfiltr_memory_summary') || '', 12000),
      sessionMemory: compact(safeJsonParse(localStorage.getItem('unfiltr_session_memory'), []), 20000),
      emotionalTimeline: compact(safeJsonParse(localStorage.getItem('unfiltr_emotional_timeline'), []), 20000),
      structuredMemory: compact(safeJsonParse(localStorage.getItem('unfiltr_structured_memory'), []), 20000),
      relationshipMilestones: compact(safeJsonParse(localStorage.getItem('unfiltr_relationship_milestones'), []), 12000),
      memoryUpdatedAt: localStorage.getItem('unfiltr_memory_updated_at') || '',
    },
  };
}

export function applyProfileSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  const id = snapshot.identity || {};
  const sub = snapshot.subscription || {};
  const comp = snapshot.companion || {};
  const app = snapshot.appearance || {};
  const mem = snapshot.memory || {};
  const usage = snapshot.usage || {};

  if (id.userProfileId) localStorage.setItem('userProfileId', id.userProfileId);
  if (id.appleUserId) {
    localStorage.setItem('unfiltr_apple_user_id', id.appleUserId);
    localStorage.setItem('unfiltr_user_id', id.appleUserId);
  }
  if (id.googleUserId) localStorage.setItem('unfiltr_google_user_id', id.googleUserId);
  if (id.email) localStorage.setItem('unfiltr_user_email', id.email);
  if (id.displayName) localStorage.setItem('unfiltr_display_name', id.displayName);
  if (id.onboardingComplete) localStorage.setItem('unfiltr_onboarding_complete', 'true');
  if (id.ageVerified) localStorage.setItem('unfiltr_age_verified', 'true');

  if (sub.isPremium) localStorage.setItem('unfiltr_is_premium', 'true');
  localStorage.setItem('unfiltr_is_annual', String(!!sub.isAnnual));
  localStorage.setItem('unfiltr_is_pro', String(!!sub.isPro));
  localStorage.setItem('unfiltr_ultimate_friend', String(!!sub.ultimateFriend));
  if (sub.familyUnlimited) localStorage.setItem('unfiltr_family_unlimited', 'true');
  if (sub.familyUnlimitedExpiresAt) localStorage.setItem('unfiltr_family_unlimited_expires_at', sub.familyUnlimitedExpiresAt);

  if (usage.dailyUsage) localStorage.setItem('unfiltr_daily_usage', JSON.stringify(usage.dailyUsage));
  if (usage.messageCount != null) localStorage.setItem('unfiltr_message_count', String(usage.messageCount));
  if (usage.bonusMessages != null) localStorage.setItem('unfiltr_bonus_messages', String(usage.bonusMessages));

  if (comp.selectedCompanionId) {
    localStorage.setItem('unfiltr_selected_companion_id', comp.selectedCompanionId);
    localStorage.setItem('unfiltr_companion_id', comp.selectedCompanionId);
    localStorage.setItem('companionId', comp.selectedCompanionId);
  }
  if (comp.nickname) localStorage.setItem('unfiltr_companion_nickname', comp.nickname);
  if (comp.companion) localStorage.setItem('unfiltr_companion', JSON.stringify(comp.companion));
  if (comp.background) localStorage.setItem('unfiltr_background', comp.background);
  if (comp.env) localStorage.setItem('unfiltr_env', JSON.stringify(comp.env));
  if (comp.voiceGender) localStorage.setItem('unfiltr_voice_gender', comp.voiceGender);
  if (comp.voicePersonality) localStorage.setItem('unfiltr_voice_personality', comp.voicePersonality);
  if (comp.relationshipMode) localStorage.setItem('unfiltr_relationship_mode', comp.relationshipMode);
  if (comp.personality) {
    Object.entries({
      unfiltr_personality_vibe: comp.personality.vibe,
      unfiltr_personality_empathy: comp.personality.empathy,
      unfiltr_personality_style: comp.personality.style,
      unfiltr_personality_humor: comp.personality.humor,
      unfiltr_personality_curiosity: comp.personality.curiosity,
    }).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
  }

  if (app.chatAppearance) localStorage.setItem('unfiltr_chat_appearance', JSON.stringify(app.chatAppearance));
  if (app.privacyTimeAwareness != null) localStorage.setItem('unfiltr_privacy_time_awareness', String(app.privacyTimeAwareness !== false));
  if (mem.userFacts) localStorage.setItem('unfiltr_user_facts', JSON.stringify(mem.userFacts));
  if (mem.memorySummary) localStorage.setItem('unfiltr_memory_summary', mem.memorySummary);
  if (mem.sessionMemory) localStorage.setItem('unfiltr_session_memory', JSON.stringify(mem.sessionMemory));
  if (mem.emotionalTimeline) localStorage.setItem('unfiltr_emotional_timeline', JSON.stringify(mem.emotionalTimeline));
  if (mem.structuredMemory) localStorage.setItem('unfiltr_structured_memory', JSON.stringify(mem.structuredMemory));
  if (mem.relationshipMilestones) localStorage.setItem('unfiltr_relationship_milestones', JSON.stringify(mem.relationshipMilestones));
  if (mem.memoryUpdatedAt) localStorage.setItem('unfiltr_memory_updated_at', mem.memoryUpdatedAt);

  window.dispatchEvent(new Event('unfiltr_auth_updated'));
  window.dispatchEvent(new Event('unfiltr_appearance_changed'));
}

export async function saveProfileSnapshot(reason = 'autosave', { force = false } = {}) {
  const profileId = localStorage.getItem('userProfileId');
  const appleUserId = localStorage.getItem('unfiltr_apple_user_id') || localStorage.getItem('unfiltr_user_id');
  if (!profileId || !appleUserId || inFlight) return false;

  const snapshot = buildProfileSnapshot();
  const json = JSON.stringify(snapshot);
  const now = Date.now();
  if (!force && json === lastSnapshotJson && now - lastSavedAt < DEFAULT_INTERVAL_MS) return false;

  inFlight = true;
  try {
    const updateData = {
      last_seen: snapshot.saved_at,
      last_active: snapshot.saved_at,
      display_name: snapshot.identity.displayName,
      companion_id: snapshot.companion.selectedCompanionId || undefined,
      companion_nickname: snapshot.companion.nickname || undefined,
      is_premium: snapshot.subscription.isPremium,
      annual_plan: snapshot.subscription.isAnnual || snapshot.subscription.ultimateFriend,
      pro_plan: snapshot.subscription.isPro,
      ultimate_friend: snapshot.subscription.ultimateFriend,
      message_count: snapshot.usage.messageCount,
      profile_snapshot: snapshot,
      snapshot_updated_at: snapshot.saved_at,
      memory_summary: snapshot.memory?.memorySummary || undefined,
      user_facts: snapshot.memory?.userFacts || undefined,
      session_memory: snapshot.memory?.sessionMemory || undefined,
      emotional_timeline: snapshot.memory?.emotionalTimeline || undefined,
      structured_memory: snapshot.memory?.structuredMemory || undefined,
      relationship_milestones: snapshot.memory?.relationshipMilestones || undefined,
      memory_updated_at: snapshot.memory?.memoryUpdatedAt || snapshot.saved_at,
      snapshot_reason: reason,
    };
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    let resp = await fetch('/api/syncProfile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', profileId, appleUserId, updateData }),
    });

    // Some older UserProfile schemas may reject the flexible profile_snapshot object.
    // If that happens, retry with only stable top-level fields so autosave never breaks.
    if (!resp.ok && updateData.profile_snapshot) {
      const fallbackData = { ...updateData };
      delete fallbackData.profile_snapshot;
      delete fallbackData.snapshot_reason;
      resp = await fetch('/api/syncProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', profileId, appleUserId, updateData: fallbackData }),
      });
    }

    if (!resp.ok) throw new Error(`snapshot save ${resp.status}`);
    lastSnapshotJson = json;
    lastSavedAt = now;
    localStorage.setItem('unfiltr_last_snapshot_at', snapshot.saved_at);
    return true;
  } catch (e) {
    console.warn('[ProfileSnapshot] save failed:', e.message);
    return false;
  } finally {
    inFlight = false;
  }
}

export function startProfileSnapshotAutosave(intervalMs = DEFAULT_INTERVAL_MS) {
  const save = (reason, force = false) => saveProfileSnapshot(reason, { force });
  const timer = setInterval(() => save('interval'), intervalMs);

  const onImportantChange = () => save('important_change');
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') save('app_backgrounded', true);
  };
  const onPageHide = () => save('page_hide', true);

  window.addEventListener('unfiltr_auth_updated', onImportantChange);
  window.addEventListener('unfiltr_premium_updated', onImportantChange);
  window.addEventListener('unfiltr_appearance_changed', onImportantChange);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  save('start', true);
  return () => {
    clearInterval(timer);
    window.removeEventListener('unfiltr_auth_updated', onImportantChange);
    window.removeEventListener('unfiltr_premium_updated', onImportantChange);
    window.removeEventListener('unfiltr_appearance_changed', onImportantChange);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
  };
}
