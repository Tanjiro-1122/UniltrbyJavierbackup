import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Users, MessageSquare, Crown, ShieldAlert, Phone, Heart, ArrowLeft, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    const savedCode = localStorage.getItem("unfiltr_admin_code");
    loadData(savedCode || undefined);
  }, []);

  const loadData = async (code) => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const me = await base44.auth.me();
      setUser(me);

      const payload = code ? { passcode: code } : {};
      const response = await base44.functions.invoke('adminStats', payload);
      const data = response.data;

      if (data?.error) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setStats(data);
      if (code) localStorage.setItem("unfiltr_admin_code", code);
    } catch (err) {
      console.error("Admin load error:", err);
      setUnauthorized(true);
    }
    setLoading(false);
  };

  const handlePasscodeSubmit = () => {
    if (!passcode.trim()) return;
    setPasscodeError(false);
    loadData(passcode.trim());
  };

  if (loading) {
    return (
      <div className="screen no-tabs" style={{ maxWidth: "100%", left: 0, transform: "none", alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="screen no-tabs text-white" style={{ maxWidth: "100%", left: 0, transform: "none", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center" style={{ padding: "0 32px", width: "100%", maxWidth: 360 }}>
          <ShieldAlert className="w-14 h-14 text-purple-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Admin Access</h1>
          <p className="text-gray-400 mb-6 text-sm">Enter your admin passcode to continue.</p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => { setPasscode(e.target.value); setPasscodeError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handlePasscodeSubmit()}
            placeholder="Enter passcode"
            className="w-full px-4 py-3 rounded-xl text-white text-center text-lg tracking-widest focus:outline-none mb-3"
            style={{ background: "rgba(139,92,246,0.1)", border: passcodeError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(139,92,246,0.3)" }}
            autoFocus
          />
          {passcodeError && <p className="text-red-400 text-xs mb-3">Wrong passcode. Try again.</p>}
          <button
            onClick={handlePasscodeSubmit}
            disabled={!passcode.trim()}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", cursor: "pointer" }}
          >
            Unlock
          </button>
          <Link to="/" className="text-purple-400 hover:text-purple-300 text-sm block mt-4">← Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen no-tabs text-white" style={{ maxWidth: "100%", left: 0, transform: "none" }}>
      <div className="scroll-area p-4 pb-10">
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-white">
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
          <StatCard icon={<MessageSquare className="w-5 h-5 text-blue-400" />} label="Profiles" value={stats.totalProfiles} />
          <StatCard icon={<MessageSquare className="w-5 h-5 text-green-400" />} label="Today's Messages" value={stats.todayMessages} />
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
            In cases of immediate danger, users can contact emergency services directly. This is legal and encouraged in all countries.
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

        {/* Admin Tools */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Admin Tools</h2>
          <Link to="/admin/avatar-processor" className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
            <span className="text-sm">🖼️ Avatar Processor</span>
            <span className="text-xs text-gray-500">→</span>
          </Link>
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