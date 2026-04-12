import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { restorePurchases } from "@/components/utils/iapBridge";
import { debugLog } from "@/components/DebugPanel";

export default function AppFooter({ dark = false }) {
  const navigate = useNavigate();
  const textClass = dark ? "text-white/55 hover:text-white/80" : "text-white/40 hover:text-white/70";
  const dividerClass = dark ? "text-white/35" : "text-white/30";
  const [restoreState, setRestoreState] = useState(null); // null | 'loading' | 'success' | 'none' | 'error'

  const handleRestore = async () => {
    if (restoreState === 'loading') return;
    debugLog('[AppFooter] Restore Purchases tapped');
    setRestoreState('loading');
    try {
      const result = await restorePurchases();
      debugLog(`[AppFooter] Restore result: ${JSON.stringify(result)}`);
      if (!result.triggered) {
        // Not in native env — navigate to Pricing so user can restore there
        navigate('/Pricing?restore=true');
        setRestoreState(null);
        return;
      }
      if (result.isSuccess) {
        window.dispatchEvent(new Event('unfiltr_auth_updated'));
        setRestoreState('success');
      } else if (result.timedOut) {
        setRestoreState('error');
      } else {
        setRestoreState('none');
      }
    } catch (e) {
      debugLog(`[AppFooter] Restore error: ${e.message}`);
      setRestoreState('error');
    }
    setTimeout(() => setRestoreState(null), 3500);
  };

  const restoreLabel =
    restoreState === 'loading' ? 'Restoring…' :
    restoreState === 'success' ? '✓ Restored!' :
    restoreState === 'none'    ? 'No purchase found' :
    restoreState === 'error'   ? 'Try again' :
    'Restore Purchases';

  return (
    <div className="w-full flex flex-col items-center gap-2 py-2 px-4">
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
        <button
          onClick={() => navigate("/PrivacyPolicy")}
          style={{ minHeight: 44, padding: "0 10px", background: "transparent", border: "none", cursor: "pointer" }}
          className={`${textClass} transition-colors text-xs font-medium`}
        >Privacy Policy</button>
        <span className={`${dividerClass} text-xs`}>·</span>
        <button
          onClick={() => navigate("/TermsOfUse")}
          style={{ minHeight: 44, padding: "0 10px", background: "transparent", border: "none", cursor: "pointer" }}
          className={`${textClass} transition-colors text-xs font-medium`}
        >Terms of Use</button>
        <span className={`${dividerClass} text-xs`}>·</span>
        <button
          onClick={handleRestore}
          disabled={restoreState === 'loading'}
          style={{ minHeight: 44, padding: "0 10px", background: "transparent", border: "none", cursor: restoreState === 'loading' ? 'default' : 'pointer', opacity: restoreState === 'loading' ? 0.7 : 1 }}
          className={`${
            restoreState === 'success' ? 'text-green-400' :
            restoreState === 'none' || restoreState === 'error' ? 'text-red-400/70' :
            textClass
          } transition-colors text-xs font-medium`}
        >{restoreLabel}</button>
        <span className={`${dividerClass} text-xs`}>·</span>
        <a
          href="mailto:support@sportswagerhelper.com?subject=Unfiltr%20Support%20Request"
          style={{ minHeight: 44, padding: "0 10px", display: "flex", alignItems: "center" }}
          className={`${textClass} transition-colors text-xs font-medium`}
        >Support</a>
      </div>
      <p className={`text-[10px] ${dark ? "text-white/40" : "text-white/30"} text-center`}>
        © {new Date().getFullYear()} Unfiltr. All rights reserved. Subscription auto-renews unless cancelled.
      </p>
    </div>
  );
}