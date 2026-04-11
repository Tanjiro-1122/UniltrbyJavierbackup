import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, MessageSquare, Crown, ShieldAlert,
  RefreshCw, BookOpen, AlertTriangle, LogOut,
  Trash2, Star, Apple, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";

/**
 * ADMIN_PASS — used both for the local UI unlock screen (5-tap + passcode) and
 * as the credential sent with every admin API request.
 *
 * IMPORTANT: This value lives in the compiled JS bundle and is visible to
 * anyone who inspects it.  It provides UI convenience gating only, not
 * true server-side secrecy.  Set the ADMIN_PASS environment variable in
 * Vercel to a long random string that is NOT committed to the repository.
 */
const ADMIN_PASS   = "javier1122admin";

/**
 * SUPPORT_PASS — credential for the Support Staff role.
 * Support staff can view users, plan flags, and memory health, and can
 * trigger structured-memory rebuilds.  They cannot delete users, revoke
 * subscriptions, or see raw chat transcripts.
 * Set the SUPPORT_PASS environment variable in Vercel.
 */
const SUPPORT_PASS = "javier1122support";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"2-digit" }) : "—";
const fmtDateTime = (s) =>
  s ? new Date(s).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

// ── design tokens ─────────────────────────────────────────────────────────────
const BG           = "linear-gradient(160deg,#12001f 0%,#1a0040 45%,#0d0030 100%)";
const CARD_STYLE   = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"16px" };
const GRAD_PURPLE  = "linear-gradient(135deg,#a855f7,#db2777)";
const GRAD_BLUE    = "linear-gradient(135deg,#60a5fa,#3b82f6)";
const GRAD_GREEN   = "linear-gradient(135deg,#34d399,#10b981)";
const GRAD_ORANGE  = "linear-gradient(135deg,#fb923c,#f97316)";
const GRAD_AMBER   = "linear-gradient(135deg,#f59e0b,#d97706)";

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, grad = GRAD_PURPLE }) {
  return (
    <div style={{ ...CARD_STYLE, display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:grad, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {icon}
        </div>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
      </div>
      <span style={{ fontSize:30, fontWeight:800, color:"#fff", lineHeight:1 }}>{value ?? 0}</span>
      {sub && <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{sub}</span>}
    </div>
  );
}

function Badge({ text, color = "#a855f7" }) {
  return (
    <span style={{
      background: color + "22", color, border:`1px solid ${color}44`,
      borderRadius:999, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap",
    }}>{text}</span>
  );
}

function SectionTitle({ children, color = "#c084fc" }) {
  return (
    <div style={{ fontSize:13, fontWeight:800, color, marginBottom:12, marginTop:4, display:"flex", alignItems:"center", gap:6 }}>
      {children}
    </div>
  );
}

function PlanBadge({ u }) {
  if (u.annual_plan)  return <Badge text="Annual"  color="#34d399" />;
  if (u.pro_plan)     return <Badge text="Pro"     color="#a855f7" />;
  if (u.is_premium)   return <Badge text="Premium" color="#f59e0b" />;
  if (u.trial_active) return <Badge text="Trial"   color="#60a5fa" />;
  return <Badge text="Free" color="#6b7280" />;
}

// ── User Detail Panel ─────────────────────────────────────────────────────────
function UserDetailPanel({ user, adminToken, onAction, showToast, requestConfirm, isSupport }) {
  const [subForm, setSubForm] = useState({
    is_premium:            user.is_premium,
    pro_plan:              user.pro_plan,
    annual_plan:           user.annual_plan,
    trial_active:          user.trial_active,
    subscription_expires:  user.subscription_expires || "",
  });
  const [reason,       setReason]       = useState("");
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");
  const [quickReason,  setQuickReason]  = useState("");
  const [quickSaving,  setQuickSaving]  = useState(false);
  const [quickMsg,     setQuickMsg]     = useState("");

  const doQuickGrant = async ({ durationDays, durationHours, label }) => {
    if (!quickReason.trim()) { setQuickMsg("❌ Reason is required"); return; }
    setQuickSaving(true); setQuickMsg("");
    try {
      const body = { adminToken, action: "subscriptionQuickGrant", userId: user.id, reason: quickReason };
      if (durationHours) body.durationHours = durationHours;
      else body.durationDays = durationDays;
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      setQuickMsg(`✅ Pro granted for ${label}!`);
      setQuickReason("");
      onAction();
    } catch (e) { setQuickMsg("❌ " + e.message); }
    setQuickSaving(false);
  };

  const doClearOverride = () => {
    if (!quickReason.trim()) { setQuickMsg("❌ Reason is required"); return; }
    if (!requestConfirm) return;
    requestConfirm({
      title: "Remove Subscription Override?",
      message: `This will revert "${user.display_name}" to free tier and clear all subscription flags.\nReason: "${quickReason}"`,
      confirmLabel: "Remove Override",
      confirmVariant: "danger",
      countdown: 2,
      onConfirm: async () => {
        setQuickSaving(true); setQuickMsg("");
        try {
          const res = await fetch("/api/adminStats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminToken, action: "subscriptionClearOverride", userId: user.id, reason: quickReason }),
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || "Failed");
          setQuickMsg("✅ Override cleared — user returned to normal.");
          setQuickReason("");
          onAction();
        } catch (e) { setQuickMsg("❌ " + e.message); }
        setQuickSaving(false);
      },
    });
  };

  const saveOverride = async () => {
    if (!reason.trim()) { setSaveMsg("❌ Reason is required"); return; }
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken, action: "subscriptionOverride", userId: user.id, subscription: subForm, reason }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      setSaveMsg("✅ Subscription updated!");
      setReason("");
      onAction();
    } catch (e) { setSaveMsg("❌ " + e.message); }
    setSaving(false);
  };

  return (
    <div style={{ marginTop:12 }}>
      {/* Profile details */}
      <div style={{ ...CARD_STYLE, marginBottom:12 }}>
        <SectionTitle color="#60a5fa">👤 Profile Details</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px" }}>
          {[
            ["Name",          user.display_name],
            ["Email",         user.email || "—"],
            ["Apple ID",      user.apple_user_id ? "✅ linked" : "❌ none"],
            ["Last Seen",     fmtDateTime(user.last_seen)],
            ["Last Active",   fmtDateTime(user.last_active)],
            ["Onboarded",     user.onboarding_complete ? "✅ Yes" : "⏳ No"],
            ["Push Enabled",  user.push_enabled ? "✅ Yes" : "❌ No"],
            ["Push Token",    user.push_token_present ? "✅ present" : "❌ not registered"],
            ["Messages",      user.message_count],
            ["Tokens Today",  user.tokens_used_today],
            ["Tokens Total",  user.tokens_used_total],
            ["Joined",        fmtDate(user.created_date)],
          ].map(([k, v]) => (
            <div key={k} style={{ background:"rgba(96,165,250,0.05)", border:"1px solid rgba(96,165,250,0.1)", borderRadius:10, padding:"8px 10px" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{k}</div>
              <div style={{ fontSize:12, color:"#fff", fontWeight:600, marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions — admin only */}
      {!isSupport && (
      <div style={{ ...CARD_STYLE, marginBottom:12 }}>
        <SectionTitle color="#fb923c">⚡ Quick Actions</SectionTitle>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Reason <span style={{ color:"#f87171" }}>*</span></div>
          <textarea
            value={quickReason}
            onChange={e => setQuickReason(e.target.value)}
            placeholder="e.g. Customer support — plan not activating after purchase"
            rows={2}
            style={{
              width:"100%", boxSizing:"border-box",
              background:"rgba(255,255,255,0.06)",
              border:`1px solid ${!quickReason.trim() && quickMsg.startsWith("❌ Reason") ? "#f87171" : "rgba(255,255,255,0.12)"}`,
              borderRadius:10, padding:"9px 12px", color:"#fff", fontSize:12, outline:"none",
              resize:"none", fontFamily:"inherit",
            }}
          />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
          {[
            { label:"Grant Pro 24h",  durationHours: 24 },
            { label:"Grant Pro 7d",   durationDays:  7  },
            { label:"Grant Pro 30d",  durationDays:  30 },
          ].map(({ label, durationDays, durationHours }) => (
            <button
              key={label}
              onClick={() => doQuickGrant({ durationDays, durationHours, label })}
              disabled={quickSaving}
              style={{ padding:"10px 8px", borderRadius:12, border:"none", cursor: quickSaving ? "default" : "pointer", background:"linear-gradient(135deg,#a855f7,#7c3aed)", color:"#fff", fontWeight:700, fontSize:12, opacity: quickSaving ? 0.6 : 1 }}
            >
              🚀 {label}
            </button>
          ))}
          <button
            onClick={doClearOverride}
            disabled={quickSaving}
            style={{ padding:"10px 8px", borderRadius:12, border:"1px solid rgba(239,68,68,0.4)", cursor: quickSaving ? "default" : "pointer", background:"rgba(239,68,68,0.1)", color:"#fca5a5", fontWeight:700, fontSize:12, opacity: quickSaving ? 0.6 : 1 }}
          >
            🚫 Remove Override
          </button>
        </div>
        {quickMsg && (
          <div style={{ fontSize:12, color: quickMsg.startsWith("✅") ? "#34d399" : "#f87171" }}>
            {quickMsg}
          </div>
        )}
      </div>
      )}

      {/* Advanced Subscription Override — admin only */}
      {!isSupport && (
      <div style={{ ...CARD_STYLE, marginBottom:12 }}>
        <SectionTitle color="#a855f7">💳 Advanced Subscription Override</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          {[
            ["is_premium",  "Premium",      "#f59e0b"],
            ["pro_plan",    "Pro Plan",     "#a855f7"],
            ["annual_plan", "Annual Plan",  "#34d399"],
            ["trial_active","Trial Active", "#60a5fa"],
          ].map(([key, label, color]) => (
            <label key={key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", background:`${color}11`, border:`1px solid ${color}33`, borderRadius:10, padding:"8px 10px" }}>
              <input
                type="checkbox"
                checked={!!subForm[key]}
                onChange={e => setSubForm(f => ({ ...f, [key]: e.target.checked }))}
                style={{ width:16, height:16, accentColor:color, cursor:"pointer" }}
              />
              <span style={{ fontSize:12, color, fontWeight:700 }}>{label}</span>
            </label>
          ))}
        </div>

        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Subscription Expires</div>
          <input
            type="date"
            value={subForm.subscription_expires ? subForm.subscription_expires.slice(0,10) : ""}
            onChange={e => setSubForm(f => ({ ...f, subscription_expires: e.target.value || null }))}
            style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"9px 12px", color:"#fff", fontSize:13, outline:"none" }}
          />
        </div>

        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Reason <span style={{ color:"#f87171" }}>*</span></div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer contacted support — subscription not syncing after payment"
            rows={2}
            style={{
              width:"100%", boxSizing:"border-box",
              background:"rgba(255,255,255,0.06)",
              border:`1px solid ${!reason.trim() && saveMsg.startsWith("❌ Reason") ? "#f87171" : "rgba(255,255,255,0.12)"}`,
              borderRadius:10, padding:"9px 12px", color:"#fff", fontSize:12, outline:"none",
              resize:"none", fontFamily:"inherit",
            }}
          />
        </div>

        {saveMsg && (
          <div style={{ fontSize:12, color: saveMsg.startsWith("✅") ? "#34d399" : "#f87171", marginBottom:8 }}>
            {saveMsg}
          </div>
        )}

        <button
          onClick={saveOverride}
          disabled={saving}
          style={{ width:"100%", padding:"11px", borderRadius:12, border:"none", cursor: saving ? "default" : "pointer", background:GRAD_PURPLE, color:"#fff", fontWeight:700, fontSize:13, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "💾 Save Subscription Override"}
        </button>
      </div>
      )}

      {/* Memory summary (if available) */}
      {(user.memory_summary || user.memory_updated_at) && (
        <div style={{ ...CARD_STYLE }}>
          <SectionTitle color="#34d399">🧠 Memory Info</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px" }}>
            {[
              ["Memory Length",  user.memory_summary ? user.memory_summary.length + " chars" : "—"],
              ["Memory Updated", fmtDateTime(user.memory_updated_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.12)", borderRadius:10, padding:"8px 10px" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>{k}</div>
                <div style={{ fontSize:12, color:"#fff", fontWeight:600, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const savedSession = sessionStorage.getItem("unfiltr_admin_session");
  const [unlocked,      setUnlocked]      = useState(() => savedSession === "admin" || savedSession === "support");
  const [role,          setRole]          = useState(() => (savedSession === "admin" || savedSession === "support") ? savedSession : "");
  const [pwInput,       setPwInput]       = useState("");
  const [pwError,       setPwError]       = useState(false);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [tab,           setTab]           = useState(() => savedSession === "support" ? "support" : "overview");
  const [toast,         setToast]         = useState("");

  // Support tab
  const [search,        setSearch]        = useState("");
  const [searching,     setSearching]     = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedUser,  setSelectedUser]  = useState(null);

  // Bulk selection (Support tab)
  const [bulkMode,      setBulkMode]      = useState(false);
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [bulkReason,    setBulkReason]    = useState("");
  const [bulkWorking,   setBulkWorking]   = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Memory tab
  const [memSearch,     setMemSearch]     = useState("");
  const [memSearching,  setMemSearching]  = useState(false);
  const [memResults,    setMemResults]    = useState(null);
  const [selectedMem,   setSelectedMem]   = useState(null);

  // Memory tab rebuild state
  const [rebuilding,    setRebuilding]    = useState(false);

  // Audit tab
  const [auditLog,      setAuditLog]      = useState(null);
  const [auditLoading,  setAuditLoading]  = useState(false);
  const [auditFilter,   setAuditFilter]   = useState("all");

  const navigate = useNavigate();

  // Token to send with all admin API calls — varies by role
  const activeToken = role === "support" ? SUPPORT_PASS : ADMIN_PASS;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const requestConfirm = (cfg) => setConfirmDialog({
    ...cfg,
    onConfirm: async () => { setConfirmDialog(null); await cfg.onConfirm?.(); },
    onCancel:  ()       => { setConfirmDialog(null); cfg.onCancel?.(); },
  });

  useEffect(() => { if (unlocked) loadData(); }, [unlocked]);

  // Debounced user search — fires on search input change or when Support tab is opened
  useEffect(() => {
    if (tab !== "support" || !unlocked) return;
    const delay = search.trim() ? 350 : 0;
    const timer = setTimeout(() => doSearch(search), delay);
    return () => clearTimeout(timer);
  }, [search, tab, unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load audit log when Audit tab first opens
  useEffect(() => {
    if (tab === "audit" && unlocked && auditLog === null) loadAuditLog();
  }, [tab, unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnlock = () => {
    if (pwInput.trim() === ADMIN_PASS) {
      sessionStorage.setItem("unfiltr_admin_session", "admin");
      setUnlocked(true); setRole("admin"); setTab("overview"); setPwError(false);
    } else if (pwInput.trim() === SUPPORT_PASS) {
      sessionStorage.setItem("unfiltr_admin_session", "support");
      setUnlocked(true); setRole("support"); setTab("support"); setPwError(false);
    } else {
      setPwError(true); setTimeout(() => setPwError(false), 1500);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("unfiltr_admin_session");
    localStorage.removeItem("unfiltr_admin_unlocked");
    setUnlocked(false); setRole(""); setStats(null); setPwInput("");
  };

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: activeToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      setStats(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const doSearch = async (q) => {
    setSearching(true);
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: activeToken, action: "userSearch", query: q }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setSearchResults(data.users || []);
    } catch (e) { showToast("❌ " + e.message); }
    setSearching(false);
  };

  const doMemSearch = async (q) => {
    setMemSearching(true);
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: activeToken, action: "userSearch", query: q }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setMemResults(data.users || []);
    } catch (e) { showToast("❌ " + e.message); }
    setMemSearching(false);
  };

  const doRebuildMemory = async (userId, displayName) => {
    setRebuilding(true);
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: activeToken, action: "rebuildMemory", userId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      showToast(`✅ Memory rebuilt for ${displayName || "user"} (${data.summary_length} chars from ${data.facts_count} facts, ${data.sessions_count} sessions)`);
      // Refresh memory results so updated timestamp shows
      if (memSearch.trim()) doMemSearch(memSearch);
    } catch (e) { showToast("❌ " + e.message); }
    setRebuilding(false);
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: activeToken, action: "auditLog" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setAuditLog(data.entries || []);
    } catch (e) { showToast("❌ " + e.message); }
    setAuditLoading(false);
  };

  // Legacy quick-action helpers (kept for backward compat)
  const grantAccess = async (userId, type) => {
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: activeToken, action: "grantAccess", userId, type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(`✅ ${type === "trial" ? "Trial" : "Family"} access granted`);
      loadData();
    } catch (e) { showToast("❌ " + e.message); }
  };

  const deleteUser = (userId, name) => {
    requestConfirm({
      title: "Delete User?",
      message: `Permanently delete "${name}"? This cannot be undone and all their data will be lost.`,
      confirmLabel: "Delete",
      confirmVariant: "danger",
      countdown: 3,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/adminStats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminToken: activeToken, action: "deleteUser", userId }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          showToast("✅ User deleted");
          loadData();
        } catch (e) { showToast("❌ " + e.message); }
      },
    });
  };

  const doBulkAction = (bulkType) => {
    if (!bulkReason.trim() || selectedIds.size === 0) {
      showToast("❌ Select users and enter a reason first"); return;
    }
    const label = bulkType === "grantPro7d" ? "Grant Pro 7d" : "Revoke Premium";
    requestConfirm({
      title: `Bulk ${label}?`,
      message: `Apply "${label}" to ${selectedIds.size} user(s).\nReason: "${bulkReason}"`,
      confirmLabel: label,
      confirmVariant: bulkType === "revokePremium" ? "danger" : "default",
      countdown: bulkType === "revokePremium" ? 2 : 0,
      onConfirm: async () => {
        setBulkWorking(true);
        try {
          const res = await fetch("/api/adminStats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminToken: activeToken, action: "bulkAction",
              userIds: [...selectedIds], bulkType, reason: bulkReason,
            }),
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error);
          showToast(`✅ ${label} applied to ${data.processed} user(s)${data.failed ? ` (${data.failed} failed)` : ""}`);
          setSelectedIds(new Set()); setBulkMode(false); setBulkReason("");
          doSearch(search);
        } catch (e) { showToast("❌ " + e.message); }
        setBulkWorking(false);
      },
    });
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (!unlocked) return (
    <div style={{ position:"fixed", inset:0, background:BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'SF Pro Display',system-ui,sans-serif" }}>
      {/* ambient glow */}
      <div style={{ position:"absolute", top:"25%", left:"50%", transform:"translateX(-50%)", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:340, padding:"0 28px", textAlign:"center", position:"relative" }}>
        <div style={{ width:76, height:76, borderRadius:24, background:GRAD_PURPLE, margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 36px rgba(168,85,247,0.45)" }}>
          <ShieldAlert style={{ width:38, height:38, color:"white" }} />
        </div>
        <h1 style={{ color:"white", fontWeight:900, fontSize:26, margin:"0 0 4px", letterSpacing:"-0.5px" }}>Unfiltr Portal</h1>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, margin:"0 0 32px" }}>Admin or Support Staff — authorized access only.</p>
        <input
          type="password" value={pwInput}
          onChange={e => setPwInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleUnlock()}
          placeholder="Enter your password" autoFocus
          style={{ width:"100%", boxSizing:"border-box", padding:"14px 16px", borderRadius:16, border: pwError ? "1.5px solid #f87171" : "1.5px solid rgba(168,85,247,0.35)", background:"rgba(168,85,247,0.08)", color:"white", fontSize:15, outline:"none", marginBottom: pwError ? 8 : 14 }}
        />
        {pwError && <p style={{ color:"#f87171", fontSize:12, margin:"0 0 12px" }}>Incorrect password</p>}
        <button
          onClick={handleUnlock}
          style={{ width:"100%", padding:"14px", borderRadius:16, border:"none", background:GRAD_PURPLE, color:"white", fontWeight:700, fontSize:15, cursor:"pointer", boxShadow:"0 4px 22px rgba(168,85,247,0.4)" }}
        >
          Sign In
        </button>
      </div>
    </div>
  );

  // ── TABS — filtered by role ───────────────────────────────────────────────
  const TABS = [
    { id:"overview",  label:"Overview",  icon:"🏠", adminOnly: true  },
    { id:"support",   label:"Support",   icon:"🎧", adminOnly: false },
    { id:"memory",    label:"Memory",    icon:"🧠", adminOnly: false },
    { id:"audit",     label:"Audit",     icon:"📋", adminOnly: true  },
    { id:"feedback",  label:"Feedback",  icon:"💬", adminOnly: true  },
  ].filter(t => role === "admin" || !t.adminOnly);

  const totalUsers = stats?.totalUsers  ?? 0;
  const proUsers   = stats?.premiumUsers ?? 0;
  const convRate   = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0";

  return (
    <div style={{ position:"fixed", inset:0, background:BG, fontFamily:"'SF Pro Display',system-ui,sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* ambient glow */}
      <div style={{ position:"absolute", top:"-8%", right:"-4%", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.08) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* ── TOP BAR ── */}
      <div style={{ padding:"max(1.2rem,env(safe-area-inset-top)) 16px 0", background:"rgba(0,0,0,0.35)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:19, fontWeight:900, background:GRAD_PURPLE, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.3px" }}>
              {role === "support" ? "🎧 Unfiltr Support" : "✨ Unfiltr Admin"}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>
              {role === "support" ? "Support Staff Portal" : `${totalUsers} users · ${new Date().toLocaleTimeString()}`}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={loadData} disabled={loading} style={{ width:36, height:36, borderRadius:12, border:"none", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
            <button onClick={() => navigate("/settings")} style={{ width:36, height:36, borderRadius:12, border:"none", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
              ←
            </button>
            <button onClick={handleLogout} style={{ width:36, height:36, borderRadius:12, border:"none", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
        {/* Tab pills */}
        <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:"7px 12px", border:"none", cursor:"pointer", fontSize:12,
              fontWeight: tab === t.id ? 700 : 500,
              background: tab === t.id ? "rgba(168,85,247,0.22)" : "transparent",
              color: tab === t.id ? "#c084fc" : "rgba(255,255,255,0.35)",
              borderRadius:10, whiteSpace:"nowrap", transition:"all .2s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 14px max(1.4rem,env(safe-area-inset-bottom))" }}>

        {toast && (
          <div style={{ background:"rgba(168,85,247,0.15)", border:"1px solid rgba(168,85,247,0.4)", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#e9d5ff" }}>
            {toast}
          </div>
        )}

        {error && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:"10px 14px", color:"#fca5a5", fontSize:13, marginBottom:12 }}>
            ⚠️ {error}{" "}
            <span style={{ textDecoration:"underline", cursor:"pointer" }} onClick={loadData}>Retry</span>
          </div>
        )}

        {loading && !stats && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>✨</div>
            Loading…
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {stats && tab === "overview" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <StatCard icon={<Users size={13} color="#fff"/>}         label="Total Users"     value={stats.totalUsers}            grad={GRAD_PURPLE} />
              <StatCard icon={<Crown size={13} color="#fff"/>}         label="Pro Users"       value={stats.premiumUsers}          sub={convRate + "% conv"} grad={GRAD_AMBER} />
              <StatCard icon={<span style={{fontSize:13}}>🆕</span>}  label="New This Week"   value={stats.newThisWeek}           grad={GRAD_GREEN} />
              <StatCard icon={<span style={{fontSize:13}}>🟢</span>}  label="Online Now"      value={stats.onlineNow}             grad={GRAD_GREEN} />
              <StatCard icon={<MessageSquare size={13} color="#fff"/>} label="Today's Msgs"   value={stats.todayMessages}         grad={GRAD_BLUE} />
              <StatCard icon={<MessageSquare size={13} color="#fff"/>} label="Total Msgs"     value={stats.totalMessages}         grad={GRAD_BLUE} />
              <StatCard icon={<BookOpen size={13} color="#fff"/>}      label="Journal Entries" value={stats.totalJournalEntries ?? 0} grad="linear-gradient(135deg,#ec4899,#db2777)" />
              <StatCard icon={<AlertTriangle size={13} color="#fff"/>} label="Crisis Flags"   value={stats.crisisFlags}           grad={GRAD_ORANGE} />
              <StatCard icon={<span style={{fontSize:13}}>📅</span>}  label="Active / Week"   value={stats.activeThisWeek}        grad={GRAD_BLUE} />
              <StatCard icon={<Apple size={13} color="#fff"/>}         label="Apple Sign-Ins"  value={stats.appleUsers}            grad="linear-gradient(135deg,#94a3b8,#64748b)" />
              <StatCard icon={<Trash2 size={13} color="#fff"/>}        label="Delete Requests" value={stats.deleteRequested}       grad="linear-gradient(135deg,#ef4444,#dc2626)" />
              <StatCard icon={<Star size={13} color="#fff"/>}          label="Feedback"        value={stats.feedbackCount}         grad="linear-gradient(135deg,#14b8a6,#0d9488)" />
            </div>

            <SectionTitle color="#c084fc">👤 Recent Signups</SectionTitle>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden", marginBottom:16 }}>
              {(stats.recentUsers || []).slice(0, 8).map((u, i) => (
                <div key={u.id || i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderBottom: i < 7 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{u.display_name || "New User"}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{fmtDate(u.created_date)} · {u.message_count || 0} msgs</div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {u.onboarding_complete ? <Badge text="✓ onboarded" color="#34d399"/> : <Badge text="pending" color="#f59e0b"/>}
                    <PlanBadge u={u} />
                  </div>
                </div>
              ))}
            </div>

            {stats.crisisFlags > 0 && (
              <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:14, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ fontSize:13, color:"#fca5a5", fontWeight:700 }}>
                  🚨 {stats.crisisFlags} crisis message(s) flagged — review needed
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SUPPORT ── */}
        {tab === "support" && (
          <>
            {/* Search bar + bulk toggle */}
            <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
              <div style={{ position:"relative", flex:1 }}>
                <Search size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color: searching ? "rgba(168,85,247,0.7)" : "rgba(255,255,255,0.3)", transition:"color .2s" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch(search)}
                  placeholder="Search by name, email, or Apple ID…"
                  style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:"11px 14px 11px 38px", color:"#fff", fontSize:13, outline:"none" }}
                />
                {searching && (
                  <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, borderRadius:"50%", border:"2px solid rgba(168,85,247,0.3)", borderTopColor:"#a855f7", animation:"spin 0.7s linear infinite" }} />
                )}
              </div>
              {role === "admin" && (
              <button
                onClick={() => { setBulkMode(m => !m); setSelectedIds(new Set()); setSelectedUser(null); }}
                style={{ padding:"10px 14px", borderRadius:12, border: bulkMode ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.12)", background: bulkMode ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)", color: bulkMode ? "#c084fc" : "rgba(255,255,255,0.4)", fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}
              >
                {bulkMode ? "✓ Selecting" : "Select"}
              </button>
              )}
            </div>

            {/* Bulk action bar — admin only */}
            {role === "admin" && bulkMode && (
              <div style={{ background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.25)", borderRadius:14, padding:"10px 12px", marginBottom:12 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, color:"#c084fc", fontWeight:700, flexShrink:0 }}>
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select users below"}
                  </span>
                  {searchResults && searchResults.length > 0 && (
                    <button
                      onClick={() => setSelectedIds(selectedIds.size === searchResults.length ? new Set() : new Set(searchResults.map(u => u.id)))}
                      style={{ padding:"4px 10px", borderRadius:8, border:"1px solid rgba(168,85,247,0.3)", background:"transparent", color:"rgba(192,132,252,0.7)", fontSize:11, fontWeight:700, cursor:"pointer" }}
                    >
                      {selectedIds.size === searchResults.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                  {selectedIds.size > 0 && (
                    <>
                      <input
                        value={bulkReason}
                        onChange={e => setBulkReason(e.target.value)}
                        placeholder="Reason (required)…"
                        style={{ flex:"1 1 120px", minWidth:100, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:12, outline:"none" }}
                      />
                      <button
                        onClick={() => doBulkAction("grantPro7d")}
                        disabled={bulkWorking || !bulkReason.trim()}
                        style={{ padding:"7px 12px", borderRadius:10, border:"none", background:GRAD_PURPLE, color:"#fff", fontWeight:700, fontSize:11, cursor:(bulkWorking || !bulkReason.trim()) ? "default" : "pointer", opacity:(bulkWorking || !bulkReason.trim()) ? 0.5 : 1, whiteSpace:"nowrap", flexShrink:0 }}
                      >
                        🚀 Grant Pro 7d
                      </button>
                      <button
                        onClick={() => doBulkAction("revokePremium")}
                        disabled={bulkWorking || !bulkReason.trim()}
                        style={{ padding:"7px 12px", borderRadius:10, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.08)", color:"#fca5a5", fontWeight:700, fontSize:11, cursor:(bulkWorking || !bulkReason.trim()) ? "default" : "pointer", opacity:(bulkWorking || !bulkReason.trim()) ? 0.5 : 1, whiteSpace:"nowrap", flexShrink:0 }}
                      >
                        🚫 Revoke
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Result count */}
            {!searching && searchResults !== null && searchResults.length > 0 && (
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:8, paddingLeft:2 }}>
                {searchResults.length} user{searchResults.length !== 1 ? "s" : ""}{search.trim() ? ` matching "${search}"` : ""}
              </div>
            )}

            {!searching && searchResults !== null && (
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden" }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding:"28px", textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>No users found.</div>
                ) : searchResults.map((u, i) => (
                  <div key={u.id || i}>
                    <div
                      onClick={() => !bulkMode && setSelectedUser(selectedUser?.id === u.id ? null : u)}
                      style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor: bulkMode ? "default" : "pointer", background: selectedUser?.id === u.id ? "rgba(168,85,247,0.09)" : "transparent", transition:"background .15s" }}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          {bulkMode && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(u.id)}
                              onChange={e => {
                                e.stopPropagation();
                                setSelectedIds(prev => {
                                  const next = new Set(prev);
                                  e.target.checked ? next.add(u.id) : next.delete(u.id);
                                  return next;
                                });
                              }}
                              onClick={e => e.stopPropagation()}
                              style={{ width:16, height:16, accentColor:"#a855f7", cursor:"pointer", flexShrink:0 }}
                            />
                          )}
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{u.display_name}</div>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                              {u.email || "no email"} · {u.apple_user_id ? "🍎" : "no apple"} · {u.message_count} msgs
                            </div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <PlanBadge u={u} />
                          {!bulkMode && (selectedUser?.id === u.id
                            ? <ChevronUp size={14} color="rgba(255,255,255,0.3)"/>
                            : <ChevronDown size={14} color="rgba(255,255,255,0.3)"/>)}
                        </div>
                      </div>
                    </div>
                    {!bulkMode && selectedUser?.id === u.id && (
                      <div style={{ padding:"0 14px 14px" }}>
                        <UserDetailPanel
                          user={u}
                          adminToken={activeToken}
                          isSupport={role === "support"}
                          showToast={showToast}
                          requestConfirm={requestConfirm}
                          onAction={() => { doSearch(search); showToast("✅ Updated — refreshing list…"); }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MEMORY ── */}
        {tab === "memory" && (
          <>
            <div style={{ ...CARD_STYLE, marginBottom:12 }}>
              <SectionTitle color="#34d399">🧠 Memory Health</SectionTitle>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", margin:"0 0 12px", lineHeight:1.6 }}>
                Search a user to view memory health indicators and rebuild from structured data only (no transcript access).
              </p>
              <div style={{ position:"relative" }}>
                <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }} />
                <input
                  value={memSearch}
                  onChange={e => setMemSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doMemSearch(memSearch)}
                  placeholder="Search user by name, email, or Apple ID…"
                  style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 14px 10px 34px", color:"#fff", fontSize:13, outline:"none" }}
                />
              </div>
              {memSearch.trim() && (
                <button
                  onClick={() => doMemSearch(memSearch)}
                  disabled={memSearching}
                  style={{ marginTop:8, width:"100%", padding:"10px", borderRadius:12, border:"none", background:GRAD_GREEN, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity: memSearching ? 0.6 : 1 }}
                >
                  {memSearching ? "Searching…" : "Search"}
                </button>
              )}
            </div>

            {memSearching && (
              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13, padding:"20px 0" }}>Searching…</div>
            )}

            {!memSearching && memResults !== null && (
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden" }}>
                {memResults.length === 0 ? (
                  <div style={{ padding:"24px", textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>No users found.</div>
                ) : memResults.map((u, i) => (
                  <div key={u.id || i}>
                    <div
                      onClick={() => setSelectedMem(selectedMem?.id === u.id ? null : u)}
                      style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer", background: selectedMem?.id === u.id ? "rgba(52,211,153,0.07)" : "transparent" }}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{u.display_name}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                            <span style={{ marginRight:8 }}>💬 {u.message_count} msgs</span>
                            <span style={{ marginRight:8 }}>🧠 {u.memory_facts_count ?? 0} facts</span>
                            <span>Last active: {fmtDateTime(u.last_active)}</span>
                          </div>
                        </div>
                        {selectedMem?.id === u.id
                          ? <ChevronUp size={14} color="rgba(255,255,255,0.3)"/>
                          : <ChevronDown size={14} color="rgba(255,255,255,0.3)"/>}
                      </div>
                    </div>
                    {selectedMem?.id === u.id && (
                      <div style={{ padding:"14px" }}>
                        {/* Memory health indicators */}
                        <div style={{ marginBottom:6 }}>
                          <div style={{ fontSize:10, color:"rgba(52,211,153,0.6)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, fontWeight:700 }}>🧠 Memory Health</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:12 }}>
                            {[
                              ["Memory Summary",        u.memory_summary ? u.memory_summary.length + " chars" : "Not available"],
                              ["Facts Present",         u.memory_facts_count ?? "—"],
                              ["Session Notes",         u.memory_session_notes_count ?? "—"],
                              ["Memory Vectors",        u.memory_vectors_count ?? "—"],
                              ["Last Updated",          fmtDateTime(u.memory_updated_at)],
                            ].map(([k, v]) => (
                              <div key={k} style={{ background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.1)", borderRadius:10, padding:"8px 10px" }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{k}</div>
                                <div style={{ fontSize:12, color: k === "Memory Summary" && !u.memory_summary ? "rgba(251,146,60,0.8)" : "#fff", fontWeight:600, marginTop:2 }}>{String(v)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Message activity (separate from memory) */}
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:10, color:"rgba(96,165,250,0.6)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, fontWeight:700 }}>💬 Message Activity</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px" }}>
                            {[
                              ["Total Messages",  u.message_count],
                              ["Tokens Total",    u.tokens_used_total || "—"],
                              ["Last Active",     fmtDateTime(u.last_active)],
                              ["Last Seen",       fmtDateTime(u.last_seen)],
                            ].map(([k, v]) => (
                              <div key={k} style={{ background:"rgba(96,165,250,0.05)", border:"1px solid rgba(96,165,250,0.1)", borderRadius:10, padding:"8px 10px" }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{k}</div>
                                <div style={{ fontSize:12, color:"#fff", fontWeight:600, marginTop:2 }}>{String(v)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button
                            onClick={() => doRebuildMemory(u.id, u.display_name)}
                            disabled={rebuilding}
                            title="Rebuilds memory_summary from stored facts, session notes, and emotional timeline — no raw transcript access"
                            style={{ flex:1, padding:"10px", borderRadius:12, border:`1px solid rgba(52,211,153,${rebuilding ? "0.2" : "0.45"})`, background:`rgba(52,211,153,${rebuilding ? "0.04" : "0.12"})`, color: rebuilding ? "rgba(52,211,153,0.4)" : "#34d399", fontWeight:700, fontSize:12, cursor: rebuilding ? "default" : "pointer", transition:"all .2s" }}
                          >
                            {rebuilding ? "Rebuilding…" : "🔄 Rebuild Memory"}
                          </button>
                          <button
                            disabled
                            title="Export chat history — coming soon"
                            style={{ flex:1, padding:"10px", borderRadius:12, border:"1px solid rgba(96,165,250,0.2)", background:"rgba(96,165,250,0.06)", color:"rgba(96,165,250,0.35)", fontWeight:700, fontSize:12, cursor:"not-allowed" }}
                          >
                            📤 Export History
                          </button>
                        </div>
                        <div style={{ marginTop:8, fontSize:11, color:"rgba(255,255,255,0.2)", textAlign:"center" }}>
                          Memory rebuild uses structured data only — no transcript access.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── AUDIT ── */}
        {tab === "audit" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <SectionTitle color="#fb923c">📋 Admin Audit Log</SectionTitle>
              <button
                onClick={loadAuditLog}
                disabled={auditLoading}
                style={{ padding:"6px 12px", borderRadius:10, border:"none", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer" }}
              >
                {auditLoading ? "Loading…" : "↻ Refresh"}
              </button>
            </div>

            {/* Action-type filter pills */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {[
                { id:"all",                   label:"All" },
                { id:"quick_grant",           label:"Grants" },
                { id:"subscription_override", label:"Overrides" },
                { id:"clear_override",        label:"Revokes" },
                { id:"bulk_",                 label:"Bulk" },
                { id:"sync_revenuecat",       label:"RC Syncs" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAuditFilter(f.id)}
                  style={{
                    padding:"5px 10px", borderRadius:8, border:"none", fontSize:11, fontWeight:700, cursor:"pointer",
                    background: auditFilter === f.id ? "rgba(251,146,60,0.22)" : "rgba(255,255,255,0.07)",
                    color: auditFilter === f.id ? "#fb923c" : "rgba(255,255,255,0.35)",
                    transition:"all .15s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {auditLoading && (
              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"32px 0" }}>Loading audit log…</div>
            )}

            {(() => {
              const filtered = auditFilter === "all"
                ? (auditLog || [])
                : (auditLog || []).filter(e => (e.action || "").startsWith(auditFilter));
              if (auditLog !== null && !auditLoading && filtered.length === 0) {
                return (
                  <div style={{ ...CARD_STYLE, textAlign:"center" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>
                      {auditLog.length === 0
                        ? "No audit log entries yet. Subscription overrides you save will appear here."
                        : `No "${auditFilter.replace(/_/g, " ")}" entries found.`}
                    </p>
                  </div>
                );
              }
              if (auditLog !== null && !auditLoading && filtered.length > 0) {
                return (
                  <>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:8 }}>
                      {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden" }}>
                      {filtered.map((entry, i) => (
                        <div key={entry.id || i} style={{ padding:"12px 14px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                            <Badge text={entry.action || "change"} color="#fb923c" />
                            <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>{fmtDateTime(entry.timestamp || entry.created_date)}</span>
                          </div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:2, fontFamily:"monospace" }}>
                            {entry.entity_id}
                          </div>
                          {entry.reason && (
                            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Reason: {entry.reason}</div>
                          )}
                          {entry.changes && (
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4, fontFamily:"monospace", background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"4px 8px", wordBreak:"break-all" }}>
                              {entry.changes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              }
              return null;
            })()}
          </>
        )}

        {/* ── FEEDBACK ── */}
        {stats && tab === "feedback" && (
          <>
            <SectionTitle color="#14b8a6">💬 User Feedback ({stats.allFeedback?.length || 0})</SectionTitle>
            {(!stats.allFeedback || stats.allFeedback.length === 0) && (
              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13, padding:"24px 0" }}>No feedback submitted yet.</div>
            )}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden" }}>
              {[...(stats.allFeedback || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((f, i, arr) => (
                <div key={f.id || i} style={{ padding:"12px 14px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{f.display_name || "User"}</span>
                    <div style={{ display:"flex", gap:6 }}>
                      {f.rating && <Badge text={"⭐".repeat(f.rating)} color="#f59e0b"/>}
                      <Badge text={f.status || "open"} color={f.status === "resolved" ? "#34d399" : "#f59e0b"} />
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>{f.category || "general"} · {fmtDate(f.created_date)}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.5 }}>{f.message || "—"}</div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {confirmDialog && (
        <ConfirmDialog
          visible={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          confirmVariant={confirmDialog.confirmVariant}
          countdown={confirmDialog.countdown || 0}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
}


