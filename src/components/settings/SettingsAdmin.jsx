import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SettingsAdmin({ profile }) {
  const navigate = useNavigate();
  const [debugLog, setDebugLog] = useState([]);
  const [iapTesting, setIapTesting] = useState(false);

  const addLog = (msg, type = "info") => {
    const ts = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, { ts, msg, type }]);
    console.log(`[UNFILTR DEBUG ${ts}] ${msg}`);
  };

  const runIapDiagnostic = async () => {
    setIapTesting(true);
    setDebugLog([]);
    addLog("🚀 Starting IAP diagnostic...");

    const hasRNWV = !!(window.ReactNativeWebView);
    const hasWTN = !!(window.webkit?.messageHandlers?.ReactNativeWebView);
    addLog(`ReactNativeWebView: ${hasRNWV ? "✅ FOUND" : "❌ NOT FOUND"}`, hasRNWV ? "ok" : "error");
    addLog(`webkit.messageHandlers: ${hasWTN ? "✅ FOUND" : "❌ NOT FOUND"}`, hasWTN ? "ok" : "error");

    if (!hasRNWV && !hasWTN) {
      addLog("⚠️ No native bridge — you are on web/browser, not in the iOS wrapper", "warn");
    } else {
      addLog("✅ Native bridge detected — running in iOS wrapper");
    }

    addLog("--- localStorage snapshot ---");
    const keys = ["unfiltr_is_premium", "unfiltr_user_id", "userProfileId", "unfiltr_display_name", "unfiltr_onboarding_complete", "unfiltr_family_unlock"];
    keys.forEach(k => {
      const v = localStorage.getItem(k);
      addLog(`  ${k}: ${v ?? "(null)"}`, v ? "ok" : "warn");
    });

    if (hasRNWV || hasWTN) {
      addLog("📡 Sending GET_OFFERINGS to native bridge...");
      const offeringsResult = await new Promise(resolve => {
        const timeout = setTimeout(() => resolve({ error: "TIMEOUT after 15s" }), 15000);
        const handler = (e) => {
          try {
            const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
            if (d.type === "OFFERINGS_RESULT" || d.type === "OFFERINGS_ERROR") {
              clearTimeout(timeout);
              window.removeEventListener("message", handler);
              resolve(d);
            }
          } catch {}
        };
        window.addEventListener("message", handler);
        const msg = JSON.stringify({ type: "GET_OFFERINGS" });
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
        else window.webkit.messageHandlers.ReactNativeWebView.postMessage(msg);
      });

      if (offeringsResult.error) {
        addLog(`❌ GET_OFFERINGS failed: ${offeringsResult.error}`, "error");
      } else {
        addLog(`✅ GET_OFFERINGS response received`, "ok");
        const pkgs = offeringsResult.data?.current?.availablePackages || [];
        addLog(`  packages count: ${pkgs.length}`, pkgs.length > 0 ? "ok" : "error");
        pkgs.forEach(p => addLog(`    📦 ${p.identifier} → ${p.product?.productIdentifier || "?"}`));
      }
    }

    addLog("✅ Diagnostic complete.");
    setIapTesting(false);
  };

  const logColor = (type) => {
    if (type === "ok") return "#4ade80";
    if (type === "error") return "#f87171";
    if (type === "warn") return "#fbbf24";
    return "rgba(255,255,255,0.6)";
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{
        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 14, padding: "12px 16px", marginBottom: 20,
      }}>
        <p style={{ color: "#f87171", fontWeight: 700, fontSize: 13, margin: 0 }}>🛡️ Admin Tools</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0" }}>Internal tools — handle with care.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate("/AdminDashboard")} style={{
          padding: "13px 16px", borderRadius: 14, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 700, fontSize: 14,
        }}>
          🛡️ Open Admin Dashboard
        </button>

        <button onClick={runIapDiagnostic} disabled={iapTesting} style={{
          padding: "13px 16px", borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)",
          fontWeight: 600, fontSize: 14, cursor: iapTesting ? "default" : "pointer",
          opacity: iapTesting ? 0.6 : 1,
        }}>
          {iapTesting ? "⏳ Running..." : "🧪 Run IAP Diagnostic"}
        </button>

        <button onClick={() => {
          localStorage.setItem("unfiltr_is_premium", "true");
          alert("Premium flag set in localStorage.");
        }} style={{
          padding: "13px 16px", borderRadius: 14,
          border: "1px solid rgba(251,191,36,0.3)",
          background: "rgba(251,191,36,0.08)", color: "#fbbf24",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>
          ⚡ Force Premium ON
        </button>

        <button onClick={() => {
          localStorage.removeItem("unfiltr_is_premium");
          alert("Premium flag cleared.");
        }} style={{
          padding: "13px 16px", borderRadius: 14,
          border: "1px solid rgba(248,113,113,0.3)",
          background: "rgba(248,113,113,0.08)", color: "#f87171",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>
          🚫 Force Premium OFF
        </button>
      </div>

      {debugLog.length > 0 && (
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            Diagnostic Log
          </p>
          <div style={{
            background: "#0a0612", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: 12, maxHeight: 300, overflowY: "auto",
            fontFamily: "monospace",
          }}>
            {debugLog.map((entry, i) => (
              <div key={i} style={{ fontSize: 11, color: logColor(entry.type), marginBottom: 2 }}>
                <span style={{ color: "rgba(255,255,255,0.2)", marginRight: 8 }}>{entry.ts}</span>
                {entry.msg}
              </div>
            ))}
          </div>
          <button onClick={() => setDebugLog([])} style={{
            marginTop: 8, padding: "8px 16px", borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
            fontSize: 12, cursor: "pointer",
          }}>
            Clear Log
          </button>
        </div>
      )}
    </div>
  );
}
