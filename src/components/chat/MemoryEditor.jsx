import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Edit3, Trash2, Check, Lock, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

// ── MemoryEditor ──────────────────────────────────────────────────────────────
// Lets users see and correct what the companion remembers about them.
// Premium: full edit + delete. Free: blurred teaser to drive upgrades.
// Integrated into Settings and can be surfaced from MemoryCard.

const SECTION_LABELS = {
  name:                "Your Name",
  age:                 "Age",
  location:            "Location",
  occupation:          "Occupation",
  relationship_status: "Relationship Status",
  humor_style:         "Your Humor Style",
  communication_style: "How You Communicate",
};

const ARRAY_SECTION_LABELS = {
  recurring_struggles: { label: "Struggles I Know About", emoji: "💭" },
  core_values:         { label: "What You Care About",    emoji: "💜" },
  goals:               { label: "Your Goals",             emoji: "🎯" },
  hobbies:             { label: "Hobbies & Interests",    emoji: "🎨" },
};

const FREE_TEASERS = [
  "your favorite topics to talk about",
  "how you feel on tough days",
  "what makes you laugh",
  "the things that stress you out",
  "your goals and dreams",
];

function ScalarRow({ label, value, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const handleSave = () => {
    if (draft.trim()) { onSave(draft.trim()); setEditing(false); }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(168,85,247,0.5)",
              borderRadius: 8, color: "white", fontSize: 14, padding: "5px 10px", width: "100%", outline: "none",
            }}
          />
        ) : (
          <div style={{ color: "white", fontSize: 14 }}>{value || <span style={{ color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>not set</span>}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {editing ? (
          <>
            <IconBtn onClick={handleSave} color="#a855f7"><Check size={13} /></IconBtn>
            <IconBtn onClick={() => setEditing(false)} color="rgba(255,255,255,0.3)"><X size={13} /></IconBtn>
          </>
        ) : (
          <>
            <IconBtn onClick={() => { setDraft(value || ""); setEditing(true); }} color="rgba(255,255,255,0.3)"><Edit3 size={13} /></IconBtn>
            {value && <IconBtn onClick={onDelete} color="#ef4444"><Trash2 size={13} /></IconBtn>}
          </>
        )}
      </div>
    </div>
  );
}

function ArraySection({ label, emoji, items = [], onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const handleAdd = () => {
    if (draft.trim()) { onAdd(draft.trim()); setDraft(""); setAdding(false); }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setCollapsed(c => !c)} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        cursor: "pointer", padding: "4px 0", width: "100%",
      }}>
        <span style={{ fontSize: 14 }}>{emoji}</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, flex: 1, textAlign: "left" }}>
          {label}{items.length > 0 && <span style={{ color: "rgba(168,85,247,0.6)", fontWeight: 400, marginLeft: 6 }}>({items.length} {items.length === 1 ? "item" : "items"})</span>}
        </span>
        {collapsed ? <ChevronDown size={13} color="rgba(255,255,255,0.3)" /> : <ChevronUp size={13} color="rgba(255,255,255,0.3)" />}
      </button>

      {!collapsed && (
        <div style={{ marginTop: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 8,
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.12)",
              marginBottom: 4,
            }}>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, flex: 1 }}>{item}</span>
              <IconBtn onClick={() => onDelete(i)} color="#ef4444"><Trash2 size={11} /></IconBtn>
            </div>
          ))}
          {adding ? (
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
                placeholder="Type and press Enter…"
                style={{
                  flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(168,85,247,0.5)",
                  borderRadius: 8, color: "white", fontSize: 13, padding: "6px 10px", outline: "none",
                }}
              />
              <IconBtn onClick={handleAdd} color="#a855f7"><Check size={13} /></IconBtn>
              <IconBtn onClick={() => setAdding(false)} color="rgba(255,255,255,0.3)"><X size={13} /></IconBtn>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{
              marginTop: 4, background: "none", border: "1px dashed rgba(168,85,247,0.3)",
              borderRadius: 8, color: "rgba(168,85,247,0.6)", fontSize: 12, padding: "5px 12px", cursor: "pointer", width: "100%",
            }}>
              + Add
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ onClick, color, children }) {
  return (
    <button onClick={onClick} style={{
      width: 26, height: 26, borderRadius: 6,
      background: "rgba(255,255,255,0.06)", border: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color,
    }}>
      {children}
    </button>
  );
}

