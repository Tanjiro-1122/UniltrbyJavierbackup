import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut, Trash2, Sparkles, Check } from "lucide-react";
import AppFooter from "@/components/AppFooter";
import PaywallModal from "@/components/PaywallModal";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, BACKGROUNDS } from "@/components/companionData";

export default function Settings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [savingCompanion, setSavingCompanion] = useState(false);
  const [savingBackground, setSavingBackground] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const profileId = localStorage.getItem("userProfileId");
      if (!profileId) return;
      const profile = await base44.entities.UserProfile.get(profileId);
      const comp = await base44.entities.Companion.get(profile.companion_id);
      setUserProfile(profile);
      setCompanion(comp);
    };
    loadData();
  }, []);

  const handleSignOut = async () => {
    localStorage.clear();
    await base44.auth.logout();
  };

  const handleChangeCompanion = async (newCompanion) => {
    if (savingCompanion || newCompanion.name === companion.name) return;
    setSavingCompanion(true);
    // Update the existing Companion record with the new companion's data
    await base44.entities.Companion.update(userProfile.companion_id, {
      name: newCompanion.name,
      avatar_url: newCompanion.avatar,
      personality: newCompanion.tagline,
    });
    // Update localStorage so ChatPage loads the right companion
    const updatedComp = { ...newCompanion, systemPrompt: companion.systemPrompt };
    localStorage.setItem("unfiltr_companion", JSON.stringify(updatedComp));
    setCompanion((prev) => ({ ...prev, name: newCompanion.name, avatar_url: newCompanion.avatar }));
    setSavingCompanion(false);
  };

  const handleChangeBackground = async (bgId) => {
    if (savingBackground || bgId === userProfile.background_id) return;
    setSavingBackground(true);
    const profileId = localStorage.getItem("userProfileId");
    await base44.entities.UserProfile.update(profileId, { background_id: bgId });
    const bg = BACKGROUNDS.find((b) => b.id === bgId);
    localStorage.setItem("unfiltr_env", JSON.stringify({ id: bg.id, label: bg.label, bg: bg.url }));
    setUserProfile((prev) => ({ ...prev, background_id: bgId }));
    setSavingBackground(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const profileId = localStorage.getItem("userProfileId");
    const companionId = localStorage.getItem("companionId");
    if (profileId) await base44.entities.UserProfile.delete(profileId);
    if (companionId) await base44.entities.Companion.delete(companionId);
    localStorage.clear();
    await base44.auth.logout();
  };

  if (!userProfile || !companion) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a0a2e] flex flex-col max-w-[430px] mx-auto relative pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-6 border-b border-white/5" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}>
        <button
          onClick={() => navigate("/chat")}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-xl">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Display Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Display Name</p>
          <p className="text-white font-semibold text-lg">{userProfile.display_name}</p>
        </motion.div>

        {/* Companion Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Your Companion</p>
          <div className="grid grid-cols-4 gap-3">
            {COMPANIONS.map((c) => {
              const isSelected = companion.name === c.name;
              return (
                <button
                  key={c.id}
                  onClick={() => handleChangeCompanion(c)}
                  className="flex flex-col items-center gap-1.5 relative"
                >
                  <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? "border-purple-500 scale-105" : "border-white/10"}`}
                    style={{ background: isSelected ? "#2d1a4e" : "#1a1a2e" }}>
                    <img
                      src={c.poses.neutral}
                      alt={c.name}
                      className="w-full h-full object-cover object-top"
                      style={{ background: "none", backgroundColor: "transparent", border: "none", mixBlendMode: "normal" }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isSelected ? "text-purple-300" : "text-white/50"}`}>{c.name}</span>
                </button>
              );
            })}
          </div>
          {savingCompanion && <p className="text-white/30 text-xs mt-2 text-center">Saving...</p>}
        </motion.div>

        {/* Background Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Background</p>
          <div className="grid grid-cols-2 gap-3">
            {BACKGROUNDS.map((bg) => {
              const isSelected = userProfile.background_id === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => handleChangeBackground(bg.id)}
                  className={`relative h-24 rounded-2xl border-2 overflow-hidden transition-all ${
                    isSelected ? "border-purple-500" : "border-white/10"
                  }`}
                >
                  <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 p-2 text-center pointer-events-none">
                    <p className="text-white text-xs font-semibold">{bg.emoji} {bg.label}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {savingBackground && <p className="text-white/30 text-xs mt-2 text-center">Saving...</p>}
        </motion.div>

        {/* Premium Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Status</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${userProfile.premium ? "bg-purple-500" : "bg-white/30"}`} />
              <p className="text-white font-semibold">{userProfile.premium ? "✨ Premium" : "Free (20 msgs/day)"}</p>
            </div>
            {!userProfile.premium && (
              <button
                onClick={() => setShowPaywall(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full"
              >
                <Sparkles className="w-3 h-3" />
                Upgrade
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer with Extra Padding */}
      <div className="pb-4">
        <AppFooter dark />
      </div>

      {/* Sign Out + Delete */}
      <motion.div className="px-4 pt-2 space-y-3" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-500/20 border border-red-500/40 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-3 bg-transparent border border-white/10 text-white/30 font-medium rounded-xl hover:border-red-500/30 hover:text-red-400/60 transition flex items-center justify-center gap-2 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </motion.div>

      {/* Paywall */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={() => {
          if (window.webkit?.messageHandlers?.storekit) {
            window.webkit.messageHandlers.storekit.postMessage({ action: "subscribe", productId: "com.unfiltr.premium.monthly" });
          } else {
            alert("In-app purchase: com.unfiltr.premium.monthly ($9.99/month)");
          }
        }}
        onRestore={() => {
          if (window.webkit?.messageHandlers?.storekit) {
            window.webkit.messageHandlers.storekit.postMessage({ action: "restore" });
          } else {
            alert("Restore purchases — handled by Apple StoreKit.");
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-[#1a0a2e] border border-white/10 rounded-t-3xl px-6 pt-6"
              style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-white font-bold text-xl mb-2">Delete Account?</h3>
              <p className="text-white/50 text-sm mb-6">This will permanently delete your profile, companion, and all messages. This cannot be undone.</p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl mb-3 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3 bg-white/10 text-white/70 font-medium rounded-xl"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}