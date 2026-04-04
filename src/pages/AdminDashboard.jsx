import React, { useState, useEffect } from "react";
import {
  Users, MessageSquare, Crown, ShieldAlert, Phone, Heart,
  RefreshCw, BookOpen, AlertTriangle, MessageSquareMore, LogOut, ChevronRight
} from "lucide-react";

const ADMIN_PASS = "javier1122admin";

// ─── Standalone admin shell — no app chrome, no bottom nav ───────────────────
export default function AdminDashboard() {
  const [unlocked, setUnlocked]   = useState(() => sessionStorage.getItem("unfiltr_admin_session") === "true");
  const [pwInput, setPwInput]     = useState("");
  const [pwError, setPwError]     = useState(false);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Load data once unlocked
  useEffect(() => { if (unlocked) loadData(); }, [unlocked]);

  const handleUnlock = () => {
    if (pwInput.trim() === ADMIN_PASS) {
      sessionStorage.setItem("unfiltr_admin_session", "true");
      setUnlocked(true);
      setPwError(false);
    } else {
      setPwError(true);
      setTimeout(() => setPwError(false), 1500);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("unfiltr_admin_session");
    setUnlocked(false);
    setStats(null);
    setPwInput("");
  };

  const loadData = async () => {
    setLoading(true);
    setErrorDetail("");
    try {
      // Call Base44 adminStats function with secret token — no user auth needed
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: "unfiltr_admin_javier1122_secret" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load stats");
      setStats({
        totalUsers:      data.totalUsers       ?? 0,
        premiumUsers:    data.premiumUsers      ?? 0,
        todayMessages:   data.todayMessages     ?? 0,
        totalMessages:   data.totalMessages     ?? 0,
        journalEntries:  data.totalJournalEntries ?? 0,
        crisisFlags:     data.crisisFlags       ?? 0,
        newThisWeek:     data.newThisWeek       ?? 0,
        activeThisWeek:  data.activeThisWeek    ?? 0,
        companions:      data.companions        ?? 0,
        feedbackCount:   data.feedbackCount     ?? 0,
        openFeedback:    data.openFeedback      ?? 0,
        recentUsers:     data.recentUsers       ?? [],
        allFeedback:     data.allFeedback       ?? [],
        premiumList:     data.premiumList       ?? [],
        pausedAccounts:  Array(data.pausedAccounts  ?? 0).fill({}),
        deleteRequested: Array(data.deleteRequested ?? 0).fill({}),
        trialUsers:      Array(data.trialUsers       ?? 0).fill({}),
      });
    } catch (err) {
      setErrorDetail(err?.message || "Failed to load stats");
    }
    setLoading(false);
  };

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#06020f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display',system-ui,sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: "0 28px", textAlign: "center" }}>
          {/* Logo */}
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#7c3aed,#db2777)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldAlert style={{ width: 32, height: 32, color: "white" }} />
          </div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 24, margin: "0 0 6px" }}>Unfiltr Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 32px" }}>This portal is for app management only.</p>

          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            placeholder="Admin password"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "14px 16px", borderRadius: 14,
              border: pwError ? "1.5px solid #f87171" : "1.5px solid rgba(139,92,246,0.3)",
              background: "rgba(139,92,246,0.07)", color: "white",
              fontSize: 15, outline: "none", marginBottom: pwError ? 8 : 14,
              transition: "border 0.2s",
            }}
          />
          {pwError && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 10px" }}>Incorrect password</p>}
          <button
            onClick={handleUnlock}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg,#7c3aed,#db2777)",
              color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Admin shell ───────────────────────────────────────────────────────────
  const tabs = [
    { id: "dashboard", label: "Overview"  },
    { id: "users",     label: "Users"     },
    { id: "feedback",  label: "Feedback"  },
    { id: "safety",    label: "Safety"    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#06020f", fontFamily: "'SF Pro Display',system-ui,sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Top bar */}
      <div style={{ padding: "max(1.2rem,env(safe-area-inset-top)) 20px 0", background: "rgba(6,2,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h1 style={{ color: "white", fontWeight: 900, fontSize: 20, margin: 0 }}>Unfiltr Admin</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>Management Portal</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadData} disabled={loading} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
            <button onClick={handleLogout} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "7px 14px", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer",
              background: activeTab === t.id ? "rgba(139,92,246,0.18)" : "transparent",
              color: activeTab === t.id ? "#c4b5fd" : "rgba(255,255,255,0.35)",
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, whiteSpace: "nowrap",
              borderBottom: activeTab === t.id ? "2px solid #a855f7" : "2px solid transparent",
              transition: "all 0.2s",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px max(1.4rem,env(safe-area-inset-bottom))" }}>
        {loading && !stats && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>Loading...</div>
        )}
        {errorDetail && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>
            ⚠️ {errorDetail}
          </div>
        )}

        {stats && activeTab === "dashboard" && <DashboardTab stats={stats} />}
        {stats && activeTab === "users"     && <UsersTab stats={stats} />}
        {stats && activeTab === "feedback"  && <FeedbackTab stats={stats} />}
        {stats && activeTab === "safety"    && <SafetyTab />}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function DashboardTab({ stats }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <StatCard icon={<Users size={18} color="#a855f7" />}  label="Total Users"     value={stats.totalUsers} />
        <StatCard icon={<Crown size={18} color="#facc15" />}  label="Premium"         value={stats.premiumUsers} sub={`${stats.totalUsers > 0 ? Math.round(stats.premiumUsers/stats.totalUsers*100) : 0}% of users`} />
        <StatCard icon={<span style={{fontSize:14}}>🟢</span>} label="Online Now"      value={stats.onlineNow ?? 0} sub="active in last 5 min" />
        <StatCard icon={<span style={{fontSize:14}}>🍎</span>} label="Apple Sign-In"   value={stats.appleUsers ?? 0} sub="linked Apple IDs" />
        <StatCard icon={<MessageSquare size={18} color="#34d399" />} label="Today's Messages" value={stats.todayMessages} />
        <StatCard icon={<Users size={18} color="#60a5fa" />}  label="Active This Week" value={stats.activeThisWeek} />
        <StatCard icon={<BookOpen size={18} color="#818cf8" />} label="Journal Entries" value={stats.journalEntries} />
        <StatCard icon={<AlertTriangle size={18} color="#f87171" />} label="Crisis Flags" value={stats.crisisFlags} />
        <StatCard icon={<Users size={18} color="#fb923c" />}  label="New This Week"   value={stats.newThisWeek} />
        <StatCard icon={<MessageSquareMore size={18} color="#f472b6" />} label="Open Feedback" value={stats.openFeedback} />
      </div>

      {/* Account alerts */}
      {(stats.deleteRequested.length > 0 || stats.pausedAccounts.length > 0) && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ color: "#f87171", fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>⚠️ Action Needed</p>
          {stats.deleteRequested.length > 0 && (
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "0 0 4px" }}>• {stats.deleteRequested.length} account deletion request(s)</p>
          )}
          {stats.pausedAccounts.length > 0 && (
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0 }}>• {stats.pausedAccounts.length} paused account(s)</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── USERS TAB ─────────────────────────────────────────────────────────────────
function UsersTab({ stats }) {
  const [filter, setFilter] = useState("all");
  const filters = [
    { id: "all",     label: "All",      list: stats.recentUsers    },
    { id: "premium", label: "Premium",  list: stats.premiumList    },
    { id: "trial",   label: "Trials",   list: stats.trialUsers     },
    { id: "paused",  label: "Paused",   list: stats.pausedAccounts },
    { id: "delete",  label: "Delete Req", list: stats.deleteRequested },
  ];
  const active = filters.find(f => f.id === filter);

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer", whiteSpace: "nowrap",
            background: filter === f.id ? "#7c3aed" : "rgba(255,255,255,0.07)",
            color: filter === f.id ? "white" : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600,
          }}>
            {f.label} <span style={{ opacity: 0.7 }}>({f.list.length})</span>
          </button>
        ))}
      </div>

      {active.list.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No users in this category.</p>
      ) : active.list.map(u => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
          <div>
            <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: "0 0 2px" }}>{u.display_name || "Anonymous"}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{u.user_id || u.id?.slice(0,12)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            {u.is_premium && <span style={{ fontSize: 10, fontWeight: 700, color: "#facc15", background: "rgba(250,204,21,0.1)", padding: "2px 8px", borderRadius: 999, display: "block", marginBottom: 3 }}>PREMIUM</span>}
            {u.trial_active && <span style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", background: "rgba(96,165,250,0.1)", padding: "2px 8px", borderRadius: 999, display: "block", marginBottom: 3 }}>TRIAL</span>}
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0 }}>{u.created_date ? new Date(u.created_date).toLocaleDateString() : ""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FEEDBACK TAB ─────────────────────────────────────────────────────────────
function FeedbackTab({ stats }) {
  return (
    <div>
      {stats.allFeedback.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No feedback yet.</p>
      ) : stats.allFeedback.map(f => (
        <div key={f.id} style={{ padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: f.status === "resolved" ? "rgba(52,211,153,0.15)" : "rgba(168,85,247,0.15)",
              color: f.status === "resolved" ? "#34d399" : "#c4b5fd",
            }}>
              {(f.category || "general").toUpperCase()}
            </span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{f.created_date ? new Date(f.created_date).toLocaleDateString() : ""}</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: "0 0 4px", lineHeight: 1.5 }}>{f.message}</p>
          {f.display_name && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>— {f.display_name}</p>}
          {typeof f.rating === "number" && <p style={{ color: "#facc15", fontSize: 11, margin: "4px 0 0" }}>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</p>}
        </div>
      ))}
    </div>
  );
}

