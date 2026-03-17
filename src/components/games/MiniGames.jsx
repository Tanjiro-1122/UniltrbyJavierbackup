import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GAMES = [
  { id: "wyr", emoji: "🤔", label: "Would You Rather", desc: "Classic dilemmas" },
  { id: "trivia", emoji: "🧠", label: "Trivia Time", desc: "Random fun facts" },
  { id: "questions", emoji: "💬", label: "20 Questions", desc: "I think of something, you guess" },
];

export default function MiniGames({ visible, onClose, onSendMessage }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePlay = async (gameId) => {
    setLoading(true);
    const prompts = {
      wyr: "Generate a fun, creative 'Would You Rather' question. Make it interesting but appropriate. Just give the question, nothing else. Format: Would you rather [option A] or [option B]?",
      trivia: "Generate a fun trivia question with 4 multiple choice answers (A, B, C, D). Include the correct answer at the end. Make it interesting and not too hard. Format:\nQuestion: ...\nA) ...\nB) ...\nC) ...\nD) ...\nAnswer: [letter]",
      questions: "Start a game of 20 Questions. Think of a random object, animal, or person. Tell the user you're thinking of something and they have 20 yes/no questions to guess what it is. Give a hint about the category (animal, object, person, place).",
    };

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[gameId],
        response_json_schema: {
          type: "object",
          properties: { message: { type: "string" } }
        }
      });
      onSendMessage(res.message || "Let's play! 🎮");
      onClose();
    } catch {
      onSendMessage("Let's play a game! Ask me anything 🎮");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", background: "#1a0a2e", borderRadius: "24px 24px 0 0",
            padding: "20px 20px", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "white", fontWeight: 800, fontSize: 20, margin: 0 }}>🎮 Mini Games</h2>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="white" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GAMES.map(g => (
              <button key={g.id} onClick={() => handlePlay(g.id)} disabled={loading}
                style={{
                  padding: "16px", borderRadius: 16, width: "100%",
                  background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                  cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                <span style={{ fontSize: 28 }}>{g.emoji}</span>
                <div style={{ textAlign: "left" }}>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>{g.label}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{g.desc}</p>
                </div>
              </button>
            ))}
          </div>
          {loading && <p style={{ color: "rgba(168,85,247,0.7)", fontSize: 12, textAlign: "center", marginTop: 12 }}>Generating... ✨</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}