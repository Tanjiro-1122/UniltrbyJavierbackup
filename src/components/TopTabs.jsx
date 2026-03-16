import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageSquare, Settings, Sparkles } from "lucide-react";

const TABS = [
  { path: "/",        label: "Home",    icon: Home },
  { path: "/Pricing", label: "Premium", icon: Sparkles },
  { path: "/chat",    label: "Chat",    icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function TopTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "rgba(6,2,15,0.95)",
        borderTop: "1px solid rgba(139,92,246,0.22)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100,
        boxShadow: "0 -4px 32px rgba(0,0,0,0.6)",
      }}
    >
      {TABS.map(({ path, label, icon: Icon }) => {
        const isActive =
          path === "/"
            ? location.pathname === "/" || location.pathname === "/HomePage"
            : location.pathname === path;

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              minHeight: 60,
              paddingTop: 10,
              paddingBottom: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            {/* Active pill background */}
            {isActive && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 56,
                height: 40,
                borderRadius: 14,
                background: "rgba(168,85,247,0.2)",
                border: "1px solid rgba(168,85,247,0.4)",
                boxShadow: "0 0 12px rgba(168,85,247,0.25)",
              }} />
            )}
            <Icon
              size={24}
              color={isActive ? "#d8b4fe" : "rgba(156,163,175,0.55)"}
              style={{
                filter: isActive ? "drop-shadow(0 0 6px rgba(216,180,254,0.8))" : "none",
                transition: "all 0.2s",
                position: "relative",
                zIndex: 1,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#d8b4fe" : "rgba(156,163,175,0.5)",
                letterSpacing: "0.2px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}