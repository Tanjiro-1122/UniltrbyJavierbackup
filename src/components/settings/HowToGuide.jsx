import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const GUIDES = [
  {
    id: "chat",
    emoji: "💬",
    title: "Chatting with Your Companion",
    steps: [
      "From the home screen, tap a vibe (Chill, Vent, Hype, or Deep Talk) to set the mood.",
      "Choose a background, then start typing in the chat bar at the bottom.",
      "Tap the 🎙️ microphone icon to talk using your voice instead of typing.",
      "Tap the 🔊 speaker icon in the top-left to toggle voice replies on or off.",
      "Your companion reacts with different expressions based on the conversation mood!",
    ],
  },
  {
    id: "journal",
    emoji: "📓",
    title: "Journal — Writing & Decorating",
    steps: [
      'Tap "Set the vibe" → Journal to enter the journal section.',
      'Tap "New Entry" (the ✏️ button) to start writing.',
      "Tap the 📷 Photo button at the bottom to add pictures from your camera or gallery.",
      "Tap the 😊 Stickers button to open the sticker tray, then tap any sticker to place it on your page.",
      "Drag placed stickers anywhere you like. Double-tap a sticker to remove it.",
      "When you're done, tap Save in the top-right corner.",
      "View all past entries from the journal list screen.",
    ],
  },
  {
    id: "breathing",
    emoji: "🫁",
    title: "Breathing Exercise",
    steps: [
      "In the chat screen, look for the small icons in the top toolbar.",
      "Tap the 💨 wind icon to open the Breathing Exercise.",
      "Tap Start and follow the circle: Breathe In → Hold → Breathe Out.",
      "This uses 4-4-4 box breathing to calm your nervous system.",
      "Do a few cycles whenever you feel stressed or anxious.",
    ],
  },
  {
    id: "meditation",
    emoji: "🧘",
    title: "Guided Meditation",
    steps: [
      "In the chat toolbar, tap the 🌙 moon icon to open Guided Meditation.",
      "Choose from Box Breathing, Calming Breath, or Energy Boost.",
      "Follow the on-screen circle and timer as it guides you through each round.",
      "The exercise ends automatically after the set number of rounds.",
    ],
  },
  {
    id: "sleepstory",
    emoji: "😴",
    title: "Sleep Stories",
    steps: [
      "Tap the 🌙 crescent icon (Sleep Story) in the chat toolbar.",
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
      'Your mood history shows up as the "Mood This Week" bar in Settings.',
      "Tap the 📈 trend icon in the chat toolbar to view Mood Insights over time.",
    ],
  },
  {
    id: "companion",
    emoji: "🐾",
    title: "Changing Your Companion",
    steps: [
      'Go to Settings and scroll to "Your Companion."',
      "Tap any character to switch — your chat personality will update.",
      'Give them a custom nickname in the "Companion Nickname" field above.',
      "Choose their voice (Male, Female, Neutral) and personality (Cheerful, Calm, etc.).",
    ],
  },
  {
    id: "background",
    emoji: "🎨",
    title: "Changing Your Background",
    steps: [
      'In Settings, scroll down to "Background."',
      "Tap any scene to switch your chat environment instantly.",
      "There are anime-style and realistic backgrounds to choose from.",
    ],
  },
  {
    id: "history",
    emoji: "🕐",
    title: "Chat History & New Chats",
    steps: [
      "Tap the 🕐 clock icon in the chat toolbar to view past conversations.",
      "Tap the 🔄 refresh icon to start a fresh chat (your previous one is auto-saved).",
      "Premium users can also export conversations as a file using the 💾 save icon.",
    ],
  },
  {
    id: "bookmarks",
    emoji: "🔖",
    title: "Bookmarked Messages",
    steps: [
      "Long-press or tap-and-hold on any message in chat to bookmark it.",
      "Tap the 🔖 bookmark icon in the chat toolbar to view all your saved messages.",
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
      "Your PIN was set during onboarding to keep your journal and chats private.",
      "If you're inactive for 5 minutes, the app will lock automatically.",
      "To change your PIN, go to Settings → Account Management → Change PIN.",
    ],
  },
  {
    id: "premium",
    emoji: "👑",
    title: "Premium Features",
    steps: [
      "Free users get 20 messages per day. Premium unlocks unlimited messages.",
      "Premium also includes companion memory, voice replies, sleep stories, and more.",
      'Tap "View Premium Plans" in Settings or the ✨ Upgrade button to subscribe.',
      'Already purchased? Use "Restore Purchase" on the upgrade screen.',
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