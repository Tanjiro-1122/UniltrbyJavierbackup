import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Search, X, Trash2, Lock, MessageCircle } from "lucide-react";
import AppShell from "@/components/shell/AppShell";
import { getTier, HISTORY_LIMITS, PLAN_LABELS } from "@/lib/entitlements";

const B44_APP  = "69b332a392004d139d4ba495";
const B44_BASE = `https://api.base44.com/api/apps/${B44_APP}/entities`;
const DB_TOKEN = "1156284fb9144ad9ab95afc962e848d8";
const DB_HDR   = { "Authorization": `Bearer ${DB_TOKEN}`, "Content-Type": "application/json" };

const HISTORY_LABELS = {
  free:   `Free — last ${HISTORY_LIMITS.free} conversations kept`,
  plus:   `${PLAN_LABELS.plus} — last ${HISTORY_LIMITS.plus} conversations kept`,
  pro:    `${PLAN_LABELS.pro} — last ${HISTORY_LIMITS.pro} conversations kept`,
  annual: `${PLAN_LABELS.annual} — unlimited history`,
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function ChatHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const tier = getTier();
  const limit = HISTORY_LIMITS[tier];
  const appleUserId = localStorage.getItem("unfiltr_apple_user_id") || localStorage.getItem("unfiltr_device_id");
  const nickName = localStorage.getItem("unfiltr_companion_nickname") || "your companion";

  useEffect(() => {
    if (!appleUserId) { setLoading(false); return; }
    fetch(`${B44_BASE}/ChatHistory/query`, {
      method: "POST", headers: DB_HDR,
      body: JSON.stringify({ filters: [{ field: "apple_user_id", operator: "eq", value: appleUserId }], sort: [{ field: "saved_at", direction: "desc" }], limit: limit }),
    })
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d) ? d : (d.items || [])); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appleUserId, limit]);

  const filtered = sessions.filter(s => {
    if (!search) return true;
    try {
      const msgs = JSON.parse(s.messages || "[]");
      return msgs.some(m => m.content?.toLowerCase().includes(search.toLowerCase()));
    } catch { return false; }
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`${B44_BASE}/ChatHistory/${id}`, { method: "DELETE", headers: DB_HDR });
      setSessions(prev => prev.filter(s => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {}
    setDeleting(null);
  };

  const getMsgPreview = (session) => {
    try {
      const msgs = JSON.parse(session.messages || "[]");
      const last = [...msgs].reverse().find(m => m.role === "assistant");
      return last?.content?.slice(0, 90) || "No messages";
    } catch { return ""; }
  };

  const getMsgCount = (session) => {
    try { return JSON.parse(session.messages || "[]").length; } catch { return 0; }
  };

  return (
    <AppShell>
      <div style={{
        position: "fixed", inset: 0, overflow: "hidden",
        fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
        background: "radial-gradient(ellipse at 50% 0%, rgba(88,28,220,0.4) 0%, #0a0118 35%, #04010d 100%)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Nebula glow */}
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 440, height: 320, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(109,40,217,0.35) 0%, transparent 68%)",
          filter: "blur(50px)", pointerEvents: "none", zIndex: 0,
        }} />

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            flexShrink: 0, position: "relative", zIndex: 10,
            paddingTop: "max(54px, env(safe-area-inset-top, 54px))",
            padding: "max(54px, env(safe-area-inset-top, 54px)) 20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <button onClick={() => navigate("/hub")} style={{
              width: 40, height: 40, borderRadius: "50%", border: "none", flexShrink: 0,
              background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}>
              <ChevronLeft size={20} color="white" />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ color: "white", fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: "-0.4px" }}>
                💬 Chat History
              </h1>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "2px 0 0" }}>
                {sessions.length > 0 ? `${sessions.length} saved session${sessions.length !== 1 ? "s" : ""} with ${nickName}` : `Conversations with ${nickName}`}
              </p>
            </div>
            <div style={{
              padding: "5px 11px", borderRadius: 99, flexShrink: 0,
              background: tier === "free" ? "rgba(251,191,36,0.12)" : "rgba(139,92,246,0.12)",
              border: `1px solid ${tier === "free" ? "rgba(251,191,36,0.3)" : "rgba(139,92,246,0.3)"}`,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Lock size={11} color={tier === "free" ? "#fbbf24" : "#a78bfa"} />
              <span style={{ color: tier === "free" ? "#fbbf24" : "#a78bfa", fontSize: 11, fontWeight: 700 }}>
                {tier === "annual" ? "∞" : limit} saved
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.07)", borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "10px 14px",
          }}>
            <Search size={15} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "white", fontSize: 14, fontFamily: "inherit",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={15} color="rgba(255,255,255,0.4)" />
              </button>
            )}
          </div>

          {/* Retention policy info */}
          <div style={{
            marginTop: 10, padding: "8px 14px", borderRadius: 10,
            background: tier === "free" ? "rgba(251,191,36,0.07)" : "rgba(139,92,246,0.07)",
            border: `1px solid ${tier === "free" ? "rgba(251,191,36,0.18)" : "rgba(139,92,246,0.18)"}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>{tier === "free" ? "🔒" : "✨"}</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.4 }}>
              {HISTORY_LABELS[tier]}. AI memory (summaries & facts) is always preserved.
            </span>
          </div>
        </motion.div>

        {/* ── SESSION LIST ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 120px", position: "relative", zIndex: 5 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  height: 90, borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", marginTop: 60, padding: "0 32px" }}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>
                {search ? "No matches found" : "No saved sessions yet"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                {search ? "Try a different search term" : `Your conversations with ${nickName} will appear here after you save them.`}
              </p>
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((session, i) => {
                const isExpanded = expandedId === session.id;
                const preview = getMsgPreview(session);
                const count = getMsgCount(session);
                let msgs = [];
                try { msgs = JSON.parse(session.messages || "[]"); } catch {}

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      borderRadius: 20,
                      border: isExpanded ? "1.5px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      background: isExpanded
                        ? "linear-gradient(145deg, rgba(109,40,217,0.2), rgba(76,29,149,0.12))"
                        : "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(16px)",
                      overflow: "hidden",
                      boxShadow: isExpanded ? "0 0 30px rgba(139,92,246,0.2)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {/* Session header row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      style={{
                        width: "100%", padding: "16px 18px",
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                        background: isExpanded ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isExpanded ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <MessageCircle size={20} color={isExpanded ? "#a78bfa" : "rgba(255,255,255,0.4)"} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ color: isExpanded ? "#c4b5fd" : "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 14 }}>
                            {formatDate(session.saved_at)}
                          </span>
                          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                            {formatTime(session.saved_at)}
                          </span>
                          <span style={{
                            padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                            background: "rgba(139,92,246,0.15)", color: "#a78bfa",
                            border: "1px solid rgba(139,92,246,0.25)",
                          }}>
                            {count} msgs
                          </span>
                        </div>
                        <p style={{
                          color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          lineHeight: 1.4,
                        }}>
                          {preview}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        disabled={deleting === session.id}
                        style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", WebkitTapHighlightColor: "transparent",
                          opacity: deleting === session.id ? 0.5 : 1,
                        }}
                      >
                        {deleting === session.id
                          ? <div style={{ width: 12, height: 12, border: "2px solid #ef4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                          : <Trash2 size={14} color="#ef4444" />
                        }
                      </button>
                    </button>

                    {/* Expanded messages */}
                    <AnimatePresence>
                      {isExpanded && msgs.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div style={{ padding: "12px 18px 16px", display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
                            {msgs.slice(0, 20).map((m, j) => (
                              <div key={j} style={{
                                display: "flex",
                                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                              }}>
                                <div style={{
                                  maxWidth: "82%", padding: "9px 14px", borderRadius: 16,
                                  background: m.role === "user"
                                    ? "linear-gradient(135deg, rgba(109,40,217,0.7), rgba(139,92,246,0.5))"
                                    : "rgba(255,255,255,0.07)",
                                  border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                                  color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.45,
                                  borderBottomRightRadius: m.role === "user" ? 4 : 16,
                                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 16,
                                }}>
                                  {m.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );
}
