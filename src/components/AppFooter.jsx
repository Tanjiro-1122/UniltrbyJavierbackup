import React from "react";
import { Link } from "react-router-dom";

export default function AppFooter({ dark = false }) {
  const textClass = dark ? "text-white/30 hover:text-white/60" : "text-white/40 hover:text-white/70";
  const dividerClass = dark ? "text-white/20" : "text-white/30";

  return (
    <div className="w-full flex flex-col items-center gap-1 py-3 px-4">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px]">
        <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className={`${textClass} transition-colors`}>Privacy Policy</a>
        <span className={dividerClass}>·</span>
        <a href="#" className={`${textClass} transition-colors`}>Terms of Use</a>
        <span className={dividerClass}>·</span>
        <a href="#" className={`${textClass} transition-colors`}>Restore Purchases</a>
        <span className={dividerClass}>·</span>
        <a href="mailto:support@unfiltr.app" className={`${textClass} transition-colors`}>Support</a>
      </div>
      <p className={`text-[9px] ${dark ? "text-white/20" : "text-white/30"} text-center`}>
        © {new Date().getFullYear()} Unfiltr. All rights reserved. Subscription auto-renews unless cancelled.
      </p>
    </div>
  );
}