import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageSquare, Settings, Star } from "lucide-react";

const TABS = [
  { path: "/",        label: "Home",    icon: Home },
  { path: "/chat",     label: "Chat",    icon: MessageSquare },
  { path: "/Pricing",  label: "Premium", icon: Star },
  { path: "/settings", label: "Settings",icon: Settings },
];

export default function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "#0a0614",
        borderTop: "1px solid rgba(139,92,246,0.18)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        zIndex: 100,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
      }}
    >
      {TABS.map(({ path, label, icon: Icon }) => {
        const isActive =
          path === "/"
            ? location.pathname === "/"
            : location.pathname === path;

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              height: 64,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.15s",
              opacity: isActive ? 1 : 0.45,
            }}
          >
            {/* Active glow pill */}
            {isActive && (
              <div style={{
                position: "absolute",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
            )}
            <Icon
              size={22}
              color={isActive ? "#a855f7" : "#9ca3af"}
              style={{
                filter: isActive ? "drop-shadow(0 0 6px rgba(168,85,247,0.8))" : "none",
                transition: "all 0.2s",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#a855f7" : "#9ca3af",
                letterSpacing: "0.3px",
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