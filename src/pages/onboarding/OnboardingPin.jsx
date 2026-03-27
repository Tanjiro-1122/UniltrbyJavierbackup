import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Lock, Delete } from "lucide-react";

export default function OnboardingPin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState([]);
  const [confirm, setConfirm] = useState([]);
  const [stage, setStage] = useState("create"); // "create" | "confirm"
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const current = stage === "create" ? pin : confirm;
  const setCurrent = stage === "create" ? setPin : setConfirm;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDigit = (d) => {
    if (current.length >= 4) return;
    const next = [...current, d];
    setCurrent(next);

    if (next.length === 4) {
      setTimeout(() => {
        if (stage === "create") {
          setStage("confirm");
          setError("");
        } else {
          if (next.join("") === pin.join("")) {
            // ✅ PIN confirmed — save and move on
            localStorage.setItem("unfiltr_pin", pin.join(""));
            navigate("/onboarding/name");
          } else {
            triggerShake();
            setError("PINs don't match — try again");
            setConfirm([]);
          }
        }
      }, 200);
    }
  };

  const handleBack = () => {
    if (current.length > 0) {
      setCurrent(current.slice(0, -1));
      setError("");
    }
  };

  const handleSkip = () => {
    localStorage.removeItem("unfiltr_pin");
    navigate("/onboarding/name");
  };

  const dots = Array.from({ length: 4 }, (_, i) => i < current.length);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 20%, rgba(124,58,237,0.35) 0%, #06020f 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'SF Pro Display',system-ui,-apple-system,sans-serif",
    }}>
      {/* Header */}
      <div style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "max(1.4rem,env(safe-area-inset-top)) 18px 0",
      }}>
        <button onClick={() => navigate("/onboarding/consent")} style={{
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>Step 2 of 7</span>
          </div>
          {/* Progress bar */}
          <div style={{ width: 180, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 6 }}>
            <div style={{ width: `${(2/7)*100}%`, height: "100%", background: "linear-gradient(90deg,#a855f7,#db2777)", borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Icon + Title */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 20 }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            width: 80, height: 80, borderRadius: 24,
            background: "linear-gradient(135deg,rgba(124,58,237,0.5),rgba(219,39,119,0.4))",
            border: "1.5px solid rgba(168,85,247,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
            boxShadow: "0 0 40px rgba(124,58,237,0.35)",
          }}
        >
          <Lock size={36} color="#c084fc" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ textAlign: "center", marginBottom: 8 }}
          >
            <h1 style={{ color: "white", fontWeight: 800, fontSize: 26, margin: "0 0 8px" }}>
              {stage === "create" ? "Keep it private?" : "Confirm your PIN"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, maxWidth: 260 }}>
              {stage === "create"
                ? "Set a 4-digit PIN so only you can open the app"
                : "Enter the same PIN again to confirm"}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", gap: 18, margin: "32px 0 12px" }}
        >
          {dots.map((filled, i) => (
            <motion.div
              key={i}
              animate={{ scale: filled ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{
                width: 18, height: 18, borderRadius: "50%",
                background: filled ? "#a855f7" : "rgba(255,255,255,0.12)",
                boxShadow: filled ? "0 0 14px rgba(168,85,247,0.7)" : "none",
                border: `2px solid ${filled ? "#a855f7" : "rgba(255,255,255,0.2)"}`,
                transition: "background 0.2s",
              }}
            />
          ))}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ color: "#f87171", fontSize: 13, margin: "4px 0 0", textAlign: "center" }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Numpad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,72px)", gap: 14, marginTop: 32 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <motion.button
              key={n}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleDigit(String(n))}
              style={{
                width: 72, height: 72, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)",
                color: "white", fontSize: 24, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >{n}</motion.button>
          ))}
          {/* Empty, 0, Delete */}
          <div />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleDigit("0")}
            style={{
              width: 72, height: 72, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)",
              color: "white", fontSize: 24, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >0</motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleBack}
            style={{
              width: 72, height: 72, borderRadius: "50%", border: "none",
              background: "transparent", color: "rgba(255,255,255,0.6)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          ><Delete size={22} /></motion.button>
        </div>
      </div>

      {/* Skip */}
      <div style={{ paddingBottom: "max(2rem,env(safe-area-inset-bottom))", textAlign: "center" }}>
        <button onClick={handleSkip} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.35)",
          fontSize: 14, cursor: "pointer", padding: "10px 24px",
          textDecoration: "underline", textUnderlineOffset: 3,
        }}>
          Skip — I don't want a PIN
        </button>
      </div>
    </div>
  );
}
