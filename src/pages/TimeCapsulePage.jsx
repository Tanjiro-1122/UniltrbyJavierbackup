import { useState, useEffect } from "react";
import { UserProfile } from "@/api/entities";
import { useNavigate } from "react-router-dom";

const DURATIONS = [
  { label: "1 month",  days: 30  },
  { label: "3 months", days: 90  },
  { label: "6 months", days: 180 },
  { label: "1 year",   days: 365 },
];

export default function TimeCapsulePage() {
  const navigate   = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [message,  setMessage]  = useState("");
  const [duration, setDuration] = useState(90);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [capsules, setCapsules] = useState([]);

  useEffect(() => {
    const pid = localStorage.getItem("userProfileId");
    if (!pid) return;
    UserProfile.get(pid).then(p => {
      setProfile(p);
      setCapsules(p?.time_capsules || []);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!message.trim() || !profile) return;
    setSaving(true);
    try {
      const deliverAt = new Date(Date.now() + duration * 86400000).toISOString();
      const existing  = profile.time_capsules || [];
      const newCapsule = {
        id:         Date.now().toString(),
        message:    message.trim(),
        created_at: new Date().toISOString(),
        deliver_at: deliverAt,
        delivered:  false,
      };
      const updated = [...existing, newCapsule];
      await UserProfile.update(profile.id, { time_capsules: updated });
      setCapsules(updated);
      setMessage("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch(e) {
      console.error(e);
    }
    setSaving(false);
  };

  const deliveredCapsules = capsules.filter(c => c.delivered || new Date(c.deliver_at) <= new Date());
  const pendingCapsules   = capsules.filter(c => !c.delivered && new Date(c.deliver_at) > new Date());

  const styles = {
    page:    { minHeight: "100vh", background: "linear-gradient(180deg,#0d0d1a 0%,#1a0d2e 100%)", padding: "0 0 80px", fontFamily: "system-ui,sans-serif" },
    header:  { display: "flex", alignItems: "center", gap: 12, padding: "52px 20px 20px" },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 22, cursor: "pointer", padding: 4 },
    title:   { color: "white", fontSize: 22, fontWeight: 800, margin: 0 },
    card:    { background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: "18px 16px", margin: "0 16px 14px", border: "1px solid rgba(255,255,255,0.08)" },
    label:   { color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 },
    textarea:{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "white", fontSize: 15, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
    chips:   { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 },
    chip:    (sel) => ({ padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: sel ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.07)", color: sel ? "#c084fc" : "rgba(255,255,255,0.6)", outline: sel ? "1.5px solid rgba(168,85,247,0.5)" : "none" }),
    saveBtn: { width: "calc(100% - 32px)", margin: "0 16px 20px", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontSize: 15, fontWeight: 700 },
    section: { color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 20px 6px" },
    capsule: (delivered) => ({ background: delivered ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.04)", borderRadius: 14, padding: "14px 16px", margin: "0 16px 10px", border: delivered ? "1px solid rgba(168,85,247,0.25)" : "1px solid rgba(255,255,255,0.07)" }),
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>‹</button>
        <h1 style={styles.title}>⏳ Time Capsule</h1>
      </div>

      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, padding: "0 20px 20px", lineHeight: 1.6 }}>
        Write a message to your future self. Your companion will deliver it when the time comes.
      </p>

      {/* Write capsule */}
      <div style={styles.card}>
        <p style={styles.label}>Your message</p>
        <textarea
          style={styles.textarea}
          rows={5}
          placeholder="Hey future me... right now I'm feeling, hoping for, working on..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={1000}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{message.length}/1000</span>
        </div>
        <p style={{ ...styles.label, marginTop: 14 }}>Deliver in</p>
        <div style={styles.chips}>
          {DURATIONS.map(d => (
            <button key={d.days} style={styles.chip(duration === d.days)} onClick={() => setDuration(d.days)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button
        style={{ ...styles.saveBtn, opacity: (!message.trim() || saving) ? 0.5 : 1 }}
        onClick={handleSave}
        disabled={!message.trim() || saving}
      >
        {saving ? "Sealing..." : saved ? "✅ Sealed!" : "🔒 Seal & Send to Future Me"}
      </button>

      {/* Delivered capsules */}
      {deliveredCapsules.length > 0 && (
        <>
          <p style={styles.section}>📬 Delivered</p>
          {deliveredCapsules.map(c => (
            <div key={c.id} style={styles.capsule(true)}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 8 }}>
                Written {new Date(c.created_at).toLocaleDateString()} · Delivered {new Date(c.deliver_at).toLocaleDateString()}
              </p>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{c.message}</p>
            </div>
          ))}
        </>
      )}

      {/* Pending capsules */}
      {pendingCapsules.length > 0 && (
        <>
          <p style={styles.section}>🔒 Sealed ({pendingCapsules.length})</p>
          {pendingCapsules.map(c => (
            <div key={c.id} style={styles.capsule(false)}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 6 }}>
                Sealed {new Date(c.created_at).toLocaleDateString()} · Opens {new Date(c.deliver_at).toLocaleDateString()}
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic", margin: 0 }}>This message is sealed until its delivery date 🔒</p>
            </div>
          ))}
        </>
      )}

      {capsules.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No capsules yet. Write your first message to the future.</p>
        </div>
      )}
    </div>
  );
}