// ── SAFETY TAB ───────────────────────────────────────────────────────────────
function SafetyTab() {
  return (
    <div>
      <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Heart size={18} color="#f87171" />
          <p style={{ color: "#f87171", fontWeight: 700, fontSize: 14, margin: 0 }}>Crisis Resources</p>
        </div>
        {[
          ["988 Suicide & Crisis Lifeline", "988", "Call or text · 24/7 · US"],
          ["Crisis Text Line", "Text HOME to 741741", "Text support · 24/7"],
          ["SAMHSA Helpline", "1-800-662-4357", "Mental health & substance use"],
          ["International Crisis Centres", "iasp.info/resources", "Global directory"],
        ].map(([label, number, desc]) => (
          <div key={label} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 10, marginBottom: 10 }}>
            <p style={{ color: "white", fontWeight: 600, fontSize: 13, margin: "0 0 1px" }}>{label}</p>
            <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 1px", fontWeight: 700 }}>{number}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 16, padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Phone size={18} color="#fb923c" />
          <p style={{ color: "#fb923c", fontWeight: 700, fontSize: 14, margin: 0 }}>Emergency</p>
        </div>
        {[
          ["🇺🇸 US", "911", "Police / Fire / Medical"],
          ["🇬🇧 UK", "999", "Emergency services"],
          ["🇪🇺 Europe / International", "112", "Universal emergency"],
        ].map(([flag, number, desc]) => (
          <div key={flag} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 10, marginBottom: 10 }}>
            <p style={{ color: "white", fontWeight: 600, fontSize: 13, margin: "0 0 1px" }}>{flag}</p>
            <p style={{ color: "#fb923c", fontSize: 15, fontWeight: 900, margin: "0 0 1px" }}>{number}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 14px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>{icon}<span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600 }}>{label}</span></div>
      <p style={{ color: "white", fontWeight: 900, fontSize: 28, margin: "0 0 2px" }}>{value ?? "—"}</p>
      {sub && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>{sub}</p>}
    </div>
  );
}

