import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Check, Users } from "lucide-react";

export default function ReferralSection({ profileId }) {
  const [code, setCode] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [bonusMessages, setBonusMessages] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    base44.functions.invoke("generateReferralCode", { profileId }).then(res => {
      // ✅ Fixed: API returns referral_code (not code)
      const c = res.data?.referral_code || res.data?.code;
      if (c) {
        setCode(c);
        setReferralCount(res.data.referral_count || 0);
        setBonusMessages(res.data.bonus_messages || 0);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [profileId]);

  const shareMessage = `I've been using Unfiltr – a private AI companion app 💜\nUse my code ${code} to get 50 free bonus messages!\nunfiltrbyjavier2.vercel.app`;

  const handleCopy = async () => {
    // Try native share first (mobile), fallback to clipboard
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on Unfiltr!", text: shareMessage });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) return (
    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!code) return (
    <div style={{ padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
      Referral code unavailable
    </div>
  );

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        Invite Friends
      </p>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Friends Referred", value: referralCount, icon: "👥" },
          { label: "Bonus Messages", value: `+${bonusMessages}`, icon: "💬" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "12px 8px",
            background: "rgba(168,85,247,0.08)", borderRadius: 14,
            border: "1px solid rgba(168,85,247,0.15)",
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>{s.value}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Code display */}
      <div style={{
        background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 14, padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <div>
          <div style={{ color: "rgba(196,181,253,0.6)", fontSize: 11, marginBottom: 3 }}>Your referral code</div>
          <div style={{ color: "white", fontWeight: 800, fontSize: 20, letterSpacing: "0.06em" }}>{code}</div>
        </div>
        <button onClick={handleCopy} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: 10,
          background: copied ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.25)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(139,92,246,0.4)"}`,
          color: copied ? "#4ade80" : "#c4b5fd", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Shared!" : "Share"}
        </button>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", margin: 0 }}>
        Each friend who joins with your code earns you +50 bonus messages
      </p>
    </div>
  );
}
