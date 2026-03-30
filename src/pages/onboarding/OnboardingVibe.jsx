import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import { getOnboardingStore, updateOnboardingStore, resetOnboardingStore } from "@/components/onboarding/useOnboardingStore";

// Google Noto animated emojis
const NOTO = "https://fonts.gstatic.com/s/e/notoemoji/latest";

const VIBES = [
  {
    id: "chill",
    emoji: `${NOTO}/1f60c/512.webp`,
    label: "Chill", sub: "Low-key",
    desc: "Just hanging out.\nNo agenda, no pressure.",
    gradient: "linear-gradient(135deg,#0f766e,#0ea5e9)",
    orb: "rgba(13,148,136,0.5)", glow: "rgba(13,148,136,0.4)",
    bg: "#031a18", accent: "#5eead4", cardBorder: "rgba(20,184,166,0.6)",
  },
  {
    id: "vent",
    emoji: `${NOTO}/1f32c/512.webp`,
    label: "Vent", sub: "Let it out",
    desc: "Need to let it all out?\nI'm here, no judgment.",
    gradient: "linear-gradient(135deg,#2563eb,#7c3aed)",
    orb: "rgba(59,130,246,0.5)", glow: "rgba(99,102,241,0.4)",
    bg: "#020818", accent: "#93c5fd", cardBorder: "rgba(99,102,241,0.6)",
  },
  {
    id: "hype",
    emoji: `${NOTO}/1f525/512.webp`,
    label: "Hype", sub: "Let's GO",
    desc: "Big moment coming up?\nLet's get you READY.",
    gradient: "linear-gradient(135deg,#ea580c,#facc15)",
    orb: "rgba(249,115,22,0.5)", glow: "rgba(234,88,12,0.4)",
    bg: "#180800", accent: "#fdba74", cardBorder: "rgba(251,146,60,0.6)",
  },
  {
    id: "deep",
    emoji: `${NOTO}/1f30c/512.webp`,
    label: "Deep Talk", sub: "Real talk",
    desc: "2am thoughts, existential\nquestions, real talk.",
    gradient: "linear-gradient(135deg,#7c3aed,#db2777)",
    orb: "rgba(124,58,237,0.5)", glow: "rgba(167,139,250,0.4)",
    bg: "#0d0218", accent: "#c4b5fd", cardBorder: "rgba(167,139,250,0.6)",
  },
  {
    id: "journal",
    emoji: `${NOTO}/270f/512.webp`,
    label: "Journal", sub: "Private",
    desc: "Write freely.\nSpeak your truth. Save it.",
    gradient: "linear-gradient(135deg,#059669,#22d3ee)",
    orb: "rgba(16,185,129,0.5)", glow: "rgba(16,185,129,0.4)",
    bg: "#011a10", accent: "#34d399", cardBorder: "rgba(52,211,153,0.6)",
  },
];

