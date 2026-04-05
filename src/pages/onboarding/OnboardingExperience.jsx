import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getOnboardingStore } from "@/components/onboarding/useOnboardingStore";

// Hub-matched Pixar icons

const EXPERIENCES = [
  {
    id: "chat",
    emoji: "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/bbe7e7fa7_generated_image.png",
    label: "Chat",
    sub: "Talk it out",
    desc: "Have a real conversation.\nYour companion listens, responds,\nand actually gets you.",
    gradient: "linear-gradient(135deg,#7c3aed,#db2777)",
    orb: "rgba(124,58,237,0.45)",
    bg: "#0d0218",
    accent: "#c4b5fd",
    cardBorder: "rgba(167,139,250,0.6)",
    glow: "rgba(124,58,237,0.4)",
  },
  {
    id: "journal",
    emoji: "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/44915ae14_generated_image.png",
    label: "Journal",
    sub: "Write freely",
    desc: "Your private space.\nWrite down your thoughts,\nfeelings, and moments.",
    gradient: "linear-gradient(135deg,#059669,#22d3ee)",
    orb: "rgba(16,185,129,0.45)",
    bg: "#011a10",
    accent: "#34d399",
    cardBorder: "rgba(52,211,153,0.6)",
    glow: "rgba(16,185,129,0.4)",
  },
  {
    id: "meditate",
    emoji: "https://media.base44.com/images/public/69c83ef77b8d9fdcb0a754f5/47037d196_generated_image.png",
    label: "Meditate",
    sub: "Find your calm",
    desc: "Breathe. Reset. Recharge.\nGuided sessions to bring\nyou back to yourself.",
    gradient: "linear-gradient(135deg,#0f766e,#0ea5e9)",
    orb: "rgba(13,148,136,0.45)",
    bg: "#031a18",
    accent: "#5eead4",
    cardBorder: "rgba(20,184,166,0.6)",
    glow: "rgba(13,148,136,0.4)",
  },
];

