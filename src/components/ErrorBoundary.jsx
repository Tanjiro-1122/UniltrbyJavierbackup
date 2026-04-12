import React from "react";

const SUPPORT_EMAIL = "huertasfam1@icloud.com";

/**
 * ErrorBoundary — catches any unhandled render/lifecycle errors in its subtree.
 * Shows a user-friendly fallback UI with a retry option, support link, and
 * optional diagnostics copy button.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error?.message, info?.componentStack);
    // Log to backend if available
    try {
      import("@/api/base44Client").then(({ base44 }) => {
        base44.functions.invoke("logError", {
          error_type: "react_boundary",
          severity: "error",
          function_name: "ErrorBoundary",
          error_message: error?.message || String(error),
          error_stack: error?.stack || "",
          context: { componentStack: info?.componentStack, url: window.location.href },
        }).catch(() => {});
      }).catch(() => {});
    } catch {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, copied: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyDiagnostics = () => {
    try {
      const diagnostics = {
        route: window.location.pathname,
        userProfileId: localStorage.getItem("userProfileId") || "(none)",
        nativeBridge: !!(window.ReactNativeWebView || window.webkit?.messageHandlers?.ReactNativeWebView),
        error: this.state.error?.message || String(this.state.error),
        ts: new Date().toISOString(),
      };
      navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2)).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }).catch(() => {});
    } catch {}
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      const { copied } = this.state;
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06020f",
          padding: 24,
        }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
            </div>
            <h2 style={{ color: "white", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
              Something went wrong
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 24px", lineHeight: 1.6 }}>
              The app ran into an unexpected error. Please try again.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 32px",
                cursor: "pointer",
                marginBottom: 10,
                width: "100%",
              }}
            >
              Reload App
            </button>
            <button
              onClick={this.handleReset}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 24px",
                cursor: "pointer",
                marginBottom: 10,
                width: "100%",
              }}
            >
              Try Again
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Unfiltr%20App%20Error&body=Route%3A%20${encodeURIComponent(window.location.pathname)}%0AError%3A%20${encodeURIComponent(this.state.error?.message || "")}`}
              style={{
                display: "block",
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.25)",
                borderRadius: 12,
                color: "#a855f7",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 24px",
                cursor: "pointer",
                marginBottom: 10,
                textDecoration: "none",
              }}
            >
              Contact Support
            </a>
            <button
              onClick={this.handleCopyDiagnostics}
              style={{
                background: "transparent",
                border: "none",
                color: copied ? "rgba(74,222,128,0.8)" : "rgba(255,255,255,0.2)",
                fontSize: 12,
                cursor: "pointer",
                padding: "6px 0",
                width: "100%",
              }}
            >
              {copied ? "✓ Copied" : "Copy Diagnostics"}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
