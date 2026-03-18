import React from "react";
import { useChatEngine } from "@/components/chat/useChatEngine";
import AppShell from "@/components/shell/AppShell";
import ParallaxBackground from "@/components/chat/ParallaxBackground";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatAvatarSection from "@/components/chat/ChatAvatarSection";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatRetryBar from "@/components/chat/ChatRetryBar";
import ConversationStarters from "@/components/chat/ConversationStarters";
import QuoteReply from "@/components/chat/QuoteReply";
import ChatInputBar from "@/components/chat/ChatInputBar";
import MoodCheckIn from "@/components/chat/MoodCheckIn";
import PaywallModal from "@/components/PaywallModal";
import ShareCardModal from "@/components/ShareCardModal";
import RatingPromptModal from "@/components/RatingPromptModal";
import CompanionShareCard from "@/components/companion/CompanionShareCard";
import AchievementBadges from "@/components/achievements/AchievementBadges";
import GuidedMeditation from "@/components/meditation/GuidedMeditation";
import MiniGames from "@/components/games/MiniGames";

export default function ChatPage() {
  const engine = useChatEngine();

  if (!engine.companion || !engine.environment) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#06020f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const userMsgCount = engine.messages.filter(m => m.role === "user").length;

  return (
    <AppShell tabs={false} style={{ position: "relative", overflow: "hidden" }}>
      <ParallaxBackground imageUrl={engine.environment.url} />

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,2,15,0.3) 0%, rgba(6,2,15,0.6) 50%, rgba(6,2,15,0.85) 100%)", zIndex: 1, pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 0 }}>
        <ChatHeader
          voiceEnabled={engine.voiceEnabled}
          setVoiceEnabled={engine.setVoiceEnabled}
          isPremium={engine.isPremium}
          messages={engine.messages}
          companion={engine.companion}
          navigate={engine.navigate}
          setMessages={engine.setMessages}
          vibe={engine.vibe}
          onShowGames={() => engine.setShowGames(true)}
          onShowMeditation={() => engine.setShowMeditation(true)}
          onShowAchievements={() => engine.setShowAchievements(true)}
        />

        <ChatAvatarSection
          companion={engine.companion}
          companionMood={engine.companionMood}
          isSpeaking={engine.isSpeaking}
          companionDisplayName={engine.companionDisplayName}
          vibe={engine.vibe}
          environment={engine.environment}
          isPremium={engine.isPremium}
          remaining={engine.remaining}
          FREE_LIMIT={engine.FREE_LIMIT}
          sessionMemory={[]}
          setShowPaywall={engine.setShowPaywall}
          spawnParticles={engine.spawnParticles}
          particles={engine.particles}
          showStreakBanner={engine.showStreakBanner}
          streak={engine.streak}
          showAnniversary={engine.showAnniversary}
          anniversary={engine.anniversary}
        />

        <ChatMessages
          messages={engine.messages}
          loading={engine.loading}
          companionMood={engine.companionMood}
          setShareCard={engine.setShareCard}
          messagesEndRef={engine.messagesEndRef}
          onSwipeReply={(msg) => engine.setQuoteReply(msg.content)}
        />

        {engine.sendError && <ChatRetryBar onRetry={engine.handleRetry} />}

        <ConversationStarters
          onSelect={engine.handleSend}
          visible={userMsgCount === 0 && !engine.loading}
        />

        <QuoteReply quote={engine.quoteReply} onClear={() => engine.setQuoteReply(null)} />

        <ChatInputBar
          input={engine.input}
          setInput={engine.setInput}
          loading={engine.loading}
          isListening={engine.isListening}
          isPremium={engine.isPremium}
          pendingImage={engine.pendingImage}
          setPendingImage={engine.setPendingImage}
          companionDisplayName={engine.companionDisplayName}
          handleSend={engine.handleSend}
          startListening={engine.startListening}
          stopListening={engine.stopListening}
          handlePhotoClick={engine.handlePhotoClick}
        />

        {/* Hidden file input for photos */}
        <input
          ref={engine.fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={engine.handleFileChange}
        />
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes speakPulse { 0%,100%{transform:scale(1);opacity:0.35} 50%{transform:scale(1.15);opacity:0.55} }
        @keyframes bannerSlide { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .particle { animation: particleBurst 0.8s ease-out forwards; }
        @keyframes particleBurst { 0%{opacity:1;transform:translate(-50%,0) scale(1)} 100%{opacity:0;transform:translate(calc(-50% + var(--tx)),var(--ty)) scale(0.3)} }
        .listen-pulse { animation: listenPulse 1s ease-in-out infinite; }
        @keyframes listenPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
      `}</style>

      {/* Modals */}
      <MoodCheckIn
        visible={engine.showMoodCheckIn}
        onSelect={engine.handleMoodSelect}
        onDismiss={() => engine.setShowMoodCheckIn(false)}
        companionName={engine.companionDisplayName}
      />

      <PaywallModal
        visible={engine.showPaywall}
        onClose={() => engine.setShowPaywall(false)}
        onSubscribe={() => {}}
        onRestore={() => {}}
      />

      {engine.shareCard && (
        <ShareCardModal
          message={engine.shareCard.message}
          mood={engine.shareCard.mood}
          companion={engine.companion}
          onClose={() => engine.setShareCard(null)}
        />
      )}

      {engine.showRatingPrompt && (
        <RatingPromptModal
          companionName={engine.companionDisplayName}
          onClose={() => engine.setShowRatingPrompt(false)}
        />
      )}

      {engine.showCompanionCard && (
        <CompanionShareCard
          companion={engine.companion}
          onClose={() => engine.setShowCompanionCard(false)}
        />
      )}

      {engine.showAchievements && (
        <AchievementBadges onClose={() => engine.setShowAchievements(false)} />
      )}

      {engine.showMeditation && (
        <GuidedMeditation onClose={() => engine.setShowMeditation(false)} />
      )}

      {engine.showGames && (
        <MiniGames onClose={() => engine.setShowGames(false)} />
      )}

      {/* Photo disclaimer */}
      {engine.showPhotoDisclaimer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => engine.setShowPhotoDisclaimer(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "linear-gradient(180deg, #1a0a2e, #0d0118)", borderRadius: 24, padding: 24, border: "1px solid rgba(168,85,247,0.2)" }}>
            <p style={{ textAlign: "center", fontSize: 28, margin: "0 0 8px" }}>📸</p>
            <h3 style={{ color: "white", fontWeight: 800, fontSize: 16, textAlign: "center", margin: "0 0 8px" }}>Photo Sharing</h3>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center", lineHeight: 1.6, margin: "0 0 16px" }}>
              Your companion can see and respond to photos you share. Photos are processed securely and not stored permanently.
            </p>
            <button onClick={engine.handlePhotoDisclaimerAccept}
              style={{ width: "100%", padding: 14, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Got it, let's go!
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}