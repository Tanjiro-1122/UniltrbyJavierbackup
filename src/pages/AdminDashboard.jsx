import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, MessageSquare, Crown, ShieldAlert,
  RefreshCw, BookOpen, AlertTriangle, LogOut,
  Trash2, Star, Apple, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"2-digit" }) : "—";
const fmtDateTime = (s) =>
  s ? new Date(s).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

// Extract first hex color from gradient string for glow effects
function hexToGlow(grad, opacity = 0.3) {
  const m = grad.match(/#([0-9a-fA-F]{6})/);
  if (!m) return `rgba(168,85,247,${opacity})`;
  const r = parseInt(m[1].slice(0,2),16);
  const g = parseInt(m[1].slice(2,4),16);
  const b = parseInt(m[1].slice(4,6),16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// ── design tokens ─────────────────────────────────────────────────────────────
const BG           = "linear-gradient(160deg,#0a0015 0%,#150030 50%,#0a001a 100%)";
const CARD_STYLE   = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:20, padding:"16px" };
const GRAD_PURPLE  = "linear-gradient(135deg,#a855f7,#db2777)";
const GRAD_BLUE    = "linear-gradient(135deg,#60a5fa,#3b82f6)";
const GRAD_GREEN   = "linear-gradient(135deg,#34d399,#10b981)";
const GRAD_ORANGE  = "linear-gradient(135deg,#fb923c,#f97316)";
const GRAD_AMBER   = "linear-gradient(135deg,#f59e0b,#d97706)";

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, grad = GRAD_PURPLE }) {
  const glow      = hexToGlow(grad, 0.28);
  const glowInner = hexToGlow(grad, 0.07);
  const glowBdr   = hexToGlow(grad, 0.45);
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${glowBdr}`,
      borderRadius: 20,
      padding: "16px",
      boxShadow: `0 0 18px ${glow}, inset 0 0 22px ${glowInner}`,
      backdropFilter: "blur(16px)",
      display: "flex", flexDirection: "column", gap: 6,
    }}>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:grad, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 2px 12px ${hexToGlow(grad, 0.5)}` }}>
          {icon}
        </div>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
      </div>
      <span style={{ fontSize:30, fontWeight:800, color:"#fff", lineHeight:1 }}>{value ?? 0}</span>
      {sub && <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{sub}</span>}
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
  if (u.ultimate_friend) return <Badge text="⭐ Ultimate" color="#f97316" />;
  if (u.annual_plan)     return <Badge text="Annual"      color="#34d399" />;
  if (u.pro_plan)        return <Badge text="Pro"         color="#a855f7" />;
  if (u.is_premium)      return <Badge text="Premium"     color="#f59e0b" />;
  if (u.trial_active)    return <Badge text="Trial"       color="#60a5fa" />;
  return <Badge text="Free" color="#6b7280" />;
}

function planColor(u) {
  if (u.ultimate_friend) return "#f97316";
  if (u.annual_plan)     return "#34d399";
  if (u.pro_plan)        return "#a855f7";
  if (u.is_premium)      return "#f59e0b";
  if (u.trial_active)    return "#60a5fa";
  return "#6b7280";
}

// ── User Detail Panel ─────────────────────────────────────────────────────────
function UserDetailPanel({ user, adminToken, onAction, showToast, requestConfirm, deleteUser }) {
  const [subForm, setSubForm] = useState({
    is_premium:            user.is_premium,
    pro_plan:              user.pro_plan,
    annual_plan:           user.annual_plan,
    trial_active:          user.trial_active,
    subscription_expires:  user.subscription_expires || "",
  });
  const [reason,        setReason]        = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saveMsg,       setSaveMsg]       = useState("");
  const [quickReason,   setQuickReason]   = useState("");
  const [quickSaving,   setQuickSaving]   = useState(false);
  const [quickMsg,      setQuickMsg]      = useState("");
  const [showManageSub, setShowManageSub] = useState(false);

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
              <div style={{ fontSize:12, color:"#fff", fontWeight:600, marginTop:2 }}>{v ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
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

      {/* ⚙️ Manage Subscription — collapsible */}
      <div style={{ ...CARD_STYLE, marginBottom:12 }}>
        <button
          onClick={() => setShowManageSub(v => !v)}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", padding:0 }}
        >
          <div style={{ fontSize:13, fontWeight:800, color:"#a855f7", display:"flex", alignItems:"center", gap:6 }}>
            ⚙️ Manage Subscription
          </div>
          {showManageSub
            ? <ChevronUp size={14} color="#a855f7"/>
            : <ChevronDown size={14} color="rgba(168,85,247,0.5)"/>}
        </button>

        {showManageSub && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                ["is_premium",     "Premium",        "#f59e0b"],
                ["pro_plan",       "Pro Plan",        "#a855f7"],
                ["annual_plan",    "Annual Plan",     "#34d399"],
                ["ultimate_friend","Ultimate Friend ⭐","#f97316"],
                ["trial_active",   "Trial Active",    "#60a5fa"],
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
      </div>

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

      <RecoveryVaultPanel
        user={user}
        adminToken={adminToken}
        showToast={showToast}
        requestConfirm={requestConfirm}
        onRestored={onAction}
      />
    </div>
  );
}

