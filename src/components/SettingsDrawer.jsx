import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function SettingsDrawer({ open, onClose, userProfile }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    localStorage.clear();
    await base44.auth.logout(); // redirects to /welcome
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-[#1a0a2e] to-[#0a0a0f] border-r border-white/10 z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white font-bold text-xl">Settings</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Display Name</p>
                <p className="text-white font-semibold">{userProfile.display_name}</p>
              </div>

              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Premium</p>
                <p className="text-white font-semibold">{userProfile.premium ? "Active" : "Free"}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-3 bg-red-500/20 border border-red-500/40 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition flex items-center justify-center gap-2 mt-auto"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}