import { useEffect } from "react";
import { runStorageCleanup } from "@/lib/storageManager";

/**
 * useStorageCleanup
 * Runs localStorage cleanup once on app mount.
 * Prunes mood history, journal entries, and monitors total usage.
 */
export function useStorageCleanup() {
  useEffect(() => {
    try {
      runStorageCleanup();
    } catch (e) {
      console.warn("[useStorageCleanup] Cleanup failed:", e?.message);
    }
  }, []);
}