export default function OnboardingVibe() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  if (!store.selectedCompanion) {
    navigate("/onboarding/nickname", { replace: true });
    return null;
  }

  const vibe = VIBES[idx];

  const goTo = useCallback((i) => {
    setIdx(Math.max(0, Math.min(VIBES.length - 1, i)));
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };
  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 8 && dx > dy) isSwiping.current = true;
  };
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (isSwiping.current && Math.abs(dx) > 35) goTo(idx + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
    isSwiping.current = false;
  };

  const finishOnboardingForJournal = async () => {
    setLoading(true);
    try {
      const companionData = COMPANIONS.find(c => c.id === store.selectedCompanion);
      const defaultBg = BACKGROUNDS[0];
      const finalName = store.companionNickname?.trim() || companionData.name;

      // ✅ Set ALL localStorage keys FIRST — before any async DB calls
      // This ensures ChatPage & JournalHome always have what they need
      localStorage.setItem("unfiltr_companion", JSON.stringify({
        id: companionData.id, name: companionData.name, displayName: finalName,
        systemPrompt: `You are ${finalName}, a supportive AI companion. ${companionData.tagline}`,
      }));
      localStorage.setItem("unfiltr_companion_nickname", finalName);
      localStorage.setItem("unfiltr_env", JSON.stringify({
        id: defaultBg.id, label: defaultBg.label, bg: defaultBg.url,
      }));
      localStorage.setItem("unfiltr_vibe", "journal");
      localStorage.setItem("unfiltr_onboarding_complete", "true");

      // Navigate immediately — don't wait for DB
      setLoading(false);
      navigate("/mood?dest=journal");

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
            display_name: store.displayName || "",
            is_premium: !!(store.isTesterAccount),
            trial_active: !!(store.isTesterAccount),
            trial_start_date: store.isTesterAccount ? new Date().toISOString() : null,
            onboarding_complete: true,
            session_memory: [],
            message_count: 0,
            last_active: new Date().toISOString(),
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
          console.error("Journal onboarding DB error (non-blocking):", err);
          resetOnboardingStore();
        }
      })();
    } catch (err) {
      console.error("Journal onboarding error:", err);
      setLoading(false);
      navigate("/mood?dest=journal");
    }
  };

  const handleContinue = () => {
    updateOnboardingStore({ selectedVibe: vibe.id });
    if (vibe.id === "journal") {
      finishOnboardingForJournal();
    } else {
      navigate("/onboarding/background");
    }
  };

  const btnLabel = loading ? "Setting up…" : vibe.id === "journal" ? "Start journaling →" : "Pick your world →";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed", inset: 0, overflow: "hidden",
        fontFamily: "'SF Pro Display',system-ui,-apple-system,sans-serif",
        display: "flex", flexDirection: "column",
        background: `radial-gradient(ellipse at 50% 20%, ${vibe.orb} 0%, ${vibe.bg} 45%, #03000d 100%)`,
        transition: "background 0.6s ease",
      }}
    >
      {/* Glow orb */}
      <AnimatePresence mode="wait">
        <motion.div key={vibe.id}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
            width: 440, height: 440, borderRadius: "50%",
            background: `radial-gradient(circle, ${vibe.orb} 0%, transparent 70%)`,
            filter: "blur(55px)", pointerEvents: "none", zIndex: 0,
          }}
        />
      </AnimatePresence>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "max(1.4rem,env(safe-area-inset-top)) 18px 8px",
        display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 5,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>
              What's your vibe?
            </h1>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 500 }}>
              Step 6 of 7
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0 }}>
            How do you want to show up today?
          </p>
        </div>
      </div>

      {/* Carousel */}
      <div style={{
        flex: 1, position: "relative", zIndex: 5,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {VIBES.map((v, i) => {
          const diff = i - idx;
          if (Math.abs(diff) > 1) return null;
          const isActive = diff === 0;
          return (
            <motion.div key={v.id}
              onClick={() => !isActive && goTo(i)}
              animate={{ x: diff * 262, scale: isActive ? 1 : 0.74, opacity: isActive ? 1 : 0.38 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "absolute", width: 232, height: 322, borderRadius: 32,
                border: `2px solid ${isActive ? v.cardBorder : "rgba(255,255,255,0.09)"}`,
                boxShadow: isActive
                  ? `0 0 0 1px ${v.glow}, 0 0 55px ${v.glow}, 0 28px 64px rgba(0,0,0,0.75)`
                  : "0 8px 24px rgba(0,0,0,0.4)",
                background: isActive
                  ? "linear-gradient(160deg,rgba(255,255,255,0.11) 0%,rgba(255,255,255,0.03) 100%)"
                  : "rgba(255,255,255,0.04)",
                backdropFilter: "blur(22px)",
                cursor: isActive ? "default" : "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "24px 22px 28px", zIndex: isActive ? 10 : 5,
              }}
            >
              <div style={{
                width: 100, height: 100, marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                filter: isActive ? `drop-shadow(0 0 28px ${v.glow}) drop-shadow(0 6px 18px rgba(0,0,0,0.6))` : "none",
              }}>
                <img src={v.emoji} alt={v.label} style={{ width: "100%", height: "100%", objectFit: "contain", opacity: isActive ? 1 : 0.55 }} />
              </div>
              <p style={{
                fontWeight: 900, fontSize: 26, margin: "0 0 3px", letterSpacing: "-0.5px",
                background: isActive ? v.gradient : "none",
                WebkitBackgroundClip: isActive ? "text" : "initial",
                WebkitTextFillColor: isActive ? "transparent" : "rgba(255,255,255,0.45)",
                color: isActive ? undefined : "rgba(255,255,255,0.45)",
              }}>{v.label}</p>
              <p style={{
                color: isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                fontSize: 11, fontWeight: 700, margin: "0 0 14px",
                textTransform: "uppercase", letterSpacing: "0.14em",
              }}>{v.sub}</p>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  style={{
                    color: "rgba(255,255,255,0.52)", fontSize: 13, lineHeight: 1.55,
                    textAlign: "center", margin: 0, whiteSpace: "pre-line",
                  }}
                >{v.desc}</motion.p>
              )}
              {isActive && v.id === "journal" && (
                <div style={{
                  marginTop: 12, padding: "3px 10px", borderRadius: 999,
                  background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)",
                  color: "#34d399", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                }}>PRIVATE</div>
              )}
            </motion.div>
          );
        })}

        {idx > 0 && (
          <button onClick={() => goTo(idx - 1)} style={{
            position: "absolute", left: 14, zIndex: 20,
            width: 42, height: 42, borderRadius: "50%",
            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "white",
          }}>
            <ChevronLeft size={20} />
          </button>
        )}
        {idx < VIBES.length - 1 && (
          <button onClick={() => goTo(idx + 1)} style={{
            position: "absolute", right: 14, zIndex: 20,
            width: 42, height: 42, borderRadius: "50%",
            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "white",
          }}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 7, paddingBottom: 12, zIndex: 5 }}>
        {VIBES.map((_, i) => (
          <div key={i} onClick={() => goTo(i)} style={{
            width: i === idx ? 20 : 7, height: 7, borderRadius: 999,
            background: i === idx ? vibe.accent : "rgba(255,255,255,0.2)",
            cursor: "pointer", transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 20px", paddingBottom: "max(20px,env(safe-area-inset-bottom))", zIndex: 5 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={loading}
          style={{
            width: "100%", padding: "20px",
            background: loading ? "rgba(255,255,255,0.1)" : vibe.gradient,
            border: "none", borderRadius: 20,
            color: loading ? "rgba(255,255,255,0.4)" : "white",
            fontWeight: 800, fontSize: 18,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : `0 0 40px ${vibe.glow}`,
            transition: "all 0.4s ease",
          }}
        >
          {btnLabel}
        </motion.button>
      </div>
    </div>
  );
}
