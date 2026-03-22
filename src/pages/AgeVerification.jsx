import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Phone, CheckCircle2 } from "lucide-react";

export default function AgeVerification() {
  const navigate = useNavigate();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleVerify = () => {
    if (!month || !year) {
      setError("Please select your birth month and year.");
      return;
    }
    const birthYear = parseInt(year);
    const birthMonthIndex = months.indexOf(month); // 0-based (Jan=0)
    const today = new Date();
    // Build an exact birthdate (use day 1 as safe default)
    const birthDate = new Date(birthYear, birthMonthIndex, 1);
    // Calculate age properly
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError("You must be 18 or older to use this app.");
      return;
    }
    localStorage.setItem("unfiltr_age_verified", "true");
    navigate("/welcome");
  };

  const handleExit = () => {
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#06020f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(168,85,247,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #7c3aed, #a855f7, #db2777)",
          padding: "32px 24px 28px",
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <AlertTriangle size={32} color="white" />
          </div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 24, margin: 0, letterSpacing: 1 }}>
            🔞 AGE VERIFICATION
          </h1>
        </div>

        {/* Body */}
        <div style={{ background: "rgba(255,255,255,0.04)", padding: "24px 20px" }}>

          {/* Must be 18+ banner */}
          <div style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.35)",
            borderRadius: 12, padding: "12px 16px",
            textAlign: "center", marginBottom: 20,
          }}>
            <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: 15, margin: 0 }}>
              You must be 18+ to use this app
            </p>
            <p style={{ color: "rgba(251,191,36,0.7)", fontSize: 12, margin: "4px 0 0" }}>
              (21+ where required by law)
            </p>
          </div>

          {/* DOB pickers */}
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>
            📅 Enter your date of birth:
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <select
              value={month}
              onChange={e => { setMonth(e.target.value); setError(""); }}
              style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: month ? "white" : "rgba(255,255,255,0.35)",
                fontSize: 14, outline: "none",
              }}
            >
              <option value="" disabled>Month</option>
              {months.map(m => <option key={m} value={m} style={{ background: "#1a0533" }}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={e => { setYear(e.target.value); setError(""); }}
              style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: year ? "white" : "rgba(255,255,255,0.35)",
                fontSize: 14, outline: "none",
              }}
            >
              <option value="" disabled>Year</option>
              {years.map(y => <option key={y} value={y} style={{ background: "#1a0533" }}>{y}</option>)}
            </select>
          </div>

          {error && (
            <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>
          )}

          {/* Disclaimers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <ShieldCheck size={16} color="#a855f7" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                <b style={{ color: "rgba(255,255,255,0.85)" }}>AI Conversations.</b> This app uses AI to generate responses. Conversations may be processed by OpenAI's API.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                <b style={{ color: "rgba(255,255,255,0.85)" }}>Mental health concern?</b> Call <b style={{ color: "#fbbf24" }}>988</b> (Suicide & Crisis Lifeline) or text HOME to <b style={{ color: "#fbbf24" }}>741741</b>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                By continuing, you certify you are of legal age and accept our <b style={{ color: "#a855f7" }}>Terms of Use</b> and <b style={{ color: "#a855f7" }}>Privacy Policy</b>.
              </p>
            </div>
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            style={{
              width: "100%", padding: "16px",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              border: "none", borderRadius: 14,
              color: "white", fontWeight: 800, fontSize: 16,
              cursor: "pointer", marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            ✅ Verify &amp; Continue
          </button>

          {/* Exit button */}
          <button
            onClick={handleExit}
            style={{
              width: "100%", padding: "14px",
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14,
              color: "rgba(239,68,68,0.7)", fontWeight: 600, fontSize: 14,
              cursor: "pointer", marginBottom: 16,
            }}
          >
            ❌ I am under 18 / Exit
          </button>

          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", margin: 0 }}>
            Birth date used only for verification, not stored on servers.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
