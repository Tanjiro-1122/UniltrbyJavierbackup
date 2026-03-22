import React, { useState, useEffect } from "react";
import { X, Send, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CAPSULE_KEY = "unfiltr_time_capsules";
const DELAY_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "1 month", days: 30 },
];

function getCapsules() {
  return JSON.parse(localStorage.getItem(CAPSULE_KEY) || "[]");
}

function saveCapsule(text, days) {
  const capsules = getCapsules();
  capsules.push({
    id: Date.now(),
    text,
    created: new Date().toISOString(),
    deliverAt: new Date(Date.now() + days * 86400000).toISOString(),
    delivered: false,
  });
  localStorage.setItem(CAPSULE_KEY, JSON.stringify(capsules));
}

export function getDeliverableCapsules() {
  const capsules = getCapsules();
  const now = new Date().toISOString();
  const ready = capsules.filter(c => !c.delivered && c.deliverAt <= now);
  if (ready.length > 0) {
    const updated = capsules.map(c =>
      ready.find(r => r.id === c.id) ? { ...c, delivered: true } : c
    );
    localStorage.setItem(CAPSULE_KEY, JSON.stringify(updated));
  }
  return ready;
}

export default function TimeCapsule({ visible, onClose, companionName }) {
  const [text, setText] = useState("");
  const [selectedDays, setSelectedDays] = useState(7);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    if (visible) {
      const capsules = getCapsules().filter(c => !c.delivered);
      setPending(capsules);
      setSent(false);
      setText("");
    }
  }, [visible]);

  if (!visible) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    saveCapsule(text.trim(), selectedDays);
    setSent(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(6,2,15,0.97)", backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top, 12px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>💌</span>
          <h2 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: 0 }}>Time Capsule</h2>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color="white" />
        </button>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: "0 16px 24px", overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", paddingTop: 60 }}>
              <span style={{ fontSize: 56 }}>✨</span>
              <h3 style={{ color: "white", fontSize: 20, fontWeight: 800, margin: "16px 0 8px" }}>Sealed!</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>
                {companionName || "Your companion"} will deliver this message to you in {DELAY_OPTIONS.find(d => d.days === selectedDays)?.label}.
              </p>
              <button onClick={onClose} style={{
                marginTop: 24, padding: "12px 32px", borderRadius: 999,
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
                Done
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                Write a letter to your future self. {companionName || "Your companion"} will deliver it when the time comes.
              </p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Dear future me..."
                style={{
                  width: "100%", height: 140, padding: 16, borderRadius: 16,
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                  color: "white", fontSize: 15, lineHeight: 1.6, resize: "none",
                  outline: "none", fontFamily: "inherit",
                }}
              />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "12px 0 8px" }}>Deliver in:</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {DELAY_OPTIONS.map(o => (
                  <button key={o.days} onClick={() => setSelectedDays(o.days)} style={{
                    padding: "8px 16px", borderRadius: 999,
                    background: selectedDays === o.days ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${selectedDays === o.days ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.1)"}`,
                    color: selectedDays === o.days ? "#c084fc" : "rgba(255,255,255,0.6)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                    {o.label}
                  </button>
                ))}
              </div>
              <button onClick={handleSend} disabled={!text.trim()} style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: text.trim() ? "linear-gradient(135deg, #7c3aed, #db2777)" : "rgba(255,255,255,0.06)",
                color: "white", fontWeight: 700, fontSize: 15, cursor: text.trim() ? "pointer" : "default",
                opacity: text.trim() ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Send size={16} /> Seal Time Capsule
              </button>

              {/* Pending capsules */}
              {pending.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Clock size={14} color="rgba(255,255,255,0.4)" />
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600 }}>Pending Capsules</span>
                  </div>
                  {pending.map(c => (
                    <div key={c.id} style={{
                      padding: "10px 14px", borderRadius: 12, marginBottom: 8,
                      background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)",
                    }}>
                      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.text}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "4px 0 0" }}>
                        Opens {new Date(c.deliverAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}