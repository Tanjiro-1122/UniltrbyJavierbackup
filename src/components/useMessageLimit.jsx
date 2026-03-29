import { useState, useEffect } from "react";

const FREE_LIMIT    = 20;
const MONTHLY_LIMIT = 100;
const ANNUAL_LIMIT  = 500;
const STORAGE_KEY   = "unfiltr_msg_usage";

function getTodayKey() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export function useMessageLimit(isPremium, isAnnual = false) {
  const [usedToday, setUsedToday] = useState(0);
  const [effectiveLimit, setEffectiveLimit] = useState(FREE_LIMIT);

  useEffect(() => {
    // Determine base limit
    let baseLimit = FREE_LIMIT;
    if (isPremium) {
      baseLimit = isAnnual ? ANNUAL_LIMIT : MONTHLY_LIMIT;
    }

    // Load bonus_messages from localStorage (admin grants)
    const bonus = parseInt(localStorage.getItem("unfiltr_bonus_messages") || "0", 10);
    const finalLimit = isNaN(bonus) || bonus <= 0 ? baseLimit : baseLimit + bonus;
    setEffectiveLimit(finalLimit);

    // Load message count from localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { date, count } = JSON.parse(raw);
        if (date === getTodayKey()) {
          setUsedToday(count);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count: 0 }));
          setUsedToday(0);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [isPremium, isAnnual]);

  const incrementCount = () => {
    const newCount = usedToday + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count: newCount }));
    setUsedToday(newCount);
  };

  const isAtLimit = usedToday >= effectiveLimit;
  const remaining = Math.max(0, effectiveLimit - usedToday);

  return { usedToday, remaining, isAtLimit, incrementCount, FREE_LIMIT: effectiveLimit, MONTHLY_LIMIT, ANNUAL_LIMIT };
}
