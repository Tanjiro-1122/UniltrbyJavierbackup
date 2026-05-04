import { useState, useEffect } from "react";

// Tier limits — must stay in sync with DAILY_MSG_LIMITS in api/_helpers.js
const FREE_DAILY       = 20;    // matches server-side DAILY_MSG_LIMITS.free
const PLUS_DAILY       = 100;   // $9.99/mo
const PRO_DAILY        = 200;   // $14.99/mo
const ANNUAL_DAILY     = 99999; // unlimited

const FREE_MONTHLY     = 300;   // 10/day × 30
const PLUS_MONTHLY     = 3000;  // 100/day × 30
const PRO_MONTHLY      = 6000;  // 200/day × 30
const ANNUAL_MONTHLY   = 99999; // unlimited

// SHARED daily key — used by both chat AND journal so they share the same 10/day limit
export const SHARED_DAILY_KEY = "unfiltr_daily_usage";
const MONTHLY_KEY      = "unfiltr_msg_monthly";

function getTodayKey()   { return new Date().toISOString().split("T")[0]; }
function getMonthKey()   { return new Date().toISOString().slice(0, 7); }

// Helper for journal (and any other page) to read/increment the shared daily counter
export function getSharedDailyUsage() {
  try {
    const raw = localStorage.getItem(SHARED_DAILY_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === getTodayKey() ? count : 0;
  } catch { return 0; }
}

export function incrementSharedDailyUsage() {
  const count = getSharedDailyUsage() + 1;
  localStorage.setItem(SHARED_DAILY_KEY, JSON.stringify({ date: getTodayKey(), count }));
}

export function useMessageLimit(isPremium, isAnnual = false, isPro = false) {
  const [usedToday,   setUsedToday]   = useState(0);
  const [usedMonth,   setUsedMonth]   = useState(0);
  const [dailyLimit,  setDailyLimit]  = useState(FREE_DAILY);
  const [monthlyLimit,setMonthlyLimit]= useState(FREE_MONTHLY);

  useEffect(() => {
    let daily   = FREE_DAILY;
    let monthly = FREE_MONTHLY;

    // Family/admin override — unlimited if flag is set in localStorage
    const hasOverride  = localStorage.getItem("unfiltr_msg_limit_override") === "true";
    const hasFamilyKey = localStorage.getItem("unfiltr_family_unlock") === "true";
    const lsPremium    = localStorage.getItem("unfiltr_is_premium") === "true";

    if (hasOverride || hasFamilyKey || isAnnual) {
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

    // Daily count — read from SHARED key
    try {
      const raw = localStorage.getItem(SHARED_DAILY_KEY);
      if (raw) {
        const { date, count } = JSON.parse(raw);
        if (date === getTodayKey()) {
          setUsedToday(count);
        } else {
          localStorage.setItem(SHARED_DAILY_KEY, JSON.stringify({ date: getTodayKey(), count: 0 }));
          setUsedToday(0);
        }
      }
    } catch { localStorage.removeItem(SHARED_DAILY_KEY); }

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
    // Increment shared daily counter
    const newDay = usedToday + 1;
    localStorage.setItem(SHARED_DAILY_KEY, JSON.stringify({ date: getTodayKey(), count: newDay }));
    setUsedToday(newDay);

    const newMonth = usedMonth + 1;
    localStorage.setItem(MONTHLY_KEY, JSON.stringify({ month: getMonthKey(), count: newMonth }));
    setUsedMonth(newMonth);
  };

  const isAtLimit   = usedToday >= dailyLimit || usedMonth >= monthlyLimit;
  const remaining   = Math.max(0, Math.min(dailyLimit - usedToday, monthlyLimit - usedMonth));
  const hitMonthly  = usedMonth >= monthlyLimit && monthlyLimit < ANNUAL_MONTHLY;

  return {
    usedToday, usedMonth, remaining, isAtLimit, hitMonthly,
    incrementCount,
    dailyLimit, monthlyLimit,
    // legacy named exports so existing callers don't break
    FREE_LIMIT: dailyLimit, MONTHLY_LIMIT: PLUS_MONTHLY, ANNUAL_LIMIT: ANNUAL_DAILY,
  };
}
