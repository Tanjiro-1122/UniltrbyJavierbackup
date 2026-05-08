import { useState, useEffect } from "react";

// Tier limits — must stay in sync with DAILY_MSG_LIMITS in api/_helpers.js
const FREE_DAILY       = 10;    // free rolling 24-hour window
const PLUS_DAILY       = 100;   // $9.99/mo
const PRO_DAILY        = 200;   // $14.99/mo
const ANNUAL_DAILY     = 99999; // unlimited

const FREE_MONTHLY     = 300;   // rough monthly safety cap
const PLUS_MONTHLY     = 3000;  // 100/day × 30
const PRO_MONTHLY      = 6000;  // 200/day × 30
const ANNUAL_MONTHLY   = 99999; // unlimited

const ROLLING_24H_MS   = 24 * 60 * 60 * 1000;

// SHARED usage key — used by both chat AND journal so they share the same free 10/24h limit
export const SHARED_DAILY_KEY = "unfiltr_daily_usage";
const MONTHLY_KEY      = "unfiltr_msg_monthly";

function getMonthKey() { return new Date().toISOString().slice(0, 7); }
function nowMs() { return Date.now(); }

function normalizeRollingUsage(raw, now = nowMs()) {
  if (!raw) {
    return { version: 2, windowMs: ROLLING_24H_MS, events: [], count: 0, resetAt: null };
  }

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    // New format: exact rolling window using per-use timestamps.
    if (Array.isArray(parsed?.events)) {
      const events = parsed.events
        .map(n => Number(n))
        .filter(ts => Number.isFinite(ts) && now - ts < ROLLING_24H_MS)
        .sort((a, b) => a - b);
      return {
        version: 2,
        windowMs: ROLLING_24H_MS,
        events,
        count: events.length,
        firstUsedAt: events[0] || null,
        resetAt: events[0] ? new Date(events[0] + ROLLING_24H_MS).toISOString() : null,
      };
    }

    // Legacy format was { date: YYYY-MM-DD, count }. Migrate conservatively:
    // if there was a same-day count, treat it as already used in the current 24h window
    // so users cannot get a midnight reset during migration.
    const legacyCount = Number(parsed?.count || 0);
    if (legacyCount > 0) {
      const count = Math.max(0, Math.min(legacyCount, PRO_DAILY));
      const anchor = Number(parsed?.windowStartedAt || parsed?.firstUsedAt || now);
      const events = Array.from({ length: count }, () => anchor).filter(ts => now - ts < ROLLING_24H_MS);
      return {
        version: 2,
        windowMs: ROLLING_24H_MS,
        events,
        count: events.length,
        firstUsedAt: events[0] || null,
        resetAt: events[0] ? new Date(events[0] + ROLLING_24H_MS).toISOString() : null,
        migratedFrom: "calendar_day",
      };
    }
  } catch {}

  return { version: 2, windowMs: ROLLING_24H_MS, events: [], count: 0, resetAt: null };
}

function saveRollingUsage(usage) {
  localStorage.setItem(SHARED_DAILY_KEY, JSON.stringify({
    version: 2,
    windowMs: ROLLING_24H_MS,
    events: usage.events || [],
    count: (usage.events || []).length,
    firstUsedAt: usage.events?.[0] || null,
    resetAt: usage.events?.[0] ? new Date(usage.events[0] + ROLLING_24H_MS).toISOString() : null,
    updatedAt: new Date().toISOString(),
  }));
}

export function getSharedDailyUsageDetails() {
  const usage = normalizeRollingUsage(localStorage.getItem(SHARED_DAILY_KEY));
  saveRollingUsage(usage); // persist migration/pruning
  return usage;
}

// Helper for journal (and any other page) to read the shared rolling 24h counter
export function getSharedDailyUsage() {
  return getSharedDailyUsageDetails().count || 0;
}

export function incrementSharedDailyUsage() {
  const usage = getSharedDailyUsageDetails();
  const events = [...(usage.events || []), nowMs()];
  saveRollingUsage({ ...usage, events });
}

