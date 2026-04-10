import { useState, useCallback } from "react";

export function useLoadingState(initialStates = {}) {
  const [states, setStates] = useState(initialStates);

  const setLoading = useCallback((key, value) => {
    setStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const startLoading = useCallback((key) => setLoading(key, true), [setLoading]);
  const stopLoading = useCallback((key) => setLoading(key, false), [setLoading]);

  const isLoading = useCallback((key) => !!states[key], [states]);
  const anyLoading = Object.values(states).some(Boolean);

  return { states, setLoading, startLoading, stopLoading, isLoading, anyLoading };
}
