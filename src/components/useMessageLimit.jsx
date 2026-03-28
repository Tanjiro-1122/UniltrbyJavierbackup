import { useState, useEffect } from "react";

const FREE_LIMIT = 20;
const STORAGE_KEY = "unfiltr_msg_usage";

function getTodayKey() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export function useMessageLimit(isPremium) {
  const [usedToday, setUsedToday] = useState(0);
  // Effective limit: base 20 + any bonus_messages granted by admin
  const [effectiveLimit, setEffectiveLimit] = useState(FREE_LIMIT);

  useEffect(() => {
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

    // Load bonus_messages from localStorage (set when profile loads)
    const bonus = parseInt(localStorage.getItem("unfiltr_bonus_messages") || "0", 10);
    if (!isNaN(bonus) && bonus > 0) {
      setEffectiveLimit(FREE_LIMIT + bonus);
    }
  }, []);

  const incrementCount = () => {
    if (isPremium) return;
    const newCount = usedToday + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count: newCount }));
    setUsedToday(newCount);
  };

  const isAtLimit = !isPremium && usedToday >= effectiveLimit;
  const remaining = isPremium ? Infinity : Math.max(0, effectiveLimit - usedToday);

  return { usedToday, remaining, isAtLimit, incrementCount, FREE_LIMIT: effectiveLimit };
}
