import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useSyncStore } from "../store/useSyncStore";
import { runDeltaSync } from "../sync/deltaSync";

export const useDeltaSync = () => {
  const isSyncing = useSyncStore((state) => state.isSyncing);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    try {
      await runDeltaSync();
    } catch (error) {
      // Error handled in runner, but could add UI notification here
    }
  }, [isSyncing]);

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
