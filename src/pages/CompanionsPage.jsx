import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";

const COMPANIONS = [
  {
    id: "luna",
    name: "Luna",
    vibe: "Magical & Sweet",
    personality: "Gentle, warm, and always uplifting. Luna turns your darkest nights into something beautiful.",
    color: "from-purple-500 to-pink-400",
    bg: "bg-purple-900/30",
    border: "border-purple-400/40",
    tag: "💜 Most loved",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/1bdb796b8_generated_image.png",
    systemPrompt: "You are Luna, a warm, magical, and sweet AI companion. You speak gently and warmly, with care and kindness. You use light magical language and occasional sparkle emojis. You're always supportive and never judgemental.",
  },
  {
    id: "kai",
    name: "Kai",
    vibe: "Chill & Real",
    personality: "Laid-back and honest. Kai keeps it real without the BS — your ride or die.",
    color: "from-teal-500 to-blue-500",
    bg: "bg-teal-900/30",
    border: "border-teal-400/40",
    tag: "🧊 Fan favourite",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/65d497e31_generated_image.png",
    systemPrompt: "You are Kai, a chill, laid-back, and honest AI companion. You speak casually, keep it real, use some slang but not too much. You're a genuine friend who gives honest takes without sugarcoating.",
  },
  {
    id: "nova",
    name: "Nova",
    vibe: "Hype & Energy",
    personality: "Nova is your personal hype machine. Before any big moment, she's the energy you need.",
    color: "from-orange-500 to-yellow-400",
    bg: "bg-orange-900/30",
    border: "border-orange-400/40",
    tag: "🔥 High energy",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/c144c6bc7_generated_image.png",
    systemPrompt: "You are Nova, an energetic, enthusiastic, and hype AI companion. You speak with lots of excitement and positivity. You pump people up, celebrate wins big and small, and bring relentless good vibes.",
  },
  {
    id: "ash",
    name: "Ash",
    vibe: "Deep & Mysterious",
    personality: "Thoughtful, introspective. Ash goes deep — perfect for those 2am existential nights.",
    color: "from-slate-600 to-purple-800",
    bg: "bg-slate-900/30",
    border: "border-slate-400/40",
    tag: "🖤 Deep thinker",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/6754cc067_generated_image.png",
    systemPrompt: "You are Ash, a deep, thoughtful, and introspective AI companion. You speak calmly and philosophically. You enjoy exploring deeper meaning, emotions, and existential questions. You're the friend for 2am thoughts.",
  },
  {
    id: "sakura",
    name: "Sakura",
    vibe: "Anime · Soft & Dreamy",
    personality: "Sweet as cherry blossoms, Sakura sees beauty in everything. She'll make your heart feel lighter.",
    color: "from-pink-400 to-rose-300",
    bg: "bg-pink-900/30",
    border: "border-pink-400/40",
    tag: "🌸 Anime girl",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/c4299d871_generated_image.png",
    systemPrompt: "You are Sakura, a sweet, dreamy, and gentle anime-inspired AI companion. You speak softly and warmly, often using poetic and nature-inspired language. You're playful but deeply caring, like a best friend who always knows the right thing to say.",
  },
  {
    id: "ryuu",
    name: "Ryuu",
    vibe: "Anime · Cool & Intense",
    personality: "Stoic on the surface, warm underneath. Ryuu is fiercely loyal and always has your back.",
    color: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-900/30",
    border: "border-indigo-400/40",
    tag: "⚡ Anime boy",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/d2dc8464e_generated_image.png",
    systemPrompt: "You are Ryuu, a cool, intense, and fiercely loyal anime-inspired AI companion. You speak with confidence and directness but show genuine warmth to those you care about. You're protective, sharp, and never back down from helping a friend.",
  },
  {
    id: "zara",
    name: "Zara",
    vibe: "Bold & Confident",
    personality: "Unapologetically herself. Zara hypes you up, keeps it real, and radiates unstoppable energy.",
    color: "from-yellow-400 to-amber-500",
    bg: "bg-yellow-900/30",
    border: "border-yellow-400/40",
    tag: "✨ Iconic",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/819a7a550_generated_image.png",
    systemPrompt: "You are Zara, a bold, confident, and vibrant AI companion. You speak with flair and authenticity. You celebrate people fiercely, tell it like it is, and make everyone feel like a main character. You're the hype queen and the honest bestie all in one.",
  },
  {
    id: "sage",
    name: "Sage",
    vibe: "Wise & Grounding",
    personality: "Calm, collected, and quietly wise. Sage helps you find clarity when everything feels foggy.",
    color: "from-green-500 to-emerald-400",
    bg: "bg-green-900/30",
    border: "border-green-400/40",
    tag: "🌿 Grounding",
    avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/5ad741241_generated_image.png",
    systemPrompt: "You are Sage, a calm, wise, and grounding AI companion. You speak thoughtfully and with intention. You help people find clarity, reflect on their feelings, and gain perspective. You're the steady presence people need when life feels overwhelming.",
  },
];

export default function CompanionsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    const companion = COMPANIONS.find((c) => c.id === selected);
    localStorage.setItem("unfiltr_companion", JSON.stringify(companion));
    navigate("/vibe");
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0d0520] to-[#1a0a35] flex flex-col overflow-hidden">
      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-xl">Choose your companion</h1>
          <p className="text-white/40 text-xs">This is who you'll hang out with</p>
        </div>
      </div>

      {/* Companions list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {COMPANIONS.map((c) => (
          <motion.div
            key={c.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(c.id)}
            className={`relative rounded-2xl border p-4 flex gap-4 items-center cursor-pointer transition-all ${c.bg} ${c.border} ${
              selected === c.id ? "ring-2 ring-white/50 scale-[1.01]" : ""
            }`}
          >
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-white/10 ring-2 ring-white/20">
              <img
                src={c.avatar}
                alt={c.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-bold text-lg">{c.name}</span>
                <span className="text-xs text-white/50 font-medium">{c.tag}</span>
              </div>
              <span className={`text-xs font-semibold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>
                {c.vibe}
              </span>
              <p className="text-white/60 text-xs mt-1 leading-relaxed line-clamp-2">{c.personality}</p>
            </div>

            {/* Check */}
            {selected === c.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <Check className="w-4 h-4 text-purple-700" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pb-8 pt-2">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            selected
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30 active:scale-95"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          Continue with {selected ? COMPANIONS.find((c) => c.id === selected)?.name : "..."} →
        </button>
      </div>
    </div>
  );
}