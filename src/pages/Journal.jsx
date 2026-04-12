import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import AppShell from "@/components/shell/AppShell";
import JournalEntryDetail from "@/components/journal/JournalEntryDetail";
import JournalEntryCard from "@/components/journal/JournalEntryCard";
import JournalEmptyState from "@/components/journal/JournalEmptyState";
import JournalWriter from "@/components/journal/JournalWriter";
import { saveJournalEntries } from "@/lib/storageManager";

export default function Journal() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    setEntries(stored);
    setLoading(false);
  }, []);

  const handleDelete = (id) => {
    const updated = entries.filter(x => x.id !== id);
    setEntries(updated);
    saveJournalEntries(updated);
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  // Group entries by month — skip entries with invalid or missing dates
  const grouped = {};
  entries.forEach(entry => {
    const ts = Date.parse(entry.created_date);
    if (!Number.isFinite(ts)) return; // skip NaN / invalid dates silently
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = { label, entries: [] };
    grouped[key].entries.push(entry);
  });
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

  const handleSaveNewEntry = (entry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    saveJournalEntries(updated);
    setWriting(false);
  };

  if (writing) {
    return (
      <AppShell tabs={false} bg="#06020f">
        <JournalWriter onSave={handleSaveNewEntry} onBack={() => setWriting(false)} />
      </AppShell>
    );
  }

  if (selectedEntry) {
    return (
      <JournalEntryDetail
        entry={selectedEntry}
        onBack={() => setSelectedEntry(null)}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <AppShell tabs={false} bg="#06020f">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>My Journal</h1>
            {entries.length > 0 && (
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
            )}
          </div>
          <button onClick={() => setWriting(true)} style={{
            background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <Plus size={18} color="#c084fc" />
          </button>
        </div>

        {/* Content */}
        <div className="scroll-area" style={{ flex: 1, padding: "4px 16px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : entries.length === 0 ? (
            <JournalEmptyState onStartJournal={() => setWriting(true)} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {sortedGroups.map(([key, group]) => (
                <div key={key}>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, paddingLeft: 4 }}>
                    {group.label}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {group.entries.map(entry => (
                      <JournalEntryCard
                        key={entry.id}
                        entry={entry}
                        onSelect={() => setSelectedEntry(entry)}
                        onDelete={() => handleDelete(entry.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}