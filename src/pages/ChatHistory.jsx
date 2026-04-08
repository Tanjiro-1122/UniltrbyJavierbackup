import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MessageCircle, Calendar, Search, X, Trash2, Lock, RefreshCw } from "lucide-react";
import AppShell from "@/components/shell/AppShell";

const B44_APP  = "69b332a392004d139d4ba495";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const DB_TOKEN = "1156284fb9144ad9ab95afc962e848d8";
const DB_HDR   = { "Authorization": `Bearer ${DB_TOKEN}`, "Content-Type": "application/json" };

const HISTORY_LIMITS = {
  free: 10, plus: 50, pro: 100, annual: 9999,
};

function getTier() {
  if (localStorage.getItem("unfiltr_family_unlock") === "true" ||
      localStorage.getItem("unfiltr_msg_limit_override") === "true") return "annual";
  if (localStorage.getItem("unfiltr_is_annual")  === "true") return "annual";
  if (localStorage.getItem("unfiltr_is_pro")     === "true") return "pro";
  if (localStorage.getItem("unfiltr_is_premium") === "true") return "plus";
  return "free";
}
const TIER_LABELS = { free:"Free", plus:"Plus", pro:"Pro", annual:"Annual" };

export default function ChatHistory() {
  const navigate = useNavigate();
  const [sessions,    setSessions]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [expandedId,  setExpandedId]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [dataSource,  setDataSource]  = useState("local"); // "db" | "local" | "merged"
  const [deleting,    setDeleting]    = useState(null);

  const tier      = getTier();
  const tierLabel = TIER_LABELS[tier];
  const limit     = HISTORY_LIMITS[tier];
  const isFree    = tier === "free";

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    setLoading(true);
    const appleId = localStorage.getItem("unfiltr_apple_user_id");
    let dbSessions = [];
    let localSessions = [];

    // ── Pull from DB ────────────────────────────────────────────────────
    if (appleId) {
      try {
        const res = await fetch(
          `${B44_BASE}/ChatHistory?apple_user_id=${encodeURIComponent(appleId)}&limit=200&sort=-saved_at`,
          { headers: { "Authorization": `Bearer ${DB_TOKEN}` } }
        );
        const data = await res.json();
        const records = Array.isArray(data) ? data : (data?.records || []);
        dbSessions = records.map(r => ({
          id:             r.id,          // DB record ID — used for deletion
          _dbId:          r.id,
          date:           r.saved_at || r.created_date,
          companion_name: r.companion_name || null,
          message_count:  r.message_count || 0,
          messages:       (() => { try { return JSON.parse(r.messages || "[]"); } catch { return []; } })(),
          _source:        "db",
        }));
      } catch(e) {}
    }

    // ── Pull from localStorage ──────────────────────────────────────────
    try {
      localSessions = JSON.parse(localStorage.getItem("unfiltr_chat_sessions") || "[]").map(s => ({
        ...s, _source: "local",
      }));
    } catch {}

    // ── Merge: DB wins for same date window, deduplicate by proximity ──
    let merged = [...dbSessions];
    localSessions.forEach(ls => {
      const lsTime = new Date(ls.date).getTime();
      const tooClose = dbSessions.some(ds => Math.abs(new Date(ds.date).getTime() - lsTime) < 5 * 60 * 1000);
      if (!tooClose) merged.push(ls);
    });

    // Sort newest first, enforce tier limit
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    merged = merged.slice(0, limit === 9999 ? 9999 : limit);

    const src = dbSessions.length > 0 && localSessions.length > 0 ? "merged"
              : dbSessions.length > 0 ? "db" : "local";
    setDataSource(src);
    setSessions(merged);
    setLoading(false);
  };

  const handleDelete = async (session) => {
    setDeleting(session.id);
    // Delete from DB if it came from DB
    if (session._dbId) {
      try {
        await fetch(`${B44_BASE}/ChatHistory/${session._dbId}`, {
          method: "DELETE", headers: { "Authorization": `Bearer ${DB_TOKEN}` },
        });
      } catch(e) {}
    }
    // Always remove from localStorage too
    const local = JSON.parse(localStorage.getItem("unfiltr_chat_sessions") || "[]");
    const updated = local.filter(s => s.id !== session.id);
    localStorage.setItem("unfiltr_chat_sessions", JSON.stringify(updated));

    setSessions(prev => prev.filter(s => s.id !== session.id));
    if (expandedId === session.id) setExpandedId(null);
    setDeleting(null);
  };

  const handleClearAll = async () => {
    if (!confirm("Delete all chat history? This can't be undone.")) return;
    const appleId = localStorage.getItem("unfiltr_apple_user_id");
    // Delete all DB records for this user (batch — fire-and-forget)
    if (appleId) {
      sessions.filter(s => s._dbId).forEach(s => {
        fetch(`${B44_BASE}/ChatHistory/${s._dbId}`, {
          method: "DELETE", headers: { "Authorization": `Bearer ${DB_TOKEN}` },
        }).catch(() => {});
      });
    }
    localStorage.removeItem("unfiltr_chat_sessions");
    setSessions([]);
    setExpandedId(null);
  };

  const filtered = sessions.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const preview = s.messages?.find(m => m.role === "user")?.content || s.messages?.[0]?.content || "";
    return (
      preview.toLowerCase().includes(q) ||
      (s.companion_name || "").toLowerCase().includes(q) ||
      (s.date || "").toLowerCase().includes(q)
    );
  });

  const sourceLabel = dataSource === "db" ? "✦ Synced across devices"
                    : dataSource === "merged" ? "✦ Device + cloud merged"
                    : "Device only";

  return (
    <AppShell bg="#0d0118" tabs={false} style={{ background: "#0d0118" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button onClick={() => navigate("/chat")}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Chat History</h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>
            {loading ? "Loading..." : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} · ${tierLabel} · ${sourceLabel}`}
          </p>
        </div>
        <button onClick={loadSessions} title="Refresh"
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          <RefreshCw size={15} color="rgba(255,255,255,0.4)" />
        </button>
        {sessions.length > 0 && (
          <button onClick={handleClearAll}
            style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "rgba(239,68,68,0.7)", fontSize: 11, fontWeight: 600, WebkitTapHighlightColor: "transparent" }}>
            Clear All
          </button>
        )}
      </motion.div>

      {/* Upgrade nudge */}
      {isFree && !loading && (
        <motion.div initial={{ opacity: 0, scaleY: 0.95 }} animate={{ opacity: 1, scaleY: 1 }}
          style={{ margin: "12px 16px 0", background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => navigate("/Pricing")}>
          <Lock size={16} color="rgba(196,181,253,0.7)" />
          <p style={{ color: "rgba(196,181,253,0.8)", fontSize: 12, margin: 0, flex: 1 }}>
            Free plan saves last 10 sessions. <span style={{ color: "#c4b5fd", fontWeight: 700 }}>Upgrade for full history →</span>
          </p>
        </motion.div>
      )}

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "10px 14px" }}>
          <Search size={16} color="rgba(255,255,255,0.35)" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: 14 }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={16} color="rgba(255,255,255,0.4)" />
            </button>
          )}
        </div>
      </motion.div>

      <div className="scroll-area" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div>Loading your conversations...</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && !search && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ textAlign: "center", padding: "70px 24px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>No conversations yet</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginBottom: 24 }}>Start chatting and your sessions will appear here</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/vibe")}
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", borderRadius: 16, padding: "14px 28px", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Start a Chat ✨
            </motion.button>
          </motion.div>
        )}

        {/* No search results */}
        {!loading && sessions.length > 0 && filtered.length === 0 && search && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
              No conversations matching <strong style={{ color: "white" }}>"{search}"</strong>
            </p>
            <button onClick={() => setSearch("")}
              style={{ marginTop: 12, background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 16px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              Clear search
            </button>
          </motion.div>
        )}

        {/* Session list */}
        <AnimatePresence>
          {!loading && filtered.map((s, index) => {
            const dateObj  = new Date(s.date);
            const dateStr  = isNaN(dateObj) ? s.date : dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            const timeStr  = isNaN(dateObj) ? "" : dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const msgCount = s.messages?.length || s.message_count || 0;
            const preview  = s.messages?.find(m => m.role === "user")?.content || s.messages?.[0]?.content || "";
            const isExpanded = expandedId === s.id;
            const isCloud    = s._source === "db";

            return (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                style={{ borderRadius: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${isCloud ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.08)"}`, overflow: "hidden" }}>

                <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar size={13} color="rgba(168,85,247,0.6)" />
                      <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{dateStr}</span>
                      {isCloud && <span style={{ fontSize: 9, color: "rgba(168,85,247,0.6)", background: "rgba(168,85,247,0.1)", borderRadius: 6, padding: "1px 5px" }}>cloud</span>}
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{timeStr}</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {preview || "Conversation with " + (s.companion_name || "companion")}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ color: "rgba(168,85,247,0.5)", fontSize: 10 }}>
                      {msgCount} messages{s.companion_name ? ` · ${s.companion_name}` : ""}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{isExpanded ? "▲ collapse" : "▼ expand"}</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px" }}>
                        <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                          {s.messages?.length > 0 ? s.messages.map((m, i) => (
                            <div key={i} style={{
                              padding: "8px 12px", borderRadius: 12, fontSize: 12, lineHeight: 1.5,
                              background: m.role === "user" ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.05)",
                              color: m.role === "user" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
                              alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%",
                            }}>
                              {m.content}
                            </div>
                          )) : (
                            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>
                              Message content not stored for this session
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleDelete(s)} disabled={deleting === s.id}
                          style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "6px 14px", cursor: "pointer", color: "rgba(239,68,68,0.7)", fontSize: 11, fontWeight: 600, WebkitTapHighlightColor: "transparent", opacity: deleting === s.id ? 0.5 : 1 }}>
                          <Trash2 size={12} />
                          {deleting === s.id ? "Deleting..." : "Delete this session"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
