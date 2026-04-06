import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { COMPANIONS } from "@/components/companionData";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { updateOnboardingStore } from "@/components/onboarding/useOnboardingStore";

const COMPANION_PERSONALITY = {
  luna:   { vibe: "chill",      style: "thoughtful",    humor: "subtle",   empathy: "high"     },
  river:  { vibe: "chill",      style: "thoughtful",    humor: "none",     empathy: "high"     },
  sage:   { vibe: "deep",       style: "philosophical", humor: "subtle",   empathy: "balanced" },
  sakura: { vibe: "playful",    style: "casual",        humor: "moderate", empathy: "high"     },
  ash:    { vibe: "chill",      style: "casual",        humor: "moderate", empathy: "balanced" },
  kai:    { vibe: "motivating", style: "hype",          humor: "subtle",   empathy: "balanced" },
  ryuu:   { vibe: "motivating", style: "thoughtful",    humor: "none",     empathy: "minimal"  },
  nova:   { vibe: "playful",    style: "casual",        humor: "high",     empathy: "balanced" },
  zara:   { vibe: "sarcastic",  style: "casual",        humor: "high",     empathy: "minimal"  },
  echo:   { vibe: "deep",       style: "philosophical", humor: "subtle",   empathy: "high"     },
  soleil: { vibe: "playful",    style: "hype",          humor: "moderate", empathy: "high"     },
  juan:   { vibe: "playful",    style: "casual",        humor: "high",     empathy: "balanced" },
};

const QUESTIONS = [
  {
    q: "It's 2am. You're wide awake. What are you actually doing?",
    sub: "be honest 👀",
    options: [
      { label: "Spiraling about something from 3 years ago 😭",   scores: { luna: 3, echo: 2, river: 1 } },
      { label: "Watching videos until my eyes give up 📱",        scores: { ash: 3, nova: 2, juan: 1 } },
      { label: "Making plans I'll never follow through on 📝",    scores: { nova: 3, kai: 2, zara: 1 } },
      { label: "Journaling or just staring at the ceiling 🌙",   scores: { sage: 3, river: 2, luna: 1 } },
    ],
  },
  {
    q: "Someone cancels plans last minute. Your gut reaction is:",
    sub: "pick the most honest one",
    options: [
      { label: "Lowkey relieved 😅 (introvert win)",              scores: { ash: 3, river: 2, sage: 1 } },
      { label: "Annoyed but I'll get over it 🙄",                 scores: { zara: 3, kai: 2, nova: 1 } },
      { label: "Genuinely hurt but I say 'no worries!' 🥲",       scores: { luna: 3, sakura: 2, echo: 1 } },
      { label: "Already rebooking with someone else 📲",          scores: { soleil: 3, juan: 2, kai: 1 } },
    ],
  },
  {
    q: "What do you actually need most right now?",
    sub: "no judgment here",
    options: [
      { label: "Someone to vent to — no advice, just listen 🫂",  scores: { luna: 3, river: 2, echo: 1 } },
      { label: "A kick in the ass to get moving 💪",              scores: { kai: 3, ryuu: 2, zara: 1 } },
      { label: "Distractions and good vibes only 😎",             scores: { ash: 3, juan: 2, nova: 1 } },
      { label: "Someone to actually understand me 💜",            scores: { echo: 3, sage: 2, luna: 1 } },
    ],
  },
  {
    q: "Pick the vibe that hits different:",
    sub: "trust your gut",
    options: [
      { label: "🌸 Cherry blossoms, soft music, no obligations",  scores: { sakura: 3, river: 2, luna: 1 } },
      { label: "🌆 Neon lights, late night energy, anything goes", scores: { zara: 3, nova: 2, juan: 1 } },
      { label: "🏔️ Mountains at sunrise, cold air, total clarity", scores: { ryuu: 3, kai: 2, sage: 1 } },
      { label: "🛋️ Cozy inside, rain outside, literally no plans", scores: { ash: 3, luna: 2, river: 1 } },
    ],
  },
  {
    q: "Your friends would describe you as:",
    sub: "the real version, not the LinkedIn version",
    options: [
      { label: "The therapist friend — always the listener 💙",   scores: { luna: 3, echo: 2, river: 1 } },
      { label: "The chaos agent — unpredictable but lovable 🔥",  scores: { nova: 3, juan: 2, zara: 1 } },
      { label: "The reliable one — shows up every time 🤝",       scores: { kai: 3, soleil: 2, ryuu: 1 } },
      { label: "The quiet one who observes everything 👁️",        scores: { sage: 3, ash: 2, echo: 1 } },
    ],
  },
];