export default function MemoryEditor({ isPremium, onUpgrade, profileId }) {
  const [open, setOpen] = useState(false);
  const [facts, setFacts] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const hasFacts = facts && Object.keys(facts).some(k => facts[k] && (!Array.isArray(facts[k]) || facts[k].length > 0));
  const factsCount = hasFacts ? Object.values(facts).flat().filter(Boolean).length : 0;

  useEffect(() => {
    if (open && isPremium) {
      // Load from localStorage first (fast)
      try {
        const cached = localStorage.getItem("unfiltr_user_facts");
        if (cached) setFacts(JSON.parse(cached));
      } catch {}

      // Fetch from DB — use profileId OR apple_user_id as fallback
      const resolvedProfileId = profileId || null;
      const appleUserId = localStorage.getItem("unfiltr_apple_user_id") || localStorage.getItem("unfiltr_user_id") || null;

      if (resolvedProfileId || appleUserId) {
        setLoading(true);
        fetch("/api/syncProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get", profileId: resolvedProfileId, appleUserId }),
        })
          .then(r => r.json())
          .then(data => {
            if (data?.user_facts && Object.keys(data.user_facts).length > 0) {
              setFacts(data.user_facts);
              localStorage.setItem("unfiltr_user_facts", JSON.stringify(data.user_facts));
            } else if (!profileId) {
              // No facts found with fallback either — show empty state gracefully
              setFacts({});
            }
          })
          .catch(() => setFacts(prev => prev || {}))
          .finally(() => setLoading(false));
      } else {
        // No identity at all — set empty so empty state shows
        setFacts({});
      }
    }
  }, [open, isPremium, profileId, refreshKey]);

  const saveToDb = async (updatedFacts) => {
    if (!profileId) return;
    setSaving(true);
    try {
      await fetch("/api/syncProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          profileId,
          updateData: { user_facts: updatedFacts },
        }),
      });
      localStorage.setItem("unfiltr_user_facts", JSON.stringify(updatedFacts));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const updateScalar = (key, value) => {
    const updated = { ...facts, [key]: value };
    setFacts(updated);
    saveToDb(updated);
  };

  const deleteScalar = (key) => {
    const updated = { ...facts };
    delete updated[key];
    setFacts(updated);
    saveToDb(updated);
  };

  const addToArray = (key, value) => {
    const updated = { ...facts, [key]: [...(facts[key] || []), value] };
    setFacts(updated);
    saveToDb(updated);
  };

  const deleteFromArray = (key, index) => {
    const updated = { ...facts, [key]: (facts[key] || []).filter((_, i) => i !== index) };
    setFacts(updated);
    saveToDb(updated);
  };

  return (
    <>
      {/* Trigger button */}
      <button onClick={() => setOpen(true)} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px", borderRadius: 14,
        background: "rgba(168,85,247,0.1)",
        border: "1px solid rgba(168,85,247,0.2)",
        cursor: "pointer", width: "100%",
      }}>
        <Brain size={16} color="#a855f7" />
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>
            What {isPremium ? "I" : "I'd"} Remember About You
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
            {isPremium
              ? (hasFacts ? `${factsCount} things remembered` : "Chat more to build your memory")
              : "Unlock to see & control your memory"}
          </div>
        </div>
        {!isPremium && <Lock size={14} color="rgba(255,255,255,0.3)" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 401,
                background: "linear-gradient(180deg, #0c0418 0%, #0a0320 100%)",
                border: "1px solid rgba(168,85,247,0.2)",
                borderRadius: "24px 24px 0 0",
                padding: "20px 20px 40px",
                maxHeight: "85vh", overflowY: "auto",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Brain size={18} color="#a855f7" />
                  <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Memory Editor</span>
                  {saved && <span style={{ color: "#4ade80", fontSize: 11 }}>✓ Saved</span>}
                  {saving && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Saving…</span>}
                  <button onClick={() => setRefreshKey(k => k + 1)} style={{
                    background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.4)",
                  }} title="Refresh memory">
                    <RefreshCw size={15} />
                  </button>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} color="rgba(255,255,255,0.5)" />
                </button>
              </div>

              {!isPremium ? (
                /* Free user — blurred teaser */
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                    Your companion would remember all of this about you — and you could edit or remove anything at any time.
                  </p>
                  {FREE_TEASERS.map((t, i) => (
                    <div key={i} style={{
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.15)",
                      marginBottom: 8, filter: "blur(4px)", userSelect: "none",
                    }}>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{t}</span>
                    </div>
                  ))}
                  <button onClick={onUpgrade} style={{
                    marginTop: 16, width: "100%", padding: "14px",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    border: "none", borderRadius: 14, color: "white",
                    fontWeight: 700, fontSize: 15, cursor: "pointer",
                  }}>
                    Unlock Memory ✨
                  </button>
                </div>
              ) : loading && !facts ? (
                /* Loading spinner */
                <div style={{ textAlign: "center", padding: 40 }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.2)", borderTop: "3px solid #a855f7", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading your memories…</div>
                </div>
              ) : facts && Object.values(facts).every(v => !v || (Array.isArray(v) && v.length === 0)) ? (
                /* Empty state */
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>No memories yet</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
                    Your companion will start remembering things about you as you chat. After a few conversations, you'll see your name, goals, struggles, and more appear here.
                  </p>
                  <p style={{ color: "rgba(168,85,247,0.7)", fontSize: 12, lineHeight: 1.5 }}>
                    💡 Tip: Talk to your companion about yourself — your job, what's been stressing you out, your goals. The more you share, the more they remember.
                  </p>
                </div>
              ) : facts ? (
                /* Premium — full editor */
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 16 }}>
                    Everything here is what your companion knows about you. Edit or remove anything anytime.
                  </p>

                  {/* Memory narrative card */}
                  {(facts.name || facts.occupation || facts.recurring_struggles?.length > 0 || facts.goals?.length > 0) && (
                    <div style={{
                      background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(219,39,119,0.07))",
                      border: "1px solid rgba(168,85,247,0.2)",
                      borderRadius: 14, padding: "14px 16px", marginBottom: 20,
                    }}>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                        🧠 What I Know About You
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.65, margin: 0 }}>
                        {[
                          facts.name && `Your name is ${facts.name}`,
                          facts.age && `you're ${facts.age}`,
                          facts.occupation && `you work as ${facts.occupation}`,
                          facts.location && `you're based in ${facts.location}`,
                          facts.relationship_status && `your relationship status is ${facts.relationship_status}`,
                          facts.recurring_struggles?.length && `you've been dealing with ${facts.recurring_struggles.slice(0, 2).join(" and ")}`,
                          facts.goals?.length && `one of your goals is ${facts.goals[0]}`,
                          facts.core_values?.length && `you value ${facts.core_values.slice(0, 2).join(" and ")}`,
                        ].filter(Boolean).join(", ") + "."}
                      </p>
                    </div>
                  )}

                  {/* Scalar facts */}
                  {Object.entries(SECTION_LABELS).map(([key, label]) => (
                    <ScalarRow
                      key={key}
                      label={label}
                      value={facts[key]}
                      onSave={(val) => updateScalar(key, val)}
                      onDelete={() => deleteScalar(key)}
                    />
                  ))}

                  <div style={{ marginTop: 20 }}>
                    {Object.entries(ARRAY_SECTION_LABELS).map(([key, { label, emoji }]) => (
                      <ArraySection
                        key={key}
                        label={label}
                        emoji={emoji}
                        items={facts[key] || []}
                        onAdd={(val) => addToArray(key, val)}
                        onDelete={(i) => deleteFromArray(key, i)}
                      />
                    ))}
                  </div>

                  {/* Important people */}
                  {facts.important_people?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                        👥 Important People
                      </div>
                      {facts.important_people.map((p, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 12px", borderRadius: 10,
                          background: "rgba(168,85,247,0.08)",
                          border: "1px solid rgba(168,85,247,0.12)",
                          marginBottom: 6,
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}> · {p.role}</span>
                            {p.note && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{p.note}</div>}
                          </div>
                          <IconBtn onClick={() => deleteFromArray("important_people", i)} color="#ef4444"><Trash2 size={11} /></IconBtn>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  Loading your memories…
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
