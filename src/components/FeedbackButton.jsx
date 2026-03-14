import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["Bug Report", "Feature Request", "General Feedback", "Something Broke"];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("General Feedback");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.Feedback.create({
        user_id: user?.id || "anonymous",
        display_name: user?.full_name || "Anonymous",
        category,
        message: message.trim(),
        page_context: window.location.pathname,
        status: "New",
      });
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setMessage(""); setCategory("General Feedback"); }, 2200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
          right: 16,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #db2777)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 90,
          boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
        }}
      >
        <MessageSquare size={18} color="white" />
      </button>

      {/* Bottom Sheet Modal */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 430, background: "#120820", borderRadius: "24px 24px 0 0", padding: "20px 20px", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))", border: "1px solid rgba(139,92,246,0.2)", borderBottom: "none" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 999, margin: "0 auto 18px" }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ color: "white", fontWeight: 700, fontSize: 17, margin: 0 }}>💬 Share Feedback</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={18} color="rgba(255,255,255,0.4)" />
              </button>
            </div>

            {done ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🙏</p>
                <p style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Thanks! We'll look into it 🙏</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>Your feedback means a lot.</p>
              </div>
            ) : (
              <>
                {/* Category */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      style={{
                        padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
                        borderColor: category === c ? "#a855f7" : "rgba(255,255,255,0.12)",
                        background: category === c ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                        color: category === c ? "#c084fc" : "rgba(255,255,255,0.45)",
                        transition: "all 0.15s",
                      }}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* Text area */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  rows={4}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 14, fontSize: 14,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.2)",
                    color: "white", resize: "none", outline: "none", lineHeight: 1.5,
                    boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.2)"}
                />

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !message.trim()}
                  style={{
                    marginTop: 12, width: "100%", padding: "13px",
                    background: "linear-gradient(135deg, #7c3aed, #db2777)",
                    border: "none", borderRadius: 14, color: "white",
                    fontWeight: 700, fontSize: 15, cursor: submitting || !message.trim() ? "default" : "pointer",
                    opacity: submitting || !message.trim() ? 0.5 : 1, transition: "opacity 0.15s",
                  }}>
                  {submitting ? "Sending…" : "Submit Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}