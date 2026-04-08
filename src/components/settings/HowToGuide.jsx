import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, BookOpen } from "lucide-react";

// ─── Book Content ─────────────────────────────────────────────────────────────
// Each "chapter" is a section. Within each section, pages advance one at a time.
// The first section is always Glossary / Terms.

const BOOK = [
  // ── Front Cover ──────────────────────────────────────────────────────────────
  {
    id: "cover",
    type: "cover",
    emoji: "📖",
    title: "Unfiltr by Javier",
    subtitle: "Your Complete Guide",
    body: "Everything you need to know — from your first sign-in to unlocking every feature. Tap the arrow to begin.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.6) 0%, rgba(219,39,119,0.3) 100%)",
    glow: "rgba(168,85,247,0.5)",
  },

  // ── Glossary ─────────────────────────────────────────────────────────────────
  {
    id: "glossary_intro",
    type: "chapter",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "📚",
    title: "Words You'll See",
    body: "Before we dive in — here are the terms Unfiltr uses so everything makes sense from the start.",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 100%)",
    glow: "rgba(139,92,246,0.4)",
  },
  {
    id: "glossary_companion",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "🤖",
    term: "Companion",
    definition: "Your personal AI character. Each companion has a unique name, look, and personality. They remember your conversations, notice your moods, and respond in their own style. You can change companions anytime in Settings.",
    example: "Sakura, Kira, Nova, Finn, Zara, and more.",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "glossary_vibe",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "🌊",
    term: "Vibe",
    definition: "The tone you set before entering a chat session. Vibe shapes how your companion talks to you for that conversation.",
    example: "Chill · Vent · Hype · Deep Talk",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "glossary_mood",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "🎭",
    term: "Mood Check-In",
    definition: "A quick tap before each session — you pick an emoji that matches how you feel. Your companion uses this to personalize its first message and tracks your mood trends over time.",
    example: "😌 Calm · 😔 Sad · 😤 Frustrated · 🤩 Excited",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "glossary_hub",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "🏠",
    term: "The Hub",
    definition: "Your main launch pad inside Unfiltr. From here you choose Chat, Journal, or Meditate. Think of it as the home screen after sign-in.",
    example: "Tap 'Chat' in the bottom tab → Hub → pick your experience",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "glossary_memory",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "🧠",
    term: "Memory",
    definition: "Premium feature. Your companion remembers important things you share — your name, what you've been through, your goals. Each session it carries context forward so conversations feel continuous.",
    example: "\"Last time you mentioned feeling overwhelmed at work...\"",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "glossary_timecapsule",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "⏳",
    term: "Time Capsule",
    definition: "A message you write to your future self. Set a date — 1 month, 6 months, a year — and your companion will reveal it on that day. A reminder of where you were and how far you've come.",
    example: "Write a message today. Open it in 6 months.",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "glossary_premium",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "👑",
    term: "Premium",
    definition: "The paid tier that unlocks unlimited messages, companion memory, voice replies, sleep stories, time capsule, and mood insights. Two plans available: monthly or annual.",
    example: "Free = 20 msgs/day · Premium = unlimited + all features",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    id: "glossary_streak",
    type: "definition",
    chapter: "Glossary & Terms",
    chapterNum: 1,
    emoji: "🔥",
    term: "Streak",
    definition: "The number of consecutive days you've opened and used Unfiltr. Your companion notices milestones and celebrates with you. Don't break the chain!",
    example: "3 days · 7 days · 30 days → each earns a reward",
    accent: "linear-gradient(160deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 100%)",
    glow: "rgba(139,92,246,0.35)",
  },

  // ── Getting Started ───────────────────────────────────────────────────────────
  {
    id: "start_intro",
    type: "chapter",
    chapter: "Getting Started",
    chapterNum: 2,
    emoji: "🚀",
    title: "Your First Time Here",
    body: "Here's exactly what happens when you open Unfiltr for the first time — step by step.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0.2) 100%)",
    glow: "rgba(16,185,129,0.4)",
  },
  {
    id: "start_age",
    type: "step",
    chapter: "Getting Started",
    chapterNum: 2,
    stepNum: 1,
    emoji: "🔞",
    title: "Age Verification",
    body: "You'll first confirm you're 17+. This is required by Apple and keeps the community safe. It only happens once.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    id: "start_consent",
    type: "step",
    chapter: "Getting Started",
    chapterNum: 2,
    stepNum: 2,
    emoji: "📋",
    title: "Privacy & Consent",
    body: "Read and accept how your data is handled. Unfiltr never sells your data. Your journal and chats are private to you.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    id: "start_name",
    type: "step",
    chapter: "Getting Started",
    chapterNum: 2,
    stepNum: 3,
    emoji: "✍️",
    title: "Your Name",
    body: "Enter whatever you'd like your companion to call you. This can be your real name, a nickname, or anything. You can change it later in Settings.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    id: "start_companion",
    type: "step",
    chapter: "Getting Started",
    chapterNum: 2,
    stepNum: 4,
    emoji: "🤖",
    title: "Choose Your Companion",
    body: "Pick your character or take the personality quiz to get matched. You can always change this later. Each companion has a unique personality — scroll to see them all.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    id: "start_nickname",
    type: "step",
    chapter: "Getting Started",
    chapterNum: 2,
    stepNum: 5,
    emoji: "💬",
    title: "Nickname & Vibe",
    body: "Give your companion a nickname — or keep their real name. Then choose a vibe style that matches how you like to talk. This sets the tone for your very first chat.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    id: "start_signin",
    type: "step",
    chapter: "Getting Started",
    chapterNum: 2,
    stepNum: 6,
    emoji: "🍎",
    title: "Sign In with Apple",
    body: "Sign in once with your Apple ID. This ties your account to your device. If you reinstall or switch phones, everything restores automatically — your companion, journal, chat history, and settings.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(16,185,129,0.35)",
  },

  // ── Chatting ──────────────────────────────────────────────────────────────────
  {
    id: "chat_intro",
    type: "chapter",
    chapter: "Chatting",
    chapterNum: 3,
    emoji: "💬",
    title: "Talking with Your Companion",
    body: "The chat is the heart of Unfiltr. Here's everything it can do.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.5) 0%, rgba(168,85,247,0.25) 100%)",
    glow: "rgba(168,85,247,0.5)",
  },
  {
    id: "chat_flow",
    type: "step",
    chapter: "Chatting",
    chapterNum: 3,
    stepNum: 1,
    emoji: "🌊",
    title: "The Flow: Vibe → Mood → Chat",
    body: "From the Hub, tap Chat. You'll pick a vibe (Chill, Vent, Hype, or Deep Talk), then check in with your mood. Your companion greets you based on both — then the conversation is yours.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(168,85,247,0.4)",
  },
  {
    id: "chat_voice",
    type: "step",
    chapter: "Chatting",
    chapterNum: 3,
    stepNum: 2,
    emoji: "🎙️",
    title: "Voice Input",
    body: "Tap the 🎙️ microphone icon in the chat bar to speak instead of type. Your words are converted to text and sent — hands-free.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(168,85,247,0.4)",
  },
  {
    id: "chat_reply_voice",
    type: "step",
    chapter: "Chatting",
    chapterNum: 3,
    stepNum: 3,
    emoji: "🔊",
    title: "Voice Replies",
    body: "Tap the 🔊 speaker icon in the top-left to toggle your companion's voice on. They'll read their replies aloud in their selected voice style. Tap again to turn it off.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(168,85,247,0.4)",
  },
  {
    id: "chat_topics",
    type: "step",
    chapter: "Chatting",
    chapterNum: 3,
    stepNum: 4,
    emoji: "💡",
    title: "Conversation Topics",
    body: "Not sure what to say? Tap the purple Topics pill in the chat toolbar. Your companion suggests starters based on your current vibe and mood. Tap one to dive in.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(168,85,247,0.4)",
  },
  {
    id: "chat_save_journal",
    type: "step",
    chapter: "Chatting",
    chapterNum: 3,
    stepNum: 5,
    emoji: "📖",
    title: "Save Chat as Journal Entry",
    body: "After 2+ messages, a green 'Save Entry' button appears in the top-right. Tap it and your companion transforms the conversation into a personal journal entry — complete with a title, mood, and full text.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(168,85,247,0.4)",
  },
  {
    id: "chat_history",
    type: "step",
    chapter: "Chatting",
    chapterNum: 3,
    stepNum: 6,
    emoji: "🗂️",
    title: "Chat History",
    body: "Tap the history icon in the top-right of the chat screen to view past sessions. Premium users sync history across devices. You can delete individual sessions or search through them.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(168,85,247,0.4)",
  },

  // ── Journal ───────────────────────────────────────────────────────────────────
  {
    id: "journal_intro",
    type: "chapter",
    chapter: "Journal",
    chapterNum: 4,
    emoji: "📓",
    title: "Your Private Journal",
    body: "The journal is your space — no judgment, no audience. Write, decorate, and revisit your thoughts.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.5) 0%, rgba(5,150,105,0.25) 100%)",
    glow: "rgba(52,211,153,0.5)",
  },
  {
    id: "journal_write",
    type: "step",
    chapter: "Journal",
    chapterNum: 4,
    stepNum: 1,
    emoji: "✏️",
    title: "Writing an Entry",
    body: "From the Hub → Journal → tap the ✏️ button to start a new entry. Title it, write freely, add photos or stickers. Tap Save when done. Your entry is stored privately on your account.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(52,211,153,0.4)",
  },
  {
    id: "journal_immersive",
    type: "step",
    chapter: "Journal",
    chapterNum: 4,
    stepNum: 2,
    emoji: "🌍",
    title: "Immersive World Journal",
    body: "Tap 'World' from the journal menu to write inside a full-screen scene — cozy apartment, rainy night, or moonlit forest. The background matches your mood.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(52,211,153,0.4)",
  },
  {
    id: "journal_stickers",
    type: "step",
    chapter: "Journal",
    chapterNum: 4,
    stepNum: 3,
    emoji: "😊",
    title: "Stickers & Photos",
    body: "In the journal editor, tap the 😊 sticker button to open the sticker tray. Tap any sticker to place it — then drag it anywhere on the page. Double-tap a sticker to remove it. Tap 📷 to add photos.",
    accent: "linear-gradient(160deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.15) 100%)",
    glow: "rgba(52,211,153,0.4)",
  },

  // ── Meditation ────────────────────────────────────────────────────────────────
  {
    id: "meditate_intro",
    type: "chapter",
    chapter: "Meditation",
    chapterNum: 5,
    emoji: "🧘",
    title: "Guided Meditation",
    body: "Unfiltr includes ambient sounds and breathing exercises — your companion checks in right after each session.",
    accent: "linear-gradient(160deg, rgba(14,165,233,0.5) 0%, rgba(56,189,248,0.25) 100%)",
    glow: "rgba(125,211,252,0.5)",
  },
  {
    id: "meditate_how",
    type: "step",
    chapter: "Meditation",
    chapterNum: 5,
    stepNum: 1,
    emoji: "▶️",
    title: "Starting a Session",
    body: "From the Hub → tap Meditate. Choose an ambient sound (Rain, Ocean, Fire, Forest, Space). Tap play. Use the breathing guide that appears to pace your inhales and exhales.",
    accent: "linear-gradient(160deg, rgba(14,165,233,0.35) 0%, rgba(56,189,248,0.15) 100%)",
    glow: "rgba(125,211,252,0.4)",
  },
  {
    id: "meditate_checkin",
    type: "step",
    chapter: "Meditation",
    chapterNum: 5,
    stepNum: 2,
    emoji: "💜",
    title: "Companion Check-In After",
    body: "When you finish a session, your companion automatically sends a caring message. They'll ask how you feel and reflect on what you just experienced together.",
    accent: "linear-gradient(160deg, rgba(14,165,233,0.35) 0%, rgba(56,189,248,0.15) 100%)",
    glow: "rgba(125,211,252,0.4)",
  },

  // ── Settings & Personalization ────────────────────────────────────────────────
  {
    id: "settings_intro",
    type: "chapter",
    chapter: "Settings & Personalization",
    chapterNum: 6,
    emoji: "⚙️",
    title: "Making It Yours",
    body: "Every part of Unfiltr is customizable. Here's what you can change and how.",
    accent: "linear-gradient(160deg, rgba(245,158,11,0.4) 0%, rgba(217,119,6,0.2) 100%)",
    glow: "rgba(251,191,36,0.4)",
  },
  {
    id: "settings_companion",
    type: "step",
    chapter: "Settings & Personalization",
    chapterNum: 6,
    stepNum: 1,
    emoji: "🤖",
    title: "Change Your Companion",
    body: "Settings → Companion & Voice. Tap any character to switch — your personality resets to match them. Give them a nickname, choose their voice (Male / Female / Neutral), and their personality style.",
    accent: "linear-gradient(160deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.15) 100%)",
    glow: "rgba(251,191,36,0.35)",
  },
  {
    id: "settings_background",
    type: "step",
    chapter: "Settings & Personalization",
    chapterNum: 6,
    stepNum: 2,
    emoji: "🎨",
    title: "Chat Background",
    body: "Settings → Background. Choose from anime-style and realistic scenes. The background appears behind your chat and reflects the mood you're in.",
    accent: "linear-gradient(160deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.15) 100%)",
    glow: "rgba(251,191,36,0.35)",
  },
  {
    id: "settings_pin",
    type: "step",
    chapter: "Settings & Personalization",
    chapterNum: 6,
    stepNum: 3,
    emoji: "🔐",
    title: "PIN Lock",
    body: "Settings → App Lock / PIN. Set a 4-digit PIN to keep your chats and journal private. The app locks automatically after 5 minutes. To reset, go to the same menu and choose Change PIN.",
    accent: "linear-gradient(160deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.15) 100%)",
    glow: "rgba(251,191,36,0.35)",
  },
  {
    id: "settings_notifications",
    type: "step",
    chapter: "Settings & Personalization",
    chapterNum: 6,
    stepNum: 4,
    emoji: "🔔",
    title: "Notifications",
    body: "Allow notifications when prompted and your companion will send you a good morning message and a goodnight check-in each day — personalized to your name and your companion's personality.",
    accent: "linear-gradient(160deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.15) 100%)",
    glow: "rgba(251,191,36,0.35)",
  },

  // ── Premium ───────────────────────────────────────────────────────────────────
  {
    id: "premium_intro",
    type: "chapter",
    chapter: "Premium",
    chapterNum: 7,
    emoji: "👑",
    title: "Premium Features",
    body: "Upgrade to unlock the full Unfiltr experience — unlimited conversations, memory, and more.",
    accent: "linear-gradient(160deg, rgba(219,39,119,0.5) 0%, rgba(168,85,247,0.3) 100%)",
    glow: "rgba(236,72,153,0.5)",
  },
  {
    id: "premium_what",
    type: "step",
    chapter: "Premium",
    chapterNum: 7,
    stepNum: 1,
    emoji: "✨",
    title: "What's Included",
    body: "Unlimited messages · Companion memory · Voice replies · Sleep stories · Time capsule · Mood trend insights · Chat history sync · Priority response speed.",
    accent: "linear-gradient(160deg, rgba(219,39,119,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(236,72,153,0.4)",
  },
  {
    id: "premium_restore",
    type: "step",
    chapter: "Premium",
    chapterNum: 7,
    stepNum: 2,
    emoji: "🔄",
    title: "Restoring a Purchase",
    body: "Already subscribed but the app doesn't show it? Go to Settings → scroll down → Restore Purchases. Tap it and your subscription will be re-verified through Apple.",
    accent: "linear-gradient(160deg, rgba(219,39,119,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(236,72,153,0.4)",
  },
  {
    id: "premium_free",
    type: "step",
    chapter: "Premium",
    chapterNum: 7,
    stepNum: 3,
    emoji: "🆓",
    title: "The Free Tier",
    body: "Free users get 20 messages per day. The chat, journal, mood check-in, and meditation features are all available without paying. Premium removes limits and adds the exclusive extras.",
    accent: "linear-gradient(160deg, rgba(219,39,119,0.4) 0%, rgba(168,85,247,0.2) 100%)",
    glow: "rgba(236,72,153,0.4)",
  },

  // ── Back Cover ────────────────────────────────────────────────────────────────
  {
    id: "end",
    type: "cover",
    emoji: "💜",
    title: "You're All Set",
    subtitle: "Enjoy Unfiltr",
    body: "Your companion is ready. Your journal is waiting. Go explore — and come back to this guide anytime from Settings → How to Use Unfiltr.",
    accent: "linear-gradient(160deg, rgba(124,58,237,0.6) 0%, rgba(219,39,119,0.4) 100%)",
    glow: "rgba(168,85,247,0.5)",
  },
];

