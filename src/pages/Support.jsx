import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail, FileText, Shield, HelpCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const FAQS = [
  {
    q: "How do I cancel my subscription?",
    a: "Open the Settings app on your iPhone → Apple ID → Subscriptions → Unfiltr → Cancel Subscription. You can also manage it through the App Store."
  },
  {
    q: "How do I delete my account and data?",
    a: "Go to Settings inside the Unfiltr app → scroll to the bottom → tap 'Delete Account'. All your data will be permanently removed within 30 days."
  },
  {
    q: "What AI service powers the companions?",
    a: "Unfiltr uses OpenAI's GPT API to generate companion responses. Your messages are sent to OpenAI to produce replies. See openai.com/privacy for their data practices."
  },
  {
    q: "Is my data private?",
    a: "Yes. We never sell your data or share it with advertisers. Your conversations are only processed by OpenAI to generate responses and are never used for marketing."
  },
  {
    q: "How do I restore my purchase?",
    a: "Open the Unfiltr app → tap the menu → Pricing → scroll down → tap 'Restore Purchases'. Make sure you're signed in with the same Apple ID used to purchase."
  },
  {
    q: "I'm having a mental health crisis. What should I do?",
    a: "Please call or text 988 (Suicide & Crisis Lifeline) immediately. You can also text HOME to 741741 (Crisis Text Line). Unfiltr is not a substitute for professional mental health support."
  },
];

export default function Support() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(180deg, #0d0520 0%, #06020f 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "white",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "max(1.5rem, env(safe-area-inset-top)) 16px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 10,
        background: "linear-gradient(180deg, #0d0520 0%, #0d0520 100%)",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 20, margin: 0 }}>Support</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>We're here to help</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ padding: "24px 16px 60px", maxWidth: 480, margin: "0 auto" }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ textAlign: "center", marginBottom: 28 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "rgba(168,85,247,0.15)",
            border: "1px solid rgba(168,85,247,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <HelpCircle size={36} color="#a855f7" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 24, margin: "0 0 8px" }}>Contact Us</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>
            We're here to help you get the most out of Unfiltr
          </p>
        </motion.div>

        {/* Email Support Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.25)",
            borderRadius: 18, padding: "20px",
            marginBottom: 12, textAlign: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 14px" }}>
            Have questions or need assistance? We're here to help!
          </p>
          <a
            href="mailto:support@sportswagerhelper.com?subject=Unfiltr%20Support%20Request"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 12, padding: "14px 20px",
              color: "#a855f7", fontWeight: 700, fontSize: 16,
              textDecoration: "none",
            }}
          >
            <Mail size={18} color="#a855f7" />
            support@sportswagerhelper.com
          </a>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "10px 0 0" }}>
            We typically respond within 24 hours
          </p>
        </motion.div>

        {/* Restore Purchases Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 18, padding: "16px 20px",
            marginBottom: 12,
            display: "flex", alignItems: "center", gap: 14,
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "rgba(34,197,94,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <RotateCcw size={20} color="#22c55e" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>
              Restore Purchases
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "0 0 10px", lineHeight: 1.4 }}>
              Already subscribed? Tap below to restore your Premium access on this device.
            </p>
            <button
              onClick={() => navigate("/Pricing?restore=true")}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                border: "none", borderRadius: 10,
                color: "white", fontWeight: 700, fontSize: 13,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <RotateCcw size={14} /> Restore Purchases
            </button>
          </div>
        </motion.div>

        {/* Quick legal links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", gap: 10, marginBottom: 24 }}
        >
          <button
            onClick={() => navigate("/PrivacyPolicy")}
            style={{
              flex: 1, padding: "13px 10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, color: "rgba(255,255,255,0.7)",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Shield size={14} color="#a855f7" /> Privacy Policy
          </button>
          <button
            onClick={() => navigate("/TermsOfUse")}
            style={{
              flex: 1, padding: "13px 10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, color: "rgba(255,255,255,0.7)",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <FileText size={14} color="#a855f7" /> Terms of Use
          </button>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>
            Frequently Asked Questions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: openFaq === i ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${openFaq === i ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 14, overflow: "hidden", transition: "all 0.2s",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", padding: "14px 16px",
                    background: "none", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: 0 }}>{faq.q}</p>
                  <span style={{
                    color: "#a855f7", fontSize: 20, flexShrink: 0,
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.2s", display: "inline-block", lineHeight: 1,
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 16px 14px" }}>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Crisis line */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            marginTop: 24,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 14, padding: "14px 16px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>
            🆘 Mental Health Emergency?
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            Call or text <b style={{ color: "white" }}>988</b> (Suicide & Crisis Lifeline)<br />
            Text HOME to <b style={{ color: "white" }}>741741</b> (Crisis Text Line)
          </p>
        </motion.div>

        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, textAlign: "center", marginTop: 24 }}>
          © 2026 Unfiltr by Javier. All rights reserved.
        </p>
      </div>
    </div>
  );
}
