/**
 * storageManager.js
 * Manages localStorage size by enforcing circular buffer limits on growing data.
 * Prevents performance degradation on older devices from unbounded storage growth.
 */

const LIMITS = {
  chat_messages: 100,   // per session key (sessionStorage)
  journal_entries: 50,
  mood_history_days: 30, // keep 30 days of mood history
  chat_history_messages: 50, // unfiltr_chat_history — last N messages kept
  // chat_sessions retention per tier (mirrors CHAT_RETENTION_LIMITS in ChatPage)
  chat_sessions: { free: 2, plus: 20, pro: 100, annual: 9999, family: 9999 },
};

/**
 * Save chat messages for a session, keeping only the last N messages.
 * Uses sessionStorage (per-tab) to match the app's existing chat persistence pattern —
 * chat history is intentionally ephemeral and clears when the tab closes.
 * @param {string} key - sessionStorage key (e.g. "unfiltr_chat_messages")
 * @param {Array} messages - Full message array to store
 */
export function saveChatMessages(key, messages) {
  try {
    const trimmed = messages.slice(-LIMITS.chat_messages);
    sessionStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("[StorageManager] Failed to save chat messages:", e?.message);
  }
}

/**
 * Save journal entries, keeping only the most recent N entries.
 * @param {Array} entries - Full entries array
 */
export function saveJournalEntries(entries) {
  try {
    const trimmed = entries.slice(0, LIMITS.journal_entries);
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify(trimmed));
  } catch (e) {
    console.warn("[StorageManager] Failed to save journal entries:", e?.message);
  }
}

/**
 * Save a single journal entry, prepending to the list and enforcing limit.
 * @param {Object} entry - The new journal entry
 * @returns {Array} Updated entries array
 */
export function addJournalEntry(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    const updated = [entry, ...existing].slice(0, LIMITS.journal_entries);
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn("[StorageManager] Failed to add journal entry:", e?.message);
    return [entry];
  }
}

/**
 * Prune mood history to keep only the last N days.
 * Mood history is stored as { "YYYY-MM-DD": "mood" } — we drop old dates.
 */
export function pruneMoodHistory() {
  try {
    const raw = localStorage.getItem("unfiltr_mood_history");
    if (!raw) return;
    const history = JSON.parse(raw);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LIMITS.mood_history_days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const pruned = Object.fromEntries(
      Object.entries(history).filter(([date]) => date >= cutoffStr)
    );
    localStorage.setItem("unfiltr_mood_history", JSON.stringify(pruned));
  } catch (e) {
    console.warn("[StorageManager] Failed to prune mood history:", e?.message);
  }
}

/**
 * Estimate current localStorage usage in KB.
 * @returns {number} Approximate size in KB
 */
export function estimateStorageUsageKB() {
  try {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      const val = localStorage.getItem(key);
      if (val) total += key.length + val.length;
    }
    return Math.round((total * 2) / 1024); // UTF-16 = 2 bytes per char
  } catch {
    return 0;
  }
}

/**
 * Run all cleanup routines. Safe to call on every app load.
 */
export function runStorageCleanup() {
  pruneMoodHistory();
  pruneJournalEntries();
  pruneChatHistory();
  pruneChatSessions();
  const usageKB = estimateStorageUsageKB();
  if (usageKB > 2048) {
    console.warn(`[StorageManager] localStorage usage is high: ~${usageKB} KB`);
  }
}

/**
 * Ensure journal entries don't exceed the limit (in case they were written without the manager).
 */
function pruneJournalEntries() {
  try {
    const raw = localStorage.getItem("unfiltr_journal_entries");
    if (!raw) return;
    const entries = JSON.parse(raw);
    if (entries.length > LIMITS.journal_entries) {
      localStorage.setItem("unfiltr_journal_entries", JSON.stringify(entries.slice(0, LIMITS.journal_entries)));
    }
  } catch (e) {
    console.warn("[StorageManager] Failed to prune journal entries:", e?.message);
  }
}

/**
 * Trim unfiltr_chat_history to the last N messages to prevent unbounded growth.
 * This key accumulates the running chat transcript across sends.
 */
function pruneChatHistory() {
  try {
    const raw = localStorage.getItem("unfiltr_chat_history");
    if (!raw) return;
    const messages = JSON.parse(raw);
    if (Array.isArray(messages) && messages.length > LIMITS.chat_history_messages) {
      localStorage.setItem(
        "unfiltr_chat_history",
        JSON.stringify(messages.slice(-LIMITS.chat_history_messages))
      );
    }
  } catch (e) {
    console.warn("[StorageManager] Failed to prune chat history:", e?.message);
  }
}

/**
 * Trim unfiltr_chat_sessions to the per-tier retention limit.
 * Reads the current tier from localStorage flags (same logic as getTier() in entitlements.js)
 * so this module stays self-contained with no circular imports.
 */
function pruneChatSessions() {
  try {
    const raw = localStorage.getItem("unfiltr_chat_sessions");
    if (!raw) return;
    const sessions = JSON.parse(raw);
    if (!Array.isArray(sessions) || sessions.length === 0) return;

    // Determine current tier from localStorage flags (mirrors getTier() in entitlements.js)
    let tier = "free";
    if (localStorage.getItem("unfiltr_family_unlimited") === "true") tier = "family";
    else if (
      localStorage.getItem("unfiltr_family_unlock") === "true" ||
      localStorage.getItem("unfiltr_msg_limit_override") === "true" ||
      localStorage.getItem("unfiltr_is_annual") === "true"
    ) tier = "annual";
    else if (localStorage.getItem("unfiltr_is_pro")     === "true") tier = "pro";
    else if (localStorage.getItem("unfiltr_is_premium") === "true") tier = "plus";

    const limit = LIMITS.chat_sessions[tier] ?? 2;
    if (limit >= 9999) return; // no cap for unlimited tiers
    if (sessions.length > limit) {
      localStorage.setItem("unfiltr_chat_sessions", JSON.stringify(sessions.slice(0, limit)));
    }
  } catch (e) {
    console.warn("[StorageManager] Failed to prune chat sessions:", e?.message);
  }
}
