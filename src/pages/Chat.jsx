import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Settings, AlertTriangle, X, Menu } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CompanionAvatar from "@/components/CompanionAvatar";
import ChatBubble from "@/components/ChatBubble";
import SettingsDrawer from "@/components/SettingsDrawer";
import { COMPANIONS, BACKGROUNDS } from "@/lib/companionData";

const CRISIS_KEYWORDS = ["suicide", "self-harm", "kill myself", "end it", "cut myself", "hurt myself"];

const MOOD_PROMPTS = {
  happy: "You're feeling uplifted and positive. Be warm, encouraging, and celebratory.",
  neutral: "Be supportive, understanding, and balanced in your responses.",
  sad: "Show deep empathy and compassion. Listen actively and validate feelings.",
};

export default function Chat() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [companionMood, setCompanionMood] = useState("neutral");
  const [showSettings, setShowSettings] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const profileId = localStorage.getItem("userProfileId");
      const companionId = localStorage.getItem("companionId");

      if (!profileId || !companionId) {
        navigate("/onboarding");
        return;
      }

      const profile = await base44.entities.UserProfile.get(profileId);
      const comp = await base44.entities.Companion.get(companionId);
      setUserProfile(profile);
      setCompanion(comp);
      setCompanionMood(comp.mood_mode || "neutral");

      const msgs = await base44.entities.Message.filter({ user_profile_id: profileId });
      setMessages(msgs);
    };

    loadData();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const detectEmotionalTone = (text) => {
    const lowerText = text.toLowerCase();
    if (/happy|great|amazing|love|excited|wonderful/i.test(lowerText)) return "happy";
    if (/sad|depressed|lonely|hopeless|numb|empty/i.test(lowerText)) return "sad";
    if (/anxious|worried|scared|nervous|panic/i.test(lowerText)) return "anxious";
    if (/angry|furious|rage|hate/i.test(lowerText)) return "angry";
    return "neutral";
  };

  const detectMood = (text) => {
    const lowerText = text.toLowerCase();
    if (/happy|great|amazing|love|excited|wonderful|proud|accomplished/i.test(lowerText)) return "happy";
    if (/sad|down|depressed|lonely|hopeless/i.test(lowerText)) return "sad";
    return "neutral";
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !userProfile || !companion) return;

    const userText = input.trim();
    const emotionalTone = detectEmotionalTone(userText);
    const detectedMood = detectMood(userText);

    // Check for crisis keywords
    if (CRISIS_KEYWORDS.some((kw) => userText.toLowerCase().includes(kw))) {
      setCrisisAlert(true);
      return;
    }

    setInput("");
    const userMsg = { role: "user", content: userText, emotional_tone: emotionalTone };
    setMessages((m) => [...m, userMsg]);

    setLoading(true);
    try {
      const systemPrompt = `You are ${companion.name}, a supportive AI companion. ${MOOD_PROMPTS[detectedMood]} Keep responses concise (1-2 sentences). Be authentic and genuine.`;

      const response = await base44.functions.invoke("chat", {
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        systemPrompt,
      });

      const assistantText = response.data?.reply || "I'm here for you.";
      const assistantMood = detectMood(assistantText);

      setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
      setCompanionMood(assistantMood);

      // Update companion mood in DB
      await base44.entities.Companion.update(companion.id, { mood_mode: assistantMood });

      // Save message to DB
      await base44.entities.Message.create({
        user_profile_id: userProfile.id,
        companion_id: companion.id,
        role: "assistant",
        content: assistantText,
        emotional_tone: assistantMood,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile || !companion) {
    return <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center max-w-[430px] mx-auto"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const bgImage = BACKGROUNDS.find((b) => b.id === userProfile?.background_id);

  return (
    <div
      className="fixed inset-0 flex flex-col max-w-[430px] mx-auto overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage?.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 pointer-events-none" />

      <div className="relative flex flex-col h-full z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-white font-bold text-sm">{companion.name}</h1>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur ${
            companionMood === "happy"
              ? "bg-yellow-500/30 text-yellow-200"
              : companionMood === "sad"
                ? "bg-blue-500/30 text-blue-200"
                : "bg-purple-500/30 text-purple-200"
          }`}>
            {companionMood === "happy" ? "😊 HAPPY" : companionMood === "sad" ? "😢 SAD" : "😌 NEUTRAL"}
          </div>
        </div>

        {/* Avatar Zone */}
        <div className="flex-1 flex items-center justify-center py-4">
          <CompanionAvatar companionId={companion.id} mood={companionMood} />
        </div>

        {/* Messages Container - Fixed Height */}
        <div className="h-56 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 justify-start"
              >
                <div className="bg-white/10 backdrop-blur border border-white/20 px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-6 pt-4">
          <div className="flex gap-2 items-end bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="How are you feeling?"
              className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full disabled:opacity-50 active:scale-90 transition"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Crisis Alert */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 max-w-[430px] mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-80 bg-gradient-to-b from-red-950 to-red-900/80 backdrop-blur border border-red-500/30 rounded-3xl p-6 shadow-2xl"
            >
              <div className="text-center mb-6">
                <h2 className="text-4xl mb-3">You matter 💜</h2>
                <p className="text-white/80 text-sm">If you're having thoughts of self-harm, please reach out:</p>
              </div>
              <div className="space-y-3 mb-6 bg-black/20 rounded-2xl p-4">
                <a
                  href="tel:988"
                  className="block p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-white text-sm font-semibold text-center transition"
                >
                  🆘 Call 988 Lifeline
                </a>
                <p className="text-white/60 text-xs text-center">Text HOME to 741741</p>
              </div>
              <button
                onClick={() => setCrisisAlert(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition"
              >
                I'm safe, let's chat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Drawer */}
      <SettingsDrawer open={showSettings} onClose={() => setShowSettings(false)} userProfile={userProfile} />
    </div>
  );
}