import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useSyncStore } from "../store/useSyncStore";
import { runDeltaSync } from "../sync/deltaSync";

export const useDeltaSync = () => {
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const lastSyncTime = useSyncStore((state) => state.lastSyncTime);
  const setLastSyncTime = useSyncStore((state) => state.setLastSyncTime);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    
    // Throttle syncs to 1 minute
    const now = Date.now();
    if (lastSyncTime && now - lastSyncTime < 60000) {
      return;
    }

    try {
      setLastSyncTime(now);
      await runDeltaSync();
    } catch {
      // Error handled in runner
    }
  }, [isSyncing, lastSyncTime, setLastSyncTime]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        sync();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Initial sync
    sync();

    return () => {
      subscription.remove();
    };
  }, [sync]);

  return { sync, isSyncing };
};
