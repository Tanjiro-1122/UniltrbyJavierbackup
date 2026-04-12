import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Delete } from "lucide-react";
import { storePin } from "@/lib/pinHash";

const TRIQUETRA = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15 C30 15 15 30 15 50 C15 65 25 77 38 82 C28 72 25 58 30 45 C35 32 46 25 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none" opacity="0.9"/>
    <path d="M50 15 C54 25 65 32 70 45 C75 58 72 72 62 82 C75 77 85 65 85 50 C85 30 70 15 50 15Z" stroke="#a855f7" strokeWidth="3" fill="none" opacity="0.9"/>
    <path d="M38 82 C42 86 46 88 50 88 C54 88 58 86 62 82 C58 78 54 76 50 76 C46 76 42 78 38 82Z" stroke="#a855f7" strokeWidth="3" fill="none" opacity="0.9"/>
    <circle cx="50" cy="50" r="8" stroke="#a855f7" strokeWidth="2" fill="rgba(168,85,247,0.15)" opacity="0.8"/>
  </svg>
);

export default function PinSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const currentPin = step === "create" ? pin : confirmPin;
  const setCurrentPin = step === "create" ? setPin : setConfirmPin;

  const handleNumber = (num) => {
    if (currentPin.length >= 4) return;
    const next = currentPin + num;
    setCurrentPin(next);
    setError("");

    if (next.length === 4) {
      setTimeout(async () => {
        if (step === "create") {
          setStep("confirm");
        } else {
          if (next === pin) {
            await storePin(pin);
            localStorage.setItem("unfiltr_last_active", Date.now().toString());
            navigate("/onboarding/name", { replace: true });
          } else {
            setShake(true);
            setError("PINs don't match. Try again.");
            setConfirmPin("");
            setTimeout(() => setShake(false), 500);
          }
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    setCurrentPin((p) => p.slice(0, -1));
    setError("");
  };

  const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #060210 0%, #0f0525 60%, #060210 100%)" }}
    >
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="mb-6">
        <TRIQUETRA />
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="text-white text-2xl font-bold mb-1 tracking-wide">
        {step === "create" ? "Create your PIN" : "Confirm your PIN"}
      </motion.h1>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-white/30 text-sm mb-10">
        {step === "create" ? "This keeps your journal & chats private" : "Enter the same PIN again"}
      </motion.p>

      <motion.div animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}} transition={{ duration: 0.4 }} className="flex gap-5 mb-4">
        {[0,1,2,3].map((i) => (
          <motion.div key={i}
            animate={{
              scale: currentPin.length === i + 1 ? [1, 1.3, 1] : 1,
              backgroundColor: i < currentPin.length ? "#a855f7" : "rgba(255,255,255,0.1)",
              boxShadow: i < currentPin.length ? "0 0 12px rgba(168,85,247,0.7)" : "none",
            }}
            transition={{ duration: 0.2 }}
            style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(168,85,247,0.4)" }}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-xs mb-4">{error}</motion.p>
        )}
      </AnimatePresence>
      {!error && <div className="mb-8" />}

      <div className="grid grid-cols-3 gap-4" style={{ width: 240 }}>
        {KEYS.map((key, i) => (
          <motion.button key={i} whileTap={{ scale: key ? 0.88 : 1 }}
            onClick={() => { if (key === "⌫") handleDelete(); else if (key !== "") handleNumber(key); }}
            style={{
              height: 64, borderRadius: 32,
              background: key === "" ? "transparent" : "rgba(255,255,255,0.07)",
              border: key === "" ? "none" : "1px solid rgba(255,255,255,0.08)",
              color: "white", fontSize: key === "⌫" ? 18 : 22, fontWeight: 500,
              cursor: key === "" ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {key === "⌫" ? <Delete size={20} color="rgba(255,255,255,0.5)" /> : key}
          </motion.button>
        ))}
      </div>

      <p className="text-white/15 text-xs mt-10 px-10 text-center">
        You can change or reset your PIN anytime in Settings
      </p>
    </div>
  );
}