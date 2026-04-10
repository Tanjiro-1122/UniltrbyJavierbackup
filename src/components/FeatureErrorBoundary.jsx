import React from "react";
import { RefreshCw } from "lucide-react";

/**
 * FeatureErrorBoundary — lightweight error boundary for individual features/pages.
 * Shows a minimal inline error card with a retry button instead of a full-screen error.
 */
export default class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const featureName = this.props.feature || "Unknown Feature";
    console.error(`[FeatureErrorBoundary:${featureName}] Caught error:`, error?.message, info?.componentStack);
    try {
      import("@/api/base44Client").then(({ base44 }) => {
        base44.functions.invoke("logError", {
          error_type: "react_feature_boundary",
          severity: "warning",
          function_name: `FeatureErrorBoundary:${featureName}`,
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
      const label = this.props.feature || "this feature";
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          gap: 12,
          minHeight: 160,
        }}>
          <span style={{ fontSize: 32 }}>😵</span>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
            {label} ran into a problem.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 10,
              color: "#c084fc",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 18px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
