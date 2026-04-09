import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png";

export default function ChatEnter() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const dest = new URLSearchParams(location.search).get("dest") || "chat";
    const t = setTimeout(() => navigate(`/${dest}`, { replace: true }), 2400);
    return () => clearTimeout(t);
  }, [navigate, location.search]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%,#1a0535 0%,#0d0520 50%,#06020f 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui,-apple-system,sans-serif",
      }}>
      <motion.img src={LOGO} alt="Unfiltr"
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}
        style={{ width: 100, height: 100, objectFit: "contain", filter: "drop-shadow(0 0 40px rgba(168,85,247,0.7))", marginBottom: 28 }}
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ color: "white", fontWeight: 800, fontSize: 24, margin: "0 0 8px", textAlign: "center" }}>
        Your Journey Begins...
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: 0, textAlign: "center" }}>
        No scripts. No judgment. Just connection.
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 1.4, ease: "easeInOut" }}
        style={{ marginTop: 40, width: 120, height: 3, borderRadius: 2, background: "linear-gradient(90deg,#7c3aed,#db2777)", transformOrigin: "left" }}
      />
    </motion.div>
  );
}
