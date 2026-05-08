// Paid-user local draft recovery for crash/refresh/WebView-kill protection.
// This only restores unsent/unsaved text. It never bypasses message or journal limits.

const PREFIX = "unfiltr_recovery_";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function isDraftRecoveryEligible() {
  try {
    return localStorage.getItem("unfiltr_is_premium") === "true" ||
      localStorage.getItem("unfiltr_is_pro") === "true" ||
      localStorage.getItem("unfiltr_is_annual") === "true" ||
      localStorage.getItem("unfiltr_ultimate_friend") === "true" ||
      localStorage.getItem("unfiltr_family_unlimited") === "true" ||
      localStorage.getItem("unfiltr_family_unlock") === "true";
  } catch {
    return false;
  }
}

export function recoveryKey(area) {
  return `${PREFIX}${area}`;
}

export function saveRecoveryDraft(area, data) {
  if (!isDraftRecoveryEligible()) return;
  try {
    const text = typeof data === "string" ? data : (data?.text || data?.content || "");
    if (!String(text || "").trim()) {
      clearRecoveryDraft(area);
      return;
    }
    localStorage.setItem(recoveryKey(area), JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}

export function loadRecoveryDraft(area) {
  if (!isDraftRecoveryEligible()) return null;
  try {
    const raw = localStorage.getItem(recoveryKey(area));
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft?.savedAt || Date.now() - draft.savedAt > MAX_AGE_MS) {
      clearRecoveryDraft(area);
      return null;
    }
    return draft;
  } catch {
    clearRecoveryDraft(area);
    return null;
  }
}

export function clearRecoveryDraft(area) {
  try { localStorage.removeItem(recoveryKey(area)); } catch {}
}

export function formatDraftTime(savedAt) {
  try {
    if (!savedAt) return "recently";
    return new Date(savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "recently";
  }
}
