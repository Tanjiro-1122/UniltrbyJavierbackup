import React, { useState } from "react";
import { Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DisplayNameEditor({ userProfile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.display_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    // Always save to localStorage immediately — survives force-close
    localStorage.setItem("unfiltr_display_name", name.trim());
    const profileId = localStorage.getItem("userProfileId");
    if (profileId) {
      try {
        await base44.entities.UserProfile.update(profileId, { display_name: name.trim() });
      } catch (e) {
        console.warn("Display name DB save failed (localStorage saved):", e);
      }
    }
    onSave?.(name.trim());
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ color: "white", fontWeight: 700, fontSize: 17, margin: 0 }}>{userProfile?.display_name}</p>
        <button onClick={() => setEditing(true)}
          style={{ padding: "6px 14px", borderRadius: 999, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#c4b5fd", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Edit
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input type="text" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSave()}
        maxLength={30} autoFocus
        style={{
          flex: 1, padding: "10px 14px", borderRadius: 12,
          background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
          color: "white", fontSize: 15, outline: "none",
        }}
      />
      <button onClick={handleSave} disabled={!name.trim() || saving}
        style={{
          padding: "10px 16px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, #7c3aed, #db2777)",
          color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
          opacity: (!name.trim() || saving) ? 0.5 : 1,
        }}>
        {saving ? "…" : <Check size={16} />}
      </button>
    </div>
  );
}