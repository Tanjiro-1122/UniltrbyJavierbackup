import { useState, useRef } from "react";

const COMPANIONS = [
  { id: "luna", name: "Luna", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/943f2fb6c_luna_happy_nobg.png" },
  { id: "kai", name: "Kai", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/e6bf25bb8_kai_happy_nobg.png" },
  { id: "nova", name: "Nova", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/775bab2d1_nova_happy_nobg.png" },
  { id: "river", name: "River", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d329e5eb5_river_happy_nobg.png" },
  { id: "ash", name: "Ash", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/a8e79ed38_ash_happy_nobg.png" },
  { id: "sakura", name: "Sakura", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/6fb3c5226_sakura_happy_nobg.png" },
  { id: "ryuu", name: "Ryuu", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/9aaa48819_ryuu_happy_nobg.png" },
  { id: "sage", name: "Sage", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/4e619dbd3_sage_happy_nobg.png" },
  { id: "zara", name: "Zara", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/2165704e8_zara_happy_nobg.png" },
  { id: "echo", name: "Echo", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/55bcca860_happy.png" },
  { id: "soleil", name: "Soleil", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/0e3c34b7e_happy.png" },
  { id: "juan", name: "Juan", url: "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/00155921c_juan_happy_nobg.png" },
];

export default function AdMaker() {
  const [step, setStep] = useState(1); // 1=clips, 2=companions, 3=text, 4=preview
  const [clips, setClips] = useState({ chat: null, journal: null, meditation: null });
  const [selectedCompanions, setSelectedCompanions] = useState([]);
  const [hookText, setHookText] = useState("Feeling alone?");
  const [endText, setEndText] = useState("Unfiltr by Javier\nNow on the App Store 💜");
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const chatRef = useRef();
  const journalRef = useRef();
  const meditationRef = useRef();

  const handleClipUpload = (type, file) => {
    if (!file) return;
    setClips(prev => ({ ...prev, [type]: file }));
  };

  const toggleCompanion = (id) => {
    setSelectedCompanions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const allClipsReady = clips.chat && clips.journal && clips.meditation;

  const handleMakeVideo = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("chat", clips.chat);
      formData.append("journal", clips.journal);
      formData.append("meditation", clips.meditation);
      formData.append("hookText", hookText);
      formData.append("endText", endText);
      formData.append("companions", JSON.stringify(
        COMPANIONS.filter(c => selectedCompanions.includes(c.id))
      ));

      setProgress(30);

      const res = await fetch("https://saving-grace-b0a754f5.base44.app/functions/makeAdVideo", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Video processing failed");
      }

      const data = await res.json();
      setVideoUrl(data.videoUrl);
      setProgress(100);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const stepLabels = ["📹 Clips", "👥 Companions", "✏️ Text", "🎉 Done"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0035 0%, #0d001a 100%)",
      color: "white",
      fontFamily: "'Inter', sans-serif",
      padding: "20px 16px",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🎬</div>
        <h1 style={{
          fontSize: 26, fontWeight: 800, margin: 0,
          background: "linear-gradient(90deg, #c084fc, #f472b6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Unfiltr Ad Maker
        </h1>
        <p style={{ color: "#a78bfa", margin: "6px 0 0", fontSize: 14 }}>
          Build your TikTok promo in 4 easy steps
        </p>
      </div>

      {/* Step Indicator — display only, not clickable */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
        {stepLabels.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={num} style={{
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: isActive
                ? "linear-gradient(90deg, #7c3aed, #db2777)"
                : isDone ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)",
              color: isActive ? "white" : isDone ? "#c084fc" : "#6b7280",
              border: isActive ? "none" : isDone ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.1)",
            }}>
              {isDone ? "✓ " : ""}{label}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Upload Clips ── */}
      {step === 1 && (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: "#e879f9" }}>
            Step 1 — Upload Your 3 Screen Recordings
          </h2>
          <p style={{ color: "#a78bfa", fontSize: 13, marginBottom: 20 }}>
            Record your app in action — chat, journal, and meditation screens. 3–5 seconds each is perfect.
          </p>

          {[
            { key: "chat", label: "💬 Chat Screen", desc: "You talking with a companion", ref: chatRef },
            { key: "journal", label: "📓 Journal Screen", desc: "The journal or world picker", ref: journalRef },
            { key: "meditation", label: "🧘 Meditation Screen", desc: "Meditation screen with companion", ref: meditationRef },
          ].map(({ key, label, desc, ref }) => (
            <div
              key={key}
              onClick={() => ref.current && ref.current.click()}
              style={{
                background: clips[key] ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                border: `2px dashed ${clips[key] ? "#7c3aed" : "rgba(167,139,250,0.25)"}`,
                borderRadius: 14,
                padding: "16px 18px",
                marginBottom: 12,
                cursor: "pointer",
              }}
            >
              <input
                ref={ref}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={e => handleClipUpload(key, e.target.files[0])}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 26 }}>{clips[key] ? "✅" : "⬆️"}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                  <div style={{ color: "#a78bfa", fontSize: 12, marginTop: 2 }}>
                    {clips[key] ? `✓ ${clips[key].name}` : desc}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setStep(2)}
            disabled={!allClipsReady}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: allClipsReady
                ? "linear-gradient(90deg, #7c3aed, #db2777)"
                : "rgba(255,255,255,0.08)",
              color: allClipsReady ? "white" : "#6b7280",
              fontWeight: 700, fontSize: 15,
              cursor: allClipsReady ? "pointer" : "not-allowed",
              marginTop: 8,
            }}
          >
            {allClipsReady ? "Next → Pick Companions 👥" : "Upload all 3 clips to continue"}
          </button>
        </div>
      )}

      {/* ── STEP 2: Pick Companions ── */}
      {step === 2 && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: "#e879f9" }}>
            Step 2 — Pick Up to 6 Companions
          </h2>
          <p style={{ color: "#a78bfa", fontSize: 13, marginBottom: 18 }}>
            They'll appear in your video intro. Selected: {selectedCompanions.length}/6
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
            {COMPANIONS.map(c => {
              const selected = selectedCompanions.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleCompanion(c.id)}
                  style={{
                    textAlign: "center", cursor: "pointer", padding: "8px 4px",
                    borderRadius: 12,
                    background: selected ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                    border: `2px solid ${selected ? "#a855f7" : "rgba(167,139,250,0.12)"}`,
                    transform: selected ? "scale(1.04)" : "scale(1)",
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                >
                  {selected && (
                    <div style={{
                      position: "absolute", top: 4, right: 4,
                      background: "#a855f7", borderRadius: "50%",
                      width: 16, height: 16, fontSize: 9,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, color: "white",
                    }}>✓</div>
                  )}
                  <img
                    src={c.url}
                    alt={c.name}
                    style={{
                      width: 54, height: 70, objectFit: "contain",
                      filter: selected ? "drop-shadow(0 0 6px #a855f7)" : "none",
                    }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: selected ? "#e879f9" : "#9ca3af" }}>
                    {c.name}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{
              flex: 1, padding: "12px", borderRadius: 12,
              border: "1px solid rgba(167,139,250,0.25)", background: "transparent",
              color: "#a78bfa", fontWeight: 600, cursor: "pointer",
            }}>← Back</button>
            <button onClick={() => setStep(3)} style={{
              flex: 2, padding: "12px", borderRadius: 12, border: "none",
              background: "linear-gradient(90deg, #7c3aed, #db2777)",
              color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>Next → Add Text ✏️</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Text ── */}
      {step === 3 && (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: "#e879f9" }}>
            Step 3 — Add Your Text
          </h2>
          <p style={{ color: "#a78bfa", fontSize: 13, marginBottom: 22 }}>
            Customize the hook and end card for your video.
          </p>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#c084fc", display: "block", marginBottom: 8 }}>
              🎣 Opening Hook (shown at start)
            </label>
            <input
              value={hookText}
              onChange={e => setHookText(e.target.value)}
              placeholder="e.g. Feeling alone?"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.3)",
                color: "white", fontSize: 15, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#c084fc", display: "block", marginBottom: 8 }}>
              🏁 End Card Text
            </label>
            <textarea
              value={endText}
              onChange={e => setEndText(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.3)",
                color: "white", fontSize: 14, outline: "none", resize: "none",
                boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 10, padding: "12px 14px", marginBottom: 16,
              fontSize: 13, color: "#fca5a5",
            }}>
              ⚠️ {error}
            </div>
          )}

          {isProcessing && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#a78bfa" }}>
                <span>🎬 Building your video...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, #7c3aed, #db2777)",
                  width: `${progress}%`, transition: "width 0.5s ease",
                }} />
              </div>
              <p style={{ color: "#a78bfa", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                Takes 1–2 minutes ☕ hang tight!
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(2)} disabled={isProcessing} style={{
              flex: 1, padding: "12px", borderRadius: 12,
              border: "1px solid rgba(167,139,250,0.25)", background: "transparent",
              color: "#a78bfa", fontWeight: 600, cursor: "pointer",
            }}>← Back</button>
            <button onClick={handleMakeVideo} disabled={isProcessing} style={{
              flex: 2, padding: "14px", borderRadius: 12, border: "none",
              background: isProcessing ? "rgba(124,58,237,0.35)" : "linear-gradient(90deg, #7c3aed, #db2777)",
              color: "white", fontWeight: 700, fontSize: 15,
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}>
              {isProcessing ? "⏳ Processing..." : "🔥 Make My Video!"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Preview & Download ── */}
      {step === 4 && videoUrl && (
        <div style={{ maxWidth: 380, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e879f9", marginBottom: 8 }}>
            Your Video is Ready!
          </h2>
          <p style={{ color: "#a78bfa", fontSize: 14, marginBottom: 22 }}>
            Download and post to TikTok 💜
          </p>

          <video
            src={videoUrl}
            controls
            style={{
              width: "100%", maxWidth: 260, borderRadius: 18,
              border: "2px solid rgba(168,85,247,0.4)",
              boxShadow: "0 0 40px rgba(168,85,247,0.25)",
              marginBottom: 18,
            }}
          />

          <a
            href={videoUrl}
            download="unfiltr_ad.mp4"
            style={{
              display: "block", padding: "14px 24px", borderRadius: 12, marginBottom: 10,
              background: "linear-gradient(90deg, #7c3aed, #db2777)",
              color: "white", fontWeight: 700, fontSize: 16, textDecoration: "none",
            }}
          >
            ⬇️ Download Video
          </a>

          <button
            onClick={() => {
              setStep(1);
              setClips({ chat: null, journal: null, meditation: null });
              setSelectedCompanions([]);
              setVideoUrl(null);
              setProgress(0);
              setError(null);
            }}
            style={{
              width: "100%", padding: "12px", borderRadius: 12,
              border: "1px solid rgba(167,139,250,0.3)", background: "transparent",
              color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            🔄 Make Another Video
          </button>
        </div>
      )}
    </div>
  );
}
