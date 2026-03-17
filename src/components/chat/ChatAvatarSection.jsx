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
      {/* Avatar + particles — takes up to 38% of viewport height */}
      <div style={{ position: "relative", width: "clamp(180px, 38dvh, 320px)", height: "clamp(180px, 38dvh, 320px)", marginBottom: 4 }}>
        {isSpeaking && (
          <div style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)", animation: "speakPulse 1.2s ease-in-out infinite", pointerEvents: "none" }} />
        )}
        {particles.map(p => (
          <div key={p.id} className="particle"
            style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, 0)", "--tx": `${p.x}px`, "--ty": `${p.y}px`, fontSize: 12, zIndex: 3, pointerEvents: "none" }}>
            {p.emoji}
          </div>
        ))}
        <LiveAvatar companionId={companion.id} mood={companionMood} isSpeaking={isSpeaking} onClick={spawnParticles} />
      </div>

      {/* Minimal status — no name pill */}
      {!isPremium && (
        <button onClick={() => setShowPaywall(true)}
          style={{ fontSize: 10, color: "rgba(196,180,252,0.9)", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)", padding: "3px 12px", borderRadius: 999, cursor: "pointer", marginTop: 2 }}>
          {remaining}/{FREE_LIMIT} msgs left · Unlock unlimited
        </button>
      )}

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