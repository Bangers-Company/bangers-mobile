import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SyncState {
  lastSyncTimestamp: Record<string, string | null>;
  isSyncing: boolean;
  lastSyncTime: number | null;
  setLastSyncTimestamp: (entity: string, timestamp: string) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncTime: (time: number) => void;
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
      lastSyncTime: null,
      setLastSyncTimestamp: (entity, timestamp) =>
        set((state) => ({
          lastSyncTimestamp: {
            ...state.lastSyncTimestamp,
            [entity]: timestamp,
          },
        })),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
    }),
    {
      name: "sync-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
