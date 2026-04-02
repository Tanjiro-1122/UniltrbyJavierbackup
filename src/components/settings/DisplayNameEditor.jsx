import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DisplayNameEditor({ userProfile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);

  // Pull from userProfile first, fall back to localStorage
  const resolvedName = userProfile?.display_name || localStorage.getItem("unfiltr_display_name") || "";
  const [name, setName] = useState(resolvedName);

  // If userProfile loads late, sync the name in
  useEffect(() => {
    if (userProfile?.display_name) setName(userProfile.display_name);
  }, [userProfile?.display_name]);

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
        <p style={{ color: resolvedName ? "white" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 17, margin: 0 }}>
          {resolvedName || "Tap Edit to set your name"}
        </p>
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
        placeholder="Enter your name..."
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
