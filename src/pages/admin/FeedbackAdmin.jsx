import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/shell/AppShell";

const CATEGORY_COLORS = {
  "Bug Report":       { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  "Something Broke":  { bg: "rgba(249,115,22,0.15)",  color: "#fb923c" },
  "Feature Request":  { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  "General Feedback": { bg: "rgba(168,85,247,0.15)",  color: "#c084fc" },
};

const STATUS_CYCLE = { "New": "In Progress", "In Progress": "Resolved", "Resolved": "New" };
const STATUS_STYLES = {
  "New":         { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  "In Progress": { bg: "rgba(234,179,8,0.15)",   color: "#facc15" },
  "Resolved":    { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
};

export default function FeedbackAdmin() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== "admin") { navigate("/"); return; }
      setAuthorized(true);
      const data = await base44.entities.Feedback.list("-created_date", 100);
      setItems(data);
      setLoading(false);
    };
    load();
  }, []);

  const toggleStatus = async (item) => {
    const newStatus = STATUS_CYCLE[item.status] || "New";
    await base44.entities.Feedback.update(item.id, { status: newStatus });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
  };

  const filtered = filter === "All" ? items : items.filter(i => i.status === filter);

  if (!authorized) return null;

  return (
    <AppShell tabs={false} bg="linear-gradient(180deg, #0a0a0f 0%, #1a0a2e 100%)"  >
      {/* Header */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px 14px",
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={() => navigate("/AdminDashboard")}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Feedback</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{items.length} submissions</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ flexShrink: 0, display: "flex", gap: 6, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {["All", "New", "In Progress", "Resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
              borderColor: filter === f ? "#a855f7" : "rgba(255,255,255,0.1)",
              background: filter === f ? "rgba(168,85,247,0.2)" : "transparent",
              color: filter === f ? "#c084fc" : "rgba(255,255,255,0.4)",
            }}>
            {f}
          </button>
        ))}
      </div>

      <div className="scroll-area px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.25)", textAlign: "center", paddingTop: 60, fontSize: 14 }}>No submissions yet.</p>
        ) : (
          filtered.map(item => {
            const catStyle  = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["General Feedback"];
            const statStyle = STATUS_STYLES[item.status] || STATUS_STYLES["New"];
            const date = new Date(item.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return (
              <div key={item.id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "14px 16px",
              }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: catStyle.bg, color: catStyle.color }}>
                    {item.category}
                  </span>
                  <button onClick={() => toggleStatus(item)}
                    style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: statStyle.bg, color: statStyle.color, border: "none", cursor: "pointer" }}>
                    {item.status}
                  </button>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginLeft: "auto" }}>{date}</span>
                </div>

                {/* Message */}
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.55, margin: "0 0 8px", wordBreak: "break-word" }}>
                  {item.message}
                </p>

                {/* Bottom row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                    {item.display_name || "Anonymous"}
                  </span>
                  {item.page_context && (
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>· {item.page_context}</span>
                  )}
                  {item.rating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} fill={s <= item.rating ? "#f59e0b" : "transparent"} color={s <= item.rating ? "#f59e0b" : "rgba(255,255,255,0.15)"} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}