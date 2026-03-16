import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { restorePurchases } from "@/components/utils/iapBridge";

export default function AppFooter({ dark = false }) {
  const navigate = useNavigate();
  const textClass = dark ? "text-white/55 hover:text-white/80" : "text-white/40 hover:text-white/70";
  const dividerClass = dark ? "text-white/35" : "text-white/30";

  return (
    <div className="w-full flex flex-col items-center gap-1 py-3 px-4">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px]">
        <button onClick={() => navigate("/PrivacyPolicy")} className={`${textClass} transition-colors bg-transparent border-none cursor-pointer p-0`}>Privacy Policy</button>
        <span className={dividerClass}>·</span>
        <button onClick={() => navigate("/TermsOfUse")} className={`${textClass} transition-colors bg-transparent border-none cursor-pointer p-0`}>Terms of Use</button>
        <span className={dividerClass}>·</span>
        <button onClick={() => restorePurchases()} className={`${textClass} transition-colors bg-transparent border-none cursor-pointer p-0`}>Restore Purchases</button>
        <span className={dividerClass}>·</span>
        <a href="mailto:support@unfiltr.app" className={`${textClass} transition-colors`}>Support</a>
      </div>
      <p className={`text-[9px] ${dark ? "text-white/45" : "text-white/30"} text-center`}>
        © {new Date().getFullYear()} Unfiltr. All rights reserved. Subscription auto-renews unless cancelled.
      </p>
    </div>
  );
}