export default function OnboardingExperience() {
  const navigate = useNavigate();
  const store = getOnboardingStore();
  const [idx, setIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  if (!store.selectedCompanion) {
    navigate("/onboarding/nickname", { replace: true });
    return null;
  }

  const exp = EXPERIENCES[idx];

  const goTo = (i) => setIdx(Math.max(0, Math.min(EXPERIENCES.length - 1, i)));

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(false);
  };
  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    if (Math.abs(e.touches[0].clientX - touchStartX) > 8) setIsSwiping(true);
  };
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (isSwiping && Math.abs(dx) > 35) goTo(idx + (dx < 0 ? 1 : -1));
    setTouchStartX(null);
    setIsSwiping(false);
  };

  const handleContinue = async () => {
    if (exp.id === "chat") {
      navigate("/onboarding/vibe");
      return;
    }

    // For Journal and Meditate: complete onboarding inline so the app
    // doesn't loop back to onboarding on next launch.
    // (Chat path completes in OnboardingBackground — this covers the other two paths.)
    const store = getOnboardingStore();
    const companionObj = store.selectedCompanion
      ? (await import("@/components/companionData").then(m => m.COMPANIONS.find(c => c.id === store.selectedCompanion)))
      : null;
    const companionName = store.companionNickname?.trim() || companionObj?.name || "Aria";

    if (companionObj && !localStorage.getItem("unfiltr_companion")) {
      localStorage.setItem("unfiltr_companion", JSON.stringify({
        id: companionObj.id,
        name: companionObj.name,
        displayName: companionName,
        systemPrompt: `You are ${companionName}, a supportive AI companion. ${companionObj.tagline}`,
      }));
      localStorage.setItem("unfiltr_companion_nickname", companionName);
    }
    if (store.displayName?.trim()) {
      localStorage.setItem("unfiltr_display_name", store.displayName.trim());
    }
    localStorage.setItem("unfiltr_onboarding_complete", "true");
    // Create a minimal DB profile in the background (non-blocking)
    try {
      const { base44 } = await import("@/api/base44Client");
      if (!localStorage.getItem("userProfileId")) {
        const profile = await base44.entities.UserProfile.create({
          display_name: store.displayName?.trim() || "",
          apple_user_id: localStorage.getItem("unfiltr_apple_user_id") || "",
          onboarding_complete: true,
          session_memory: [],
          message_count: 0,
          last_active: new Date().toISOString(),
        });
        localStorage.setItem("userProfileId", profile.id);
        localStorage.setItem("unfiltr_user_id", profile.id);
        localStorage.setItem("unfiltr_auth_token", profile.id);
        window.dispatchEvent(new Event("unfiltr_auth_updated"));
      }
    } catch (e) { console.warn("[Onboarding] DB profile creation failed (non-fatal):", e); }

    if (exp.id === "journal") {
      navigate("/mood?dest=journal&onboarding=1");
    } else if (exp.id === "meditate") {
      navigate("/meditate");
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed", inset: 0, overflow: "hidden",
        fontFamily: "'SF Pro Display',system-ui,-apple-system,sans-serif",
        display: "flex", flexDirection: "column",
        background: `radial-gradient(ellipse at 50% 20%, ${exp.orb} 0%, ${exp.bg} 45%, #03000d 100%)`,
        transition: "background 0.6s ease",
      }}
    >
      {/* Glow orb */}
      <AnimatePresence mode="wait">
        <motion.div key={exp.id}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
            width: 440, height: 440, borderRadius: "50%",
            background: `radial-gradient(circle, ${exp.orb} 0%, transparent 70%)`,
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
              Choose your experience
            </h1>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 500 }}>
              Step 5 of 6
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0 }}>
            How do you want to start?
          </p>
        </div>
      </div>

      {/* Carousel */}
      <div style={{
        flex: 1, position: "relative", zIndex: 5,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {EXPERIENCES.map((e, i) => {
          const diff = i - idx;
          if (Math.abs(diff) > 1) return null;
          const isActive = diff === 0;
          return (
            <motion.div key={e.id}
              onClick={() => !isActive && goTo(i)}
              animate={{ x: diff * 262, scale: isActive ? 1 : 0.74, opacity: isActive ? 1 : 0.38 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "absolute", width: 232, height: 322, borderRadius: 32,
                border: `2px solid ${isActive ? e.cardBorder : "rgba(255,255,255,0.09)"}`,
                boxShadow: isActive
                  ? `0 0 0 1px ${e.glow}, 0 0 55px ${e.glow}, 0 28px 64px rgba(0,0,0,0.75)`
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
                filter: isActive ? `drop-shadow(0 0 28px ${e.glow}) drop-shadow(0 6px 18px rgba(0,0,0,0.6))` : "none",
              }}>
                <img src={e.emoji} alt={e.label} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16, opacity: isActive ? 1 : 0.55 }} />
              </div>
              <p style={{
                fontWeight: 900, fontSize: 26, margin: "0 0 3px", letterSpacing: "-0.5px",
                background: isActive ? e.gradient : "none",
                WebkitBackgroundClip: isActive ? "text" : "initial",
                WebkitTextFillColor: isActive ? "transparent" : "rgba(255,255,255,0.45)",
                color: isActive ? undefined : "rgba(255,255,255,0.45)",
              }}>{e.label}</p>
              <p style={{
                color: isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                fontSize: 11, fontWeight: 700, margin: "0 0 14px",
                textTransform: "uppercase", letterSpacing: "0.14em",
              }}>{e.sub}</p>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  style={{
                    color: "rgba(255,255,255,0.52)", fontSize: 13, lineHeight: 1.55,
                    textAlign: "center", margin: 0, whiteSpace: "pre-line",
                  }}
                >{e.desc}</motion.p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Dots */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 8,
        paddingBottom: 16, position: "relative", zIndex: 5,
      }}>
        {EXPERIENCES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === idx ? 22 : 7, height: 7, borderRadius: 999, border: "none",
            background: i === idx ? exp.accent : "rgba(255,255,255,0.18)",
            transition: "all 0.3s", cursor: "pointer", padding: 0,
          }} />
        ))}
      </div>

      {/* Arrows */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 24px 16px", position: "relative", zIndex: 5,
      }}>
        <button onClick={() => goTo(idx - 1)} disabled={idx === 0} style={{
          width: 44, height: 44, borderRadius: "50%", border: "none",
          background: idx === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1,
        }}>
          <ChevronLeft size={22} color="white" />
        </button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleContinue}
          style={{
            padding: "14px 40px", borderRadius: 999, border: "none",
            background: exp.gradient, color: "white",
            fontSize: 16, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 0 28px ${exp.glow}`,
          }}
        >
          {exp.id === "chat" ? "Let's chat →" : exp.id === "journal" ? "Start writing →" : "Let's breathe →"}
        </motion.button>

        <button onClick={() => goTo(idx + 1)} disabled={idx === EXPERIENCES.length - 1} style={{
          width: 44, height: 44, borderRadius: "50%", border: "none",
          background: idx === EXPERIENCES.length - 1 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: idx === EXPERIENCES.length - 1 ? "not-allowed" : "pointer",
          opacity: idx === EXPERIENCES.length - 1 ? 0.3 : 1,
          transform: "rotate(180deg)",
        }}>
          <ChevronLeft size={22} color="white" />
        </button>
      </div>
    </div>
  );
}

