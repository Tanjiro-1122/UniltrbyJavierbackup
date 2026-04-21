import React, { useState } from "react";

export default function DeleteAccount() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = `mailto:huertasfam@gmail.com?subject=Account Deletion Request - Unfiltr by Javier&body=Hello,%0A%0AI would like to request deletion of my Unfiltr account and all associated data.%0A%0AEmail / Apple ID associated with my account: ${email}%0A%0APlease confirm once my data has been deleted.%0A%0AThank you.`;
    setSubmitted(true);
  };

  return (
    <div style={{
      backgroundColor: "#06020f",
      minHeight: "100vh",
      color: "#e2e8f0",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: "40px 20px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌙</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#a855f7", margin: 0 }}>Unfiltr by Javier</h1>
          <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 16 }}>Account & Data Deletion Request</p>
        </div>

        {/* Info block */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
          <h2 style={{ color: "#a855f7", fontSize: 17, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>How to Request Deletion</h2>
          <ol style={{ color: "#cbd5e1", lineHeight: 1.9, fontSize: 14, paddingLeft: 20, margin: 0 }}>
            <li>Enter the email or Apple/Google ID linked to your Unfiltr account below</li>
            <li>Click <b>"Send Deletion Request"</b> — this will open your email app with a pre-filled message</li>
            <li>Send the email to us at <a href="mailto:huertasfam@gmail.com" style={{ color: "#a855f7" }}>huertasfam@gmail.com</a></li>
            <li>We will process your request within <b>7 business days</b> and confirm via email</li>
          </ol>
        </div>

        {/* What gets deleted */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
          <h2 style={{ color: "#a855f7", fontSize: 17, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>What Gets Deleted</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 0 }}>When you request full account deletion, we will permanently remove:</p>
          <ul style={{ color: "#cbd5e1", lineHeight: 1.9, fontSize: 14, paddingLeft: 20, margin: 0 }}>
            <li>Your account profile and display name</li>
            <li>All journal entries and mood logs</li>
            <li>All chat history with your AI companion</li>
            <li>Your companion preferences and settings</li>
            <li>Your push notification token</li>
          </ul>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 12, marginBottom: 0 }}>
            <b style={{ color: "#e2e8f0" }}>Retention note:</b> Anonymized, non-identifiable usage data may be retained for up to 30 days for system integrity purposes, after which it is permanently purged.
          </p>
        </div>

        {/* Partial deletion */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 32 }}>
          <h2 style={{ color: "#a855f7", fontSize: 17, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>Partial Data Deletion (Optional)</h2>
          <p style={{ color: "#cbd5e1", fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            You can also request deletion of specific data only — for example, just your journal entries or chat history — without deleting your entire account. Simply mention in your email which data you'd like removed and we'll handle it within 7 business days.
          </p>
        </div>

        {/* Request form */}
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>
                Email or Apple/Google ID linked to your account
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "13px 16px", borderRadius: 12,
                  border: "1px solid rgba(139,92,246,0.3)",
                  background: "rgba(139,92,246,0.08)",
                  color: "white", fontSize: 15, outline: "none"
                }}
              />
            </div>
            <button type="submit" style={{
              width: "100%", padding: "14px",
              borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              color: "white", fontSize: 16, fontWeight: 700,
              cursor: "pointer"
            }}>
              Send Deletion Request
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: 32, background: "rgba(34,197,94,0.08)", borderRadius: 14, border: "1px solid rgba(34,197,94,0.2)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ color: "#86efac", fontWeight: 600, fontSize: 16, margin: 0 }}>Your email app should have opened with your request.</p>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>If it didn't open, email us directly at <a href="mailto:huertasfam@gmail.com" style={{ color: "#a855f7" }}>huertasfam@gmail.com</a></p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 48, color: "#475569", fontSize: 13 }}>
          © 2026 Unfiltr by Javier. All rights reserved.
        </div>
      </div>
    </div>
  );
}
