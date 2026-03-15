import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageSquare, Settings, Star } from "lucide-react";

const TABS = [
  { path: "/",        label: "Home",    icon: Home },
  { path: "/vibe",    label: "Vibe",    icon: Star },
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
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        paddingTop: "env(safe-area-inset-top, 0px)",
        background: "rgba(6,2,15,0.92)",
        borderBottom: "1px solid rgba(139,92,246,0.18)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
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
              height: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.15s",
              opacity: isActive ? 1 : 0.45,
              position: "relative",
            }}
          >
            {isActive && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 24,
                height: 2,
                borderRadius: 999,
                background: "#a855f7",
                boxShadow: "0 0 8px rgba(168,85,247,0.8)",
              }} />
            )}
            <Icon
              size={20}
              color={isActive ? "#a855f7" : "#9ca3af"}
              style={{
                filter: isActive ? "drop-shadow(0 0 6px rgba(168,85,247,0.8))" : "none",
                transition: "all 0.2s",
              }}
            />
            <span
              style={{
                fontSize: 9,
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