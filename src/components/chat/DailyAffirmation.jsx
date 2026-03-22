import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AFFIRMATIONS = [
  "You are enough, exactly as you are right now. 💜",
  "Today is full of possibilities — you just have to show up. ✨",
  "Your feelings are valid. Every single one. 🌿",
  "Small steps still move you forward. 🦋",
  "You deserve kindness — especially from yourself. 🫶",
  "It's okay to rest. Growth happens in the quiet too. 🌙",
  "You're doing better than you think. Really. 🌟",
  "The world is better with you in it. 💫",
  "Let go of what you can't control. Focus on what you can. 🍃",
  "You've survived 100% of your hardest days. 💪",
  "Be gentle with yourself today. 🌸",
  "Your story isn't over — the best chapters might be next. 📖",
  "It's okay to not have it all figured out. Nobody does. 🌊",
  "You are worthy of love and good things. 💝",
  "Every sunrise is a chance to start fresh. ☀️",
];

const AFF_KEY = "unfiltr_daily_affirmation";

function getTodaysAffirmation() {
  const stored = JSON.parse(localStorage.getItem(AFF_KEY) || '{}');
  const today = new Date().toDateString();
  if (stored.date === today) return stored.text;
  // Pick a deterministic affirmation based on date
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const text = AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
  localStorage.setItem(AFF_KEY, JSON.stringify({ date: today, text }));
  return text;
}

export default function DailyAffirmation({ visible }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!visible) return;
    const affirmation = getTodaysAffirmation();
    setText(affirmation);
    setShow(true);
    const timer = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          onClick={() => setShow(false)}
          style={{
            padding: "8px 16px",
            background: "rgba(139,92,246,0.08)",
            borderBottom: "1px solid rgba(139,92,246,0.1)",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <p style={{
            color: "rgba(196,180,252,0.8)", fontSize: 12, fontWeight: 500,
            textAlign: "center", margin: 0, lineHeight: 1.5, fontStyle: "italic",
          }}>
            {text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}