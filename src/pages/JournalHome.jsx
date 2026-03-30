import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, PenLine, Globe } from "lucide-react";

export default function JournalHome() {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: "linear-gradient(160deg, #060210 0%, #0f0525 50%, #0a1a10 100%)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4 shrink-0"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">

        {/* Journal icon + title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <div style={{ fontSize: 64 }} className="mb-4">📓</div>
          <h1
            className="text-white text-3xl font-bold mb-2"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            My Journal
          </h1>
          <p className="text-white/30 text-sm">Your private space to think, feel, and grow.</p>
        </motion.div>

        {/* Classic Mode */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/journal/entry")}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-2xl p-5 flex items-center gap-4 text-left"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(16,185,129,0.2))",
            border: "1px solid rgba(168,85,247,0.3)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(168,85,247,0.2)" }}
          >
            <PenLine className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Classic Mode</p>
            <p className="text-white/40 text-sm">Write freely — just you and the page</p>
          </div>
        </motion.button>

        {/* Immersive Mode */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate("/journal/world")}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-2xl p-5 flex items-center gap-4 text-left"
          style={{
            background: "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(109,40,217,0.25))",
            border: "1px solid rgba(14,165,233,0.3)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(14,165,233,0.2)" }}
          >
            <Globe className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Immersive Mode</p>
            <p className="text-white/40 text-sm">Write inside a world with your companion</p>
          </div>
        </motion.button>

        {/* Saved Entries */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate("/journal/list")}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-2xl p-5 flex items-center gap-4 text-left"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Saved Entries</p>
            <p className="text-white/40 text-sm">Read your past journal entries</p>
          </div>
        </motion.button>

      </div>

      {/* Bottom quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-white/15 text-xs pb-10 px-8"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        "Writing is the painting of the voice." 🌙
      </motion.p>
    </div>
  );
}
