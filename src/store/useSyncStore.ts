import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SyncState {
  lastSyncTimestamp: Record<string, string | null>;
  isSyncing: boolean;
  setLastSyncTimestamp: (entity: string, timestamp: string) => void;
  setSyncing: (isSyncing: boolean) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastSyncTimestamp: {
        events: null,
        artists: null,
        acts: null,
      },
      isSyncing: false,
      setLastSyncTimestamp: (entity, timestamp) =>
        set((state) => ({
          lastSyncTimestamp: {
            ...state.lastSyncTimestamp,
            [entity]: timestamp,
          },
        })),
      setSyncing: (isSyncing) => set({ isSyncing }),
    }),
    {
      name: "sync-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