// ── Recovery Vault Panel ──────────────────────────────────────────────────────
function RecoveryVaultPanel({ user, adminToken, showToast, requestConfirm, onRestored }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState(null);
  const [msg, setMsg] = useState("");

  const loadBackups = async () => {
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/utils", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken, action: "recoveryList", userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      setBackups(data.backups || []);
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setLoading(false);
  };

  const restoreBackup = (backup) => {
    requestConfirm({
      title: "Restore Backup?",
      message: `Restore ${backup.label || backup.type} for ${user.display_name || "this user"}? This will put the saved chat/memory back into their backend account.`,
      confirmLabel: "Restore",
      confirmVariant: "default",
      countdown: 2,
      onConfirm: async () => {
        setLoading(true); setMsg("");
        try {
          const res = await fetch("/api/utils", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminToken, action: "recoveryRestore", userId: user.id, backupId: backup.id }),
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || "Failed");
          setMsg(`✅ Restored ${data.restored || 0} item(s).`);
          showToast(`✅ Recovery restored for ${user.display_name || "user"}`);
          await loadBackups();
          onRestored?.();
        } catch (e) {
          setMsg("❌ " + e.message);
        }
        setLoading(false);
      },
    });
  };

  const count = Array.isArray(backups) ? backups.length : (Array.isArray(user.recovery_backups) ? user.recovery_backups.length : 0);

  return (
    <div style={{ ...CARD_STYLE, marginTop:12 }}>
      <button
        onClick={() => { const next = !open; setOpen(next); if (next && backups === null) loadBackups(); }}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", padding:0 }}
      >
        <div style={{ fontSize:13, fontWeight:800, color:"#f59e0b", display:"flex", alignItems:"center", gap:6 }}>
          🛟 Recovery Vault {count ? `(${count})` : ""}
        </div>
        {open ? <ChevronUp size={14} color="#f59e0b"/> : <ChevronDown size={14} color="rgba(245,158,11,0.6)"/>}
      </button>

      {open && (
        <div style={{ marginTop:12 }}>
          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:12, lineHeight:1.45, margin:"0 0 10px" }}>
            Private admin fail-safe for paid accounts only. Used for accidental chat or AI memory deletion. True account-deletion requests should still be respected.
          </p>
          <button
            onClick={loadBackups}
            disabled={loading}
            style={{ padding:"7px 10px", borderRadius:10, border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.1)", color:"#fbbf24", fontWeight:700, fontSize:12, cursor: loading ? "default" : "pointer", marginBottom:10 }}
          >
            {loading ? "Loading…" : "Refresh Vault"}
          </button>
          {msg && <div style={{ fontSize:12, color: msg.startsWith("✅") ? "#34d399" : "#f87171", marginBottom:10 }}>{msg}</div>}
          {loading && !backups && <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>Loading backups…</div>}
          {Array.isArray(backups) && backups.length === 0 && (
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, padding:"10px 0" }}>No recovery backups yet.</div>
          )}
          {Array.isArray(backups) && backups.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {backups.map(b => (
                <div key={b.id} style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.14)", borderRadius:12, padding:"10px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"flex-start" }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ color:"#fff", fontWeight:800, fontSize:12 }}>{b.label || b.type}</div>
                      <div style={{ color:"rgba(255,255,255,0.42)", fontSize:11, marginTop:3 }}>
                        {b.type} · {b.item_count || 0} item(s) · {fmtDateTime(b.created_at)}
                      </div>
                      {b.expires_at && <div style={{ color:"rgba(255,255,255,0.28)", fontSize:10, marginTop:2 }}>Vault expires: {fmtDate(b.expires_at)}</div>}
                    </div>
                    <button
                      onClick={() => restoreBackup(b)}
                      disabled={loading}
                      style={{ padding:"7px 10px", borderRadius:10, border:"none", background:GRAD_AMBER, color:"#fff", fontWeight:800, fontSize:11, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, whiteSpace:"nowrap" }}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Memory Detail Panel ───────────────────────────────────────────────────────
