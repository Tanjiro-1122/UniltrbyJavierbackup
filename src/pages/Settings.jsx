import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Settings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [companion, setCompanion] = useState(null);

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

  if (!userProfile || !companion) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a0a2e] flex flex-col max-w-[430px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-6 border-b border-white/5">
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
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${userProfile.premium ? "bg-purple-500" : "bg-white/30"}`} />
            <p className="text-white font-semibold">{userProfile.premium ? "Premium" : "Free"}</p>
          </div>
        </motion.div>
      </div>

      {/* Sign Out Button */}
      <motion.div className="px-4 pb-8 pt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-500/20 border border-red-500/40 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}