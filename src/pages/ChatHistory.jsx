import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MessageCircle, Calendar, Search, X, Trash2 } from "lucide-react";
import AppShell from "@/components/shell/AppShell";

export default function ChatHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("unfiltr_chat_sessions") || "[]");
    setSessions(stored);
  }, []);

  const handleDelete = (id) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("unfiltr_chat_sessions", JSON.stringify(updated));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    if (!confirm("Delete all chat history from this device?")) return;
    setSessions([]);
    localStorage.removeItem("unfiltr_chat_sessions");
  };

  const filtered = sessions.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const preview = s.messages?.[0]?.content || "";
    return preview.toLowerCase().includes(q) || s.companion_name?.toLowerCase().includes(q) || s.date?.toLowerCase().includes(q);
  });

  return (
    <AppShell bg="#0d0118" tabs={false} style={{ background: "#0d0118" }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate("/chat")}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Chat History</h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>Stored on this device only</p>
        </div>
        {sessions.length > 0 && (
          <button onClick={handleClearAll}
            style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "rgba(239,68,68,0.7)", fontSize: 11, fontWeight: 600 }}>
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: "10px 14px",
        }}>
          <Search size={16} color="rgba(255,255,255,0.35)" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={16} color="rgba(255,255,255,0.4)" />
            </button>
          )}
        </div>
      </div>

      <div className="scroll-area" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <MessageCircle size={40} color="rgba(168,85,247,0.3)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No chat history yet</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
              Start a new chat to see your conversations here
            </p>
          </div>
        )}
        {filtered.map(s => {
          const date = new Date(s.date);
          const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          const msgCount = s.messages?.length || 0;
          const preview = s.messages?.find(m => m.role === "user")?.content || s.messages?.[0]?.content || "";
          const isExpanded = expandedId === s.id;

          return (
            <div key={s.id} style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                style={{
                  width: "100%", textAlign: "left", padding: "14px 16px",
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={13} color="rgba(168,85,247,0.6)" />
                    <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{dateStr}</span>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{timeStr}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {preview}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ color: "rgba(168,85,247,0.5)", fontSize: 10 }}>
                    {msgCount} messages {s.companion_name ? `· with ${s.companion_name}` : ""}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px" }}>
                  <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {s.messages?.map((m, i) => (
                      <div key={i} style={{
                        padding: "8px 12px", borderRadius: 12, fontSize: 12, lineHeight: 1.5,
                        background: m.role === "user" ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.05)",
                        color: m.role === "user" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)",
                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                      }}>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleDelete(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 10, padding: "6px 14px", cursor: "pointer",
                      color: "rgba(239,68,68,0.7)", fontSize: 11, fontWeight: 600,
                    }}>
                    <Trash2 size={12} />
                    Delete this session
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}