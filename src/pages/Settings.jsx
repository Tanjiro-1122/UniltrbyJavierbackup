import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut, Trash2, Sparkles } from "lucide-react";
import PaywallModal from "@/components/PaywallModal";
import { base44 } from "@/api/base44Client";

export default function Settings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

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
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a0a2e] flex flex-col max-w-[430px] mx-auto relative">
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

        {/* Companion */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Companion</p>
          <p className="text-white font-semibold text-lg">{companion.name}</p>
        </motion.div>

        {/* Background */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Background</p>
          <p className="text-white font-semibold text-lg capitalize">{userProfile.background_id}</p>
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

      {/* Sign Out + Delete */}
      <motion.div className="px-4 pt-4 space-y-3" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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