import React from "react";

/**
 * AppShell — the single layout wrapper for every page.
 *
 * Props:
 *   tabs      – boolean (default true)  → reserves space for BottomTabs
 *   bg        – optional CSS background override (string)
 *   className – extra classes on the outer div
 *   style     – extra inline styles
 *
 * Children fill the remaining vertical space.
 * The shell fills the full device viewport (100dvh) and handles safe-area insets.
 */
export default function AppShell({
  children,
  tabs = true,
  bg,
  className = "",
  style = {},
}) {
  return (
    <div
      className={`app-shell ${tabs ? "" : "no-tabs"} ${className}`}
      style={{
        background: bg || "#06020f",
        maxWidth: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}