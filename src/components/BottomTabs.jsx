import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, MessageSquare, Settings } from "lucide-react";

const TABS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function BottomTabs() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-40 safe-area-inset-bottom"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" }}>
      <div className="max-w-4xl mx-auto flex items-center justify-around h-16 px-4">
        {TABS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path === "/chat" && location.pathname.startsWith("/chat"));
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors flex-1"
              style={{
                color: isActive ? "#a78bfa" : "#9ca3af",
                backgroundColor: isActive ? "rgba(167, 139, 250, 0.1)" : "transparent",
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for notch/home indicator */}
      <div className="h-safe-area-inset-bottom safe-area-bottom" />
    </div>
  );
}