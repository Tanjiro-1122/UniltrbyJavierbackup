import React from "react";
import { subscribeToPlan, restorePurchases } from "@/components/utils/iapBridge";

import { useChatEngine } from "@/components/chat/useChatEngine";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInputBar from "@/components/chat/ChatInputBar";
import ChatRetryBar from "@/components/chat/ChatRetryBar";
import ConversationStarters from "@/components/chat/ConversationStarters";
import MoodCheckIn from "@/components/chat/MoodCheckIn";
import QuoteReply from "@/components/chat/QuoteReply";
import LiveAvatar from "@/components/LiveAvatar";
import AchievementBadges from "@/components/achievements/AchievementBadges";
import GuidedMeditation from "@/components/meditation/GuidedMeditation";
import MiniGames from "@/components/games/MiniGames";
import CompanionShareCard from "@/components/companion/CompanionShareCard";
import ParallaxBackground from "@/components/chat/ParallaxBackground";
import BackgroundEffect from "@/components/chat/BackgroundEffect";
import RatingPromptModal from "@/components/RatingPromptModal";
import ShareCardModal from "@/components/ShareCardModal";
import PaywallModal from "@/components/PaywallModal";

import { COMPANIONS } from "@/components/companionData";

export default function ChatPage() {
  const chat = useChatEngine();

  const handleSubscribe = () => subscribeToPlan("monthly");
  const handleRestore = () => restorePurchases();

  if (!chat.companion || !chat.environment) return (
    <div style={{ position: "fixed", inset: 0, background: "#06020f", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <input ref={chat.fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={chat.handleFileChange} />

      <div style={{ position: "fixed", inset: 0, width: "100%", overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 1, background: "#06020f" }}>
        <ParallaxBackground imageUrl={chat.environment.bg} />
        <BackgroundEffect environmentId={chat.environment.id} />
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 40%, rgba(6,2,15,0.6) 75%, rgba(6,2,15,0.9) 100%)" }} />

        <style>{`
          @keyframes particleFly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.3)} }
          @keyframes listenPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
          @keyframes speakPulse  { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
          @keyframes spin        { to { transform: rotate(360deg); } }
          @keyframes bannerSlide { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
          .particle     { animation: particleFly 1s ease-out forwards; }
          .listen-pulse { animation: listenPulse 0.8s ease-in-out infinite; }
        `}</style>

        <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", flexDirection: "column", width: "100%", paddingTop: "env(safe-area-inset-top, 0px)", boxSizing: "border-box", overflow: "hidden" }}>

          {/* TOP MENU BAR */}
          <ChatHeader
            voiceEnabled={chat.voiceEnabled}
            setVoiceEnabled={chat.setVoiceEnabled}
            isPremium={chat.isPremium}
            messages={chat.messages}
            companion={chat.companion}
            navigate={chat.navigate}
            setMessages={chat.setMessages}
            vibe={chat.vibe}
            onShowGames={() => chat.setShowGames(true)}
            onShowMeditation={() => chat.setShowMeditation(true)}
            onShowAchievements={() => chat.setShowAchievements(true)}
          />

          {/* AVATAR */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", width: "100%", padding: "0 16px", boxSizing: "border-box" }}>
            {chat.isSpeaking && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "clamp(180px, 40dvh, 300px)", height: "clamp(180px, 40dvh, 300px)", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)", animation: "speakPulse 1.2s ease-in-out infinite", pointerEvents: "none" }} />
            )}
            {chat.particles.map(p => (
              <div key={p.id} className="particle"
                style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, 0)", "--tx": `${p.x}px`, "--ty": `${p.y}px`, fontSize: 12, zIndex: 3, pointerEvents: "none" }}>
                {p.emoji}
              </div>
            ))}
            <LiveAvatar companionId={chat.companion.id} mood={chat.companionMood} isSpeaking={chat.isSpeaking} onClick={chat.spawnParticles} />
            <button onClick={() => chat.setShowCompanionCard(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 8px", marginTop: 2 }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>
                {chat.companionDisplayName} {COMPANIONS.find(c => c.id === chat.companion.id)?.emoji || ""}
              </span>
            </button>

            {!chat.isPremium && (
              <button onClick={() => chat.setShowPaywall(true)}
                style={{ fontSize: 10, color: "rgba(196,180,252,0.9)", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)", padding: "3px 12px", borderRadius: 999, cursor: "pointer", marginTop: 4 }}>
                {chat.remaining}/{chat.FREE_LIMIT} msgs left · Unlock unlimited
              </button>
            )}

            {chat.showStreakBanner && (
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, rgba(234,88,12,0.9), rgba(239,68,68,0.9))", backdropFilter: "blur(12px)", borderRadius: 999, padding: "5px 12px", zIndex: 20, whiteSpace: "nowrap", animation: "bannerSlide 0.4s ease-out forwards", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 11 }}>🔥 {chat.streak} day streak!</span>
              </div>
            )}
            {chat.showAnniversary && chat.anniversary && (
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(219,39,119,0.95))", backdropFilter: "blur(12px)", borderRadius: 14, padding: "5px 12px", zIndex: 20, whiteSpace: "nowrap", animation: "bannerSlide 0.4s ease-out forwards", boxShadow: "0 4px 24px rgba(168,85,247,0.5)", textAlign: "center" }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 11 }}>🎉 {chat.anniversary} Days Together! ✨</span>
              </div>
            )}
          </div>

          {/* Memory banner */}
          {chat.showMemoryBanner && !chat.isPremium && (
            <div onClick={() => chat.setShowPaywall(true)}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "4px 16px", background: "rgba(139,92,246,0.08)", borderBottom: "1px solid rgba(139,92,246,0.12)", cursor: "pointer", opacity: 0.85 }}>
              <span style={{ fontSize: 11 }}>🔒</span>
              <span style={{ color: "rgba(196,180,252,0.7)", fontSize: 10, fontWeight: 500 }}>Unlock Memory — tap to learn more</span>
            </div>
          )}

          {/* CHAT MESSAGES */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "linear-gradient(180deg, rgba(6,2,15,0.3) 0%, rgba(6,2,15,0.85) 30%)", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
            <ChatMessages
              messages={chat.messages}
              loading={chat.loading}
              companionMood={chat.companionMood}
              setShareCard={chat.setShareCard}
              messagesEndRef={chat.messagesEndRef}
              onSwipeReply={(text) => chat.setQuoteReply(text)}
            />
          </div>

          {/* CONVERSATION STARTERS */}
          <ConversationStarters
            visible={chat.messages.filter(m => m.role === "user").length === 0}
            onSelect={(text) => chat.handleSend(text)}
          />

          {/* RETRY BAR */}
          {chat.sendError && <ChatRetryBar onRetry={chat.handleRetry} />}

          {/* Quote reply bar */}
          {chat.quoteReply && (
            <div style={{ flexShrink: 0, padding: "0 12px" }}>
              <QuoteReply quote={chat.quoteReply} onClear={() => chat.setQuoteReply(null)} />
            </div>
          )}

          {/* TEXT INPUT */}
          <ChatInputBar
            input={chat.input}
            setInput={chat.setInput}
            loading={chat.loading}
            isListening={chat.isListening}
            isPremium={chat.isPremium}
            pendingImage={chat.pendingImage}
            setPendingImage={chat.setPendingImage}
            companionDisplayName={chat.companionDisplayName}
            handleSend={chat.handleSend}
            startListening={chat.startListening}
            stopListening={chat.stopListening}
            handlePhotoClick={chat.handlePhotoClick}
          />
        </div>
      </div>

      {/* PHOTO DISCLAIMER MODAL */}
      {chat.showPhotoDisclaimer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => chat.setShowPhotoDisclaimer(false)}>
          <div style={{ width: "100%", background: "#1a0a2e", borderRadius: "24px 24px 0 0", padding: "24px 24px", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 999, margin: "0 auto 20px" }} />
            <p style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>📸</p>
            <h3 style={{ color: "white", fontWeight: 800, fontSize: 18, margin: "0 0 10px", textAlign: "center" }}>Share a Photo</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" }}>
              Photos you share are sent to the AI to respond to. They are not stored permanently and are only used for this conversation.
            </p>
            <button onClick={chat.handlePhotoDisclaimerAccept}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", borderRadius: 14, color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
              Got it, share photo
            </button>
            <button onClick={() => chat.setShowPhotoDisclaimer(false)}
              style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <PaywallModal visible={chat.showPaywall} onClose={() => chat.setShowPaywall(false)} onSubscribe={handleSubscribe} onRestore={handleRestore} isAndroid={/android/i.test(navigator.userAgent)} />
      <RatingPromptModal visible={chat.showRatingPrompt} onClose={() => chat.setShowRatingPrompt(false)} />
      <ShareCardModal visible={!!chat.shareCard} onClose={() => chat.setShareCard(null)} message={chat.shareCard?.message || ""} companionName={chat.companionDisplayName} mood={chat.shareCard?.mood || "neutral"} />
      <MoodCheckIn visible={chat.showMoodCheckIn} onSelect={chat.handleMoodSelect} onDismiss={() => { localStorage.setItem("unfiltr_mood_checkin_date", new Date().toDateString()); chat.setShowMoodCheckIn(false); }} companionName={chat.companionDisplayName} />
      <AchievementBadges visible={chat.showAchievements} onClose={() => chat.setShowAchievements(false)} />
      <GuidedMeditation visible={chat.showMeditation} onClose={() => chat.setShowMeditation(false)} companionName={chat.companionDisplayName} />
      <MiniGames visible={chat.showGames} onClose={() => chat.setShowGames(false)} onSendMessage={(text) => chat.handleSend(text)} />
      <CompanionShareCard
        visible={chat.showCompanionCard}
        onClose={() => chat.setShowCompanionCard(false)}
        companionId={chat.companion?.id}
        companionName={chat.companionDisplayName}
        daysTogether={(() => { const c = localStorage.getItem("unfiltr_companion_created"); return c ? Math.max(1, Math.floor((Date.now() - new Date(c).getTime()) / 86400000)) : 0; })()}
      />
    </>
  );
}