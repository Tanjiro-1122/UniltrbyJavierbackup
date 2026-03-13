import { useState, useEffect } from "react";

const FREE_LIMIT = 20;
const STORAGE_KEY = "unfiltr_msg_usage";

function getTodayKey() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export function useMessageLimit(isPremium) {
  const [usedToday, setUsedToday] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { date, count } = JSON.parse(raw);
      if (date === getTodayKey()) {
        setUsedToday(count);
      } else {
        // New day — reset
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count: 0 }));
        setUsedToday(0);
      }
    }
  }, []);

  const incrementCount = () => {
    if (isPremium) return;
    const newCount = usedToday + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count: newCount }));
    setUsedToday(newCount);
  };

  const isAtLimit = !isPremium && usedToday >= FREE_LIMIT;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_LIMIT - usedToday);

  return { usedToday, remaining, isAtLimit, incrementCount, FREE_LIMIT };
}