// ─── Page Renderer ─────────────────────────────────────────────────────────────
function BookPage({ page, direction }) {
  const variants = {
    enter:  (d) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  const isCover     = page.type === "cover";
  const isChapter   = page.type === "chapter";
  const isDefinition= page.type === "definition";
  const isStep      = page.type === "step";

  return (
    <motion.div
      key={page.id}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.8 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 28px",
        textAlign: "center",
        background: page.accent,
        borderRadius: 24,
        border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 0 60px ${page.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
        overflow: "hidden",
      }}
    >
      {/* Chapter label */}
      {(isChapter || isDefinition || isStep) && (
        <div style={{
          position: "absolute", top: 18, left: 0, right: 0,
          display: "flex", justifyContent: "center",
        }}>
          <span style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 20,
            padding: "3px 12px",
            color: "rgba(255,255,255,0.6)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            {page.chapter}
          </span>
        </div>
      )}

      {/* Emoji */}
      <div style={{
        fontSize: isCover ? 72 : 56,
        marginBottom: 20,
        filter: `drop-shadow(0 0 28px ${page.glow})`,
        lineHeight: 1,
      }}>
        {page.emoji}
      </div>

      {/* Cover / Chapter */}
      {(isCover || isChapter) && (
        <>
          {page.subtitle && (
            <p style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}>{page.subtitle}</p>
          )}
          <h2 style={{
            color: "white",
            fontSize: isCover ? 28 : 24,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            marginBottom: 14,
            lineHeight: 1.2,
          }}>{page.title}</h2>
          <p style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: 280,
          }}>{page.body}</p>
        </>
      )}

      {/* Definition */}
      {isDefinition && (
        <>
          <h2 style={{
            color: "white",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.4px",
            marginBottom: 12,
            lineHeight: 1.2,
          }}>{page.term}</h2>
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 14,
            lineHeight: 1.65,
            maxWidth: 290,
            marginBottom: 16,
          }}>{page.definition}</p>
          <div style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "10px 16px",
            maxWidth: 280,
          }}>
            <p style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.5,
            }}>{page.example}</p>
          </div>
        </>
      )}

      {/* Step */}
      {isStep && (
        <>
          <div style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 999,
            padding: "4px 14px",
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            marginBottom: 14,
          }}>STEP {page.stepNum}</div>
          <h2 style={{
            color: "white",
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: "-0.4px",
            marginBottom: 14,
            lineHeight: 1.2,
          }}>{page.title}</h2>
          <p style={{
            color: "rgba(255,255,255,0.68)",
            fontSize: 14,
            lineHeight: 1.7,
            maxWidth: 290,
          }}>{page.body}</p>
        </>
      )}
    </motion.div>
  );
}

