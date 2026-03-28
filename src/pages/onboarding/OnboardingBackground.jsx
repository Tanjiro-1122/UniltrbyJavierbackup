import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import { getOnboardingStore, updateOnboardingStore, resetOnboardingStore } from "@/components/onboarding/useOnboardingStore";

// Only use anime-style backgrounds for onboarding picker
const BG_LIST = BACKGROUNDS.filter(b => b.style === "anime");

export default function OnboardingBackground() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dir, setDir] = useState(0);
  const touchStartX = useRef(null);
  const mouseStartX = useRef(null);

  if (!store.selectedCompanion) {
    navigate("/onboarding/companion", { replace: true });
    return null;
  }

  const companionData = COMPANIONS.find(c => c.id === store.selectedCompanion);
  const bg = BG_LIST[idx];

  const goTo = useCallback((i) => {
    const next = Math.max(0, Math.min(BG_LIST.length - 1, i));
    setDir(next > idx ? 1 : -1);
    setIdx(next);
  }, [idx]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goTo(idx - 1);
      if (e.key === "ArrowRight") goTo(idx + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, goTo]);

  // Touch
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  // Mouse drag
  const onMouseDown = (e) => { mouseStartX.current = e.clientX; };
  const onMouseUp = (e) => {
    if (mouseStartX.current === null) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));
    mouseStartX.current = null;
  };

  const handleFinish = async () => {
    const selected = bg.id;
    updateOnboardingStore({ selectedBackground: selected });
    setLoading(true);
    try {
      const finalName = store.companionNickname?.trim() || companionData.name;

      // ✅ Set ALL localStorage keys FIRST — before any async DB calls
      localStorage.setItem("unfiltr_companion_nickname", store.companionNickname?.trim() || "");
      localStorage.setItem("unfiltr_companion", JSON.stringify({
        id: companionData.id,
        name: companionData.name,
        displayName: finalName,
        systemPrompt: `You are ${finalName}, a supportive AI companion. ${companionData.tagline}`,
      }));
      localStorage.setItem("unfiltr_env", JSON.stringify({
        id: bg.id, label: bg.label, bg: bg.url,
      }));
      if (store.selectedVibe) {
        localStorage.setItem("unfiltr_vibe", store.selectedVibe);
      }
      localStorage.setItem("unfiltr_onboarding_complete", "true");
      window.dispatchEvent(new Event("unfiltr_auth_updated"));
      // Navigate immediately — don't wait for DB
      setLoading(false);
      navigate("/mood?dest=chat");

      // Fire-and-forget DB calls in background
      (async () => {
        try {
          const companion = await base44.entities.Companion.create({
            name: companionData.name,
            avatar_id: companionData.id,
            avatar_gender: companionData.gender || "female",
            personality_preset: companionData.personality || companionData.tagline || "friendly",
            mood_mode: "neutral",
            is_active: true,
          });
          const profileData = {
            display_name: store.displayName,
            companion_id: companion.id,
            background_id: selected,
            premium: store.isTesterAccount,
            is_premium: store.isTesterAccount,
            session_memory: store.isTesterAccount ? [{
              date: new Date().toLocaleDateString(),
              summary: "This is a demo account for app review. The user wanted to explore all premium features.",
            }] : [],
          };
          let userProfile;
          if (store.pendingProfileId) {
            userProfile = await base44.entities.UserProfile.update(store.pendingProfileId, profileData);
          } else {
            userProfile = await base44.entities.UserProfile.create(profileData);
          }
          localStorage.setItem("userProfileId", userProfile.id);
          localStorage.setItem("companionId", companion.id);
          resetOnboardingStore();
        } catch (err) {
          console.error("Onboarding DB error (non-blocking):", err);
          resetOnboardingStore();
        }
      })();
    } catch (err) {
      console.error("Onboarding error:", err);
      localStorage.setItem("unfiltr_onboarding_complete", "true");
      window.dispatchEvent(new Event("unfiltr_auth_updated"));
      resetOnboardingStore();
      setLoading(false);
      navigate("/mood?dest=chat");
    }
  };

  // Companion neutral mood image
  const companionImg = companionData?.moods?.neutral || companionData?.avatar;

  return (
    <div
      style={{ position: "fixed", inset: 0, overflow: "hidden", fontFamily: "'SF Pro Display',system-ui,sans-serif" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {/* Full-screen background */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={bg.id}
          initial={{ x: dir * 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -dir * 60, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url(${bg.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.88) 100%)", zIndex: 1 }} />

      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "max(1.4rem,env(safe-area-inset-top)) 18px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate("/onboarding/vibe")}
          style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600 }}>Step 7 of 7</div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, marginTop: 4, overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg,#7c3aed,#db2777)", borderRadius: 99 }} />
          </div>
        </div>
      </div>

      {/* Companion floating in the world */}
      {companionImg && (
        <AnimatePresence mode="wait">
          <motion.div
            key={bg.id + "-companion"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              position: "absolute", bottom: "28%", left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5, width: 180, height: 260,
              filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.8))",
            }}
          >
            <img src={companionImg} alt={companionData?.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Left / Right arrows */}
      <button
        onClick={() => goTo(idx - 1)}
        disabled={idx === 0}
        style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          zIndex: 10, width: 44, height: 44, borderRadius: "50%", border: "none",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.25 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <ChevronLeft size={22} color="white" />
      </button>
      <button
        onClick={() => goTo(idx + 1)}
        disabled={idx === BG_LIST.length - 1}
        style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          zIndex: 10, width: 44, height: 44, borderRadius: "50%", border: "none",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: idx === BG_LIST.length - 1 ? "default" : "pointer",
          opacity: idx === BG_LIST.length - 1 ? 0.25 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <ChevronRight size={22} color="white" />
      </button>

      {/* Bottom panel */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: "20px 20px max(1.6rem,env(safe-area-inset-bottom))",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>
        {/* World name */}
        <AnimatePresence mode="wait">
          <motion.div
            key={bg.id + "-label"}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.5px", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              {bg.emoji} {bg.label}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {BG_LIST.map((b, i) => (
            <button key={b.id} onClick={() => goTo(i)} style={{
              width: i === idx ? 20 : 7, height: 7, borderRadius: 99, border: "none",
              background: i === idx ? "#a855f7" : "rgba(255,255,255,0.3)",
              transition: "all 0.25s", padding: 0, cursor: "pointer",
            }} />
          ))}
        </div>

        {/* Enter button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleFinish}
          disabled={loading}
          style={{
            width: "100%", padding: "17px", borderRadius: 20, border: "none",
            background: loading ? "rgba(168,85,247,0.4)" : "linear-gradient(135deg,#7c3aed,#a855f7,#db2777)",
            color: "white", fontWeight: 900, fontSize: 17, cursor: loading ? "default" : "pointer",
            boxShadow: "0 0 40px rgba(168,85,247,0.55), 0 4px 20px rgba(0,0,0,0.5)",
            letterSpacing: "0.2px",
          }}
        >
          {loading ? "Setting up your world…" : "Enter this world →"}
        </motion.button>
      </div>
    </div>
  );
}
