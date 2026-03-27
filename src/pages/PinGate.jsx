import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ChevronRight, X } from "lucide-react";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

export default function PinGate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dest = searchParams.get("dest") || "chat";
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [stage, setStage] = useState("create");
  const existingPin = localStorage.getItem("unfiltr_pin");

  React.useEffect(() => {
    if (existingPin) {
      navigate(dest === "journal" ? "/journal-enter" : "/chat-enter", { replace: true });
    }
  }, []);

  const handleSkip = () => {
    navigate(dest === "journal" ? "/journal-enter" : "/chat-enter");
  };

  const handleDigit = (d) => {
    if (stage === "create") {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) setStage("confirm");
    } else {
      const next = confirm + d;
      setConfirm(next);
      if (next.length === 4) {
        if (next === pin) {
          localStorage.setItem("unfiltr_pin", pin);
          navigate(dest === "journal" ? "/journal-enter" : "/chat-enter");
        } else {
          setConfirm("");
        }
      }
    }
  };

  const handleBack = () => {
    if (stage === "confirm") {
      setConfirm(confirm.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const current = stage === "create" ? pin : confirm;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 0%,#1a0535 0%,#0d0520 40%,#06020f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui,-apple-system,sans-serif",
      padding: "max(2rem,env(safe-area-inset-top)) 24px max(2rem,env(safe-area-inset-bottom))",
    }}>

      {/* Close button */}
      <button onClick={() => navigate("/chat-enter")} style={{
        position: "absolute", top: "max(1.5rem,env(safe-area-inset-top))", left: 20,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "50%", width: 36, height: 36, color: "rgba(255,255,255,0.5)",
        fontSize: 18, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        ✕
      </button>

      {/* Skip button */}
      <button onClick={handleSkip} style={{
        position: "absolute", top: "max(1.5rem,env(safe-area-inset-top))", right: 20,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20, padding: "6px 16px", color: "rgba(255,255,255,0.5)",
        fontSize: 14, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        Skip <ChevronRight size={14} />
      </button>

      {/* Icon + Title */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
          background: "rgba(168,85,247,0.12)", border: "2px solid rgba(168,85,247,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Lock size={32} color="#a855f7" />
        </div>
        <h1 style={{ color: "white", fontWeight: 800, fontSize: 24, margin: "0 0 8px" }}>
          Keep your thoughts<br />to yourself
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
          {stage === "create"
            ? "Create a 4-digit PIN to lock your space"
            : "Confirm your PIN"}
        </p>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 14, marginBottom: 40 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: "50%",
            background: i < current.length ? "#a855f7" : "rgba(255,255,255,0.15)",
            boxShadow: i < current.length ? "0 0 10px rgba(168,85,247,0.6)" : "none",
            transition: "all 0.2s",
          }} />
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, width: "100%", maxWidth: 280 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <motion.button key={n} whileTap={{ scale: 0.92 }} onClick={() => handleDigit(String(n))}
            style={{
              aspectRatio: "1", borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "white", fontWeight: 600, fontSize: 22,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {n}
          </motion.button>
        ))}
        <div />
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => handleDigit("0")}
          style={{ aspectRatio: "1", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.08)", color: "white", fontWeight: 600, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          0
        </motion.button>
        <motion.button whileTap={{ scale: 0.92 }} onClick={handleBack}
          style={{ aspectRatio: "1", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={20} />
        </motion.button>
      </div>

      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 24, textAlign: "center" }}>
        You can change or remove your PIN anytime in Settings
      </p>
    </div>
  );
}
