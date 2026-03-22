import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, PenLine, Trash2 } from "lucide-react";

export default function JournalList() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    setEntries(stored);
    setLoading(false);
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const preview = (text) => text?.length > 120 ? text.slice(0, 120) + "..." : text;

  const deleteEntry = (id) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 flex flex-col"
      style={{ background: "linear-gradient(160deg, #060210 0%, #0f0525 50%, #0a1a10 100%)" }}>

      <div className="flex items-center gap-3 px-4 pb-4 shrink-0"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button onClick={() => navigate("/journal")}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-lg" style={{ fontFamily: "'Georgia', serif" }}>Saved Entries</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading && (
          <div className="flex justify-center pt-20">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-24 gap-4">
            <span style={{ fontSize: 56 }}>📭</span>
            <p className="text-white/30 text-center text-sm">No entries yet.<br />Start writing something beautiful.</p>
            <button onClick={() => navigate("/journal/entry")}
              className="mt-4 px-6 py-3 rounded-2xl bg-purple-600/60 text-white text-sm font-semibold flex items-center gap-2">
              <PenLine className="w-4 h-4" />Write your first entry
            </button>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((e, i) => (
              <motion.div key={e.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-purple-400/70 text-xs uppercase tracking-widest mb-2">{formatDate(e.created_date)}</p>
                    <p className="text-white/70 text-sm leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
                      {preview(e.content)}
                    </p>
                  </div>
                  <button
                    onClick={() => { if (window.confirm("Delete this journal entry?")) deleteEntry(e.id); }}
                    className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Trash2 className="w-4 h-4 text-white/30" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB — new entry */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}
        onClick={() => navigate("/journal/entry")}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{ background: "linear-gradient(135deg, #7c3aed, #10b981)" }}>
        <PenLine className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}