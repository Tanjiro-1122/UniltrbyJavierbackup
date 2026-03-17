import React from "react";
import { Brain } from "lucide-react";
import LiveAvatar from "@/components/LiveAvatar";

export default function ChatAvatarSection({
  companion, companionMood, isSpeaking, companionDisplayName,
  vibe, environment, isPremium, remaining, FREE_LIMIT,
  sessionMemory, setShowPaywall, spawnParticles, particles,
  showStreakBanner, streak, showAnniversary, anniversary,
}) {
  return (
    <div style={{
      flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 16px",
      position: "relative",
      width: "100%",
      boxSizing: "border-box",
    }}>
      {/* Avatar + particles */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        {isSpeaking && (
          <div style={{ position: "absolute", inset: -16, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)", animation: "speakPulse 1.2s ease-in-out infinite", pointerEvents: "none" }} />
        )}
        {particles.map(p => (
          <div key={p.id} className="particle"
            style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, 0)", "--tx": `${p.x}px`, "--ty": `${p.y}px`, fontSize: 12, zIndex: 3, pointerEvents: "none" }}>
            {p.emoji}
          </div>
        ))}
        <LiveAvatar companionId={companion.id} mood={companionMood} isSpeaking={isSpeaking} onClick={spawnParticles} />
      </div>

      {/* Name + info pill */}
      <div style={{
        background: "rgba(6,2,15,0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "6px 16px 5px",
        margin: "4px 0 0", textAlign: "center",
      }}>
        <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: 0 }}>{companionDisplayName}</p>
        <p style={{ color: "rgba(196,180,252,0.8)", fontSize: 10, margin: "2px 0 3px", textTransform: "capitalize" }}>{vibe} mode · {environment.label}</p>
        {!isPremium ? (
          <button onClick={() => setShowPaywall(true)}
            style={{ fontSize: 10, color: "rgba(196,180,252,0.9)", background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.4)", padding: "2px 10px", borderRadius: 999, cursor: "pointer" }}>
            {remaining}/{FREE_LIMIT} msgs left · Unlock unlimited
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <p style={{ fontSize: 10, color: "rgba(168,85,247,0.9)", margin: 0 }}>✨ Premium</p>
            {sessionMemory.length > 0 && (
              <span style={{ fontSize: 10, color: "rgba(168,85,247,0.7)", display: "flex", alignItems: "center", gap: 2 }}>
                · <Brain size={9} color="rgba(168,85,247,0.7)" /> {sessionMemory.length} memories
              </span>
            )}
          </div>
        )}
      </div>

      {/* Banners */}
      {showStreakBanner && (
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, rgba(234,88,12,0.9), rgba(239,68,68,0.9))",
          backdropFilter: "blur(12px)", borderRadius: 999,
          padding: "5px 12px", zIndex: 20, whiteSpace: "nowrap",
          animation: "bannerSlide 0.4s ease-out forwards",
          boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
        }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 11 }}>🔥 {streak} day streak!</span>
        </div>
      )}
      {showAnniversary && anniversary && (
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(219,39,119,0.95))",
          backdropFilter: "blur(12px)", borderRadius: 14,
          padding: "5px 12px", zIndex: 20, whiteSpace: "nowrap",
          animation: "bannerSlide 0.4s ease-out forwards",
          boxShadow: "0 4px 24px rgba(168,85,247,0.5)",
          textAlign: "center",
        }}>
          <span style={{ color: "white", fontWeight: 800, fontSize: 11 }}>🎉 {anniversary} Days Together! ✨</span>
        </div>
      )}
    </div>
  );
}