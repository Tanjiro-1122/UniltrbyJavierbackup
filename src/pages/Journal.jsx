import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";
import AppShell from "@/components/shell/AppShell";

const MOOD_EMOJI = {
  happy: "😊", neutral: "😐", sad: "😢", anxious: "😰",
  grateful: "🙏", reflective: "🪞", excited: "🎉",
};

export default function Journal() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const profileId = localStorage.getItem("userProfileId");

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    base44.entities.JournalEntry.filter({ user_profile_id: profileId }, "-created_date", 50)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleDelete = async (id) => {
    await base44.entities.JournalEntry.delete(id);
    setEntries(e => e.filter(x => x.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  if (selectedEntry) {
    return (
      <AppShell tabs={false} bg="#06020f">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <button onClick={() => setSelectedEntry(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ArrowLeft size={18} color="white" />
            </button>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}>{selectedEntry.title || "Journal Entry"}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
                {new Date(selectedEntry.created_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <span style={{ fontSize: 28 }}>{MOOD_EMOJI[selectedEntry.mood] || "📓"}</span>
          </div>
          <div className="scroll-area" style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {selectedEntry.content}
            </p>
            {selectedEntry.companion_name && (
              <p style={{ color: "rgba(168,85,247,0.6)", fontSize: 11, marginTop: 20 }}>
                Written with {selectedEntry.companion_name}
              </p>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell tabs={false} bg="#06020f">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <button onClick={() => navigate("/vibe")} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>My Journal</h1>
        </div>

        <div className="scroll-area" style={{ flex: 1, padding: "8px 16px 20px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <BookOpen size={48} color="rgba(168,85,247,0.3)" style={{ margin: "0 auto 16px" }} />
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600 }}>No journal entries yet</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 4 }}>Start a Journal session to write your first entry</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entries.map(entry => (
                <button key={entry.id} onClick={() => setSelectedEntry(entry)}
                  style={{
                    width: "100%", textAlign: "left", padding: "14px 16px",
                    background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)",
                    borderRadius: 14, cursor: "pointer", position: "relative",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{MOOD_EMOJI[entry.mood] || "📓"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.title || "Untitled"}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "2px 0 0" }}>
                        {new Date(entry.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      style={{ background: "rgba(239,68,68,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Trash2 size={13} color="rgba(239,68,68,0.7)" />
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "8px 0 0", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {entry.content}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}