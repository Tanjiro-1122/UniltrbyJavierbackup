import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Users, MessageSquare, Crown, ShieldAlert, Phone, Heart, ArrowLeft, RefreshCw, BookOpen, AlertTriangle, MessageSquareMore } from "lucide-react";

const ADMIN_DISPLAY_NAME = "Javier 1122";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    setLoading(true);
    setUnauthorized(false);
    setErrorDetail("");

    // Check localStorage admin flag — set by Settings password modal
    const isAdmin = localStorage.getItem("unfiltr_admin_unlocked") === "true";
    if (!isAdmin) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    // Admin confirmed — load stats
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    setErrorDetail("");
    try {
      const profileId = localStorage.getItem("userProfileId") || "";
      const userId = localStorage.getItem("unfiltr_user_id") || "";
      const response = await base44.functions.invoke('adminStats', { profileId, userId, adminToken: "huertasfam_admin_2026" });
      // Handle both response shapes: { data: {...} } or direct object
      const data = response?.data ?? response;
      if (data && data.totalUsers !== undefined) {
        setStats(data);
      } else if (data?.error) {
        setErrorDetail(data.error);
      } else {
        // Fallback: try to load basic stats directly
        setErrorDetail("Loading stats directly...");
        try {
          const [profiles, messages] = await Promise.all([
            base44.entities.UserProfile.list(),
            base44.entities.Message.list(),
          ]);
          setStats({
            totalUsers: profiles.length,
            premiumUsers: profiles.filter(p => p.is_premium).length,
            todayMessages: messages.filter(m => (m.created_date||"").startsWith(new Date().toISOString().slice(0,10))).length,
            totalJournalEntries: messages.filter(m => m.mood_mode === "journal").length,
            recentUsers: profiles.slice(-10).reverse().map(p => ({
              id: p.id, full_name: p.display_name || "Anonymous",
              email: p.user_id || "", created_date: p.created_date, is_premium: p.is_premium,
            })),
            recentErrors: [],
          });
          setErrorDetail("");
        } catch (fallbackErr) {
          setErrorDetail("Could not load stats: " + (fallbackErr?.message || "unknown"));
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Unknown error";
      setErrorDetail(msg);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="screen no-tabs" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const ADMIN_PASS = "javier1122admin";

  const handleUnlock = () => {
    if (pwInput.trim() === ADMIN_PASS) {
      localStorage.setItem("unfiltr_admin_unlocked", "true");
      setPwError(false);
      checkAccessAndLoad();
    } else {
      setPwError(true);
      setTimeout(() => setPwError(false), 1500);
    }
  };

  if (unauthorized) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#06020f", fontFamily: "'SF Pro Display',system-ui,sans-serif" }}>
        <div style={{ padding: "32px 28px", width: "100%", maxWidth: 360, textAlign: "center" }}>
          <ShieldAlert style={{ width: 52, height: 52, color: "#a855f7", margin: "0 auto 16px" }} />
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 6px" }}>Admin Access</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 24px" }}>Enter the admin password to continue.</p>
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            placeholder="Admin password"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "13px 16px", borderRadius: 14,
              border: pwError ? "1.5px solid #f87171" : "1.5px solid rgba(139,92,246,0.35)",
              background: "rgba(139,92,246,0.08)", color: "white",
              fontSize: 15, outline: "none", marginBottom: 12,
              transition: "border 0.2s",
            }}
          />
          {pwError && <p style={{ color: "#f87171", fontSize: 12, margin: "-4px 0 10px" }}>Wrong password</p>}
          <button
            onClick={handleUnlock}
            style={{
              width: "100%", padding: "13px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 16,
            }}>
            Unlock
          </button>
          <Link to="/chat" style={{ color: "rgba(168,85,247,0.7)", fontSize: 13, textDecoration: "none" }}>← Back to app</Link>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-white" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#06020f" }}>
        <div className="text-center" style={{ padding: "0 32px" }}>
          <ShieldAlert className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p className="text-gray-400 mb-4 text-sm">{errorDetail || "Failed to load stats"}</p>
          <button onClick={loadData} className="text-purple-400 hover:text-purple-300 text-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen no-tabs text-white" style={{ maxWidth: "100%", left: 0, transform: "none", overflow: "auto" }}>
      <div className="scroll-area p-4 pb-10" style={{ overflow: "auto" }}>
        <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <Link to="/settings" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Unfiltr App</p>
            </div>
          </div>
          <button onClick={loadData} className="text-gray-400 hover:text-white p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={<Users className="w-5 h-5 text-purple-400" />} label="Total Users" value={stats.totalUsers} />
          <StatCard icon={<Crown className="w-5 h-5 text-yellow-400" />} label="Premium Users" value={stats.premiumUsers} sub={`${stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% of users`} />
          <StatCard icon={<MessageSquare className="w-5 h-5 text-green-400" />} label="Today's Messages" value={stats.todayMessages} />
          <StatCard icon={<BookOpen className="w-5 h-5 text-blue-400" />} label="Journal Entries" value={stats.totalJournalEntries} />
        </div>

        {/* Quick Links */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Quick Links</h2>
          <Link to="/FeedbackAdmin" className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
            <span className="flex items-center gap-2 text-sm">
              <MessageSquareMore className="w-4 h-4 text-purple-400" />
              Feedback Manager
            </span>
            <span className="text-xs text-gray-500">→</span>
          </Link>
        </div>

        {/* Recent Users */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent Sign-ups</h2>
          {stats.recentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{u.full_name || "Anonymous"}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className="text-xs text-gray-600">{u.created_date ? new Date(u.created_date).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Logs */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-gray-300">Recent Errors</h2>
          </div>
          {(!stats.recentErrors || stats.recentErrors.length === 0) ? (
            <p className="text-gray-500 text-sm">No errors logged yet. 🎉</p>
          ) : (
            <div className="space-y-2">
              {stats.recentErrors.map(e => (
                <div key={e.id} className="p-3 rounded-xl border border-gray-800" style={{ background: "rgba(239,68,68,0.05)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                      background: e.severity === "error" ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)",
                      color: e.severity === "error" ? "#f87171" : "#facc15"
                    }}>
                      {e.severity?.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500">{e.source}</span>
                    <span className="text-[10px] text-gray-600 ml-auto">
                      {e.date ? new Date(e.date).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 break-all">{e.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crisis & Help Resources */}
        <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-red-400" />
            <h2 className="text-sm font-semibold text-red-300">Crisis Help Resources</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            If a user expresses distress, suicidal thoughts, or danger — these resources are available in-app via the chat safety prompt.
          </p>
          <div className="space-y-2">
            <HelpLine label="988 Suicide & Crisis Lifeline" number="988" desc="Call or text — 24/7, US" color="text-red-300" />
            <HelpLine label="Crisis Text Line" number="Text HOME to 741741" desc="Text support, 24/7" color="text-orange-300" />
            <HelpLine label="International Association for Suicide Prevention" number="https://www.iasp.info/resources/Crisis_Centres/" desc="Global crisis centers" color="text-yellow-300" link />
            <HelpLine label="SAMHSA Helpline" number="1-800-662-4357" desc="Mental health & substance use" color="text-pink-300" />
          </div>
        </div>

        {/* Emergency */}
        <div className="bg-orange-950/40 border border-orange-800/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-semibold text-orange-300">Emergency Contact</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            In cases of immediate danger, users can contact emergency services directly.
          </p>
          <div className="space-y-2">
            <HelpLine label="🇺🇸 US — Police / Fire / Medical" number="911" desc="Immediate life-threatening emergencies" color="text-orange-300" />
            <HelpLine label="🇬🇧 UK — Emergency Services" number="999" desc="Police, ambulance, fire" color="text-orange-300" />
            <HelpLine label="🇪🇺 Europe — Emergency" number="112" desc="Universal EU emergency number" color="text-orange-300" />
            <HelpLine label="🌍 International SOS" number="112" desc="Works in most countries" color="text-orange-300" />
          </div>
          <div className="mt-3 p-3 bg-orange-900/30 rounded-xl text-xs text-orange-200">
            ⚠️ Contacting emergency services is always legal and appropriate when someone's life is at risk. Never hesitate to call.
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-400">{label}</span></div>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function HelpLine({ label, number, desc, color, link }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-800/50 last:border-0">
      <div>
        <p className="text-xs font-medium text-gray-300">{label}</p>
        <p className="text-[11px] text-gray-500">{desc}</p>
      </div>
      {link ? (
        <a href={number} target="_blank" rel="noopener noreferrer" className={`text-xs font-bold ${color} shrink-0 underline`}>Visit</a>
      ) : (
        <a href={`tel:${number.replace(/\D/g, '')}`} className={`text-xs font-bold ${color} shrink-0`}>{number}</a>
      )}
    </div>
  );
}



