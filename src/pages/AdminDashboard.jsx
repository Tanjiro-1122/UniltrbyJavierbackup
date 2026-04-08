import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, MessageSquare, Crown, ShieldAlert,
  RefreshCw, BookOpen, AlertTriangle, LogOut,
  Trash2, PauseCircle, Star, Apple
} from "lucide-react";

const ADMIN_PASS = "javier1122admin";
const ADMIN_TOKEN = "unfiltr_admin_javier1122_secret";

// ── helpers ──────────────────────────────────────────────────────────────────
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const startOfWeek  = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d; };
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "—";

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "#a855f7" }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "16px 14px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
        {icon}
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</span>
      </div>
      <span style={{ fontSize:32, fontWeight:800, color, lineHeight:1 }}>{value ?? 0}</span>
      {sub && <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{sub}</span>}
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{
      background: color + "22", color,
      border: `1px solid ${color}44`,
      borderRadius: 999, padding:"2px 9px",
      fontSize:11, fontWeight:600, whiteSpace:"nowrap",
    }}>{text}</span>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize:13, fontWeight:700, color:"#a855f7", marginBottom:12, marginTop:4 }}>{children}</div>;
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("unfiltr_admin_session") === "true");
  const [pwInput, setPwInput]   = useState("");
  const [pwError, setPwError]   = useState(false);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("overview");
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState("");
  const navigate = useNavigate();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { if (unlocked) loadData(); }, [unlocked]);

  const handleUnlock = () => {
    if (pwInput.trim() === ADMIN_PASS) {
      sessionStorage.setItem("unfiltr_admin_session", "true");
      setUnlocked(true); setPwError(false);
    } else {
      setPwError(true); setTimeout(() => setPwError(false), 1500);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("unfiltr_admin_session");
    localStorage.removeItem("unfiltr_admin_unlocked");
    setUnlocked(false); setStats(null); setPwInput("");
  };

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: ADMIN_TOKEN }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      setStats(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const grantAccess = async (userId, type) => {
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: ADMIN_TOKEN, action: "grantAccess", userId, type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(`✅ ${type === "trial" ? "Trial" : "Family"} access granted`);
      loadData();
    } catch (e) { showToast("❌ " + e.message); }
  };

  const revokeAccess = async (userId) => {
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: ADMIN_TOKEN, action: "revokeAccess", userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("✅ Access revoked");
      loadData();
    } catch (e) { showToast("❌ " + e.message); }
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`Delete "${name}" permanently? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: ADMIN_TOKEN, action: "deleteUser", userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("✅ User deleted");
      loadData();
    } catch (e) { showToast("❌ " + e.message); }
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (!unlocked) return (
    <div style={{ position:"fixed", inset:0, background:"#06020f", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'SF Pro Display',system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:340, padding:"0 28px", textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#7c3aed,#db2777)", margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ShieldAlert style={{ width:32, height:32, color:"white" }} />
        </div>
        <h1 style={{ color:"white", fontWeight:900, fontSize:24, margin:"0 0 6px" }}>Unfiltr Admin</h1>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:"0 0 28px" }}>Management portal — authorized access only.</p>
        <input
          type="password" value={pwInput}
          onChange={e => setPwInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleUnlock()}
          placeholder="Admin password" autoFocus
          style={{ width:"100%", boxSizing:"border-box", padding:"14px 16px", borderRadius:14, border: pwError ? "1.5px solid #f87171" : "1.5px solid rgba(139,92,246,0.3)", background:"rgba(139,92,246,0.07)", color:"white", fontSize:15, outline:"none", marginBottom: pwError ? 8 : 14 }}
        />
        {pwError && <p style={{ color:"#f87171", fontSize:12, margin:"0 0 10px" }}>Incorrect password</p>}
        <button onClick={handleUnlock} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#7c3aed,#db2877)", color:"white", fontWeight:700, fontSize:15, cursor:"pointer" }}>
          Sign In
        </button>
      </div>
    </div>
  );

  // ── TABS ──────────────────────────────────────────────────────────────────
  const TABS = ["overview","users","messages","feedback"];

  // ── derived ───────────────────────────────────────────────────────────────
  const allUsers    = stats?.recentUsers    ?? [];
  const allFeedback = stats?.allFeedback    ?? [];
  const totalUsers  = stats?.totalUsers     ?? 0;
  const proUsers    = stats?.premiumUsers   ?? 0;
  const convRate    = totalUsers > 0 ? ((proUsers/totalUsers)*100).toFixed(1) : "0";

  const filteredUsers = allUsers.filter(u =>
    (u.display_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (u.email||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"#06020f", fontFamily:"'SF Pro Display',system-ui,sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ padding:"max(1.2rem,env(safe-area-inset-top)) 16px 0", background:"rgba(6,2,15,0.97)", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, background:"linear-gradient(135deg,#a855f7,#db2777)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              ⚡ Control Panel
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>
              {totalUsers} users · {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={loadData} disabled={loading} style={{ width:34, height:34, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
            <button onClick={() => navigate("/settings")} style={{ width:34, height:34, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
              ←
            </button>
            <button onClick={handleLogout} style={{ width:34, height:34, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:0, overflowX:"auto" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:"7px 16px", border:"none", cursor:"pointer", fontSize:13, fontWeight: tab===t ? 700 : 500,
              background:"transparent", color: tab===t ? "#c4b5fd" : "rgba(255,255,255,0.35)",
              borderBottom: tab===t ? "2px solid #a855f7" : "2px solid transparent",
              whiteSpace:"nowrap", transition:"all .2s",
            }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 14px max(1.4rem,env(safe-area-inset-bottom))" }}>

        {toast && (
          <div style={{ background:"#a855f722", border:"1px solid #a855f7", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13 }}>
            {toast}
          </div>
        )}

        {error && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:13, marginBottom:12 }}>
            ⚠️ {error}
          </div>
        )}

        {loading && !stats && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)" }}>Loading...</div>
        )}

        {/* ── OVERVIEW ── */}
        {stats && tab === "overview" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <StatCard icon={<Users size={14} color="#a855f7"/>}      label="Total Users"     value={stats.totalUsers}       color="#a855f7" />
              <StatCard icon={<Crown size={14} color="#f59e0b"/>}      label="Pro Users"       value={stats.premiumUsers}     sub={convRate+"% conv"} color="#f59e0b" />
              <StatCard icon={<span style={{fontSize:13}}>🆕</span>}   label="New This Week"   value={stats.newThisWeek}      color="#10b981" />
              <StatCard icon={<span style={{fontSize:13}}>🟢</span>}   label="Online Now"      value={stats.onlineNow}        color="#22c55e" />
              <StatCard icon={<MessageSquare size={14} color="#6366f1"/>} label="Today's Msgs" value={stats.todayMessages}    color="#6366f1" />
              <StatCard icon={<MessageSquare size={14} color="#8b5cf6"/>} label="Total Msgs"   value={stats.totalMessages}    color="#8b5cf6" />
              <StatCard icon={<BookOpen size={14} color="#ec4899"/>}   label="Journal Entries" value={stats.totalJournalEntries ?? 0} color="#ec4899" />
              <StatCard icon={<AlertTriangle size={14} color="#f97316"/>} label="Crisis Flags" value={stats.crisisFlags}      color="#f97316" />
              <StatCard icon={<span style={{fontSize:13}}>📅</span>}   label="Active / Week"   value={stats.activeThisWeek}   color="#3b82f6" />
              <StatCard icon={<Apple size={14} color="#e2e8f0"/>}      label="Apple Sign-Ins"  value={stats.appleUsers}       color="#e2e8f0" />
              <StatCard icon={<Trash2 size={14} color="#ef4444"/>}     label="Delete Requests" value={stats.deleteRequested}  color="#ef4444" />
              <StatCard icon={<Star size={14} color="#14b8a6"/>}       label="Feedback"        value={stats.feedbackCount}    color="#14b8a6" />
            </div>

            {/* Recent users */}
            <SectionTitle>👤 Recent Signups</SectionTitle>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
              {(stats.recentUsers||[]).slice(0,8).map((u,i) => (
                <div key={u.id||i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderBottom: i < 7 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{u.display_name || "New User"}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{fmtDate(u.created_date)} · {u.message_count||0} msgs</div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {u.onboarding_complete ? <Badge text="✓ onboarded" color="#10b981"/> : <Badge text="pending" color="#f59e0b"/>}
                    {(u.is_premium||u.annual_plan||u.pro_plan) ? <Badge text="PRO" color="#a855f7"/> : <Badge text="free" color="#6b7280"/>}
                  </div>
                </div>
              ))}
            </div>

            {/* Crisis flags alert */}
            {(stats.crisisFlags > 0) && (
              <>
                <SectionTitle>🚨 Crisis Flags — Needs Review</SectionTitle>
                <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ fontSize:13, color:"#f87171" }}>{stats.crisisFlags} message(s) flagged as crisis. Check the Messages tab or reach out to affected users.</div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── USERS ── */}
        {stats && tab === "users" && (
          <>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, outline:"none", marginBottom:12 }}
            />
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
              {filteredUsers.length === 0 && (
                <div style={{ padding:"24px", textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>No users found.</div>
              )}
              {filteredUsers.map((u,i) => (
                <div key={u.id||i} style={{ padding:"12px 14px", borderBottom: i < filteredUsers.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{u.display_name || "New User"}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
                        {u.email||"no email"} · {u.apple_user_id ? "🍎 Apple" : "no apple"} · {u.message_count||0} msgs
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:1 }}>
                        Last active: {fmtDate(u.last_active)} · Joined: {fmtDate(u.created_date)}
                      </div>
                    </div>
                    <div>
                      {u.annual_plan ? <Badge text="Annual" color="#10b981"/> :
                       u.pro_plan    ? <Badge text="Pro" color="#a855f7"/> :
                       u.is_premium  ? <Badge text="Premium" color="#f59e0b"/> :
                                       <Badge text="Free" color="#6b7280"/>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:4 }}>
                    {!u.is_premium && (
                      <>
                        <button onClick={() => grantAccess(u.id, "trial")} style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:"#f59e0b22", color:"#f59e0b" }}>
                          + Trial
                        </button>
                        <button onClick={() => grantAccess(u.id, "family")} style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:"#10b98122", color:"#10b981" }}>
                          + Family
                        </button>
                      </>
                    )}
                    {u.is_premium && (
                      <button onClick={() => revokeAccess(u.id)} style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:"#ef444422", color:"#ef4444" }}>
                        Revoke
                      </button>
                    )}
                    <button onClick={() => deleteUser(u.id, u.display_name)} style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:"#ef444411", color:"#f87171" }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MESSAGES ── */}
        {stats && tab === "messages" && (
          <>
            <SectionTitle>💬 Message Stats</SectionTitle>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <StatCard icon={<MessageSquare size={14} color="#6366f1"/>} label="Today" value={stats.todayMessages} color="#6366f1"/>
              <StatCard icon={<MessageSquare size={14} color="#8b5cf6"/>} label="All Time" value={stats.totalMessages} color="#8b5cf6"/>
              <StatCard icon={<AlertTriangle size={14} color="#f97316"/>} label="Crisis Flags" value={stats.crisisFlags} color="#f97316"/>
              <StatCard icon={<BookOpen size={14} color="#ec4899"/>}      label="Journal Entries" value={stats.totalJournalEntries ?? 0} color="#ec4899"/>
            </div>
            <SectionTitle>📊 Per-User Message Counts</SectionTitle>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
              {(stats.recentUsers||[])
                .filter(u => (u.message_count||0) > 0)
                .sort((a,b) => (b.message_count||0) - (a.message_count||0))
                .map((u,i,arr) => (
                  <div key={u.id||i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize:13, color:"#fff" }}>{u.display_name || "New User"}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#8b5cf6" }}>{u.message_count} msgs</span>
                  </div>
              ))}
            </div>
          </>
        )}

        {/* ── FEEDBACK ── */}
        {stats && tab === "feedback" && (
          <>
            <SectionTitle>📬 User Feedback ({allFeedback.length})</SectionTitle>
            {allFeedback.length === 0 && (
              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13, padding:"24px 0" }}>No feedback submitted yet.</div>
            )}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
              {[...allFeedback].sort((a,b) => new Date(b.created_date)-new Date(a.created_date)).map((f,i,arr) => (
                <div key={f.id||i} style={{ padding:"12px 14px", borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{f.display_name || "New User"}</span>
                    <div style={{ display:"flex", gap:6 }}>
                      {f.rating && <Badge text={"⭐".repeat(f.rating)} color="#f59e0b"/>}
                      <Badge text={f.status||"open"} color={f.status==="resolved"?"#10b981":"#f59e0b"}/>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>{f.category||"general"} · {fmtDate(f.created_date)}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.5 }}>{f.message||"—"}</div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


