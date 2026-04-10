/**
 * storageManager.js
 * Manages localStorage size by enforcing circular buffer limits on growing data.
 * Prevents performance degradation on older devices from unbounded storage growth.
 */

const LIMITS = {
  chat_messages: 100,   // per session key
  journal_entries: 50,
  mood_history_days: 30, // keep 30 days of mood history
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
