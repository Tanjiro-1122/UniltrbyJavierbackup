import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Settings, AlertTriangle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CompanionAvatar from "@/components/CompanionAvatar";
import ChatBubble from "@/components/ChatBubble";
import SettingsDrawer from "@/components/SettingsDrawer";

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

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a0a2e] flex flex-col max-w-[430px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-white font-bold">{companion.name}</h1>
          <p className="text-white/50 text-xs capitalize">{companionMood} mode</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Avatar Zone */}
      <div className="flex-1 flex items-center justify-center py-6">
        <CompanionAvatar mood={companionMood} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
              <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-2xl rounded-bl-none">
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
      <div className="px-4 pb-6 pt-2">
        <div className="flex gap-2 items-end bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2">
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
            className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg disabled:opacity-50 active:scale-90 transition"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Crisis Alert */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/50 flex items-end max-w-[430px] mx-auto"
          >
            <motion.div className="w-full bg-red-950/95 backdrop-blur border-t border-red-500/30 px-4 py-6">
              <div className="flex gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-bold">We're concerned</h3>
                  <p className="text-white/80 text-sm mt-1">If you're having thoughts of self-harm, please reach out to a crisis counselor:</p>
                </div>
              </div>
              <div className="space-y-2 mb-4 text-sm text-white/90">
                <p>🆘 <strong>988 Suicide & Crisis Lifeline</strong> (US): Call or text 988</p>
                <p>🌍 <strong>Crisis Text Line</strong>: Text HOME to 741741</p>
              </div>
              <button
                onClick={() => setCrisisAlert(false)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-semibold transition"
              >
                I'm safe, continue chatting
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