export function useMessageLimit(isPremium, isAnnual = false, isPro = false) {
  const [usedToday,   setUsedToday]   = useState(0);
  const [usedMonth,   setUsedMonth]   = useState(0);
  const [dailyLimit,  setDailyLimit]  = useState(FREE_DAILY);
  const [monthlyLimit,setMonthlyLimit]= useState(FREE_MONTHLY);
  const [resetAt,     setResetAt]     = useState(null);

  useEffect(() => {
    let daily   = FREE_DAILY;
    let monthly = FREE_MONTHLY;

    // Family/admin/Ultimate override — unlimited if flag is set in localStorage
    const hasOverride  = localStorage.getItem("unfiltr_msg_limit_override") === "true";
    const hasFamilyKey = localStorage.getItem("unfiltr_family_unlock") === "true";
    const isUltimate   = localStorage.getItem("unfiltr_ultimate_friend") === "true";
    const isFamily     = localStorage.getItem("unfiltr_family_unlimited") === "true";
    const lsPremium    = localStorage.getItem("unfiltr_is_premium") === "true";

    if (hasOverride || hasFamilyKey || isFamily || isUltimate || isAnnual) {
      daily   = ANNUAL_DAILY;
      monthly = ANNUAL_MONTHLY;
    } else if (isPro) {
      daily   = PRO_DAILY;
      monthly = PRO_MONTHLY;
    } else if (isPremium || lsPremium) {
      daily   = PLUS_DAILY;
      monthly = PLUS_MONTHLY;
    }

    // Bonus messages (admin grants)
    const bonus = parseInt(localStorage.getItem("unfiltr_bonus_messages") || "0", 10);
    if (!isNaN(bonus) && bonus > 0 && daily < ANNUAL_DAILY) daily += bonus;

    setDailyLimit(daily);
    setMonthlyLimit(monthly);

    // Rolling 24-hour count — read from SHARED key. This intentionally does NOT
    // reset at midnight, preventing 11:50 PM → 12:00 AM double-dipping.
    try {
      const usage = getSharedDailyUsageDetails();
      setUsedToday(usage.count || 0);
      setResetAt(usage.resetAt || null);
    } catch {
      localStorage.removeItem(SHARED_DAILY_KEY);
      setUsedToday(0);
      setResetAt(null);
    }

    // Monthly count
    try {
      const raw = localStorage.getItem(MONTHLY_KEY);
      if (raw) {
        const { month, count } = JSON.parse(raw);
        if (month === getMonthKey()) {
          setUsedMonth(count);
        } else {
          localStorage.setItem(MONTHLY_KEY, JSON.stringify({ month: getMonthKey(), count: 0 }));
          setUsedMonth(0);
        }
      }
    } catch { localStorage.removeItem(MONTHLY_KEY); }

  }, [isPremium, isAnnual, isPro]);

  const incrementCount = () => {
    incrementSharedDailyUsage();
    const usage = getSharedDailyUsageDetails();
    setUsedToday(usage.count || 0);
    setResetAt(usage.resetAt || null);

    const newMonth = usedMonth + 1;
    localStorage.setItem(MONTHLY_KEY, JSON.stringify({ month: getMonthKey(), count: newMonth }));
    setUsedMonth(newMonth);
  };

  // Fix 2 – Zombie Timer (web side): when the iOS wrapper resumes from background,
  // native sends APP_BECAME_ACTIVE. We re-read localStorage so the rolling counter
  // reflects reality — JS timers freeze while backgrounded, leaving state stale.
  useEffect(() => {
    const handler = (e) => {
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!msg || msg.type !== "APP_BECAME_ACTIVE") return;
        const usage = getSharedDailyUsageDetails();
        setUsedToday(usage.count || 0);
        setResetAt(usage.resetAt || null);
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const isAtLimit   = usedToday >= dailyLimit || usedMonth >= monthlyLimit;
  const remaining   = Math.max(0, Math.min(dailyLimit - usedToday, monthlyLimit - usedMonth));
  const hitMonthly  = usedMonth >= monthlyLimit && monthlyLimit < ANNUAL_MONTHLY;

  return {
    usedToday, usedMonth, remaining, isAtLimit, hitMonthly,
    incrementCount,
    dailyLimit, monthlyLimit,
    resetAt,
    rollingWindowHours: 24,
    // legacy named exports so existing callers don't break
    FREE_LIMIT: dailyLimit, MONTHLY_LIMIT: PLUS_MONTHLY, ANNUAL_LIMIT: ANNUAL_DAILY,
  };
}
