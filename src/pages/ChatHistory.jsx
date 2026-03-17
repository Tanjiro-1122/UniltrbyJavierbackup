import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MessageCircle, Calendar, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/shell/AppShell";

export default function ChatHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profileId = localStorage.getItem("userProfileId");
    if (!profileId) { setLoading(false); return; }

    base44.entities.Message.filter(
      { user_profile_id: profileId },
      "-created_date",
      200
    ).then(msgs => {
      // Group messages by date
      const grouped = {};
      msgs.forEach(m => {
        const date = new Date(m.created_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(m);
      });
      const sessionList = Object.entries(grouped).map(([date, msgs]) => ({
        date,
        count: msgs.length,
        preview: msgs[0]?.content?.slice(0, 80) || "",
        lastTime: new Date(msgs[0]?.created_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      }));
      setSessions(sessionList);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AppShell bg="#0d0118" tabs={false} style={{ background: "#0d0118" }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate("/chat")}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Chat History</h1>
      </div>

      <div className="scroll-area" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {!loading && sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <MessageCircle size={40} color="rgba(168,85,247,0.3)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No chat history yet</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Start chatting to see your conversations here</p>
          </div>
        )}
        {sessions.map((s, i) => (
          <div key={i} style={{
            padding: "14px 16px", borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={13} color="rgba(168,85,247,0.6)" />
                <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{s.date}</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{s.lastTime}</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.preview}...
            </p>
            <span style={{ color: "rgba(168,85,247,0.5)", fontSize: 10, marginTop: 4, display: "inline-block" }}>
              {s.count} messages
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}