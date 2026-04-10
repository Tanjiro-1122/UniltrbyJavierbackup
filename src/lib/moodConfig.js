/**
 * moodConfig.js
 * Single source of truth for all mood definitions used across the app.
 * Import from here instead of defining moods inline in each component.
 */

export const MOODS = [
  { emoji: "😊", label: "Happy",      value: "happy" },
  { emoji: "😌", label: "Calm",       value: "calm" },
  { emoji: "😐", label: "Meh",        value: "neutral" },
  { emoji: "😔", label: "Sad",        value: "sad" },
  { emoji: "😤", label: "Frustrated", value: "frustrated" },
  { emoji: "😰", label: "Anxious",    value: "anxious" },
  { emoji: "🥰", label: "Loved",      value: "loved" },
  { emoji: "🔥", label: "Motivated",  value: "motivated" },
];

/** Quick lookup: mood value → emoji */
export const MOOD_EMOJIS = Object.fromEntries(MOODS.map(m => [m.value, m.emoji]));

/** Quick lookup: mood value → display label */
export const MOOD_LABEL_MAP = Object.fromEntries(MOODS.map(m => [m.value, m.label]));

/** Display labels including emoji suffix, e.g. "Happy 😊" */
export const MOOD_LABELS = {
  happy:      "Happy 😊",
  calm:       "Calm 😌",
  neutral:    "Neutral 😐",
  sad:        "Sad 😔",
  frustrated: "Frustrated 😤",
  anxious:    "Anxious 😰",
  loved:      "Loved 🥰",
  motivated:  "Motivated 🔥",
};

/** Color palette for charts and highlights */
export const MOOD_COLORS = {
  happy:      "#facc15",
  calm:       "#4ade80",
  neutral:    "#94a3b8",
  sad:        "#60a5fa",
  frustrated: "#f97316",
  anxious:    "#f43f5e",
  loved:      "#ec4899",
  motivated:  "#ef4444",
};

/**
 * Get the emoji for a mood value. Falls back to 💜 if unknown.
 * @param {string} mood
 * @returns {string}
 */
export function getMoodEmoji(mood) {
  return MOOD_EMOJIS[mood] || "💜";
}

/**
 * Get the color for a mood value. Falls back to #6b7280 if unknown.
 * @param {string} mood
 * @returns {string}
 */
export function getMoodColor(mood) {
  return MOOD_COLORS[mood] || "#6b7280";
}

/**
 * Get the display label (with emoji) for a mood value.
 * @param {string} mood
 * @returns {string}
 */
export function getMoodLabel(mood) {
  return MOOD_LABELS[mood] || mood;
}