// ─── Progress Dots ─────────────────────────────────────────────────────────────
function ProgressDots({ total, current }) {
  if (total <= 1) return null;
  const visible = Math.min(total, 11);
  const start = Math.max(0, Math.min(current - 4, total - visible));
  const dots = Array.from({ length: visible }, (_, i) => start + i);

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
      {dots.map(i => (
        <div key={i} style={{
          width: i === current ? 18 : 6,
          height: 6,
          borderRadius: 3,
          background: i === current ? "#a855f7" : "rgba(255,255,255,0.2)",
          transition: "all 0.25s ease",
        }} />
      ))}
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function HowToGuide() {
  const [pageIdx, setPageIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = BOOK.length;
  const page = BOOK[pageIdx];

  const go = (delta) => {
    const next = pageIdx + delta;
    if (next < 0 || next >= total) return;
    setDirection(delta);
    setPageIdx(next);
  };

  // Swipe support
  const touchStart = React.useRef(null);
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
    touchStart.current = null;
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Book viewport */}
      <div style={{
        position: "relative",
        width: "100%",
        minHeight: 340,
        borderRadius: 24,
        overflow: "hidden",
      }}>
        <AnimatePresence custom={direction} mode="popLayout">
          <BookPage key={page.id} page={page} direction={direction} />
        </AnimatePresence>
      </div>

      {/* Navigation row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        {/* Prev */}
        <button
          onClick={() => go(-1)}
          disabled={pageIdx === 0}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: pageIdx === 0 ? "rgba(255,255,255,0.04)" : "rgba(168,85,247,0.2)",
            border: `1px solid ${pageIdx === 0 ? "rgba(255,255,255,0.06)" : "rgba(168,85,247,0.4)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: pageIdx === 0 ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <ChevronLeft size={20} color={pageIdx === 0 ? "rgba(255,255,255,0.2)" : "white"} />
        </button>

        {/* Dots */}
        <ProgressDots total={total} current={pageIdx} />

        {/* Next */}
        <button
          onClick={() => go(1)}
          disabled={pageIdx === total - 1}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: pageIdx === total - 1 ? "rgba(255,255,255,0.04)" : "rgba(168,85,247,0.2)",
            border: `1px solid ${pageIdx === total - 1 ? "rgba(255,255,255,0.06)" : "rgba(168,85,247,0.4)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: pageIdx === total - 1 ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <ChevronRight size={20} color={pageIdx === total - 1 ? "rgba(255,255,255,0.2)" : "white"} />
        </button>
      </div>

      {/* Page counter */}
      <p style={{
        textAlign: "center",
        color: "rgba(255,255,255,0.25)",
        fontSize: 11,
        fontWeight: 500,
        margin: 0,
      }}>
        {pageIdx + 1} of {total}
      </p>
    </div>
  );
}
