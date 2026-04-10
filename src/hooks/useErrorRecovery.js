import { useState, useCallback } from "react";

export function useErrorRecovery() {
  const [error, setError] = useState(null);

  const handleError = useCallback((err, context = "") => {
    console.error(`[ErrorRecovery] ${context}:`, err);
    setError({
      message: err?.message || "Something went wrong",
      context,
      timestamp: Date.now(),
      retry: null,
    });
  }, []);

  const setRetryable = useCallback((err, context, retryFn) => {
    console.error(`[ErrorRecovery] ${context}:`, err);
    setError({
      message: err?.message || "Something went wrong",
      context,
      timestamp: Date.now(),
      retry: retryFn,
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, handleError, setRetryable, clearError };
}
