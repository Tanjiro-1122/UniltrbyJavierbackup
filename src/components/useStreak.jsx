/**
 * useStreak.jsx
 * Manages daily chat streak — localStorage + DB sync + milestone detection
 *
 * Returns:
 *   streak        — current streak count (number)
 *   longestStreak — all-time best (number)
 *   milestone     — if today hit a milestone, the number (else null)
 *   clearMilestone — call after showing the celebration UI
 *   syncStreak    — call once on chat load (or after first message)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Milestones that get a celebration modal
const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

function isMilestone(n) {
  return MILESTONES.includes(n);
}

export function useStreak() {
  const [streak, setStreak]               = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [milestone, setMilestone]         = useState(null); // number | null
  const syncedToday                       = useRef(false);

  // Read from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem("unfiltr_streak");
    if (raw) {
      try {
        const sd = JSON.parse(raw);
        setStreak(sd.count || 0);
        setLongestStreak(sd.longest || sd.count || 0);
      } catch {}
    }
  }, []);

  const syncStreak = useCallback(async () => {
    if (syncedToday.current) return;
    syncedToday.current = true;

    const today     = new Date();
    const todayStr  = today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const yestStr   = yesterday.toDateString();

    const raw   = localStorage.getItem("unfiltr_streak");
    let sd      = { date: "", count: 0, longest: 0 };
    try { sd = JSON.parse(raw || "{}"); } catch {}

    let newCount = 1;
    if (sd.date === todayStr) {
      // Already counted today — just load
      setStreak(sd.count);
      setLongestStreak(sd.longest || sd.count);
      return;
    } else if (sd.date === yestStr) {
      // Consecutive day!
      newCount = (sd.count || 0) + 1;
    } else {
      // Streak broken — reset
      newCount = 1;
    }

    const newLongest = Math.max(newCount, sd.longest || 0);
    const newData    = { date: todayStr, count: newCount, longest: newLongest };

    localStorage.setItem("unfiltr_streak", JSON.stringify(newData));
    setStreak(newCount);
    setLongestStreak(newLongest);

    // Show milestone if applicable
    if (newCount > 1 && isMilestone(newCount)) {
      setMilestone(newCount);
    }

    // Sync to DB (best effort)
    const profileId = localStorage.getItem("userProfileId");
    if (profileId) {
      try {
        await base44.entities.UserProfile.update(profileId, {
          streak_count:   newCount,
          streak_longest: newLongest,
          streak_last_date: todayStr,
        });
      } catch (e) {
        console.warn("[useStreak] DB sync failed (non-fatal):", e);
      }
    }
  }, []);

  const clearMilestone = useCallback(() => setMilestone(null), []);

  return { streak, longestStreak, milestone, clearMilestone, syncStreak };
}
