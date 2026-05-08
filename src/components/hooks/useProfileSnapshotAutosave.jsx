import { useEffect } from 'react';
import { startProfileSnapshotAutosave } from '@/lib/profileSnapshot';

export function useProfileSnapshotAutosave(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    return startProfileSnapshotAutosave();
  }, [enabled]);
}