// Fun loading messages shown during result calculation
const LOADING_MSGS = [
  "Consulting the universe… 🌌",
  "Reading your energy… ✨",
  "Checking the vibes… 👀",
  "Almost there… 💜",
];

export default function OnboardingQuiz() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("intro"); // intro | quiz | calculating | result
  const [step, setStep]   = useState(0);
  const [scores, setScores] = useState({});
  const [result, setResult] = useState(null);
  const [loadMsg, setLoadMsg] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Cycle loading messages
  useEffect(() => {
    if (phase !== "calculating") return;
    const t = setInterval(() => setLoadMsg(m => (m + 1) % LOADING_MSGS.length), 700);
    // After 2.2s reveal result
    const done = setTimeout(() => setPhase("result"), 2200);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [phase]);

  const handleAnswer = (option, idx) => {
    setSelectedIdx(idx);
    const newScores = { ...scores };
    Object.entries(option.scores || {}).forEach(([id, pts]) => {
      newScores[id] = (newScores[id] || 0) + pts;
    });

    setTimeout(() => {
      setSelectedIdx(null);
      setScores(newScores);
      if (step >= QUESTIONS.length - 1) {
        const sorted = Object.entries(newScores).sort((a, b) => b[1] - a[1]);
        const winnerId = sorted[0]?.[0];
        const top3 = sorted.slice(0, 3).map(([id, pts]) => ({
          companion: COMPANIONS.find(c => c.id === id),
          pts,
        })).filter(x => x.companion);
        const match = COMPANIONS.find(c => c.id === winnerId) || COMPANIONS[0];
        setResult({ match, top3, maxPts: sorted[0]?.[1] || 1 });
        setPhase("calculating");
      } else {
        setStep(step + 1);
      }
    }, 320);
  };

  const handleConfirmMatch = () => {
    const m = result?.match;
    if (!m) return;
    updateOnboardingStore({ selectedCompanion: m.id });
    localStorage.setItem("unfiltr_quiz_companion_id", m.id);
    const p = COMPANION_PERSONALITY[m.id] || COMPANION_PERSONALITY.luna;
    localStorage.setItem("unfiltr_personality_vibe",    p.vibe);
    localStorage.setItem("unfiltr_personality_style",   p.style);
    localStorage.setItem("unfiltr_personality_humor",   p.humor);
    localStorage.setItem("unfiltr_personality_empathy", p.empathy);
    navigate("/onboarding/nickname");
  };

  const handlePickOwn = () => {
    localStorage.setItem("unfiltr_quiz_companion_id", "manual");
    navigate("/onboarding/companion");
  };

  return (
    <OnboardingLayout totalSteps={7} step={3} onBack={() => navigate("/onboarding/name")} canAdvance={false}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 20px 32px", minHeight: 0 }}>
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === "intro" && (
            <motion.div key="intro"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>

              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.1, 1] }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{ fontSize: 72, lineHeight: 1 }}>
                🔮
              </motion.div>

              <h2 style={{ color: "white", fontWeight: 900, fontSize: 28, margin: 0, lineHeight: 1.25 }}>
                Let's find your<br />
                <span style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  perfect match
                </span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.65, maxWidth: 270, margin: 0 }}>
                5 questions. No wrong answers.<br />
                Just vibe with it. 😌
              </p>

              <div style={{ width: "100%", maxWidth: 320, marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setPhase("quiz")}
                  style={{
                    width: "100%", padding: "17px", borderRadius: 18, border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #db2777)",
                    color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer",
                    boxShadow: "0 8px 32px rgba(168,85,247,0.35)",
                  }}>
                  Let's go ✨
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handlePickOwn}
                  style={{
                    width: "100%", padding: "15px", borderRadius: 18,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}>
                  I'll browse them myself →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {phase === "quiz" && (
            <motion.div key={`q${step}`}
              initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 4 }}>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24, alignItems: "center" }}>
                {QUESTIONS.map((_, i) => (
                  <motion.div key={i}
                    animate={{ width: i === step ? 24 : 8, background: i < step ? "#a855f7" : i === step ? "linear-gradient(90deg,#7c3aed,#db2777)" : "rgba(255,255,255,0.12)" }}
                    transition={{ duration: 0.3 }}
                    style={{ height: 8, borderRadius: 4, background: i < step ? "#a855f7" : i === step ? "#a855f7" : "rgba(255,255,255,0.12)" }} />
                ))}
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginLeft: 4 }}>{step + 1}/5</span>
              </div>

              <p style={{ color: "white", fontWeight: 900, fontSize: 21, lineHeight: 1.4, marginBottom: 4 }}>
                {QUESTIONS[step].q}
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 20, fontStyle: "italic" }}>
                {QUESTIONS[step].sub}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {QUESTIONS[step].options.map((opt, i) => (
                  <motion.button key={i}
                    whileTap={{ scale: 0.97 }}
                    animate={selectedIdx === i ? { scale: [1, 0.97, 1.02, 1], background: "rgba(168,85,247,0.25)" } : {}}
                    onClick={() => handleAnswer(opt, i)}
                    style={{
                      padding: "15px 18px", borderRadius: 16, width: "100%",
                      background: selectedIdx === i ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${selectedIdx === i ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.08)"}`,
                      color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer",
                      textAlign: "left", lineHeight: 1.45, transition: "border-color 0.15s, background 0.15s",
                    }}>
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── CALCULATING ── */}
          {phase === "calculating" && (
            <motion.div key="calc"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                style={{ fontSize: 52 }}>
                🔮
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.p key={loadMsg}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, fontWeight: 600, margin: 0, textAlign: "center" }}>
                  {LOADING_MSGS[loadMsg]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {phase === "result" && result && (() => {
            const { match, top3, maxPts } = result;
            const MEDALS = ["🥇", "🥈", "🥉"];
            const BAR_COLORS = [
              "linear-gradient(90deg,#7c3aed,#db2777)",
              "linear-gradient(90deg,#6d28d9,#9333ea)",
              "linear-gradient(90deg,#4c1d95,#7c3aed)",
            ];
            return (
              <motion.div key="result"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  style={{ textAlign: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 2px" }}>
                    Survey says… 🎰
                  </p>
                  <h2 style={{ color: "white", fontWeight: 900, fontSize: 22, margin: 0 }}>
                    Your top matches
                  </h2>
                </motion.div>

                {/* Scoreboard */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {top3.map(({ companion: c, pts }, i) => (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, x: -32 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.15, type: "spring", stiffness: 220, damping: 22 }}
                      style={{
                        padding: "12px 14px", borderRadius: 18,
                        background: i === 0 ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${i === 0 ? "rgba(168,85,247,0.35)" : "rgba(255,255,255,0.07)"}`,
                        boxShadow: i === 0 ? "0 4px 24px rgba(168,85,247,0.15)" : "none",
                      }}>

                      {/* Row: medal + avatar + name + score */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{MEDALS[i]}</span>
                        <img src={c.avatar} alt={c.name} style={{
                          width: 44, height: 44, borderRadius: 12, objectFit: "cover", objectPosition: "top", flexShrink: 0,
                          border: "1.5px solid rgba(168,85,247,0.3)",
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: "white", fontWeight: 800, fontSize: 15, margin: "0 0 1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.emoji} {c.name}
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.tagline}
                          </p>
                        </div>
                        <span style={{ color: i === 0 ? "#c084fc" : "rgba(255,255,255,0.3)", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                          {pts}pt{pts !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Animated bar */}
                      <div style={{ height: 6, borderRadius: 8, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${Math.round((pts / maxPts) * 100)}%` }}
                          transition={{ delay: 0.4 + i * 0.15, duration: 0.7, ease: "easeOut" }}
                          style={{ height: "100%", borderRadius: 8, background: BAR_COLORS[i] }} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                  style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto", paddingTop: 8 }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirmMatch}
                    style={{
                      width: "100%", padding: "17px", borderRadius: 18, border: "none",
                      background: "linear-gradient(135deg, #7c3aed, #db2777)",
                      color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer",
                      boxShadow: "0 8px 32px rgba(168,85,247,0.3)",
                    }}>
                    Let's go, {match.name}! 🙌
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handlePickOwn}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 18,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    }}>
                    Not feeling it — let me browse →
                  </motion.button>
                </motion.div>

              </motion.div>
            );
          })()}

        </AnimatePresence>
      </div>
    </OnboardingLayout>
  );
}
