import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";
import OnboardingTutorial from "@/components/OnboardingTutorial";

const TESTER_NAMES = ["demo", "appreviewer", "applereviewer", "googlereviewer", "tester", "javier1122"];
const TESTER_CODE  = "unfiltr2026demo";
const GRADIENT = "linear-gradient(180deg, #06020f 0%, #120626 40%, #1a0535 70%, #0d0220 100%)";

export default function Onboarding() {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(true);
  const [step, setStep]                             = useState(0);
  const [displayName, setDisplayName]               = useState("");
  const [selectedCompanion, setSelectedCompanion]   = useState(null);
  const [companionNickname, setCompanionNickname]   = useState("");
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [loading, setLoading]                       = useState(false);
  const [isTesterAccount, setIsTesterAccount]       = useState(false);
  const [pendingProfileId, setPendingProfileId]     = useState(null);

  const canAdvance = [
    displayName.trim().length > 0,
    !!selectedCompanion,
    true,
    !!selectedBackground,
  ];

  const handleBack = () => {
    if (step === 0) navigate("/");
    else setStep(s => s - 1);
  };

  const handleNext = async () => {
    if (!canAdvance[step]) return;

    if (step === 3) {
      setLoading(true);
      try {
        const companionData = COMPANIONS.find(c => c.id === selectedCompanion);
        const companion = await base44.entities.Companion.create({
          name:       companionData.name,
          avatar_url: companionData.avatar,
          mood_mode:  "neutral",
          personality: companionData.tagline,
        });

        let userProfile;
        if (pendingProfileId) {
          userProfile = await base44.entities.UserProfile.update(pendingProfileId, {
            display_name:  displayName,
            companion_id:  companion.id,
            background_id: selectedBackground,
            premium:       isTesterAccount,
            is_premium:    isTesterAccount,
            session_memory: isTesterAccount ? [
              {
                date: "Mar 14, 2026",
                summary: "This is a demo account for app review. The user wanted to explore all premium features including companion memory, unlimited messages, and voice responses.",
              }
            ] : [],
          });
        } else {
          userProfile = await base44.entities.UserProfile.create({
            display_name:  displayName,
            companion_id:  companion.id,
            background_id: selectedBackground,
            premium:       isTesterAccount,
            is_premium:    isTesterAccount,
            session_memory: isTesterAccount ? [
              {
                date: "Mar 14, 2026",
                summary: "This is a demo account for app review. The user wanted to explore all premium features including companion memory, unlimited messages, and voice responses.",
              }
            ] : [],
          });
        }

        localStorage.setItem("userProfileId",  userProfile.id);
        localStorage.setItem("companionId",     companion.id);

        const finalName = companionNickname.trim() || companionData.name;
        localStorage.setItem("unfiltr_companion_nickname", companionNickname.trim());

        localStorage.setItem("unfiltr_companion", JSON.stringify({
          id:          companionData.id,
          name:        companionData.name,
          displayName: finalName,
          systemPrompt: `You are ${finalName}, a supportive AI companion. ${companionData.tagline}`,
        }));

        const bg = BACKGROUNDS.find(b => b.id === selectedBackground);
        localStorage.setItem("unfiltr_env", JSON.stringify({
          id: bg.id, label: bg.label, bg: bg.url,
        }));

        navigate("/vibe");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Save display_name to DB when leaving step 0
    if (step === 0) {
      try {
        if (pendingProfileId) {
          await base44.entities.UserProfile.update(pendingProfileId, { display_name: displayName });
        } else {
          const profile = await base44.entities.UserProfile.create({ 
            display_name: displayName,
            companion_id: "pending",
            background_id: "pending",
          });
          setPendingProfileId(profile.id);
          localStorage.setItem("userProfileId", profile.id);
        }
      } catch { /* non-blocking */ }
    }

    setStep(s => s + 1);
  };

  const STEP_TITLES = ["What's your name?", "Pick your companion", "Name your companion", "Pick your space"];
  const STEP_SUBS   = [
    "This is what your companion will call you.",
    "Choose who you want to hang with.",
    "Give them a nickname — or keep their real name.",
    "Where do you want to hang out?",
  ];

  return (
    <>
      {showTutorial && (
        <OnboardingTutorial
          profileId={null}
          onComplete={() => setShowTutorial(false)}
        />
      )}
      {!showTutorial && (
    <div
      className="screen no-tabs"
      style={{ background: GRADIENT, position: "fixed", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: 0 }}
    >
      {/* Stars */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width:  Math.random() * 2 + 0.5,
            height: Math.random() * 2 + 0.5,
            borderRadius: "50%",
            background: "white",
            top:  Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            opacity: Math.random() * 0.6 + 0.1,
            animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + "s",
          }} />
        ))}
        <div style={{
          position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      </div>

      <style>{`@keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.9} }`}</style>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px 8px",
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
        position: "relative",
        zIndex: 1,
      }}>
        <button
          onClick={handleBack}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Step {step + 1} of 4</p>
        <div style={{ width: 40 }} />
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ flexShrink: 0, padding: "0 16px 16px", position: "relative", zIndex: 1 }}>
        <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${((step + 1) / 4) * 100}%`,
            background: "linear-gradient(90deg, #7c3aed, #db2777)",
            boxShadow: "0 0 8px rgba(168,85,247,0.6)",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* ── STEP CONTENT ── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div key="s0"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "8px 16px 120px 16px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>{STEP_TITLES[0]}</h2>
            <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: "0 0 14px" }}>{STEP_SUBS[0]}</p>
            <input
              type="text" value={displayName}
              onChange={e => {
                const val = e.target.value;
                setDisplayName(val);
                const normalized = val.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
                setIsTesterAccount(TESTER_NAMES.includes(normalized) || normalized === TESTER_CODE);
              }}
              onKeyDown={e => e.key === "Enter" && handleNext()}
              placeholder="Enter display name" autoFocus
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "1px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.1)", color: "white", fontSize: 16, outline: "none", caretColor: "#a855f7" }}
              onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.6)"}
              onBlur={e  => e.target.style.borderColor = "rgba(139,92,246,0.35)"}
            />
            {isTesterAccount && (
              <div style={{
                marginTop: 10, padding: "8px 14px", borderRadius: 12,
                background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <span style={{ color: "rgba(196,180,252,0.9)", fontSize: 13 }}>
                  <strong style={{ color: "#c084fc" }}>Premium Demo Account</strong> — full access enabled
                </span>
              </div>
            )}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}
          >
            <div style={{ flexShrink: 0, padding: "0 16px 10px" }}>
              <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>{STEP_TITLES[1]}</h2>
              <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: 0 }}>{STEP_SUBS[1]}</p>
            </div>
            <div className="scroll-area" style={{ flex: 1, minHeight: 0, padding: "4px 16px 8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, paddingBottom: 20 }}>
                {COMPANIONS.filter(c => !c.testerOnly || isTesterAccount).map(c => (
                  <motion.button key={c.id} whileTap={{ scale: 0.94 }}
                    onClick={() => { setSelectedCompanion(c.id); setStep(2); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      borderRadius: 18, overflow: "hidden", cursor: "pointer", padding: "10px 6px 8px",
                      background: selectedCompanion === c.id ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)",
                      border: `2px solid ${selectedCompanion === c.id ? "rgba(168,85,247,0.85)" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: selectedCompanion === c.id ? "0 0 18px rgba(168,85,247,0.35)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ width: "100%", height: 80, overflow: "hidden", borderRadius: 10 }}>
                      <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "top" }} onError={e => e.target.style.opacity = "0.3"} />
                    </div>
                    <p style={{ color: "white", fontSize: 11, fontWeight: 700, margin: "6px 0 2px", textAlign: "center", lineHeight: 1.2 }}>{c.emoji} {c.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textAlign: "center", lineHeight: 1.2, margin: 0 }}>{c.tagline}</p>
                    {selectedCompanion === c.id && (
                      <div style={{ marginTop: 5, width: 16, height: 16, borderRadius: "50%", background: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", padding: "16px 16px 120px 16px", position: "relative" }}
          >
            <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 6px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>{STEP_TITLES[2]}</h2>
            <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: "0 0 20px" }}>{STEP_SUBS[2]}</p>
            {selectedCompanion && (() => {
              const c = COMPANIONS.find(cd => cd.id === selectedCompanion);
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "14px 16px", borderRadius: 18, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <img src={c.avatar} alt={c.name} style={{ width: 60, height: 60, objectFit: "contain" }} />
                  <div>
                    <p style={{ color: "white", fontWeight: 700, margin: "0 0 2px" }}>{c.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>{c.tagline}</p>
                  </div>
                </div>
              );
            })()}
            <input
              type="text" value={companionNickname}
              onChange={e => setCompanionNickname(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNext()}
              placeholder={`Default: ${COMPANIONS.find(c => c.id === selectedCompanion)?.name || "companion"}`}
              maxLength={20} autoFocus
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "1px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.1)", color: "white", fontSize: 16, outline: "none", caretColor: "#a855f7" }}
              onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.6)"}
              onBlur={e  => e.target.style.borderColor = "rgba(139,92,246,0.35)"}
            />
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", margin: "10px 0 0" }}>Leave blank to use their default name</p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}
          >
            <div style={{ flexShrink: 0, padding: "0 16px 12px", position: "relative", zIndex: 2 }}>
              <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 4px", textShadow: "0 0 20px rgba(168,85,247,0.5)" }}>{STEP_TITLES[3]}</h2>
              <p style={{ color: "rgba(196,180,252,0.7)", fontSize: 13, margin: 0 }}>{STEP_SUBS[3]}</p>
            </div>
            <div className="scroll-area" style={{
              flex: 1, minHeight: 0,
              padding: "4px 16px",
              paddingBottom: "180px",
              position: "relative",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, paddingBottom: 8 }}>
                {BACKGROUNDS.map(bg => (
                  <motion.button key={bg.id} whileTap={{ scale: 0.96 }} onClick={() => setSelectedBackground(bg.id)}
                    style={{
                      position: "relative", height: 120, borderRadius: 18, overflow: "hidden", cursor: "pointer",
                      border: `2px solid ${selectedBackground === bg.id ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.1)"}`,
                      boxShadow: selectedBackground === bg.id ? "0 0 20px rgba(168,85,247,0.35)" : "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      background: "transparent",
                      padding: 0,
                    }}
                  >
                    <img src={bg.url} alt={bg.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px", textAlign: "center", pointerEvents: "none" }}>
                      <p style={{ color: "white", fontSize: 12, fontWeight: 600, margin: 0 }}>{bg.emoji} {bg.label}</p>
                    </div>
                    {selectedBackground === bg.id && (
                      <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#7c3aed" }} />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
      </div>

      {step !== 1 && (
        <div style={{ flexShrink: 0, padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))", background: "#06020f", position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", maxWidth: 430, marginLeft: "auto", marginRight: "auto", zIndex: 1000 }}>
          <button
            onClick={handleNext}
            disabled={!canAdvance[step] || loading}
            style={{
              width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
              color: "white", fontWeight: 900, fontSize: 17,
              cursor: canAdvance[step] && !loading ? "pointer" : "default",
              opacity: canAdvance[step] && !loading ? 1 : 0.3,
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
              boxShadow: canAdvance[step] ? "0 0 24px rgba(168,85,247,0.45), 0 4px 16px rgba(0,0,0,0.4)" : "none",
              transition: "opacity 0.2s, box-shadow 0.2s",
            }}
          >
            {step === 3
              ? (loading ? "Setting up…" : "Enter this world →")
              : <span>Next <ChevronRight size={16} style={{ display: "inline", verticalAlign: "middle" }} /></span>
            }
          </button>
        </div>
      )}
    </div>
      )}
    </>
  );
}