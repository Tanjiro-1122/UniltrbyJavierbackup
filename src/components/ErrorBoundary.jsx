import React from "react";

/**
 * ErrorBoundary — catches any unhandled render/lifecycle errors in its subtree.
 * Shows a user-friendly fallback UI with a retry option.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
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
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
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
              onClick={this.handleReset}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 32px",
                cursor: "pointer",
                marginBottom: 12,
                width: "100%",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 24px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
