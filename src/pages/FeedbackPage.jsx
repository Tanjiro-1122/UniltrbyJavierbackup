import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["Bug Report", "Feature Request", "General Feedback", "Something Broke"];

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("General Feedback");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
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
        page_context: "/feedback",
        rating: rating || null,
        status: "New",
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen no-tabs" style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #1a0a2e 100%)" }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px 14px",
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={() => navigate(-1)}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Send Feedback</h1>
      </div>

      <div className="scroll-area px-4 py-6">
        {done ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
            <p style={{ fontSize: 56, marginBottom: 16 }}>🙏</p>
            <h2 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 8px", textAlign: "center" }}>Thanks for your feedback!</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>We'll look into it and keep improving the app.</p>
            <button onClick={() => navigate(-1)}
              style={{ marginTop: 32, padding: "12px 32px", background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Go Back
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Category */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Category</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    style={{
                      padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
                      borderColor: category === c ? "#a855f7" : "rgba(255,255,255,0.12)",
                      background: category === c ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                      color: category === c ? "#c084fc" : "rgba(255,255,255,0.45)",
                      transition: "all 0.15s",
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Message</p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 14,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.2)",
                  color: "white", resize: "none", outline: "none", lineHeight: 1.6, boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.2)"}
              />
            </div>

            {/* Star Rating */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Overall Rating <span style={{ color: "rgba(255,255,255,0.25)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star}
                    onClick={() => setRating(star === rating ? 0 : star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <Star
                      size={30}
                      fill={(hoverRating || rating) >= star ? "#f59e0b" : "transparent"}
                      color={(hoverRating || rating) >= star ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
              style={{
                padding: "14px", background: "linear-gradient(135deg, #7c3aed, #db2777)",
                border: "none", borderRadius: 14, color: "white",
                fontWeight: 700, fontSize: 15, cursor: submitting || !message.trim() ? "default" : "pointer",
                opacity: submitting || !message.trim() ? 0.5 : 1, transition: "opacity 0.15s",
              }}>
              {submitting ? "Sending…" : "Submit Feedback"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}