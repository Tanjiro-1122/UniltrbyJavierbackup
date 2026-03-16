import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { restorePurchases } from "@/components/utils/iapBridge";

export default function AppFooter({ dark = false }) {
  const navigate = useNavigate();
  const textClass = dark ? "text-white/55 hover:text-white/80" : "text-white/40 hover:text-white/70";
  const dividerClass = dark ? "text-white/35" : "text-white/30";

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
          onClick={() => restorePurchases()}
          style={{ minHeight: 44, padding: "0 10px", background: "transparent", border: "none", cursor: "pointer" }}
          className={`${textClass} transition-colors text-xs font-medium`}
        >Restore Purchases</button>
        <span className={`${dividerClass} text-xs`}>·</span>
        <a
          href="mailto:support@unfiltr.app"
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