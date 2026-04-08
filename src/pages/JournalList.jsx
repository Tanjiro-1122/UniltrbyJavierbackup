import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, PenLine, Trash2, RefreshCw } from "lucide-react";

const B44_APP  = "69b332a392004d139d4ba495";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const DB_TOKEN = "1156284fb9144ad9ab95afc962e848d8";

export default function JournalList() {
  const navigate = useNavigate();
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dataSource, setDataSource] = useState("local");
  const [deleting,   setDeleting]   = useState(null);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    const appleId = localStorage.getItem("unfiltr_apple_user_id");
    let dbEntries    = [];
    let localEntries = [];

    // ── DB first ─────────────────────────────────────────────────────────
    if (appleId) {
      try {
        const res  = await fetch(
          `${B44_BASE}/JournalEntry?apple_user_id=${encodeURIComponent(appleId)}&limit=200&sort=-created_date`,
          { headers: { "Authorization": `Bearer ${DB_TOKEN}` } }
        );
        const data    = await res.json();
        const records = Array.isArray(data) ? data : (data?.records || []);
        dbEntries = records.map(r => ({ ...r, _dbId: r.id, _source: "db" }));
      } catch(e) {}
    }

    // ── localStorage ─────────────────────────────────────────────────────
    try {
      localEntries = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]")
        .map(e => ({ ...e, _source: "local" }));
    } catch {}

    // ── Merge: deduplicate by content similarity + date proximity ─────────
    let merged = [...dbEntries];
    localEntries.forEach(le => {
      const leTime = new Date(le.created_date).getTime();
      const tooClose = dbEntries.some(de =>
        Math.abs(new Date(de.created_date).getTime() - leTime) < 60 * 1000 &&
        (de.content || "").slice(0, 60) === (le.content || "").slice(0, 60)
      );
      if (!tooClose) merged.push(le);
    });

    merged.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const src = dbEntries.length > 0 && localEntries.length > 0 ? "merged"
              : dbEntries.length > 0 ? "db" : "local";
    setDataSource(src);
    setEntries(merged);
    setLoading(false);
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const preview = (text) => text?.length > 120 ? text.slice(0, 120) + "…" : text;

  const deleteEntry = async (entry) => {
    if (!window.confirm("Delete this journal entry?")) return;
    setDeleting(entry.id);

    // Delete from DB if cloud entry
    if (entry._dbId) {
      try {
        await fetch(`${B44_BASE}/JournalEntry/${entry._dbId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${DB_TOKEN}` },
        });
      } catch(e) {}
    }

    // Remove from localStorage
    const local = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify(local.filter(e => e.id !== entry.id)));

    setEntries(prev => prev.filter(e => e.id !== entry.id));
    setDeleting(null);
  };

  const sourceLabel = dataSource === "db"     ? "✦ Synced across devices"
                    : dataSource === "merged"  ? "✦ Device + cloud merged"
                    : "Device only";

  return (
    <div className="fixed inset-0 flex flex-col"
      style={{ background: "linear-gradient(160deg, #060210 0%, #0f0525 50%, #0a1a10 100%)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-4 shrink-0"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button onClick={() => navigate("/journal/home")}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg" style={{ fontFamily: "'Georgia', serif" }}>Saved Entries</h1>
          <p className="text-white/30 text-xs mt-0.5">
            {loading ? "Loading..." : `${entries.length} entr${entries.length !== 1 ? "ies" : "y"} · ${sourceLabel}`}
          </p>
        </div>
        <button onClick={loadEntries} title="Refresh"
          className="w-9 h-9 rounded-full bg-white/07 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-white/30" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center pt-20">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
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

        {/* Entry list */}
        {!loading && entries.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map((e, i) => (
                <motion.div key={e.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${e._source === "db" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-purple-400/70 text-xs uppercase tracking-widest">{formatDate(e.created_date)}</p>
                        {e._source === "db" && (
                          <span style={{ fontSize: 9, color: "rgba(168,85,247,0.6)", background: "rgba(168,85,247,0.1)", borderRadius: 6, padding: "1px 5px" }}>cloud</span>
                        )}
                        {e.mood && (
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{e.mood}</span>
                        )}
                      </div>
                      {e.title && (
                        <p className="text-white/90 text-sm font-semibold mb-1" style={{ fontFamily: "'Georgia', serif" }}>{e.title}</p>
                      )}
                      <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
                        {preview(e.content)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteEntry(e)}
                      disabled={deleting === e.id}
                      className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                      style={{ opacity: deleting === e.id ? 0.4 : 1 }}
                    >
                      <Trash2 className="w-4 h-4 text-white/30" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FAB */}
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
