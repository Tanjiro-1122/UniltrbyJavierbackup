// Mood tracker utility — stores daily mood check-ins in localStorage
const STORAGE_KEY = "unfiltr_mood_history";

const MOOD_EMOJI_MAP = {
  happy: "😊",
  calm: "😌",
  neutral: "😐",
  sad: "😔",
  frustrated: "😤",
  anxious: "😰",
  loved: "🥰",
  motivated: "🔥",
};

export function saveMood(moodValue) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  history[todayKey] = moodValue;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getMoodWeek() {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const moodValue = history[key] || null;
    return {
      day: days[d.getDay()],
      mood: moodValue ? (MOOD_EMOJI_MAP[moodValue] || "💜") : null,
      isToday: i === 6,
    };
  });
}