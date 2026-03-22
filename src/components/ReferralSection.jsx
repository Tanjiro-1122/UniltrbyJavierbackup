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
      if (res.data?.code) {
        setCode(res.data.code);
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
            <p style={{ fontSize: 18, margin: 0 }}>{s.icon}</p>
            <p style={{ color: "#a855f7", fontWeight: 800, fontSize: 18, margin: "2px 0 0" }}>{s.value}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Code display */}
      <div style={{
        padding: "14px 16px", borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 10,
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 4px" }}>Your referral code</p>
        <p style={{ color: "white", fontWeight: 800, fontSize: 20, letterSpacing: "0.05em", margin: 0 }}>{code}</p>
      </div>

      <button
        onClick={handleCopy}
        style={{
          width: "100%", padding: "13px",
          background: copied ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #7c3aed, #db2777)",
          border: copied ? "1px solid rgba(34,197,94,0.4)" : "none",
          borderRadius: 14, color: "white", fontWeight: 700, fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copied to clipboard!" : "Copy & Share"}
      </button>
      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
        Each friend who joins gets 50 bonus messages. So do you! 🎁
      </p>
    </div>
  );
}