import { useState, useRef } from "react";

const COMPANIONS = [
  { id: "luna", name: "Luna", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/943f2fb6c_luna_happy_nobg.png" },
  { id: "kai", name: "Kai", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/e6bf25bb8_kai_happy_nobg.png" },
  { id: "nova", name: "Nova", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/775bab2d1_nova_happy_nobg.png" },
  { id: "river", name: "River", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/public/69b22f8b58e45d23cafd78d2/d329e5eb5_river_happy_nobg.png" },
  { id: "ash", name: "Ash", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/a8e79ed38_ash_happy_nobg.png" },
  { id: "sakura", name: "Sakura", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/6fb3c5226_sakura_happy_nobg.png" },
  { id: "ryuu", name: "Ryuu", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/9aaa48819_ryuu_happy_nobg.png" },
  { id: "sage", name: "Sage", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/public/69b22f8b58e45d23cafd78d2/4e619dbd3_sage_happy_nobg.png" },
  { id: "zara", name: "Zara", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/public/69b22f8b58e45d23cafd78d2/2165704e8_zara_happy_nobg.png" },
  { id: "echo", name: "Echo", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/55bcca860_happy.png" },
  { id: "soleil", name: "Soleil", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/0e3c34b7e_happy.png" },
  { id: "juan", name: "Juan", url: "https://base44.app/api/apps/69b22f8b58e45d23cafd78d2/files/mp/public/69b22f8b58e45d23cafd78d2/00155921c_juan_happy_nobg.png" },
];

const STEPS = ["clips", "companions", "text", "preview"];

export default function AdMaker() {
  const [step, setStep] = useState("clips");
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
      setStep("preview");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0035 0%, #0d001a 100%)",
      color: "white",
      fontFamily: "'Inter', sans-serif",
      padding: "20px"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🎬</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, background: "linear-gradient(90deg, #c084fc, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Unfiltr Ad Maker
        </h1>
        <p style={{ color: "#a78bfa", margin: "6px 0 0", fontSize: 14 }}>
          Build your TikTok promo in 4 easy steps
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
        {[
          { key: "clips", label: "📹 Clips", num: 1 },
          { key: "companions", label: "👥 Companions", num: 2 },
          { key: "text", label: "✏️ Text", num: 3 },
          { key: "preview", label: "🎉 Done", num: 4 },
        ].map(s => (
          <div key={s.key} style={{
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: step === s.key ? "linear-gradient(90deg, #7c3aed, #db2777)" : "rgba(255,255,255,0.08)",
            color: step === s.key ? "white" : "#a78bfa",
            cursor: "pointer",
            border: step === s.key ? "none" : "1px solid rgba(167,139,250,0.2)",
            transition: "all 0.2s"
          }} onClick={() => step !== "preview" && setStep(s.key)}>
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1 — Upload Clips */}
      {step === "clips" && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#e879f9" }}>Step 1 — Upload Your 3 Screen Recordings</h2>
          <p style={{ color: "#a78bfa", fontSize: 13, marginBottom: 24 }}>
            These are YOUR real app recordings — the chat screen, journal screen, and meditation screen. Each clip should be 3-5 seconds.
          </p>

          {[
            { key: "chat", label: "💬 Chat Screen Recording", desc: "You chatting with a companion", ref: chatRef },
            { key: "journal", label: "📓 Journal Screen Recording", desc: "The journal world and writing", ref: journalRef },
            { key: "meditation", label: "🧘 Meditation Screen Recording", desc: "The meditation screen with companion", ref: meditationRef },
          ].map(({ key, label, desc, ref }) => (
            <div key={key} style={{
              background: clips[key] ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              border: `2px dashed ${clips[key] ? "#7c3aed" : "rgba(167,139,250,0.3)"}`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              cursor: "pointer",
              transition: "all 0.2s"
            }} onClick={() => ref.current.click()}>
              <input ref={ref} type="file" accept="video/*" style={{ display: "none" }}
                onChange={e => handleClipUpload(key, e.target.files[0])} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 28 }}>{clips[key] ? "✅" : "⬆️"}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                  <div style={{ color: "#a78bfa", fontSize: 12 }}>{clips[key] ? `✓ ${clips[key].name}` : desc}</div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setStep("companions")}
            disabled={!allClipsReady}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: allClipsReady ? "linear-gradient(90deg, #7c3aed, #db2777)" : "rgba(255,255,255,0.1)",
              color: "white",
              fontWeight: 700,
              fontSize: 15,
              cursor: allClipsReady ? "pointer" : "not-allowed",
              marginTop: 8
            }}>
            {allClipsReady ? "Next → Pick Companions 👥" : "Upload all 3 clips to continue"}
          </button>
        </div>
      )}

      {/* STEP 2 — Pick Companions */}
      {step === "companions" && (
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#e879f9" }}>Step 2 — Pick Up to 6 Companions</h2>
          <p style={{ color: "#a78bfa", fontSize: 13, marginBottom: 20 }}>
            These will appear in your video intro. Selected: {selectedCompanions.length}/6
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {COMPANIONS.map(c => {
              const selected = selectedCompanions.includes(c.id);
              return (
                <div key={c.id} onClick={() => toggleCompanion(c.id)} style={{
                  textAlign: "center",
                  cursor: "pointer",
                  padding: "10px 6px",
                  borderRadius: 14,
                  background: selected ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${selected ? "#a855f7" : "rgba(167,139,250,0.15)"}`,
                  transform: selected ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s",
                  position: "relative"
                }}>
                  {selected && (
                    <div style={{
                      position: "absolute", top: 4, right: 4,
                      background: "#a855f7", borderRadius: "50%",
                      width: 18, height: 18, fontSize: 10,
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800
                    }}>✓</div>
                  )}
                  <img src={c.url} alt={c.name} style={{
                    width: 60, height: 80, objectFit: "contain",
                    filter: selected ? "drop-shadow(0 0 8px #a855f7)" : "none"
                  }} />
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: selected ? "#e879f9" : "#a78bfa" }}>{c.name}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("clips")} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(167,139,250,0.3)",
              background: "transparent", color: "#a78bfa", fontWeight: 600, cursor: "pointer"
            }}>← Back</button>
            <button onClick={() => setStep("text")} style={{
              flex: 2, padding: "12px", borderRadius: 12, border: "none",
              background: "linear-gradient(90deg, #7c3aed, #db2777)", color: "white",
              fontWeight: 700, fontSize: 15, cursor: "pointer"
            }}>Next → Add Text ✏️</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Text */}
      {step === "text" && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#e879f9" }}>Step 3 — Add Your Text</h2>
          <p style={{ color: "#a78bfa", fontSize: 13, marginBottom: 24 }}>Customize the hook and end card for your video.</p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#c084fc", display: "block", marginBottom: 8 }}>
              🎣 Opening Hook (shown at start)
            </label>
            <input
              value={hookText}
              onChange={e => setHookText(e.target.value)}
              placeholder="e.g. Feeling alone?"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.3)",
                color: "white", fontSize: 15, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#c084fc", display: "block", marginBottom: 8 }}>
              🏁 End Card Text (shown at the end)
            </label>
            <textarea
              value={endText}
              onChange={e => setEndText(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.3)",
                color: "white", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
                fontFamily: "inherit"
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5"
            }}>
              ⚠️ {error}
            </div>
          )}

          {isProcessing && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#a78bfa" }}>
                <span>🎬 Building your video...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, #7c3aed, #db2777)",
                  width: `${progress}%`, transition: "width 0.5s ease"
                }} />
              </div>
              <p style={{ color: "#a78bfa", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                This takes 1-2 minutes — hang tight! ☕
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("companions")} disabled={isProcessing} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(167,139,250,0.3)",
              background: "transparent", color: "#a78bfa", fontWeight: 600, cursor: "pointer"
            }}>← Back</button>
            <button onClick={handleMakeVideo} disabled={isProcessing} style={{
              flex: 2, padding: "14px", borderRadius: 12, border: "none",
              background: isProcessing ? "rgba(124,58,237,0.4)" : "linear-gradient(90deg, #7c3aed, #db2777)",
              color: "white", fontWeight: 700, fontSize: 15, cursor: isProcessing ? "not-allowed" : "pointer"
            }}>
              {isProcessing ? "⏳ Processing..." : "🔥 Make My Video!"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Preview & Download */}
      {step === "preview" && videoUrl && (
        <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e879f9", marginBottom: 8 }}>Your Video is Ready!</h2>
          <p style={{ color: "#a78bfa", fontSize: 14, marginBottom: 24 }}>Download it and post directly to TikTok 💜</p>

          <video
            src={videoUrl}
            controls
            style={{
              width: "100%", maxWidth: 280, borderRadius: 20,
              border: "2px solid rgba(168,85,247,0.4)",
              boxShadow: "0 0 40px rgba(168,85,247,0.3)",
              marginBottom: 20
            }}
          />

          <a href={videoUrl} download="unfiltr_ad.mp4" style={{
            display: "block", padding: "14px 24px", borderRadius: 12, marginBottom: 12,
            background: "linear-gradient(90deg, #7c3aed, #db2777)",
            color: "white", fontWeight: 700, fontSize: 16, textDecoration: "none"
          }}>
            ⬇️ Download Video
          </a>

          <button onClick={() => {
            setStep("clips");
            setClips({ chat: null, journal: null, meditation: null });
            setSelectedCompanions([]);
            setVideoUrl(null);
            setProgress(0);
          }} style={{
            width: "100%", padding: "12px", borderRadius: 12,
            border: "1px solid rgba(167,139,250,0.3)", background: "transparent",
            color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: 14
          }}>
            🔄 Make Another Video
          </button>
        </div>
      )}
    </div>
  );
}
