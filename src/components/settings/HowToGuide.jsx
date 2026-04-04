import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const GUIDES = [
  {
    id: "chat",
    emoji: "💬",
    title: "Chatting with Your Companion",
    steps: [
      "From the Hub, tap Chat to enter the vibe selector.",
      "Swipe left or right to choose a vibe: Chill, Vent, Hype, or Deep Talk — then tap 'Pick your world →'.",
      "Choose your mood, then start typing in the chat bar at the bottom.",
      "Tap the 🎙️ microphone icon in the input bar to talk using your voice instead of typing.",
      "Tap the 📷 photo icon to share an image directly in chat.",
      "Tap the 🔊 speaker icon in the top-left to toggle voice replies on or off.",
      "Your companion reacts with different expressions based on the conversation mood!",
    ],
  },
  {
    id: "topics",
    emoji: "💡",
    title: "Conversation Topics",
    steps: [
      "In the chat toolbar, tap the purple 'Topics' pill button.",
      "Your companion will suggest conversation starters based on your vibe and mood.",
      "Tap any topic to jump right into that conversation.",
      "Great for when you're not sure what to talk about!",
    ],
  },
  {
    id: "journal",
    emoji: "📓",
    title: "Journal — Writing & Decorating",
    steps: [
      "From the Hub, tap Journal to enter the journal section.",
      "Tap the ✏️ button to start a new entry.",
      "Tap the 📷 Photo button at the bottom to add pictures from your camera or gallery.",
      "Tap the 😊 Stickers button to open the sticker tray, then tap any sticker to place it on your page.",
      "Drag placed stickers anywhere you like. Double-tap a sticker to remove it.",
      "When you're done, tap Save in the top-right corner.",
      "View all past entries from the journal list screen.",
    ],
  },
  {
    id: "journal_from_chat",
    emoji: "📖",
    title: "Save a Chat as a Journal Entry",
    steps: [
      "In the chat toolbar, tap the 🔊 speaker icon to switch to Journal vibe if needed.",
      "After at least 2 messages, a green 'Save Entry' button appears in the top-right.",
      "Tap it and your companion will turn the conversation into a personal journal entry automatically.",
      "It gets saved to your Journal with a title, mood tag, and full entry.",
    ],
  },
  {
    id: "meditation",
    emoji: "🧘",
    title: "Guided Meditation",
    steps: [
      "Access meditation two ways: tap Meditate from the Hub, or tap the 🌙 moon icon in the chat toolbar.",
      "Choose from Box Breathing, Calming Breath, or Energy Boost.",
      "Follow the on-screen circle and timer as it guides you through each round.",
      "The exercise ends automatically after the set number of rounds.",
      "Use this whenever you need to slow down and reset.",
    ],
  },
  {
    id: "breathing",
    emoji: "🫁",
    title: "Breathing Exercise",
    steps: [
      "In the chat screen, tap the 🌙 moon icon in the toolbar and select a breathing session.",
      "Tap Start and follow the circle: Breathe In → Hold → Breathe Out.",
      "This uses 4-4-4 box breathing to calm your nervous system.",
      "Do a few cycles whenever you feel stressed or anxious.",
    ],
  },
  {
    id: "sleepstory",
    emoji: "😴",
    title: "Sleep Stories",
    steps: [
      "Tap the 🌙 moon icon in the chat toolbar and choose Sleep Story.",
      "Pick a theme: Enchanted Forest, Ocean Waves, Starry Night, or Rainy Evening.",
      "Your companion will write you a personalized bedtime story.",
      "Tap 🔊 Listen to hear it read aloud in your companion's voice.",
    ],
  },
  {
    id: "games",
    emoji: "🎮",
    title: "Mini Games",
    steps: [
      "Tap the 🎮 gamepad icon in the chat toolbar.",
      "Choose Would You Rather, Trivia Time, or 20 Questions.",
      "The game starts right in your chat — play and respond naturally!",
    ],
  },
  {
    id: "mood",
    emoji: "💜",
    title: "Mood Check-Ins & Insights",
    steps: [
      "When your companion asks how you're feeling, tap a mood emoji to log it.",
      "Your mood history shows up as the 'Mood This Week' bar in Settings.",
      "Tap the 📈 Mood icon in the chat toolbar to view your Mood Insights over time.",
      "Track patterns and see how your emotional well-being changes week to week.",
    ],
  },
  {
    id: "timecapsule",
    emoji: "⏰",
    title: "Time Capsule",
    steps: [
      "Tap the 🕐 clock icon in the chat toolbar to open your Time Capsule.",
      "Leave yourself a message or memory to revisit in the future.",
      "Your companion keeps it safe and can remind you to look back on it.",
    ],
  },
  {
    id: "achievements",
    emoji: "🏆",
    title: "Achievement Badges",
    steps: [
      "Tap the 🏆 trophy icon in the chat toolbar to view your badges.",
      "Earn badges by using the app consistently — streaks, check-ins, journal entries, and more.",
      "Each badge marks a milestone in your wellness journey.",
    ],
  },
  {
    id: "bookmarks",
    emoji: "🔖",
    title: "Bookmarked Messages",
    steps: [
      "Long-press or tap-and-hold on any message in chat to bookmark it.",
      "Tap the 🔖 Saved icon in the chat toolbar to view all your saved messages.",
      "Great for saving advice, affirmations, or moments you want to remember.",
    ],
  },
  {
    id: "history",
    emoji: "🕐",
    title: "Chat History & New Chats",
    steps: [
      "Tap the 🕐 history icon (top-right area) to view past conversations.",
      "Tap the 🔄 refresh icon to start a fresh chat — your previous one is auto-saved.",
      "Premium users can also export conversations as a file using the 💾 save icon.",
    ],
  },
  {
    id: "affirmation",
    emoji: "✨",
    title: "Daily Affirmations",
    steps: [
      "Each day, your companion may share a personalized affirmation when you open the app.",
      "These are based on your mood history and past conversations.",
      "Tap it to dismiss, or let it set the tone for your day.",
    ],
  },
  {
    id: "companion",
    emoji: "🐾",
    title: "Changing Your Companion",
    steps: [
      "Go to Settings and scroll to 'Your Companion.'",
      "Tap any character to switch — your chat personality will update immediately.",
      "Give them a custom nickname in the 'Companion Nickname' field above.",
      "Choose their voice (Male, Female, Neutral) and personality (Cheerful, Calm, etc.).",
    ],
  },
  {
    id: "background",
    emoji: "🎨",
    title: "Changing Your Background",
    steps: [
      "In Settings, scroll down to 'Background.'",
      "Tap any scene to switch your chat environment instantly.",
      "There are anime-style and realistic backgrounds to choose from.",
    ],
  },
  {
    id: "quiz",
    emoji: "✨",
    title: "Personality Quiz",
    steps: [
      "Go to Settings → Fun Stuff → Which companion are you?",
      "Answer 5 quick questions and discover your perfect companion match.",
      "Share your result with friends!",
    ],
  },
  {
    id: "pin",
    emoji: "🔐",
    title: "PIN Lock",
    steps: [
      "Set up a PIN in Settings → Account Management → Set PIN to keep your journal and chats private.",
      "Once enabled, the app will lock automatically after 5 minutes of inactivity.",
      "To change or remove your PIN, go to Settings → Account Management → Change PIN.",
    ],
  },
  {
    id: "premium",
    emoji: "👑",
    title: "Premium Features",
    steps: [
      "Free users get 20 messages per day. Premium unlocks unlimited messages.",
      "Premium also includes companion memory, voice replies, sleep stories, time capsule, and more.",
      "Tap 'View Premium Plans' in Settings or the ✨ Upgrade button to subscribe.",
      "Already purchased? Use 'Restore Purchase' on the upgrade screen.",
    ],
  },
];

function GuideItem({ guide }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>{guide.emoji}</span>
        <span style={{ color: "white", fontWeight: 600, fontSize: 14, textAlign: "left", flex: 1 }}>{guide.title}</span>
        {open
          ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
          : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {guide.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                    background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#c084fc", fontSize: 10, fontWeight: 700, marginTop: 1,
                  }}>{i + 1}</span>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HowToGuide() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {GUIDES.map(guide => (
        <GuideItem key={guide.id} guide={guide} />
      ))}
    </div>
  );
}