function MemoryDetailPanel({ user, adminToken, showToast, requestConfirm, onCleared }) {
  const [clearReason, setClearReason] = useState("");
  const [clearing,    setClearing]    = useState(false);
  const [clearMsg,    setClearMsg]    = useState("");

  const doClearMemory = () => {
    if (!clearReason.trim()) { setClearMsg("❌ Reason is required"); return; }
    requestConfirm({
      title: "Clear User Memory?",
      message: `This wipes "${user.display_name}"'s memory summary and all stored memory vectors. The AI will rebuild fresh memory on the next conversation.\n\nReason: "${clearReason}"`,
      confirmLabel: "Clear Memory",
      confirmVariant: "danger",
      countdown: 2,
      onConfirm: async () => {
        setClearing(true); setClearMsg("");
        try {
          const res = await fetch("/api/adminStats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminToken, action: "clearMemory", userId: user.id, reason: clearReason }),
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || "Failed");
          setClearMsg("✅ Memory cleared — AI will start fresh on next chat.");
          setClearReason("");
          showToast(`✅ Memory cleared for ${user.display_name}`);
          onCleared?.();
        } catch (e) { setClearMsg("❌ " + e.message); }
        setClearing(false);
      },
    });
  };

  return (
    <div style={{ padding:"14px" }}>
      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:12 }}>
        {[
          ["Memory Summary",  user.memory_summary ? user.memory_summary.length + " chars" : "Not available"],
          ["Memory Updated",  fmtDateTime(user.memory_updated_at)],
          ["Last Active",     fmtDateTime(user.last_active)],
          ["Last Seen",       fmtDateTime(user.last_seen)],
          ["Total Messages",  user.message_count],
          ["Tokens Total",    user.tokens_used_total || "—"],
        ].map(([k, v]) => (
          <div key={k} style={{ background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.1)", borderRadius:10, padding:"8px 10px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{k}</div>
            <div style={{ fontSize:12, color:"#fff", fontWeight:600, marginTop:2 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Memory summary preview */}
      {user.memory_summary && (
        <div style={{ background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.12)", borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Memory Content Preview</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", lineHeight:1.55, whiteSpace:"pre-wrap", maxHeight:120, overflowY:"auto" }}>
            {user.memory_summary.slice(0, 600)}{user.memory_summary.length > 600 ? "…" : ""}
          </div>
        </div>
      )}

      {/* Clear memory */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Reason <span style={{ color:"#f87171" }}>*</span></div>
        <textarea
          value={clearReason}
          onChange={e => { setClearReason(e.target.value); setClearMsg(""); }}
          placeholder="e.g. User reported AI confused them with another person"
          rows={2}
          style={{
            width:"100%", boxSizing:"border-box",
            background:"rgba(255,255,255,0.06)",
            border:`1px solid ${!clearReason.trim() && clearMsg.startsWith("❌ Reason") ? "#f87171" : "rgba(255,255,255,0.12)"}`,
            borderRadius:10, padding:"9px 12px", color:"#fff", fontSize:12, outline:"none",
            resize:"none", fontFamily:"inherit",
          }}
        />
      </div>
      {clearMsg && (
        <div style={{ fontSize:12, color: clearMsg.startsWith("✅") ? "#34d399" : "#f87171", marginBottom:8 }}>
          {clearMsg}
        </div>
      )}
      <button
        onClick={doClearMemory}
        disabled={clearing}
        style={{ width:"100%", padding:"10px", borderRadius:12, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#fca5a5", fontWeight:700, fontSize:12, cursor: clearing ? "default" : "pointer", opacity: clearing ? 0.6 : 1 }}
      >
        {clearing ? "Clearing…" : "🗑️ Clear Memory (Fix Confused AI)"}
      </button>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [unlocked,      setUnlocked]      = useState(false);
  const [adminToken,    setAdminToken]    = useState("");
  const [pwInput,       setPwInput]       = useState("");
  const [pwError,       setPwError]       = useState(false);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [tab,           setTab]           = useState("overview");
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

  // Audit tab
  const [auditLog,      setAuditLog]      = useState(null);
  const [auditLoading,  setAuditLoading]  = useState(false);
  const [auditFilter,   setAuditFilter]   = useState("all");

  // Live clock
  const [liveClock,     setLiveClock]     = useState("");

  const navigate = useNavigate();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const requestConfirm = (cfg) => setConfirmDialog({
    ...cfg,
    onConfirm: async () => { setConfirmDialog(null); await cfg.onConfirm?.(); },
    onCancel:  ()       => { setConfirmDialog(null); cfg.onCancel?.(); },
  });

  useEffect(() => {
    const savedToken = sessionStorage.getItem("unfiltr_admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setUnlocked(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (unlocked) loadData(); }, [unlocked]);

  // Live clock — updates every second
  useEffect(() => {
    const tick = () => setLiveClock(new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Debounced user search — fires on search input change or when Users tab is opened
  useEffect(() => {
    if (tab !== "users" || !unlocked) return;
    const delay = search.trim() ? 350 : 0;
    const timer = setTimeout(() => doSearch(search), delay);
    return () => clearTimeout(timer);
  }, [search, tab, unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load audit log when Audit tab first opens
  useEffect(() => {
    if (tab === "audit" && unlocked && auditLog === null) loadAuditLog();
  }, [tab, unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnlock = async () => {
    try {
      const res = await fetch("/api/utils", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verifySpecialCode", code: pwInput }),
      });
      const data = await res.json();
      if (data.type === "admin") {
        sessionStorage.setItem("unfiltr_admin_token", pwInput.trim());
        setAdminToken(pwInput.trim());
        setUnlocked(true); setPwError(false);
      } else {
        setPwError(true); setTimeout(() => setPwError(false), 1500);
      }
    } catch {
      setPwError(true); setTimeout(() => setPwError(false), 1500);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("unfiltr_admin_unlocked");
    sessionStorage.removeItem("unfiltr_admin_token");
    setUnlocked(false); setAdminToken(""); setStats(null); setPwInput("");
  };

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: adminToken }),
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
        body: JSON.stringify({ adminToken: adminToken, action: "userSearch", query: q }),
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
        body: JSON.stringify({ adminToken: adminToken, action: "userSearch", query: q }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setMemResults(data.users || []);
    } catch (e) { showToast("❌ " + e.message); }
    setMemSearching(false);
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/adminStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: adminToken, action: "auditLog" }),
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
        body: JSON.stringify({ adminToken: adminToken, action: "grantAccess", userId, type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(`✅ ${type === "trial" ? "Trial" : "Family"} access granted`);
      loadData();
    } catch (e) { showToast("❌ " + e.message); }
  };

  const deleteUser = (userId, name) => {
    requestConfirm({
      title: "Delete Account?",
      message: `Are you sure you want to permanently delete "${name}"? This will remove all their data. This cannot be undone.`,
      confirmLabel: "Delete Permanently",
      confirmVariant: "danger",
      countdown: 3,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/adminStats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminToken: adminToken, action: "deleteUser", userId }),
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
              adminToken: adminToken, action: "bulkAction",
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
        <h1 style={{ color:"white", fontWeight:900, fontSize:26, margin:"0 0 4px", letterSpacing:"-0.5px" }}>Unfiltr Admin</h1>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, margin:"0 0 32px" }}>Management portal — authorized access only.</p>
        <input
          type="password" value={pwInput}
          onChange={e => setPwInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleUnlock()}
          placeholder="Admin password" autoFocus
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

  // ── TABS ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id:"overview",  label:"Overview",  icon:"🏠" },
    { id:"users",     label:"Users",     icon:"👥" },
    { id:"memory",    label:"Memory",    icon:"🧠" },
    { id:"audit",     label:"Audit",     icon:"📋" },
    { id:"feedback",  label:"Feedback",  icon:"💬" },
  ];

  const totalUsers = stats?.totalUsers  ?? 0;
  const proUsers       = stats?.premiumUsers ?? 0;
  const ultimateUsers  = stats?.ultimateUsers ?? 0;
  const convRate   = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0";

  return (
    <div style={{ position:"fixed", inset:0, background:BG, fontFamily:"'SF Pro Display',system-ui,sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* ambient glow */}
      <div style={{ position:"absolute", top:"-8%", right:"-4%", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"10%", left:"-8%", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,0.07) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* ── TOP BAR ── */}
      <div style={{ padding:"max(1.2rem,env(safe-area-inset-top)) 16px 0", background:"rgba(0,0,0,0.45)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:19, fontWeight:900, background:"linear-gradient(135deg,#c084fc,#e879f9,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.3px" }}>
              ✦ Unfiltr Admin
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1 }}>
              {totalUsers} users · {liveClock}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={loadData} disabled={loading} style={{ width:36, height:36, borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
            <button onClick={() => navigate("/settings")} style={{ width:36, height:36, borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
              ←
            </button>
            <button onClick={handleLogout} style={{ width:36, height:36, borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
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

        {/* Toast — top-center pill (fixed) */}
        {toast && (
          <div style={{
            position:"fixed", top:80, left:"50%", transform:"translateX(-50%)",
            background:"rgba(20,0,40,0.92)", border:"1px solid rgba(168,85,247,0.5)",
            borderRadius:999, padding:"10px 22px", fontSize:13, color:"#e9d5ff",
            boxShadow:"0 4px 24px rgba(168,85,247,0.3)", zIndex:9999, whiteSpace:"nowrap",
            backdropFilter:"blur(12px)",
          }}>
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
            <div style={{ fontSize:28, marginBottom:8 }}>✦</div>
            Loading…
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {stats && tab === "overview" && (
          <>
            {/* Hero banner */}
            <div style={{
              background:"linear-gradient(135deg,rgba(168,85,247,0.18) 0%,rgba(219,39,119,0.12) 100%)",
              border:"1px solid rgba(168,85,247,0.25)",
              borderRadius:20, padding:"18px 20px", marginBottom:16,
              boxShadow:"0 0 40px rgba(168,85,247,0.12)",
            }}>
              <div style={{ fontSize:28, fontWeight:900, background:"linear-gradient(135deg,#c084fc,#e879f9,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.5px", marginBottom:4 }}>
                Unfiltr
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Total Users</div>
                  <div style={{ fontSize:32, fontWeight:900, color:"#fff", lineHeight:1.1 }}>{totalUsers}</div>
                </div>
                <div style={{ width:1, height:40, background:"rgba(255,255,255,0.1)" }} />
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Pro Users</div>
                  <div style={{ fontSize:32, fontWeight:900, color:"#c084fc", lineHeight:1.1 }}>{proUsers}</div>
                </div>
                <div style={{ width:1, height:40, background:"rgba(255,255,255,0.1)" }} />
                <div style={{ marginLeft:"auto", textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"rgba(255,255,255,0.9)", letterSpacing:"-0.5px" }}>{liveClock}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{convRate}% conversion</div>
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <StatCard icon={<Users size={13} color="#fff"/>}         label="Total Users"     value={stats.totalUsers}            grad={GRAD_PURPLE} />
              <StatCard icon={<Crown size={13} color="#fff"/>}         label="Premium Users"   value={stats.premiumUsers}          sub={convRate + "% conv"} grad={GRAD_AMBER} />
              <StatCard icon={<span style={{fontSize:13}}>⭐</span>}  label="Ultimate Friend" value={stats.ultimateFriendUsers ?? 0} grad="linear-gradient(135deg,#f97316,#ea580c)" />
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
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden", marginBottom:16 }}>
              {(stats.recentUsers || []).slice(0, 8).map((u, i) => (
                <div key={u.id || i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderBottom: i < 7 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.display_name || "New User"}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {u.email || <span style={{ color:"rgba(255,255,255,0.2)" }}>no email</span>} · {fmtDate(u.created_date)} · {u.message_count || 0} msgs
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0, marginLeft:8 }}>
                    {u.onboarding_complete ? <Badge text="✓" color="#34d399"/> : <Badge text="⏳" color="#f59e0b"/>}
                    <PlanBadge u={u} />
                    <button
                      onClick={e => { e.stopPropagation(); deleteUser(u.id, u.display_name || "this user"); }}
                      style={{ width:28, height:28, borderRadius:8, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#f87171", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}
                      title="Delete account"
                    >
                      🗑️
                    </button>
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

        {/* ── USERS ── */}
        {tab === "users" && (
          <>
            {/* Search bar */}
            <div style={{ position:"relative", marginBottom:14 }}>
              <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: searching ? "rgba(168,85,247,0.7)" : "rgba(255,255,255,0.3)", transition:"color .2s" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch(search)}
                placeholder="Search by name, email, or Apple ID…"
                style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(168,85,247,0.2)", borderRadius:16, padding:"13px 16px 13px 42px", color:"#fff", fontSize:14, outline:"none", backdropFilter:"blur(8px)" }}
              />
              {searching && (
                <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", width:14, height:14, borderRadius:"50%", border:"2px solid rgba(168,85,247,0.3)", borderTopColor:"#a855f7", animation:"spin 0.7s linear infinite" }} />
              )}
            </div>

            {/* Result count */}
            {!searching && searchResults !== null && (
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:10, paddingLeft:2 }}>
                {searchResults.length} user{searchResults.length !== 1 ? "s" : ""}{search.trim() ? ` matching "${search}"` : " total"}
              </div>
            )}

            {!searching && searchResults !== null && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {searchResults.length === 0 ? (
                  <div style={{ ...CARD_STYLE, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13, padding:"28px" }}>No users found.</div>
                ) : searchResults.map((u) => (
                  <div key={u.id} style={{
                    background:"rgba(255,255,255,0.03)",
                    border:`1px solid ${selectedUser?.id === u.id ? "rgba(168,85,247,0.35)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius:16,
                    overflow:"hidden",
                    boxShadow: selectedUser?.id === u.id ? "0 0 16px rgba(168,85,247,0.1)" : "none",
                    transition:"border-color .15s, box-shadow .15s",
                  }}>
                    {/* User row */}
                    <div
                      onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                      style={{ padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width:40, height:40, borderRadius:12, flexShrink:0,
                        background:`linear-gradient(135deg,${planColor(u)},${planColor(u)}aa)`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:16, fontWeight:800, color:"#fff",
                        boxShadow:`0 2px 10px ${planColor(u)}44`,
                      }}>
                        {(u.display_name || "?")[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{u.display_name || "Unknown"}</span>
                          <PlanBadge u={u} />
                          {u.apple_user_id
                            ? <span style={{ fontSize:13 }} title="Apple ID linked">🍎</span>
                            : <Apple size={13} color="rgba(255,255,255,0.15)" />}
                          {u.onboarding_complete
                            ? <span style={{ fontSize:11, color:"#34d399" }}>✓</span>
                            : <span style={{ fontSize:11, color:"#f59e0b" }}>⏳</span>}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {u.email || <span style={{ color:"rgba(255,255,255,0.2)" }}>no email</span>}
                          {" · "}Joined {fmtDate(u.created_date)}
                          {" · "}Last seen {fmtDate(u.last_seen)}
                          {" · "}{u.message_count ?? 0} msgs
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); deleteUser(u.id, u.display_name || "this user"); }}
                          style={{ width:32, height:32, borderRadius:9, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#f87171", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}
                          title="Delete account"
                        >
                          🗑️
                        </button>
                        {selectedUser?.id === u.id
                          ? <ChevronUp size={14} color="rgba(255,255,255,0.3)"/>
                          : <ChevronDown size={14} color="rgba(255,255,255,0.3)"/>}
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {selectedUser?.id === u.id && (
                      <div style={{ padding:"0 14px 14px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                        <UserDetailPanel
                          user={u}
                          adminToken={adminToken}
                          showToast={showToast}
                          requestConfirm={requestConfirm}
                          deleteUser={deleteUser}
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
              <SectionTitle color="#34d399">🧠 Memory & Sync Health</SectionTitle>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", margin:"0 0 12px", lineHeight:1.6 }}>
                Search a user to view their memory summary and last chat activity.
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
                            {u.message_count} msgs · Last active: {fmtDateTime(u.last_active)}
                          </div>
                        </div>
                        {selectedMem?.id === u.id
                          ? <ChevronUp size={14} color="rgba(255,255,255,0.3)"/>
                          : <ChevronDown size={14} color="rgba(255,255,255,0.3)"/>}
                      </div>
                    </div>
                    {selectedMem?.id === u.id && (
                      <MemoryDetailPanel
                        user={u}
                        adminToken={adminToken}
                        showToast={showToast}
                        requestConfirm={requestConfirm}
                        onCleared={() => {
                          setMemResults(r => r.map(x => x.id === u.id
                            ? { ...x, memory_summary: null, memory_vectors: [], memory_updated_at: null }
                            : x
                          ));
                          setSelectedMem(null);
                        }}
                      />
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



